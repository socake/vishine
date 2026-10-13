#!/usr/bin/env python3
"""Verify catalog coverage and build the source snippets readers actually see."""
import argparse
from html.parser import HTMLParser
import os
from pathlib import Path
import subprocess
import shutil
import tempfile

class Snippets(HTMLParser):
    def __init__(self, language='markdown'):
        super().__init__()
        self.language = language
        self.items, self.current = [], None
    def handle_starttag(self, tag, attrs):
        if tag == 'code' and dict(attrs).get('data-lang') == self.language:
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
        # Exercise configuration copied from rendered chapter 14, not a mirror
        # of those recipes maintained in the test itself.
        rendered = (work/'tutorial/docs/14-reading-search/index.html').read_text()
        yaml, toml, extension = Snippets('yaml'), Snippets('toml'), Snippets('go-html-template')
        for collector in [yaml, toml, extension]: collector.feed(rendered)
        assert len(yaml.items) == 2 and len(toml.items) == 3 and len(extension.items) == 1
        (host/'hugo.toml').write_text('baseURL="https://example.test/lab/"\ntitle="Public recipes"\ndefaultContentLanguage="zh-cn"\n'+'\n'.join(toml.items)+'\ngoogleFonts=false\n')
        (host/'content/courses').mkdir()
        (host/'content/courses/_index.md').write_text('---\ntitle: Lessons\n'+yaml.items[1]+'\n---\n')
        for number in [1, 2]:
            (host/f'content/courses/lesson-{number}.md').write_text(f'---\ntitle: Lesson {number}\nweight: {number}\n'+yaml.items[0]+'\n---\n## Main\n### Detail\n#### Deep\nCOPY_BODY_RECIPE_014\n')
        for kind in ['css', 'js']:
            (host/f'assets/{kind}').mkdir(parents=True)
            (host/f'assets/{kind}/site.{kind}').write_text('/* Site extension */')
        (host/'layouts/partials/extensions').mkdir(parents=True)
        (host/'layouts/partials/extensions/article-after.html').write_text(extension.items[0])
        build(host, work/'public-recipes')
        html = (work/'public-recipes/courses/lesson-1/index.html').read_text()
        assert 'data-id="deep"' in html and 'class="art-cover-fig"' not in html
        assert 'rm-reading-nav' in html and 'lesson-2/' in html
        assert '<p>本文属于 Public recipes。</p>' in html
        assert '/lab/js/site.' in html
        assert 'COPY_BODY_RECIPE_014' in (work/'public-recipes/index.json').read_text()
        embedded = Snippets()
        embedded.feed(rendered)
        assert len(embedded.items) == 2 and all('html-embed' in item for item in embedded.items)
        (host/'static/diagrams').mkdir(parents=True)
        shutil.copyfile(theme/'tutorialSite/static/diagrams/embed-example.html', host/'static/diagrams/embed-example.html')
        recipe = host/'content/posts/html-embed.md'
        recipe.write_text('---\ntitle: Vector embed\n---\n'+embedded.items[0])
        build(host, work/'embed-recipes')
        html = (work/'embed-recipes/posts/html-embed/index.html').read_text()
        assert '<iframe' in html and 'src="/lab/diagrams/embed-example.html"' in html
        assert 'title="从输入到结果"' in html and 'loading="lazy"' in html
        assert 'height:260px;min-width:0px' in html and 'html-embed.' in html
        assert 'data-embed-fit="width"' in html and 'data-embed-min-width="760"' in html
        assert 'class="html-embed-fit" hidden' in html and 'class="html-embed-hint" hidden' in html
        assert (work/'embed-recipes/diagrams/embed-example.html').is_file()
        recipe.write_text('---\ntitle: Legacy embed\n---\n{{< html-embed src="/diagrams/embed-example.html" title="Diagram" minWidth=760 >}}')
        build(host, work/'embed-legacy')
        html = (work/'embed-legacy/posts/html-embed/index.html').read_text()
        assert 'data-embed-fit="scroll"' in html and 'min-width:760px' in html
        recipe.write_text('---\ntitle: Archify embed\n---\n{{< html-embed src="/diagrams/embed-example.html" title="Diagram" mode="archify" >}}')
        build(host, work/'embed-archify')
        html = (work/'embed-archify/posts/html-embed/index.html').read_text()
        assert 'embed=1&amp;theme=light' in html and 'data-embed-mode="archify"' in html
        assert 'data-embed-fit="width"' in html and 'min-width:0px' in html
        assert 'data-embed-surface="theme"' in html
        shutil.copyfile(theme/'tutorialSite/static/diagrams/archify-surface-example.html', host/'static/diagrams/archify-surface-example.html')
        recipe.write_text('---\ntitle: Surface recipes\n---\n'+embedded.items[1])
        build(host, work/'embed-surfaces')
        html = (work/'embed-surfaces/posts/html-embed/index.html').read_text()
        assert 'data-embed-surface="theme"' in html and 'data-embed-surface="source"' in html
        assert html.count('/lab/diagrams/archify-surface-example.html?embed=1') == 2
        assert (work/'embed-surfaces/diagrams/archify-surface-example.html').is_file()
        for bad in ['src="https://example.com/file.html" title="Remote"', 'src="/file.html"', 'src="/file.html" title="Bad size" height=0', 'src="/file.html" title="Bad mode" mode="unknown"', 'src="/file.html" title="Bad fit" fit="unknown"', 'src="/file.html" title="Bad surface" surface="unknown"', 'src="/file.html" title="Page cannot adopt theme" surface="theme"']:
            recipe.write_text('---\ntitle: Invalid embed\n---\n{{< html-embed '+bad+' >}}')
            try:
                build(host, work/'embed-invalid')
            except RuntimeError as error:
                assert 'html-embed' in str(error)
            else:
                raise AssertionError('Invalid embed parameters must fail: '+bad)
        # Sponsor recipes must work when copied into a host deployed under a subpath.
        recipe.unlink()  # Remove the intentionally invalid embed fixture above.
        rendered = (work/'tutorial/docs/16-sponsor/index.html').read_text()
        sponsor_config, sponsor_pages = Snippets('toml'), Snippets()
        sponsor_config.feed(rendered)
        sponsor_pages.feed(rendered)
        assert len(sponsor_config.items) == 1 and len(sponsor_pages.items) == 2
        base_config = 'baseURL="https://example.test/lab/"\ntitle="Sponsor recipes"\ndefaultContentLanguage="en"\n[params]\ngoogleFonts=false\n'
        (host/'hugo.toml').write_text(base_config + sponsor_config.items[0])
        (host/'static/img').mkdir(parents=True)
        shutil.copyfile(theme/'tutorialSite/static/img/sponsor-placeholder.svg', host/'static/img/sponsor-placeholder.svg')
        (host/'content/sponsor.md').write_text(sponsor_pages.items[0])
        (host/'content/sponsor-override.md').write_text('---\ntitle: Override\n---\n'+sponsor_pages.items[1])
        build(host, work/'sponsor-recipes')
        html = (work/'sponsor-recipes/sponsor/index.html').read_text()
        assert html.count('class="sp-code sp-code--') == 2
        assert 'src="/lab/img/sponsor/wechat-qr.svg"' in html and 'href="/lab/img/sponsor/wechat.png"' in html
        assert 'Scan with WeChat' in html and 'View original image' in html
        assert 'class="art-cover-fig"' not in html
        html = (work/'sponsor-recipes/sponsor-override/index.html').read_text()
        assert html.count('href="/lab/img/sponsor-placeholder.svg"') == 2
        assert '/lab/img/sponsor/wechat.png' not in html
        (host/'hugo.toml').write_text(base_config)
        (host/'content/sponsor-override.md').write_text('---\ntitle: Legacy single code\n---\n{{< sponsor wechat="https://example.test/legacy.png" >}}')
        build(host, work/'sponsor-fallbacks')
        assert 'class="sc-sponsor"' not in (work/'sponsor-fallbacks/sponsor/index.html').read_text()
        html = (work/'sponsor-fallbacks/sponsor-override/index.html').read_text()
        assert html.count('class="sp-code sp-code--') == 1
        assert 'src="https://example.test/legacy.png"' in html and 'href="https://example.test/legacy.png"' in html
    print('PASS: catalog coverage; component recipes, chapter 14 and 16 copied from rendered tutorial; embed/sponsor parameters, fallbacks and subpaths')

if __name__ == '__main__':
    main()
