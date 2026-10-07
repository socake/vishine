#!/usr/bin/env python3
"""Verify catalog coverage and build the source snippets readers actually see."""
import argparse
from html.parser import HTMLParser
import os
from pathlib import Path
import subprocess
import tempfile

class Snippets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items, self.current = [], None
    def handle_starttag(self, tag, attrs):
        if tag == 'code' and dict(attrs).get('data-lang') == 'markdown':
            self.current = []
    def handle_data(self, value):
        if self.current is not None:
            self.current.append(value)
    def handle_endtag(self, tag):
        if tag == 'code' and self.current is not None:
            self.items.append(''.join(self.current))
            self.current = None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--hugo', default=os.environ.get('HUGO_BIN', 'hugo'))
    args = parser.parse_args()
    theme = Path(__file__).resolve().parents[1]
    catalog = (theme/'docs/COMPONENTS.md').read_text()
    missing = [p.stem for p in (theme/'layouts/shortcodes').glob('*.html') if f'`{p.stem}`' not in catalog]
    assert not missing, f'Undocumented shortcodes: {missing}'
    with tempfile.TemporaryDirectory(prefix='vishine-component-docs-') as temp:
        work = Path(temp)
        env = dict(os.environ, HUGO_RESOURCEDIR=str(work/'resources'))
        def build(source, dest):
            result = subprocess.run([args.hugo, '--source', str(source), '--themesDir', str(theme.parent),
                '--theme', theme.name, '--destination', str(dest), '--cacheDir', str(work/'cache')],
                env=env, text=True, capture_output=True)
            if result.returncode:
                raise RuntimeError(result.stdout + result.stderr)
        build(theme/'tutorialSite', work/'tutorial')
        snippets = Snippets()
        snippets.feed((work/'tutorial/docs/11-components/index.html').read_text())
        assert len(snippets.items) == 4, 'Expected four copyable component recipes'
        host = work/'host'
        (host/'content/posts').mkdir(parents=True)
        (host/'hugo.toml').write_text('''baseURL="https://example.test/blog/"
title="Component recipe verification"
defaultContentLanguage="zh-cn"
[outputs]
home=["HTML","JSON"]
[params]
googleFonts=false
[params.cover]
auto=false
[markup.highlight]
noClasses=false
''')
        for i, snippet in enumerate(snippets.items):
            assert '{{</*' not in snippet, 'Escaped documentation syntax leaked to reader'
            (host/f'content/posts/recipe-{i}.md').write_text(f'---\ntitle: Recipe {i}\n---\n\n## Example\n\n'+snippet)
        build(host, work/'result')
        for i, marker in enumerate(['co-title', 'runbook-step', 'data-config-tabs', 'reading-details']):
            html = (work/f'result/posts/recipe-{i}/index.html').read_text()
            assert marker in html, f'Recipe {i} did not render its component'
        assert 'reading-components' in (work/'result/posts/recipe-2/index.html').read_text()
    print('PASS: all shortcode names documented; four rendered source recipes build in an independent host; tab enhancement included')

if __name__ == '__main__':
    main()
