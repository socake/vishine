#!/usr/bin/env python3
"""Local-only draft review storage and preview. Python 3.9+, no packages."""
import argparse
import contextlib
import datetime
import fcntl
import hashlib
import hmac
import json
import os
from pathlib import Path
import re
import secrets
import signal
import subprocess
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit


def stamp():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def is_draft(text):
    if text.startswith('---') or text.startswith('+++'):
        sep = text[:3]
        parts = text.split(sep, 2)
        if len(parts) != 3:
            return False
        header = parts[1]
        if sep == '+++':
            header = re.split(r'^\s*\[', header, maxsplit=1, flags=re.M)[0]
        declarations = re.findall(r'^draft\s*[:=]\s*(.*?)\s*$', header, re.M | re.I)
        return len(declarations) == 1 and bool(re.fullmatch(r'true\s*(?:#.*)?', declarations[0], re.I))
    if text.startswith('{'):
        try:
            return json.JSONDecoder().raw_decode(text)[0].get('draft') is True
        except (ValueError, AttributeError):
            pass
    return False


def validate_hugo_args(extra):
    """Keep forwarding narrow: aliases/config overrides must not escape isolation."""
    result = []
    index = 0
    while index < len(extra):
        arg = extra[index]
        name, equal, value = arg.partition('=')
        if name == '--disableLiveReload' and not equal:
            result.append(arg)
        elif name in ('--theme', '--themesDir'):
            if not equal:
                index += 1
                value = extra[index] if index < len(extra) else ''
            if not value or value.startswith('-'):
                raise ValueError('Theme options require a value')
            result.extend([name, value])
        else:
            raise ValueError('Only --theme, --themesDir and --disableLiveReload may be forwarded')
        index += 1
    return result


class ReviewStore:
    def __init__(self, site, directory=None):
        self.site = Path(site).resolve()
        self.content = (self.site / 'content').resolve()
        key = hashlib.sha256(str(self.site).encode()).hexdigest()[:16]
        self.directory = Path(directory or Path.home() / '.cache' / 'vishine' / 'draft-reviews' / key).resolve()

    def source(self, article):
        if not isinstance(article, str) or '\\' in article:
            raise ValueError('Invalid article path')
        path = (self.content / article).resolve()
        if not path.is_relative_to(self.content) or Path(article).is_absolute() or '..' in Path(article).parts or path.suffix != '.md':
            raise ValueError('Article must be a Markdown file inside content')
        raw = path.read_bytes()
        text = raw.decode('utf-8')
        if not is_draft(text):
            raise ValueError('Only explicit drafts can be reviewed')
        return hashlib.sha256(raw).hexdigest()

    def path(self, article):
        return self.directory / (hashlib.sha256(article.encode()).hexdigest() + '.json')

    @contextlib.contextmanager
    def lock(self):
        self.directory.mkdir(mode=0o700, parents=True, exist_ok=True)
        with (self.directory / '.lock').open('a') as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            yield

    def read(self, article):
        revision = self.source(article)
        path = self.path(article)
        data = json.loads(path.read_text()) if path.exists() else dict(schemaVersion=1, article=article, version=0, annotations=[])
        data['sourceRevision'] = revision
        return data

    def change(self, article, version, operation, payload, source_revision=None):
        with self.lock():
            data = self.read(article)
            if data['version'] != version:
                raise FileExistsError('Review changed in another window; reload and retry')
            if operation == 'add' and source_revision is not None and source_revision != data['sourceRevision']:
                raise FileExistsError('Source changed; reload the preview')
            if operation == 'add':
                if set(payload) != {'anchor', 'comment'} or len(data['annotations']) >= 500:
                    raise ValueError('Invalid annotation')
                anchor = payload['anchor']
                fields = {'kind', 'quote', 'block', 'prefix', 'suffix', 'heading', 'index', 'start', 'end'}
                if not isinstance(anchor, dict) or set(anchor) != fields:
                    raise ValueError('Invalid anchor')
                for key in ('quote', 'block', 'prefix', 'suffix', 'heading', 'kind'):
                    if not isinstance(anchor[key], str) or len(anchor[key]) > 24000:
                        raise ValueError('Invalid anchor text')
                if anchor['kind'] not in ('text', 'paragraph') or not anchor['quote'].strip():
                    raise ValueError('Empty quote')
                if any(type(anchor[k]) is not int or anchor[k] < 0 for k in ('index', 'start', 'end')):
                    raise ValueError('Invalid anchor position')
                units = anchor['block'].encode('utf-16-le')
                if units[anchor['start'] * 2:anchor['end'] * 2].decode('utf-16-le') != anchor['quote']:
                    raise ValueError('Quote does not match block position')
                comment = payload['comment']
                if not isinstance(comment, str) or not comment.strip() or len(comment) > 8000:
                    raise ValueError('Comment must contain 1–8000 characters')
                data['annotations'].append(dict(id=secrets.token_hex(12), anchor=anchor, comment=comment.strip(), status='open', sourceRevision=data['sourceRevision'], createdAt=stamp(), updatedAt=stamp(), resolution=''))
            elif operation == 'update':
                if set(payload) - {'id', 'comment', 'status', 'resolution'} or 'id' not in payload:
                    raise ValueError('Invalid update')
                item = next((a for a in data['annotations'] if a['id'] == payload['id']), None)
                if not item:
                    raise ValueError('Annotation not found')
                for key in ('comment', 'status', 'resolution'):
                    if key not in payload:
                        continue
                    val = payload[key]
                    if not isinstance(val, str) or len(val) > 8000 or (key == 'status' and val not in ('open', 'resolved', 'archived')) or (key == 'comment' and not val.strip()):
                        raise ValueError('Invalid update value')
                    item[key] = val
                item['updatedAt'] = stamp()
            else:
                raise ValueError('Unknown operation')
            data['version'] += 1
            data['updatedAt'] = stamp()
            with tempfile.NamedTemporaryFile(mode='w', dir=self.directory, delete=False) as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                temp = f.name
            os.replace(temp, self.path(article))
            return data


def handler(store, token, origins):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass  # Never log request headers or draft text.

        def send_json(self, code, value):
            self.send_response(code)
            origin = self.headers.get('Origin')
            if origin in origins:
                self.send_header('Access-Control-Allow-Origin', origin)
                self.send_header('Vary', 'Origin')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(value, ensure_ascii=False).encode())

        def allowed(self):
            return (self.headers.get('Origin') in origins and
                    self.headers.get('Host') == f'127.0.0.1:{self.server.server_port}' and
                    hmac.compare_digest(self.headers.get('X-Draft-Review', '').encode(), token.encode()))

        def do_OPTIONS(self):
            if self.headers.get('Origin') not in origins:
                return self.send_json(403, {'error': 'Origin denied'})
            self.send_response(204)
            self.send_header('Access-Control-Allow-Origin', self.headers['Origin'])
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Draft-Review')
            self.end_headers()

        def handle_review(self, write=False):
            if not self.allowed():
                return self.send_json(403, {'error': 'Local review session required'})
            url = urlsplit(self.path)
            if url.path != '/reviews':
                return self.send_json(404, {'error': 'Unknown endpoint'})
            try:
                article = parse_qs(url.query).get('article', [''])[0]
                if write:
                    length = int(self.headers.get('Content-Length', '0'))
                    if not 0 < length <= 150000:
                        raise ValueError('Request too large')
                    request = json.loads(self.rfile.read(length))
                    if set(request) != {'version', 'operation', 'payload', 'sourceRevision'} or type(request['version']) is not int:
                        raise ValueError('Invalid request')
                    data = store.change(article, request['version'], request['operation'], request['payload'], request['sourceRevision'])
                else:
                    data = store.read(article)
                self.send_json(200, data)
            except FileExistsError:
                self.send_json(409, {'error': 'Review changed in another window'})
            except (ValueError, KeyError, TypeError, OSError):
                self.send_json(400, {'error': 'Invalid draft or annotation'})

        def do_GET(self):
            self.handle_review()

        def do_POST(self):
            self.handle_review(True)
    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['serve', 'list', 'resolve'])
    parser.add_argument('--site', required=True)
    parser.add_argument('--store')
    parser.add_argument('--article')
    parser.add_argument('--id')
    parser.add_argument('--resolution', default='')
    parser.add_argument('--hugo', default='hugo')
    parser.add_argument('--port', type=int, default=1313)
    parser.add_argument('--api-port', type=int, default=1315)
    args, extra = parser.parse_known_args()
    store = ReviewStore(args.site, args.store)
    if args.command != 'serve':
        if extra:
            parser.error('Unexpected arguments')
        if not args.article:
            parser.error('--article is required')
        data = store.read(args.article)
        if args.command == 'resolve':
            if not args.id or not args.resolution.strip():
                parser.error('--id and --resolution are required')
            data = store.change(args.article, data['version'], 'update', dict(id=args.id, status='resolved', resolution=args.resolution))
        print(json.dumps(dict(storage=str(store.path(args.article)), **data), ensure_ascii=False, indent=2))
        return
    if args.port == args.api_port or not (1024 <= args.port <= 65535 and 1024 <= args.api_port <= 65535):
        parser.error('Choose distinct unprivileged ports')
    extra = extra[1:] if extra[:1] == ['--'] else extra
    try:
        extra = validate_hugo_args(extra)
    except ValueError as error:
        parser.error(str(error))
    token = secrets.token_urlsafe(32)
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.api_port), handler(store, token, {f'http://localhost:{args.port}', f'http://127.0.0.1:{args.port}'}))
    except OSError:
        parser.exit(2, 'Review API port unavailable. Stop the old review session or choose another --api-port.\n')
    threading.Thread(target=server.serve_forever, daemon=True).start()
    runtime = Path(tempfile.mkdtemp(prefix='vishine-review-'))
    env = dict(os.environ, HUGO_DRAFT_REVIEW_API=f'http://127.0.0.1:{args.api_port}', HUGO_DRAFT_REVIEW_TOKEN=token, HUGO_RESOURCEDIR=str(runtime / 'resources'))
    command = [args.hugo, 'server', '--source', str(store.site), '--bind', '127.0.0.1', '--port', str(args.port), '--baseURL', f'http://localhost:{args.port}/', '--buildDrafts', '--disableFastRender', '--noBuildLock', '--destination', str(runtime / 'public'), '--cacheDir', str(runtime / 'cache'), *extra]
    print(f'Preview http://localhost:{args.port}/ | Review data: {store.directory}', flush=True)
    child = subprocess.Popen(command, env=env)
    def stop(*_):
        child.terminate()
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    try:
        child.wait()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
