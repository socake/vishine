// Managed ego-browser Page; production tutorial served at localhost:1315.
export async function run(page,artifactDir) {
 const results=[],fs=await import('node:fs/promises');
 const check=(name,pass)=>{results.push({name,pass:!!pass});if(!pass)throw Error(name)};
 await page.goto('http://localhost:1315/docs/17-interactive/');
 await page.evaluate(()=>document.querySelector('[data-knowledge]').scrollIntoView({behavior:'instant'}));await page.waitForSelector('.ki-node');
 await page.evaluate(()=>{window.__kiPerfMutations=0;window.__kiPerfObserver=new MutationObserver(list=>window.__kiPerfMutations+=list.length);window.__kiPerfObserver.observe(document.querySelector('.ki-grid-graph'),{subtree:true,attributes:true,childList:true,characterData:true})});
 await page.fill('[aria-label="128 GPU · 并行策略实验室"] input >> nth=0','8');
 check('Draft input updates feedback without rewriting GPU graph',await page.evaluate(()=>{window.__kiPerfObserver.disconnect();const pass=window.__kiPerfMutations===0&&document.querySelector('[data-knowledge]').textContent.includes('参数尚未应用');delete window.__kiPerfObserver;delete window.__kiPerfMutations;return pass}));
 await page.evaluate(()=>document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"]').scrollIntoView({behavior:'instant'}));await page.waitForSelector('.ki-playback');
 check('Leaving the viewport stops playback and scheduled steps',await page.evaluate(async()=>{const h=document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"]');h.querySelectorAll('.ki-playback button')[1].click();await new Promise(r=>setTimeout(r,0));scrollTo({top:0,behavior:'instant'});await new Promise(r=>setTimeout(r,150));const step=h.querySelector('.ki-narration').textContent;await new Promise(r=>setTimeout(r,1100));return h.dataset.playing==='false'&&h.querySelector('.ki-narration').textContent===step}));
 check('Cleanup remains active after a persisted pagehide',await page.evaluate(async()=>{const count=()=>document.querySelectorAll('.ki-header').length;const n=count();window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));const preserved=count()===n;window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}));await new Promise(r=>setTimeout(r,0));return n>0&&preserved&&count()===0}));
 await fs.writeFile(artifactDir+'/performance-regressions.json',JSON.stringify(results,null,2));console.log(results);
}
