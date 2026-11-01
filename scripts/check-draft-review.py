#!/usr/bin/env python3
"""Check draft-only rendering and server-side write boundaries on a real Hugo host."""
import argparse
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--hugo', default=os.environ.get('HUGO_BIN', 'hugo'))
args = parser.parse_args()
theme = Path(__file__).resolve().parents[1]


def port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


with tempfile.TemporaryDirectory(prefix='vishine-draft-gate-') as temporary:
    root = Path(temporary)
    host = root / 'host'
    (host / 'content').mkdir(parents=True)
    (host / 'hugo.toml').write_text('baseURL="https://example.test/"\ntitle="Draft gate"\ndefaultContentLanguage="en"\n[params]\ngoogleFonts=false\n')
    draft = host / 'content/draft.md'
    draft.write_text('---\ntitle: Draft\ndraft: true\n---\n\nA draft paragraph.\n')
    (host / 'content/published.md').write_text('---\ntitle: Published\ndraft: false\n---\n\nA public paragraph.\n')
    env = dict(os.environ, HUGO_DRAFT_REVIEW_API='http://127.0.0.1:1317', HUGO_DRAFT_REVIEW_TOKEN='SENTINEL_NOT_A_SECRET', HUGO_RESOURCEDIR=str(root / 'resources'))
    base = [args.hugo, '--source', str(host), '--themesDir', str(theme.parent), '--theme', theme.name, '--noBuildLock', '--cacheDir', str(root / 'cache')]
    for include_drafts in (False, True):
        output = root / ('with-drafts' if include_drafts else 'production')
        result = subprocess.run(base + ['--destination', str(output)] + (['--buildDrafts'] if include_drafts else []), env=env, capture_output=True, text=True)
        assert result.returncode == 0, result.stderr
        assert (output / 'published/index.html').exists()
        assert (output / 'draft/index.html').exists() == include_drafts
        for file in output.rglob('*.html'):
            html = file.read_text()
            assert all(s not in html for s in ('draftReviewConfig', 'draft-review.min.', 'SENTINEL_NOT_A_SECRET')), file
        assert not list(output.rglob('draft-review*.js'))

    preview_port, api_port = port(), port()
    while api_port == preview_port:
        api_port = port()
    command = [sys.executable, str(theme / 'scripts/draft-review.py'), 'serve', '--site', str(host), '--store', str(root / 'notes'), '--hugo', args.hugo, '--port', str(preview_port), '--api-port', str(api_port), '--', '--themesDir', str(theme.parent), '--theme', theme.name]
    with (root / 'server.log').open('w') as log:
        process = subprocess.Popen(command, stdout=log, stderr=log)
    try:
        address = f'http://localhost:{preview_port}'
        for _ in range(100):
            try:
                html = urllib.request.urlopen(address + '/draft/', timeout=1).read().decode()
                break
            except OSError:
                time.sleep(.1)
        else:
            raise AssertionError('Draft test server failed to start')
        match = re.search(r'<script[^>]*id="draftReviewConfig"[^>]*>(.*?)</script>', html, re.S)
        assert match, 'Local draft must enable review'
        config = json.loads(match[1])
        published = urllib.request.urlopen(address + '/published/').read().decode()
        assert 'draftReviewConfig' not in published and 'draft-review.min.' not in published
        headers = {'Origin': address, 'X-Draft-Review': config['token']}
        endpoint = f'http://127.0.0.1:{api_port}/reviews?article=draft.md'
        assert json.load(urllib.request.urlopen(urllib.request.Request(endpoint, headers=headers)))['version'] == 0
        draft.write_text(draft.read_text().replace('draft: true', 'draft: false'))
        try:
            urllib.request.urlopen(urllib.request.Request(endpoint, headers=headers))
            raise AssertionError('Published source accepted by review API')
        except urllib.error.HTTPError as error:
            assert error.code == 400
        headers['Content-Type'] = 'application/json'
        body = json.dumps({'version': 0, 'operation': 'add', 'sourceRevision': config['revision'], 'payload': {}}).encode()
        try:
            urllib.request.urlopen(urllib.request.Request(endpoint, data=body, headers=headers))
            raise AssertionError('Published source accepted a write')
        except urllib.error.HTTPError as error:
            assert error.code == 400
    finally:
        process.terminate()
        process.wait(timeout=10)

print('PASS: only local explicit drafts enable review; published pages and production builds exclude UI/resources/session; publishing revokes API access')
