/* Runs the actual Hugo-rendered worker against an in-memory Cache API. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const worker = process.env.VISHINE_SW_FILE;
function runtime(file = worker) {
  const origin = 'https://example.test', storage = new Map(), listeners = {};
  const address = value => new URL(typeof value === 'string' ? value : value.url,origin).href;
  function cache() {
    const entries = new Map();
    return {
      add: async key => entries.set(address(key),new Response('precache')),
      put: async (key,value) => entries.set(address(key),value.clone()),
      match: async key => entries.get(address(key))?.clone(),
      delete: async key => entries.delete(address(key)),
      keys: async () => [...entries.keys()].map(url=>({url}))
    };
  }
  const caches = {
    open:async name=>{if(!storage.has(name)) storage.set(name,cache());return storage.get(name);},
    keys:async()=>[...storage.keys()], delete:async name=>storage.delete(name)
  };
  let network = async () => new Response('ok');
  const context = vm.createContext({URL,Response,Promise,Math,caches,
    fetch:(...args)=>network(...args),
    self:{location:{origin},addEventListener:(name,fn)=>listeners[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}}
  });
  vm.runInContext(fs.readFileSync(file,'utf8'),context);
  const names = vm.runInContext('({PREFIX,ASSETS,PAGES,MAX_PAGES})',context);
  async function fire(name, request) {
    const pending=[];let response;
    listeners[name]({request,waitUntil:p=>pending.push(p),respondWith:p=>response=p});
    const result = response && await response;
    await Promise.all(pending);return result;
  }
  return {names,caches,fire,setNetwork:fn=>network=fn};
}
test('activation removes only this site’s obsolete assets and keeps reading pages',{skip:!worker},async()=>{
  const app=runtime();const {PREFIX,ASSETS,PAGES}=app.names;
  await app.caches.open(PREFIX+'assets-old');await app.caches.open(ASSETS);await app.caches.open(PAGES);
  await app.caches.open('vishine-other-site-assets-old');await app.fire('activate');
  const keys=await app.caches.keys();assert(!keys.includes(PREFIX+'assets-old'));assert(keys.includes(PAGES));assert(keys.includes('vishine-other-site-assets-old'));
});
test('failed navigation cannot replace a good offline reading copy',{skip:!worker},async()=>{
  const app=runtime(),req={url:'https://example.test/lab/courses/first/',method:'GET',mode:'navigate'};
  app.setNetwork(async()=>new Response('good article'));assert.equal(await (await app.fire('fetch',req)).text(),'good article');
  app.setNetwork(async()=>new Response('server error',{status:500}));assert.equal(await (await app.fire('fetch',req)).text(),'good article');
  app.setNetwork(async()=>{throw new Error('offline');});assert.equal(await (await app.fire('fetch',req)).text(),'good article');
});
test('activation preserves fingerprinted assets referenced by retained HTML',{skip:!worker},async()=>{
  const app=runtime(),req={url:'https://example.test/lab/css/previous.abcdef.css',method:'GET',mode:'cors'};
  assert.equal(app.names.ASSETS,app.names.PREFIX+'assets-v2');
  app.setNetwork(async()=>new Response('previous theme stylesheet'));
  await app.fire('fetch',req);await app.fire('activate');
  app.setNetwork(async()=>{throw new Error('offline');});
  assert.equal(await (await app.fire('fetch',req)).text(),'previous theme stylesheet');
});
test('404 is returned honestly and does not overwrite a successful cache copy',{skip:!worker},async()=>{
  const app=runtime(),req={url:'https://example.test/lab/existing/',method:'GET',mode:'navigate'};
  app.setNetwork(async()=>new Response('existing article'));await app.fire('fetch',req);
  app.setNetwork(async()=>new Response('deleted',{status:404}));assert.equal((await app.fire('fetch',req)).status,404);
  assert.equal(await (await (await app.caches.open(app.names.PAGES)).match(req)).text(),'existing article');
});
test('reading cache is bounded and preserves the latest visits',{skip:!worker},async()=>{
  const app=runtime();
  for(let i=0;i<app.names.MAX_PAGES+2;i++) await app.fire('fetch',{url:`https://example.test/lab/page-${i}/`,method:'GET',mode:'navigate'});
  const cache=await app.caches.open(app.names.PAGES);const keys=await cache.keys();
  assert.equal(keys.length,app.names.MAX_PAGES);assert(!keys.some(key=>key.url.endsWith('/page-0/')));
});
test('a language worker can cache shared assets outside its language prefix',{skip:!worker},async()=>{
  const sibling=require('node:path').join(require('node:path').dirname(worker),'ja/sw.js');
  const app=runtime(sibling),req={url:'https://example.test/lab/css/shared.css',method:'GET',mode:'cors'};
  app.setNetwork(async()=>new Response('shared stylesheet'));await app.fire('fetch',req);
  app.setNetwork(async()=>{throw new Error('offline');});assert.equal(await (await app.fire('fetch',req)).text(),'shared stylesheet');
  assert.equal(await app.fire('fetch',{url:'https://example.test/other/page/',method:'GET',mode:'navigate'}),undefined);
});
