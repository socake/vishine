#!/usr/bin/env python3
"""Production Hugo integration, subpaths, invalid config and static fallback."""
import json, os, pathlib, subprocess, tempfile, argparse, re
p=argparse.ArgumentParser();p.add_argument('--hugo',default=os.environ.get('HUGO_BIN','hugo'));args=p.parse_args()
theme=pathlib.Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='vishine-knowledge-') as temp:
 root=pathlib.Path(temp);host=root/'host';page=host/'content/posts/lesson';page.mkdir(parents=True)
 (host/'hugo.toml').write_text('baseURL="https://example.test/nested/"\ntitle="Tests"\ndefaultContentLanguage="en"\n[params]\ngoogleFonts=false\n[outputs]\nhome=["HTML","JSON"]\n')
 (host/'content/plain.md').write_text('---\ntitle: Plain\n---\nExisting article.')
 (page/'index.md').write_text('---\ntitle: Lesson\n---\n{{< interactive src="knowledge-examples/math.yaml" params=`{"a":2}` >}}\n{{< interactive src="unsafe.json" >}}\n{{< interactive src="bad.yaml" >}}\n{{< interactive src="scalar.yaml" params=`[]` >}}\n{{< interactive src="bad-state.json" params=`{"x":2}` >}}\n{{< interactive src="scalar-state.json" params=`{"x":2}` >}}\n{{< interactive src="zero-state.json" >}}\n')
 config={'schemaVersion':1,'id':'escape','title':'Escaping','description':'</script><script>alert(1)</script>','state':{'draft_secret':{'type':'number','initial':999},'public':{'type':'number','initial':7,'label':'Public value'}},'scene':{'id':'text','type':'Text','props':{'text':'<img src=x onerror=alert(1)>'}}}
 (page/'unsafe.json').write_text(json.dumps(config));(page/'bad.yaml').write_text('state: [\n');(page/'scalar.yaml').write_text('123\n')
 (page/'bad-state.json').write_text(json.dumps({'state':{'x':1}}))
 (page/'zero-state.json').write_text(json.dumps({'state':0}))
 (page/'scalar-state.json').write_text(json.dumps({'state':42}))
 result=subprocess.run([args.hugo,'--source',str(host),'--themesDir',str(theme.parent),'--theme',theme.name,'--destination',str(root/'public'),'--cacheDir',str(root/'cache'),'--noBuildLock','--minify'],env=dict(os.environ,HUGO_RESOURCEDIR=str(root/'resources')),capture_output=True,text=True)
 assert result.returncode==0,result.stdout+result.stderr
 html=(root/'public/posts/lesson/index.html').read_text();plain=(root/'public/plain/index.html').read_text()
 assert 'knowledge-dist' not in plain
 assert '/nested/knowledge-dist/loader-' in html
 assert 'data-ki-fallback' in html and 'Text explanation' in html
 from html.parser import HTMLParser
 class InjectionCheck(HTMLParser):
  def handle_starttag(self,tag,attrs):
   assert not (tag=='img' and 'onerror' in dict(attrs)), 'Executable image payload'
   if tag=='script': assert dict(attrs).get('type')=='application/json' or not self.get_starttag_text().startswith('<script>alert'), 'Executable script payload'
 InjectionCheck().feed(html)
 assert '<script>alert(1)</script>' not in html.split('<body',1)[1]

 payloads=re.findall(r'<script[^>]*data-ki-config[^>]*>(.*?)</script>',html,re.S)
 assert len(payloads)==2
 payload=json.loads(payloads[0]);assert payload['state']['a']['initial']==2,payload['state']['a']
 fallback_blocks=re.findall(r'<details[^>]*data-ki-fallback[^>]*>(.*?)</details>',html,re.S)
 assert len(fallback_blocks)==2
 assert 'Public value' in fallback_blocks[1] and '>7<' in fallback_blocks[1]
 assert 'draft_secret' not in ''.join(fallback_blocks) and '999' not in ''.join(fallback_blocks)
 assert '二次项系数 a' in fallback_blocks[0] and '>2<' in fallback_blocks[0]
 assert 'configuration could not be read' in html
 assert list((root/'public/knowledge-dist/chunks').glob('runtime-*.js'))
 print('PASS: production/subpath publishing, isolated configs, parameter override, plain-page zero loader, escaped JSON, malformed YAML/scalar/state fallback (including overrides)')
