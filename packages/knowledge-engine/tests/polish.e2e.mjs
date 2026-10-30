// Additional production-page checks for control geometry and authored initial layouts.
export async function run(page,artifactDir){
 const fs=await import('node:fs/promises');const results=[];
 const check=async(name,pass)=>{results.push({name,pass:!!pass});await fs.writeFile(artifactDir+'/polish-results.json',JSON.stringify(results,null,2));console.log(pass?'PASS':'FAIL',name);if(!pass)throw Error(name)};
 await page.cdp('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});await page.goto('http://localhost:1315/docs/17-interactive/');
 const titles=await page.evaluate(()=>[...document.querySelectorAll('[data-knowledge]')].map(e=>e.getAttribute('aria-label')));
 for(const title of titles){await page.evaluate(title=>{const h=document.querySelector(`[aria-label="${title}"]`);scrollTo({top:scrollY+h.getBoundingClientRect().top-80,behavior:'instant'})},title);await page.waitForFunction(title=>document.querySelector(`[aria-label="${title}"]`)?.dataset.ready==='true',title)}
 await check('Every select reserves text space and inset arrow',await page.evaluate(()=>[...document.querySelectorAll('.ki-select')].every(w=>{const s=w.querySelector('select'),i=w.querySelector('svg');return parseFloat(getComputedStyle(s).paddingRight)>=40&&parseFloat(getComputedStyle(i).right)>=14&&getComputedStyle(i).pointerEvents==='none'})));
 await check('Ring initial connections are static topology, not active transfers',await page.evaluate(()=>{const e=[...document.querySelectorAll('[aria-label="Ring AllReduce · 数据如何汇合"] .ki-edge')];return e.length===4&&e.every(e=>e.dataset.transmitting==='false'&&!e.querySelector('.ki-edge-line').hasAttribute('marker-end'))}));
 await check('Initial selected GPU is visible inside its own scroll area',await page.evaluate(()=>{const g=document.querySelector('.ki-node-groups'),n=g.querySelector('[aria-pressed=true]'),r=g.getBoundingClientRect(),b=n.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom}));
 await page.selectOption('[aria-label="128 GPU · 并行策略实验室"] select','DP');
 await check('Styled native select still updates group selection',await page.evaluate(()=>document.querySelectorAll('.ki-node[data-active=true]').length===16));
 await page.focus('[aria-label="128 GPU · 并行策略实验室"] select');await page.keyboard.press('t');
 await check('Native select keyboard typeahead changes the selected group',await page.evaluate(()=>document.querySelector('[aria-label="128 GPU · 并行策略实验室"] select').value==='TP'));
 await page.cdp('Emulation.setDeviceMetricsOverride',{width:375,height:1000,deviceScaleFactor:1,mobile:false});
 for(const title of ['Kubernetes · 一个 Pod 如何找到节点','TCP · 三次握手']){
 await page.evaluate(title=>{const h=document.querySelector(`[aria-label="${title}"]`);scrollTo({top:scrollY+h.getBoundingClientRect().top-80,behavior:'instant'})},title);
 await page.waitForFunction(title=>{const h=document.querySelector(`[aria-label="${title}"]`),r=h.querySelector('.ki-graph-scroll').getBoundingClientRect();return [...h.querySelectorAll('.ki-svg-node')].every(n=>{const b=n.getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1})},title);
 await check(title+' initial nodes fit mobile viewport',true);
 }
 await check('TCP removes unused vertical space and shows two endpoints',await page.evaluate(()=>{const h=document.querySelector('[aria-label="TCP · 三次握手"]');return h.querySelectorAll('.ki-svg-node').length===2&&h.querySelector('.ki-graph-scroll').clientHeight<=180}));
 await check('Kubernetes separates control, node and workload layers',await page.evaluate(()=>document.querySelectorAll('[aria-label="Kubernetes · 一个 Pod 如何找到节点"] .ki-graph-band').length===3));
 console.log(JSON.stringify(results));
}
