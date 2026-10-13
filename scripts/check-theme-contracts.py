#!/usr/bin/env python3
"""Exercise theme APIs in an independent multilingual host, not the author's blog."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import re
import struct
import subprocess
import tempfile
import zlib


def png(width, height):
    def chunk(kind, data):
        return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data))
    # A deterministic checkerboard gives the browser a real large raster to zoom.
    raw = b''.join(b'\0' + b''.join(bytes((30, 90, 130) if (x//80+y//80)%2 else (235, 220, 175)) for x in range(width)) for y in range(height))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!2I5B', width, height, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')


def run(root, hugo, theme):
    root.mkdir(parents=True, exist_ok=True)
    def write(name, text):
        path = root/name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
    config = '''baseURL="https://example.test/lab/"
title="Atlas Docs"
theme="THEME"
defaultContentLanguage="en"
[outputs]
home=["HTML","RSS","JSON"]
[languages.en]
label="English"
contentDir="content/en"
weight=1
[languages.ja]
label="日本語"
contentDir="content/ja"
weight=2
[pagination]
pagerSize=4
[params]
googleFonts=false
customCSS=["css/site.css"]
customJS=["js/site.js"]
homeSections=["courses","posts"]
[params.brand]
pre="Atlas"
hl="Docs"
[params.article]
tocEnd=4
[params.search]
excludeSections=["excluded"]
[markup.tableOfContents]
startLevel=2
endLevel=5
'''.replace('THEME', theme.name)
    write('hugo.toml', config)
    write('assets/css/site.css', ':root{--contract-custom-last:yes}.list-title{letter-spacing:.01em}')
    write('assets/js/site.js', 'window.themeContractExtension = true;')
    for slot in ['head', 'article-before', 'article-after', 'footer']:
        write('layouts/partials/extensions/'+slot+'.html', '<meta data-slot="'+slot+'" content="{{ .Title }}">' if slot == 'head' else '<div data-slot="'+slot+'">{{ .Title }}</div>')

    def content(language, name, front, body=''):
        write('content/'+language+'/'+name, '---\n'+front+'\n---\n'+body)
    for language in ['en', 'ja']:
        content(language, 'courses/_index.md', '''title: Courses
cascade:
  params:
    readingNav:
      enabled: true
    sectionNav:
      enabled: true
      groupBy: group
      groupOrder: [Start, Next]
''')
        content(language, 'courses/first/index.md', '''title: First lesson
translationKey: lesson-one
date: 2026-01-01
weight: 10
group: Start
tags: [One]
''', '''## Recover a worker

The unique body term E_THEME_042 is explained here.

### Check connectivity

Use the steps below.

#### Deep detail

A fourth-level detail.

##### Fifth level

A fifth-level detail.

![A large checkerboard diagram](diagram.png)

{{< runbook-step title="Reusable step" id="reusable-step" >}}
{{< step-part kind="action" >}}Run the command.{{< /step-part >}}
{{< /runbook-step >}}
''')
        image = root/'content'/language/'courses/first/diagram.png'
        image.write_bytes(png(1600, 900))
        content(language, 'courses/second.md', 'title: Second lesson\nweight: 20\ngroup: Start\ndate: 2026-01-02', '## Second\nSecond lesson content.')
        content(language, 'courses/third.md', 'title: Third lesson\nweight: 30\ngroup: Next\ndate: 2026-01-03', '## Third\nThird lesson content.')
    content('en','posts/_index.md','title: Articles')
    tags = [f'Tag{i:02}' for i in range(35)]
    content('en','posts/all-terms.md','title: All terms\ndate: 2026-01-01\ntags: '+json.dumps(tags)+'\ncategories: '+json.dumps([f'Group{i:02}' for i in range(20)]),'## Content\nAll filters should be reachable.')
    content('en','posts/hidden.md','title: Hidden layout\ndate: 2026-01-02\ntoc: false\narticle:\n  showCover: false\n  showMeta: false\n  showRelated: false\n  showShare: false\n  showTags: false\n  showNavigation: false\nsearch: false','## Still readable\nThis is a simple page.')
    content('en','posts/draft.md','title: Draft fixture\ndraft: true','Private draft token.')
    content('en','posts/self-test.md','title: Self test\ninterview: true','## Review\n### Question one\nAnswer one.\n### Question two\nAnswer two.')
    content('en','excluded/item.md','title: Excluded search page','Never included in index.')
    content('en','roadmap/legacy/_index.md','title: Legacy track')
    content('en','roadmap/legacy/one.md','title: Legacy one\ntrack: legacy\ngroup: Basics\nweight: 10','## One\nLegacy contents.')
    content('en','roadmap/legacy/two.md','title: Legacy two\ntrack: legacy\ngroup: Basics\nweight: 20','## Two\nLegacy contents.')
    public = root/'public'
    env = dict(os.environ, HUGO_RESOURCEDIR=str(root/'resources'))
    def build():
        result = subprocess.run([hugo,'--source',str(root),'--themesDir',str(theme.parent),'--destination',str(public),'--cacheDir',str(root/'cache'),'--minify'],text=True,capture_output=True,env=env)
        assert result.returncode == 0, result.stdout+result.stderr
    build()
    module = importlib.util.spec_from_file_location('home_check', theme/'scripts/check-home-config.py')
    parser = importlib.util.module_from_spec(module)
    module.loader.exec_module(parser)
    def page(path): return parser.Document(public/path/'index.html').root
    def by_id(doc, identifier): return next(el for el in doc.find() if el.attrs.get('id') == identifier)
    def text(path): return (public/path).read_text()
    article = page('courses/first')
    assert 'fonts.googleapis.com' not in text('courses/first/index.html'), 'googleFonts=false must remove font requests'
    sheets = [link.attrs['href'].removeprefix('/lab/') for link in article.find(tag='link') if link.attrs.get('rel') == 'stylesheet']
    assert all('fonts.googleapis.com' not in text(sheet) for sheet in sheets), 'CSS must not bypass the font setting'
    assert article.find('rm-reading-nav'), 'A courses section must support reading navigation'
    assert '1 / 3' in article.find('rm-reading-context')[0].text()
    assert article.find('hub-tree-articles') and 'Second lesson' in article.find('hub-tree-articles')[0].text()
    toc = by_id(article, 'tocList')
    toc_links = [a.attrs.get('data-id') for a in toc.find(tag='a')]
    assert 'deep-detail' in toc_links and 'fifth-level' not in toc_links, toc_links
    assert 'reusable-step' in toc_links, 'Shortcode headings must remain in the outline'
    assert len(toc_links) == len(set(toc_links))
    hidden = page('posts/hidden')
    assert hidden.find('art-no-toc') and not hidden.find('art-toc') and not hidden.find('toc-fab')
    assert not hidden.find('art-cover-fig') and not hidden.find('art-meta') and not hidden.find('share-row')
    assert by_id(hidden, 'readWidthInlineBtn'), 'Width switch must remain available without a TOC'
    assert page('roadmap/legacy/one').find('rm-reading-nav'), 'Legacy track configuration must remain compatible'
    assert article.find('drawer-head')[0].find(tag='b')[0].text() == 'AtlasDocs'
    translations = [a.attrs['href'] for a in article.find('lang-switch')[0].find(tag='a')]
    assert '/lab/ja/courses/first/' in translations, translations
    assert '/lab/ja/' in [a.attrs['href'] for a in hidden.find('lang-switch')[0].find(tag='a')]
    ui = json.loads(by_id(page('ja/courses/first'),'vishine-i18n').text())
    assert ui['copySection'] == 'この節のリンクをコピー' and ui['zoomIn'] == '拡大'
    slots = {el.attrs.get('data-slot') for el in article.find() if el.attrs.get('data-slot')}
    assert slots == {'head','article-before','article-after','footer'}, slots
    sheets = [el.attrs['href'] for el in article.find(tag='link') if el.attrs.get('rel') == 'stylesheet']
    assert len(sheets) == 1, sheets
    css = text(sheets[0].removeprefix('/lab/'))
    assert css.index('--contract-custom-last') > css.index('.filter-picker')
    scripts = [el.attrs.get('src','') for el in article.find(tag='script')]
    assert any('/js/site.' in path for path in scripts), scripts
    listing = page('posts')
    assert len(listing.find('filter-quick')[0].find(tag='button')) == 3
    chip_tags = [el.attrs['data-value'] for el in listing.find('filter-panel')[0].find(tag='button') if el.attrs.get('data-type') == 'tag']
    assert all(tag in chip_tags for tag in tags), chip_tags
    assert len([el for el in listing.find(tag='link') if el.attrs.get('rel') == 'stylesheet']) == 1
    figure = article.find('fig')[0]
    assert figure.attrs['data-original'].endswith('/diagram.png')
    assert figure.attrs['data-image-width'] == '1600'
    assert '_hu_' in figure.find(tag='img')[0].attrs['src']
    assert by_id(article,'viewerViewport') and by_id(article,'viewerOriginal')
    index = json.loads(text('index.json'))
    assert not any(entry['title'] in ['Hidden layout','Draft fixture','Excluded search page'] for entry in index)
    lesson = next(entry for entry in index if entry['title'] == 'First lesson')
    assert lesson['sectionLabel'] == 'Courses'
    assert any('E_THEME_042' in part['text'] and part['anchor'] == 'recover-a-worker' for part in lesson['passages'])
    assert json.loads(text('manifest.webmanifest'))['scope'] == '/lab/'
    assert json.loads(text('ja/manifest.webmanifest'))['scope'] == '/lab/ja/'
    assert 'const SCOPE_PATH="/lab/"' in text('sw.js').replace(' ','') or 'const SCOPE_PATH = "/lab/"' in text('sw.js')
    assert '/lab/index.xml' in by_id(article,'rssCopy').attrs['data-rss']
    # Check the native Hugo depth setting when article overrides are absent.
    write('hugo.toml',config.replace('tocEnd=4',''))
    build()
    assert 'fifth-level' in [a.attrs.get('data-id') for a in by_id(page('courses/first'),'tocList').find(tag='a')]
    # Explicit false and body-index opt-out must not be swallowed by defaults.
    write('hugo.toml',config.replace('googleFonts=false','googleFonts=false\npwa=false').replace('excludeSections=["excluded"]','excludeSections=["excluded"]\nincludeBody=false'))
    build()
    assert 'rel="manifest"' not in text('courses/first/index.html') and 'rel=manifest' not in text('courses/first/index.html')
    assert all(not entry['passages'] for entry in json.loads(text('index.json')))
    # Leave the complete configuration available for browser acceptance.
    write('hugo.toml',config)
    build()
    subprocess.run(['node','--test',str(theme/'tests/pwa.test.cjs')],check=True,
                   env=dict(os.environ,VISHINE_SW_FILE=str(public/'sw.js')))
    print('PASS: arbitrary sections / legacy navigation / layout false / H4 + native H5 + shortcode TOC / brand / extension slots / custom JS / full terms / image originals / body search / exclusions / translations / subpath / scoped PWA / single CSS')
    print('Fixture:',root)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--hugo',default=os.environ.get('HUGO_BIN','hugo'))
    parser.add_argument('--fixture',type=Path,help='Keep the independent host at this path for browser acceptance')
    args = parser.parse_args()
    theme = Path(__file__).resolve().parents[1]
    if args.fixture: run(args.fixture.resolve(),args.hugo,theme)
    else:
        with tempfile.TemporaryDirectory(prefix='vishine-contracts-') as tmp: run(Path(tmp),args.hugo,theme)


if __name__ == '__main__': main()
