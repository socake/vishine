const test = require('node:test');
const assert = require('node:assert/strict');
const search = require('../assets/js/search-state.js');
const entries = search.prepare([
  {title:'Operations guide',url:'/guide/',type:'courses',date:'2026-01-01',categories:['Systems'],tags:['Linux'],summary:'Start here',passages:[{heading:'Recover a worker',anchor:'recover',text:'Check logs, then resolve E_THEME_042 before continuing.'}]},
  {title:'E_THEME_042',url:'/posts/code/',type:'posts',date:'2025-01-01',summary:'Reference',passages:[]},
  {title:'日本語の手引き',url:'/ja/guide/',type:'courses',date:'2026-01-02',passages:[{heading:'接続の確認',anchor:'接続',text:'エラー ABC42 の場合に再接続する。'}]}
]);
test('body-only matches include an excerpt and an existing heading anchor',()=>{
  const result=search.find(entries,'E_THEME_042','courses');
  assert.equal(result.length,1);assert.equal(result[0].anchor,'recover');assert.match(result[0].snippet,/E_THEME_042/);
});
test('exact title ranks above a body match and keeps its article URL',()=>{
  const result=search.find(entries,'E_THEME_042');assert.equal(result[0].title,'E_THEME_042');assert.equal(result[0].anchor,'');
});
test('terms combine metadata and the matching passage; unrelated terms do not match',()=>{
  assert.equal(search.find(entries,'Linux E_THEME_042').length,1);
  assert.equal(search.find(entries,'Linux missing-token').length,0);
});
test('Unicode normalization supports full-width queries and CJK',()=>{
  assert.equal(search.find(entries,'ＡＢＣ４２')[0].anchor,'接続');
  assert.equal(search.find(entries,'再接続')[0].title,'日本語の手引き');
});
test('scope applies to recent entries as well as searches',()=>{
  assert.equal(search.find(entries,'','posts').length,1);
  assert.equal(search.find(entries,'','courses').length,2);
});
