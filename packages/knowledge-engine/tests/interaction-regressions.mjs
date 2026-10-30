// Execute with the same managed ego-browser Page used by browser.e2e.mjs.
export async function run(page,artifactDir){
 const fs=await import('node:fs/promises');const results=[];
 const check=async(name,pass)=>{results.push({name,pass:!!pass});await fs.writeFile(artifactDir+'/interaction-regressions.json',JSON.stringify(results,null,2));console.log(pass?'PASS':'FAIL',name);if(!pass)throw Error(name)};
 const gpu='128 GPU · 并行策略实验室',ring='Ring AllReduce · 数据如何汇合',math='二次函数 · 参数怎样改变曲线',gallery='组件组合与联动';
 const scope=title=>`[data-knowledge][aria-label="${title}"]`;
 const show=async title=>{await page.evaluate(title=>{const h=[...document.querySelectorAll('[data-knowledge]')].find(e=>e.getAttribute('aria-label')===title);scrollTo({top:scrollY+h.getBoundingClientRect().top-80,behavior:'instant'})},title);await page.waitForFunction(title=>document.querySelector(`[aria-label="${title}"]`)?.dataset.ready==='true',title)};
 await page.cdp('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
 await page.goto('http://localhost:1315/docs/17-interactive/');
 for(const title of await page.evaluate(()=>[...document.querySelectorAll('[data-knowledge]')].map(e=>e.getAttribute('aria-label'))))await show(title);
 await show(ring);
 await page.click(scope(ring)+' .ki-svg-node >> nth=2');
 await page.click(scope(ring)+' .ki-playback button >> nth=2');
 await check('Ring selection survives next step',await page.evaluate(()=>document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"] .ki-inspector').textContent.startsWith('数据块的贡献来源Rank 2')));
 await page.click(scope(ring)+' .ki-playback button >> nth=0');
 await check('Ring selection survives previous step',await page.evaluate(()=>document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"] .ki-svg-node[aria-pressed=true]').textContent.includes('Rank 2')));
 await page.selectOption(scope(ring)+' .ki-playback select','0.5');
 // Ego native actions briefly hide/show the page. Test selection in one foreground
 // DOM event sequence so the intentional visibility-pause does not mask selection.
 await check('Selecting another Rank keeps playback running',await page.evaluate(async()=>{
 const h=document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"]');
 h.querySelectorAll('.ki-playback button')[1].click();await new Promise(r=>setTimeout(r,0));
 h.querySelectorAll('.ki-svg-node')[1].dispatchEvent(new MouseEvent('click',{bubbles:true}));await new Promise(r=>setTimeout(r,0));
 const playing=h.dataset.playing==='true';if(playing)h.querySelectorAll('.ki-playback button')[1].click();return playing;
 }));
 await page.click(scope(ring)+' [aria-label="Zoom in"]');
 await check('Zoom displays actual scale',await page.evaluate(()=>document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"] .ki-zoom').textContent.includes('125%')));
 await page.click(scope(ring)+' .ki-tools button >> nth=0');
 await check('Reset restores zoom, speed, selection and step',await page.evaluate(()=>{const h=document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"]');return h.querySelector('.ki-zoom').textContent.includes('100%')&&h.querySelector('.ki-playback select').value==='1'&&h.querySelector('.ki-svg-node[aria-pressed=true]').textContent.includes('Rank 0')&&h.querySelector('.ki-narration').textContent.includes('1 / 7')}));
 for(let i=0;i<6;i++)await page.click(scope(ring)+' .ki-playback button >> nth=2');
 await check('All four data blocks visibly complete with value10',await page.evaluate(()=>{const b=[...document.querySelectorAll('[aria-label="Ring AllReduce · 数据如何汇合"] .ki-data-block')];return b.length===4&&b.every(e=>e.dataset.complete==='true'&&e.querySelector('strong').textContent==='10')}));
 await show(gpu);
 await page.fill(scope(gpu)+' input >> nth=0','');
 await check('Number field allows clearing while graph remains valid',await page.evaluate(()=>document.querySelector('[aria-label="128 GPU · 并行策略实验室"] input').value===''&&document.querySelectorAll('.ki-node').length===128));
 await page.press(scope(gpu)+' input >> nth=0','Tab');
 await check('Empty numeric field explains validation failure',await page.evaluate(()=>!!document.querySelector('[aria-invalid=true]')&&!!document.querySelector('.ki-field-error')));
 await page.fill(scope(gpu)+' input >> nth=0','8');
 await check('Pending inputs do not pretend to be applied',await page.evaluate(()=>{const h=document.querySelector('[aria-label="128 GPU · 并行策略实验室"]');return h.textContent.includes('参数尚未应用')&&h.querySelectorAll('.ki-node').length===128}));
 await page.fill(scope(gpu)+' input >> nth=2','8');
 await page.click(scope(gpu)+' [data-component=Button] button');
 await check('Apply updates graph and acknowledges committed parameters',await page.evaluate(()=>{const h=document.querySelector('[aria-label="128 GPU · 并行策略实验室"]');return h.querySelectorAll('.ki-node').length===64&&h.querySelector('[data-component=Button] button').disabled&&h.textContent.includes('参数已应用')}));
 await page.click(scope(gpu)+' .ki-group-toggle >> nth=0');
 await page.click(scope(gpu)+' .ki-tools button >> nth=0');
 await check('Reset restores all GPU groups and cards',await page.evaluate(()=>document.querySelectorAll('.ki-node').length===128&&[...document.querySelectorAll('.ki-group-toggle')].every(e=>e.getAttribute('aria-expanded')==='true')));
 await show(math);await page.waitForSelector(scope(math)+' .ki-chart svg');
 const before=await page.evaluate(()=>{const c=document.querySelector('[aria-label="二次函数 · 参数怎样改变曲线"] .ki-chart');return {instance:c.getAttribute('_echarts_instance_'),paths:[...c.querySelectorAll('path')].map(p=>p.getAttribute('d')).join('|')}});
 await page.press(scope(math)+' input >> nth=0','ArrowRight');
 await check('Chart updates data without rebuilding instance',await page.evaluate(before=>{const c=document.querySelector('[aria-label="二次函数 · 参数怎样改变曲线"] .ki-chart');return c.getAttribute('_echarts_instance_')===before.instance&&!!before.instance},before));
 await page.waitForFunction(before=>[...document.querySelectorAll('[aria-label="二次函数 · 参数怎样改变曲线"] .ki-chart path')].map(p=>p.getAttribute('d')).join('|')!==before.paths,before);
 await check('Coefficient change changes plotted geometry in fixed coordinates',true);
 await page.click(scope(math)+' [data-component=Button] button >> nth=1');
 await check('Preset synchronizes sliders, formula and explanation',await page.evaluate(()=>{const h=document.querySelector('[aria-label="二次函数 · 参数怎样改变曲线"]');return h.querySelector('input').value==='-1'&&h.querySelector('.ki-inspector').textContent.includes('向下')}));
 await show(gallery);await page.click(scope(gallery)+' [role=tab] >> nth=1');await page.evaluate(()=>document.querySelectorAll('[aria-label="组件组合与联动"] .ki-svg-node')[1].dispatchEvent(new MouseEvent('click',{bubbles:true})));
 await check('Nested Node event and parent Graph event commit together',await page.evaluate(()=>{const h=document.querySelector('[aria-label="组件组合与联动"]');return h.querySelector('.ki-svg-node[aria-pressed=true]').textContent.includes('输出')&&h.querySelector('.ki-inspector').textContent.includes('接收处理后的结果')}));
 await page.click(scope(gallery)+' .ki-tools button >> nth=0');
 await check('Global reset restores first tab',await page.evaluate(()=>document.querySelector('[aria-label="组件组合与联动"] [role=tab]').getAttribute('aria-selected')==='true'));
 for(const width of [320,375]){
 await page.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await show(ring);
 await page.waitForFunction(()=>{const h=document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"]'),v=h.querySelector('.ki-graph-scroll').getBoundingClientRect();return [...h.querySelectorAll('.ki-svg-node')].every(n=>{const b=n.getBoundingClientRect();return b.left>=v.left-1&&b.right<=v.right+1&&b.height>=44})});
 await check(`Ring initial fit shows every Rank with 44px targets at ${width}px`,true);
 }
 await page.click(scope(ring)+' [aria-label="Zoom in"]');
 await check('Enlarged view explains horizontal navigation and fit',await page.evaluate(()=>!!document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"] .ki-navigation-hint')));
 await page.click(scope(ring)+' [aria-label="恢复缩放"]');
 await check('Fit restores complete mobile topology',await page.evaluate(()=>{const h=document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"]'),v=h.querySelector('.ki-graph-scroll').getBoundingClientRect();return !h.querySelector('.ki-navigation-hint')&&[...h.querySelectorAll('.ki-svg-node')].every(n=>{const b=n.getBoundingClientRect();return b.left>=v.left-1&&b.right<=v.right+1})}));
 console.log(JSON.stringify(results));
}
