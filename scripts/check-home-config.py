#!/usr/bin/env python3
"""Build the real two-section preset and check homepage/brand URL contracts."""
import argparse
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

class Element:
    def __init__(self, tag='', attrs=None):
        self.tag, self.attrs, self.children = tag, dict(attrs or []), []
    def text(self):
        return ''.join(c if isinstance(c, str) else c.text() for c in self.children)
    def find(self, cls=None, tag=None):
        found = []
        for child in self.children:
            if isinstance(child, Element):
                if (cls is None or cls in child.attrs.get('class', '').split()) and (tag is None or tag == child.tag):
                    found.append(child)
                found.extend(child.find(cls, tag))
        return found

class Document(HTMLParser):
    void = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
    def __init__(self, path):
        super().__init__()
        self.root = Element()
        self.stack = [self.root]
        self.feed(path.read_text())
    def handle_starttag(self, tag, attrs):
        element = Element(tag, attrs)
        self.stack[-1].children.append(element)
        if tag not in self.void:
            self.stack.append(element)
    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Element(tag, attrs))
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]
                break
    def handle_data(self, data):
        self.stack[-1].children.append(data)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--hugo', default=os.environ.get('HUGO_BIN', 'hugo'))
    args = parser.parse_args()
    theme = Path(__file__).resolve().parents[1]
    with tempfile.TemporaryDirectory(prefix='vishine-home-') as tmp:
        root = Path(tmp)/'site'
        shutil.copytree(theme/'exampleSite/presets/internal', root)
        public = Path(tmp)/'public'
        env = dict(os.environ, HUGO_RESOURCEDIR=str(Path(tmp)/'resources'))
        def build(override=''):
            config = root/'override.toml'
            config.write_text(override)
            command = [args.hugo, '--source', str(root), '--themesDir', str(theme.parent), '--minify',
                       '--destination', str(public), '--cacheDir', str(Path(tmp)/'cache'),
                       '--config', 'hugo.toml,override.toml']
            result = subprocess.run(command, text=True, capture_output=True, env=env)
            log = result.stdout + result.stderr
            assert result.returncode == 0 and not re.search(r'\b(ERROR|WARN)\b', log), log
            return Document(public/'index.html').root
        def target(url):
            path = unquote(urlsplit(url).path)
            assert path.startswith('/internal/'), url
            relative = path.removeprefix('/internal/')
            return public/relative/('index.html' if path.endswith('/') else '')
        def cover_texts(page):
            src = page.find('art-cover-fig')[0].find(tag='img')[0].attrs['src']
            svg = ET.parse(target(src)).getroot()
            return [''.join(e.itertext()) for e in svg.iter() if e.tag.endswith('}text')]

        home = build()
        assert Document(public/'posts/intro-1/index.html').root.find('art-cover-fig')
        home = build('[params.cover]\nautoArticle=false\n')
        assert not Document(public/'posts/intro-1/index.html').root.find('art-cover-fig')
        assert Document(public/'posts/index.html').root.find(tag='source'), 'mobile artwork must survive autoArticle=false'
        home = build('[params.cover]\nautoArticle=true\n')
        cards = home.find('mod')
        assert len(cards) == 2
        assert all('span-3' in c.attrs['class'].split() for c in cards)
        assert [c.attrs['class'].split()[2] for c in cards] == ['sec-docs','sec-posts']
        assert all(c.find('mod-ico')[0].find(tag='svg') for c in cards)
        rows = cards[0].find('mod-index-row')
        assert len(rows) == 7 and all(r.find('index-count')[0].text() == '1' for r in rows)
        assert [r.find('index-title')[0].text() for r in rows] == ['安装','配置','命令行','项目','协作','部署','排障']
        assert '7 专区' in cards[0].find('mod-count')[0].text()
        assert [s.find('num')[0].text() for s in home.find('stat-cell')] == ['3篇','7篇','2+','1+']
        assert [s.find('lbl')[0].text() for s in home.find('stat-cell')][:2] == ['入门介绍','使用手册']
        assert len(home.find('feed-row')) == 6
        assert all('/docs/' in r.attrs['href'] for r in home.find('feed-row'))
        assert home.find('brand-mini')[0].find(tag='b')[0].text() == 'DevBox'
        assert '团队共享的工具使用手册。' in home.find('foot-brand')[0].text()
        for link in home.find('hero-links')[0].find(tag='a') + rows:
            assert target(link.attrs['href']).is_file(), link.attrs
        article = Document(public/'posts/intro-1/index.html').root
        tag = [a for a in article.find('art-end')[0].find(tag='a') if a.text() == 'bcecmd -c'][0]
        assert '/tags/bcecmd--c/' in tag.attrs['href'] and target(tag.attrs['href']).is_file(), tag.attrs
        texts = cover_texts(article)
        assert 'bcecmd -c' in texts and 'DevBox' in texts, texts
        assert article.find('art-title')[0].text() == 'sslaunch 是什么'
        sheets = [e.attrs['href'] for e in home.find(tag='link') if e.attrs.get('rel') == 'stylesheet']
        css = target(sheets[0]).read_text()
        assert css.index('--internal-site-extension') > css.index('.mod-index-row')
        assert not re.search(r'(?<![\w. ])\.reveal\{opacity:0', css)
        assert '@media print' in css
        thumbs = list((public/'covers').glob('*.svg'))
        assert any('Dev' in p.read_text() and 'Box' in p.read_text() for p in thumbs)

        # Recursive counts, draft exclusion and mixed-source date ordering.
        nested = root/'content/docs/01/deep'
        nested.mkdir()
        (nested/'_index.md').write_text('---\ntitle: 更深栏目\n---\n')
        (nested/'page.md').write_text('---\ntitle: 深层文章\ndate: 2026-08-01\n---\n')
        (root/'content/posts/draft.md').write_text('---\ntitle: 不应出现\ndraft: true\n---\n')
        home = build('[params]\nrecentLimit=10\n')
        assert len(home.find('mod-index-row')) == 7
        assert home.find('mod-index-row')[0].find('index-count')[0].text() == '2'
        dates = [target(a.attrs['href']) for a in home.find('feed-row')]
        assert len(dates) == 10 and len(set(dates)) == 10
        assert '不应出现' not in home.text()
        assert '/posts/intro-3/' in home.find('feed-row')[7].attrs['href']

        # Cardinality layouts remain independent of the AI class.
        keys = ['docs','posts','playbook','roadmap','resources','extra']
        expected = {1:[6], 2:[3,3], 3:[2,2,2], 4:[3,3,3,3], 5:[3,3,2,2,2], 6:[2]*6}
        for count, spans in expected.items():
            layouts = '\n[params.homeCardLayout]\n' + '\n'.join(key+'="standard"' for key in keys)
            home = build('[params]\nhomeSections='+repr(keys[:count]).replace("'", '"')+'\n'+layouts)
            actual = [int(re.search(r'\bspan-(\d)', c.attrs['class'])[1]) for c in home.find('mod')]
            assert actual == spans, (count, actual)

        # Default density groups sparse destinations after the standard cards.
        home = build('[params]\nhomeSections=["resources","docs","posts"]\n')
        cards = home.find('mod')
        assert [c.attrs['class'].split()[2] for c in cards] == ['sec-docs','sec-posts','sec-resources']
        assert 'mod-compact' in cards[-1].attrs['class'] and 'span-6' in cards[-1].attrs['class']
        home = build('[params.homeCardLayout]\nposts="compact"\n')
        assert 'mod-compact' in home.find('mod')[-1].attrs['class']
        try:
            build('[params.homeCardLayout]\nposts="unsupported"\n')
        except AssertionError as error:
            assert 'homeCardLayout.posts' in str(error)
        else:
            raise AssertionError('Invalid home layout must fail')

        # Custom taxonomy permalinks and raw SVG icons use Hugo data, not guessed paths.
        (root/'data/sections.toml').write_text('[sections.posts]\nclass="ai"\nicon=\'<svg viewBox="0 0 24 24"><path data-custom="yes" d="M0 0h24"/></svg>\'\n')
        home = build('[permalinks.term]\ntags="/keywords/:slug/"\n')
        assert any(p.attrs.get('data-custom') == 'yes' for p in home.find(tag='path'))
        article = Document(public/'posts/intro-1/index.html').root
        tag = [a for a in article.find('art-end')[0].find(tag='a') if a.text() == 'bcecmd -c'][0]
        assert '/keywords/' in tag.attrs['href'] and target(tag.attrs['href']).is_file()

        # Legacy defaults, Title fallback, unresolvable links, and docs category fallback.
        config = (root/'hugo.toml').read_text()
        remove = ('homeSections', 'homeStats', 'recentSections', 'recentLimit', 'heroLinks', 'brand', 'customCSS', 'footerTagline')
        (root/'hugo.toml').write_text('\n'.join(line for line in config.splitlines() if not line.startswith(remove)))
        home = build()
        assert [int(s.find('num')[0].text().rstrip('篇+')) for s in home.find('stat-cell')][:2] == [3,0]
        assert len(home.find('mod')) == 5 and len(home.find('feed-row')) == 3
        assert home.find('brand-mini')[0].find(tag='b')[0].text() == 'DevBox'
        assert not home.find('hero-links') and home.find('role-tags')
        assert '的技术索引。' in home.find('foot-brand')[0].text()
        home = build('[params]\nheroLinks=[{name="无效",pageRef="/missing"},{name="手册",pageRef="/docs"}]\nfooterTagline=""\n')
        assert len(home.find('hero-links')[0].find(tag='a')) == 1
        assert '的技术索引。' not in home.find('foot-brand')[0].text()
        shutil.rmtree(root/'content/docs')
        (root/'content/docs').mkdir()
        (root/'content/docs/_index.md').write_text('---\ntitle: 手册\n---\n')
        home = build()
        assert not home.find('mod-index-row') and home.find('mod-chips')
        # Preserve full HTML titles; topic labels safely truncate without cropping.
        post = root/'content/posts/intro-1.md'
        for title, label in [('中文标题超过十一字保持中点断行', '中文主题'),
                             ('LongUnbrokenASCIIWord', 'LongUnbrokenASCIIWord'),
                             ('sslaunch是什么以及使用指南', 'A & B')]:
            post.write_text('---\ntitle: '+title+'\ncoverLabel: '+label+'\ndate: 2026-01-01\n---\n')
            build('[params.cover]\nautoArticle=true\n')
            article = Document(public/'posts/intro-1/index.html').root
            texts = cover_texts(article)
            expected = label if len(label) <= 18 else label[:17]+'…'
            assert expected in texts, (label, texts)
            assert article.find('art-title')[0].text() == title
        post.write_text('---\ntitle: Manual cover\ncover: /manual.svg\ndate: 2026-01-01\n---\n')
        (root/'static').mkdir(exist_ok=True)
        (root/'static/manual.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><rect width="300" height="100"/></svg>')
        build('[params.cover]\nautoArticle=false\n')
        assert Document(public/'posts/intro-1/index.html').root.find('art-cover-fig')[0].find(tag='img')[0].attrs['src'] == '/manual.svg'
    print('PASS: two-section preset / 7 child counts / statistics / icons / brands / hero links / recent ordering / term URLs / title wrapping / CSS extension / legacy defaults / 1–6 cards')

if __name__ == '__main__':
    main()
