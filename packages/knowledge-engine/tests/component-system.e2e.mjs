// Uses the managed ego-browser Page supplied by the caller.
export async function run(page,artifactDir){
 const fs=await import('node:fs/promises');const results=[];const check=async(name,pass)=>{results.push({name,pass:!!pass});await fs.writeFile(artifactDir+'/component-results.json',JSON.stringify(results,null,2));console.log(pass?'PASS':'FAIL',name);if(!pass)throw Error(name)};
 await page.cdp('Emulation.setDeviceMetricsOverride',{width:1280,height:1100,deviceScaleFactor:1,mobile:false});await page.goto('http://localhost:1315/labs/components/');await page.waitForSelector('.ki-svg-node');
 await page.click('[data-component=Button] button >> nth=0');
 await check('Primary button executes its configured action',await page.evaluate(()=>document.querySelector('.ki-text').textContent==='操作次数：1'));
 await page.selectOption('.ki-select select >> nth=0','ghost');
 await check('Button variant is driven by shared state',await page.evaluate(()=>document.querySelectorAll('[data-component=Button] button')[1].dataset.variant==='ghost'));
 await check('Busy button and disabled input have actual disabled semantics',await page.evaluate(()=>{const b=document.querySelectorAll('[data-component=Button] button')[4];return b.disabled&&b.getAttribute('aria-busy')==='true'&&document.querySelector('input[type=number]').disabled}));
 await page.evaluate(()=>document.querySelector('.ki-svg-node[aria-disabled=true]').dispatchEvent(new MouseEvent('click',{bubbles:true})));
 await check('Disabled SVG node rejects selection',await page.evaluate(()=>document.querySelector('.ki-inspector p').textContent==='a'));
 await page.evaluate(()=>{const h=document.querySelector('.ki-diagram');scrollTo({top:scrollY+h.getBoundingClientRect().top-100,behavior:'instant'})});
 await page.click('.ki-svg-node >> nth=1');
 await check('Selected and highlighted states remain independent',await page.evaluate(()=>{const n=document.querySelectorAll('.ki-svg-node');return n[1].getAttribute('aria-pressed')==='true'&&n[1].dataset.active==='true'&&n[0].getAttribute('aria-pressed')==='false'&&n[1].querySelectorAll('rect').length===2}));
 await page.focus('.ki-svg-node >> nth=2');await page.keyboard.press('Enter');
 await check('Keyboard selection updates Inspector',await page.evaluate(()=>document.querySelector('.ki-inspector p').textContent==='c'));
 await check('Long labels wrap while full title remains available',await page.evaluate(()=>{const n=document.querySelectorAll('.ki-svg-node')[2];return n.querySelector('title').textContent.includes('较长的节点名称会自动换行')&&n.querySelectorAll('text')[0].querySelectorAll('tspan').length===2}));
 await check('Empty graph provides readable status',await page.evaluate(()=>document.querySelector('.ki-empty').getAttribute('role')==='status'));
 await page.hover('.ki-svg-node >> nth=1');
 await check('Hover highlights only related paths without changing selection',await page.evaluate(()=>document.querySelectorAll('.ki-edge[data-related=true]').length===1&&document.querySelector('.ki-inspector p').textContent==='c'));
 await page.click('[aria-label="Zoom in"]');await page.click('[aria-label="Zoom in"]');await page.click('.ki-zoom [aria-label="定位选中"]');
 await check('Locate selection moves only the diagram viewport to selected node',await page.evaluate(()=>{const a=document.querySelector('.ki-graph-scroll').getBoundingClientRect(),b=document.querySelector('.ki-svg-node[aria-pressed=true]').getBoundingClientRect();return b.left>=a.left-2&&b.right<=a.right+2&&b.top>=a.top-2&&b.bottom<=a.bottom+2}));
 await page.click('[aria-label="恢复缩放"]');
 const measurements=[];
 for(const width of [320,375,768,1280]){await page.cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:false});await page.waitForFunction(()=>document.querySelector('.ki-zoom').getBoundingClientRect().height<60);measurements.push(await page.evaluate(()=>({width:innerWidth,pageWidth:document.documentElement.scrollWidth,toolbarHeight:document.querySelector('.ki-zoom').getBoundingClientRect().height})));}
 await check('Toolbar stays one row and page has no horizontal overflow',measurements.every(x=>x.toolbarHeight<60&&x.width===x.pageWidth));
 const overlaps=await page.evaluate(()=>{const nodes=[...document.querySelectorAll('.ki-svg-node > rect:first-of-type')].map(e=>e.getBoundingClientRect()),labels=[...document.querySelectorAll('.ki-edge-label rect')].map(e=>e.getBoundingClientRect());const hit=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;return labels.some(a=>nodes.some(b=>hit(a,b)))||labels.some((a,i)=>labels.some((b,j)=>j>i&&hit(a,b)))});
 await check('Rendered connection labels do not overlap nodes or one another',!overlaps);
 await page.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await check('Reduced motion stops busy indicator animation',await page.evaluate(()=>getComputedStyle(document.querySelector('.ki-busy-dot')).animationName==='none'));await page.cdp('Emulation.setEmulatedMedia',{features:[]});
 await page.evaluate(()=>{const h=document.querySelector('.ki-grid-graph');scrollTo({top:scrollY+h.getBoundingClientRect().top-100,behavior:'instant'})});
 await page.selectOption('.ki-select select >> nth=1','首项');
 await page.focus('.ki-grid-graph .ki-node >> nth=1');await page.keyboard.press('ArrowRight');
 await check('Grid ArrowRight skips disabled first item using enabled index',await page.evaluate(()=>document.activeElement.textContent.includes('节点 C')));
 await page.keyboard.press('ArrowLeft');
 await check('Grid ArrowLeft returns to previous enabled item',await page.evaluate(()=>document.activeElement.textContent.includes('节点 B')));
 await page.selectOption('.ki-select select >> nth=1','中间项');
 await page.focus('.ki-grid-graph .ki-node >> nth=0');await page.keyboard.press('ArrowRight');
 await check('Grid ArrowRight skips disabled middle item',await page.evaluate(()=>document.activeElement.textContent.includes('节点 C')));
 await page.keyboard.press('ArrowRight');
 await check('Grid enabled focus wraps without stopping at disabled item',await page.evaluate(()=>document.activeElement.textContent.includes('节点 A')));
 await page.keyboard.press('Enter');
 await check('Grid Enter commits the focused enabled selection',await page.evaluate(()=>document.querySelector('.ki-grid-graph .ki-node[aria-pressed=true]').textContent.includes('节点 A')));
 console.log(JSON.stringify({results,measurements}));
}
