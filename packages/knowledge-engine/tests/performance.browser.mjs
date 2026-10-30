export async function run(p,output){
await p.cdp('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
await p.cdp('Emulation.setCPUThrottlingRate',{rate:4});
await p.goto('http://localhost:1315/posts/interactive-knowledge-engine/');
const initial=await p.evaluate(()=>({mounted:document.querySelectorAll('[data-ready=true]').length,resources:performance.getEntriesByType('resource').filter(e=>e.name.includes('knowledge-dist')).map(e=>e.name.split('/').pop())}));
await p.evaluate(()=>document.querySelector('[data-knowledge]').scrollIntoView({behavior:'instant'}));await p.waitForSelector('.ki-node');
const run=async()=>await p.evaluate(async()=>{
const host=document.querySelector('[data-knowledge]'),buttons=[...host.querySelectorAll('.ki-node')];const commits=[],frames=[],longTasks=[];const observer=new PerformanceObserver(list=>longTasks.push(...list.getEntries().map(e=>e.duration)));observer.observe({type:'longtask'});
for(let i=0;i<30;i++){
const b=buttons[(i+1)%buttons.length],start=performance.now();
await new Promise(resolve=>{const o=new MutationObserver(()=>{if(b.getAttribute('aria-pressed')==='true'){o.disconnect();resolve(null)}});o.observe(b,{attributes:true});b.click();});
commits.push(performance.now()-start);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));frames.push(performance.now()-start);
}
observer.disconnect();const stats=a=>{a.sort((x,y)=>x-y);return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a[a.length-1]}};return {nodes:buttons.length,samples:30,commit:stats(commits),twoFrames:stats(frames),longTasks};});
const gpu128=await run();
await p.fill('[aria-label="128 GPU · 并行策略实验室"] input >> nth=0','64');await p.fill('[aria-label="128 GPU · 并行策略实验室"] input >> nth=2','64');await p.click('[aria-label="128 GPU · 并行策略实验室"] [data-component=Button] button');await p.waitForFunction(()=>document.querySelectorAll('.ki-node').length===512);
const gpu512=await run();
const resources=await p.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('knowledge-dist')).map(e=>e.name.split('/').pop()));
await p.goto('http://localhost:1315/');const plain=await p.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('knowledge-dist')).map(e=>e.name));
await p.cdp('Emulation.setCPUThrottlingRate',{rate:1});
const report={environment:await p.evaluate(()=>({userAgent:navigator.userAgent,cores:navigator.hardwareConcurrency,cpuThrottle:4,network:'localhost, no network throttling'})),initial,gpu128,gpu512,resources,plain};console.log(report);await(await import('node:fs/promises')).writeFile(output,JSON.stringify(report,null,2));
}
