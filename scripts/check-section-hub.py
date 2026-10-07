#!/usr/bin/env python3
"""Build an isolated site and verify navigation boundaries, grouping and deep links."""
import argparse
import os
from pathlib import Path
import subprocess
import tempfile
from html.parser import HTMLParser

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.cards, self.articles, self.ids, self.stack = [], [], [], []
        self.html = path.read_text()
        self.feed(self.html)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get('class', '').split()
        if attrs.get('id'): self.ids.append(attrs['id'])
        if tag == 'a':
            if 'hub-card' in classes: self.cards.append(attrs['href'])
            if any('hub-pages' in cls for _, cls in self.stack): self.articles.append(attrs['href'])
        if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'):
            self.stack.append((tag, classes))
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i][0] == tag:
                self.stack = self.stack[:i]
                break

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--hugo',default=os.environ.get('HUGO_BIN','hugo'))
    args=parser.parse_args()
    theme=Path(__file__).resolve().parents[1]
    with tempfile.TemporaryDirectory(prefix='vishine-hub-') as tmp:
        root=Path(tmp)
        (root/'hugo.toml').write_text('''baseURL="https://example.test/project/"
title="Hub fixture"
theme="'''+theme.name+'''"
defaultContentLanguage="zh-cn"
[outputs]
home=["HTML","JSON"]
[params]
googleFonts=false
[params.cover]
auto=false
''')
        def content(name, front, body=''):
            p=root/'content'/name
            p.parent.mkdir(parents=True,exist_ok=True)
            p.write_text('---\n'+front+'\n---\n'+body)
        content('kb/_index.md','''title: 知识库
cascade:
  params:
    sectionNav:
      enabled: true
      groupBy: group
      subgroupBy: stage
      groupOrder: [基础]
''')
        content('kb/a.md','title: 基础条目\nweight: 1\ngroup: 基础\nstage: 开始')
        content('kb/b.md','title: 未知分组也显示\nweight: 2\ngroup: 扩展')
        content('kb/c.md','title: 未分组也显示\nweight: 3')
        content('kb/draft.md','title: 不应显示\ndraft: true')
        content('kb/branch/_index.md','title: 分支\nweight: 1')
        content('kb/branch/deep/_index.md','title: 更深层级')
        content('kb/branch/deep/leaf.md','title: 深层文章')
        content('kb/leaf/_index.md','title: 纯文章栏目\nweight: 2')
        content('kb/leaf/page.md','title: 直属文章')
        content('kb/empty/_index.md','title: 空栏目\nweight: 3')
        content('posts/_index.md','title: 博客')
        content('posts/post.md','title: 普通文章\ndate: 2026-01-01')
        subprocess.run([args.hugo, 'new', 'content', '--source', str(root),
                        '--themesDir', str(theme.parent), '--kind', 'hub',
                        'handbook/_index.md'], check=True, capture_output=True, text=True)
        content('handbook/start.md','title: 从这里开始')
        command=[args.hugo,'--source',str(root),'--themesDir',str(theme.parent),'--destination',str(root/'public'),'--cacheDir',str(root/'cache')]
        result=subprocess.run(command,capture_output=True,text=True)
        if result.returncode: raise RuntimeError(result.stdout+result.stderr)
        def page(slug): return Page(root/'public'/slug/'index.html')
        kb=page('kb')
        assert len(kb.cards)==3, kb.cards
        assert kb.articles==['/project/kb/a/','/project/kb/b/','/project/kb/c/'],kb.articles
        assert '不应显示' not in kb.html
        assert '开始' in kb.html and '扩展' in kb.html
        assert len(kb.ids)==len(set(kb.ids))
        branch=page('kb/branch')
        assert branch.cards==['/project/kb/branch/deep/'] and not branch.articles
        leaf=page('kb/leaf')
        assert not leaf.cards and leaf.articles==['/project/kb/leaf/page/']
        assert '这里还没有子栏目或文章' in page('kb/empty').html
        deep=page('kb/branch/deep')
        assert deep.articles==['/project/kb/branch/deep/leaf/']
        assert 'aria-current="page"' in deep.html
        assert 'id="postGrid"' in page('posts').html
        assert 'section-hub' not in page('posts').html.split('<main',1)[1].split('>',1)[0]
        assert page('handbook').articles==['/project/handbook/start/']
        print('PASS: mixed / branch-only / leaf-only / empty / 3-level nesting / unknown and missing groups / stage / drafts / subpath / normal blog fallback / archetype and explicit layout')
if __name__=='__main__': main()
