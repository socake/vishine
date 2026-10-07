const { test } = require('node:test');
const assert = require('node:assert/strict');
const model = require('../assets/js/list-state.js');
const items = [
  {url:'a',categories:['读书笔记'],tags:['学习']},
  {url:'b',categories:['Kubernetes'],tags:['GitOps']},
  {url:'c',categories:['Linux'],tags:['Shell']},
  {url:'d',categories:['Kubernetes'],tags:['Shell']},
  {url:'e',categories:['Kubernetes','Linux'],tags:['GitOps']}
];
const blank = {category:[],tag:[],page:1};
test('filters the complete collection before pagination, including items outside the initial page', () => {
  const first = model.select(items,{...blank,category:['Kubernetes']},2);
  assert.equal(first.total,3); assert.equal(first.pages,2);
  assert.deepEqual(first.items.map(x=>x.url),['b','d']);
  const last = model.select(items,{...blank,category:['Kubernetes'],page:2},2);
  assert.deepEqual(last.items.map(x=>x.url),['e']);
  assert.deepEqual([last.from,last.to,last.total],[3,3,3]);
});
test('same-type OR and cross-type AND preserve one copy of multi-category entries', () => {
  const result=model.select(items,{category:['Kubernetes','Linux'],tag:['GitOps'],page:1},8);
  assert.deepEqual(result.items.map(x=>x.url),['b','e']);
});
test('clearing returns the full total; empty results and stale page numbers are consistent', () => {
  assert.equal(model.select(items,blank,2).total,5);
  const empty=model.select(items,{category:['读书笔记'],tag:['GitOps'],page:5},2);
  assert.deepEqual([empty.items.length,empty.total,empty.pages,empty.page,empty.from,empty.to],[0,0,0,1,0,0]);
  assert.equal(model.select(items,{...blank,page:99},2).page,3);
});
test('URL round trip handles Chinese, slashes, commas and repeated keys while preserving unrelated parameters', () => {
  const state={category:['云原生','CI/CD','a,b'],tag:['C++','A&B'],page:3};
  const path=model.address('https://example.com/blog/posts/page/2/?utm_source=review#list','/blog/posts/',state);
  const url=new URL(path,'https://example.com');
  assert.equal(url.searchParams.get('utm_source'),'review');assert.equal(url.hash,'#list');
  assert.deepEqual(model.read(url,'/blog/posts/',1),state);
  const clear=new URL(model.address(url,'/blog/posts/',blank),'https://example.com');
  assert.equal(clear.search,'?utm_source=review');
});
test('restores a server-rendered second page, validates malformed page values, and de-duplicates selections', () => {
  assert.equal(model.read(new URL('https://example.com/posts/page/2/'),'/posts/page/2/',2).page,2);
  for(const value of ['-1','1.5','NaN','Infinity']) assert.equal(model.read(new URL('https://example.com/posts/?page='+value),'/posts/',1).page,1);
  assert.deepEqual(model.read(new URL('https://example.com/posts/?cat=Linux&cat=Linux'),'/posts/',1).category,['Linux']);
});
