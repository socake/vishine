// Chromium mobile metrics + coarse pointer + CDP touch events, not a real phone/Safari.
export async function run(page,artifactDir,url='http://localhost:1315/posts/interactive-knowledge-engine/') {
 const fs=await import('node:fs/promises');await fs.mkdir(artifactDir,{recursive:true});const results=[];
 const check=async(name,pass)=>{results.push({name,pass:!!pass});await fs.writeFile(artifactDir+'/mobile-results.json',JSON.stringify(results,null,2));console.log(pass?'PASS':'FAIL',name);if(!pass)throw Error(name)};
 const device=async(width,height)=>{await page.cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await page.cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});};
 const show=async(title)=>{await page.evaluate(title=>document.querySelector(`[data-knowledge][aria-label="${title}"]`).scrollIntoView({behavior:'instant'}),title);await page.waitForFunction(title=>document.querySelector(`[data-knowledge][aria-label="${title}"]`).dataset.ready==='true',title);await page.evaluate(title=>{const h=document.querySelector(`[data-knowledge][aria-label="${title}"]`);scrollTo({top:scrollY+h.getBoundingClientRect().top-72,behavior:'instant'})},title)};
 const tap=async(selector,portion=.5)=>{const point=await page.evaluate(({selector,portion})=>{const e=document.querySelector(selector);e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect(),x=r.left+r.width*portion,y=r.top+r.height/2,hit=document.elementFromPoint(x,y);if(!e.contains(hit)&&hit!==e)throw Error('Touch target obstructed: '+selector);return{x,y}}, {selector,portion});await page.cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,radiusX:1,radiusY:1,id:1}]});await page.cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 const gpu='128 GPU · 并行策略实验室',ring='Ring AllReduce · 数据如何汇合',math='二次函数 · 参数怎样改变曲线',gallery='组件组合与联动';const scope=t=>`[data-knowledge][aria-label="${t}"]`;
 await device(390,844);await page.goto(url+'?mobile-check='+Date.now());
 const titles=await page.evaluate(()=>[...document.querySelectorAll('[data-knowledge]')].map(h=>h.getAttribute('aria-label')));for(const t of titles)await show(t);
 const geometry=[];
 for(const [width,height] of [[320,568],[360,800],[375,812],[390,844],[430,932],[844,390]]){
  await device(width,height);
  geometry.push(await page.evaluate(()=>({width:innerWidth,height:innerHeight,pageWidth:document.documentElement.scrollWidth,coarse:matchMedia('(pointer:coarse)').matches,small:[...document.querySelectorAll('.ki button,.ki input,.ki select,.ki-svg-node')].filter(e=>!e.disabled&&!e.closest('[hidden]')).map(e=>{const target=e.type==='checkbox'?e.closest('label'):e;const r=target.getBoundingClientRect();return{label:e.getAttribute('aria-label')||e.textContent.slice(0,30),width:r.width,height:r.height}}).filter(r=>r.width>0&&r.height>0&&(r.width<43.5||r.height<43.5)),fonts:[...document.querySelectorAll('.ki input[type=number],.ki select')].map(e=>parseFloat(getComputedStyle(e).fontSize)),playbacks:[...document.querySelectorAll('.ki-playback')].map(e=>e.getBoundingClientRect().height)})));
 }
 await fs.writeFile(artifactDir+'/mobile-geometry.json',JSON.stringify(geometry,null,2));
 await check('Six mobile/orientation sizes use coarse input without page overflow',geometry.every(r=>r.coarse&&r.width===r.pageWidth));
 await check('Touch controls and SVG nodes have at least44px targets',geometry.every(r=>r.small.length===0));
 await check('Mobile editable numbers and selects are at least16px',geometry.every(r=>r.fonts.every(n=>n>=16)));
 await check('Mobile playback remains a single60px strip',geometry.every(r=>r.playbacks.every(n=>n<=64)));
 await device(390,844);await show(gpu);
 await tap(scope(gpu)+' .ki-node[aria-label="GPU 4 Rank 20"]');
 await check('Touching a GPU changes Rank and Inspector',await page.evaluate(()=>document.querySelector('[aria-label="128 GPU · 并行策略实验室"] .ki-inspector').textContent.includes('Rank 20')));
 await page.selectOption(scope(gpu)+' select','DP');await check('Native selector updates the communication group',await page.evaluate(()=>document.querySelectorAll('.ki-node[data-active=true]').length===16));
 await page.fill(scope(gpu)+' input >> nth=0','8');await page.press(scope(gpu)+' input >> nth=0','Enter');
 await check('Done blurs numeric input and retains numeric keyboard hint',await page.evaluate(()=>{const e=document.querySelector('[aria-label="128 GPU · 并行策略实验室"] input');return document.activeElement!==e&&e.inputMode==='numeric'&&e.enterKeyHint==='done'}));
 await page.fill(scope(gpu)+' input >> nth=2','8');await tap(scope(gpu)+' [data-component=Button] button');
 await check('Touch apply commits parameters atomically',await page.evaluate(()=>document.querySelectorAll('.ki-node').length===64));
 await tap(scope(gpu)+' .ki-tools button');
 await device(844,390);await check('Rotation retains selected GPU and initial topology',await page.evaluate(()=>document.querySelectorAll('.ki-node').length===128&&document.querySelector('.ki-node[aria-pressed=true]').getAttribute('aria-label').includes('19')));
 await check('Six numeric fields use balanced3-column landscape layout',await page.evaluate(()=>getComputedStyle(document.querySelector('.ki-control-panel .ki-row')).gridTemplateColumns.split(' ').length===3));
 await device(390,844);await show(gallery);await tap(scope(gallery)+' .ki-toggle span');
 await check('Tapping toggle label changes conditional content',await page.evaluate(()=>!document.querySelector('[aria-label="组件组合与联动"] .ki-card')));
 await show(math);await page.waitForSelector(scope(math)+' .ki-chart svg');
 const old=await page.evaluate(()=>document.querySelector('[aria-label="二次函数 · 参数怎样改变曲线"] input').value);
 await tap(scope(math)+' input[type=range]',.85);
 await check('Touch slider updates formula and explanation',await page.evaluate(old=>{const h=document.querySelector('[aria-label="二次函数 · 参数怎样改变曲线"]');const value=h.querySelector('input').value,n=Number(value);return value!==old&&h.querySelector('.ki-formula').textContent.includes(value+'x')&&h.querySelector('.ki-inspector').textContent.includes(n>0?'向上':n<0?'向下':'不是二次')},old));
 await show(ring);await tap(scope(ring)+' .ki-playback button:last-of-type');
 await check('Touch next advances diagram and narration',await page.evaluate(()=>document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"] .ki-narration').textContent.includes('2 / 7')));
 await tap(scope(ring)+' .ki-zoom button[aria-label="Zoom in"]');await check('Touch zoom reaches125%',await page.evaluate(()=>document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"] .ki-zoom').textContent.includes('125%')));
 await tap(scope(ring)+' .ki-zoom button[aria-label="恢复缩放"]');await check('Touch fit returns to100%',await page.evaluate(()=>document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"] .ki-zoom').textContent.includes('100%')));
 await page.selectOption(scope(ring)+' .ki-playback select','0.5');await tap(scope(ring)+' .ki-playback button:nth-of-type(2)');await page.waitForFunction(()=>document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"]').dataset.playing==='true');await check('Touch play starts the lesson clock',true);await tap(scope(ring)+' .ki-playback button:nth-of-type(2)');await check('Touch pause stops the lesson clock',await page.evaluate(()=>document.querySelector('[aria-label="Ring AllReduce · 数据如何汇合"]').dataset.playing==='false'));
 await tap(scope(ring)+' .ki-tools button:last-child');await page.waitForFunction(()=>!!document.fullscreenElement);await check('Touch fullscreen opens the active lesson',true);await tap(scope(ring)+' .ki-tools button:last-child');await page.waitForFunction(()=>!document.fullscreenElement);await check('Touch exit restores inline article',true);
 await show(gpu);await page.evaluate(()=>{const g=document.querySelector('.ki-node-groups');g.scrollTop=g.scrollHeight;g.scrollIntoView({block:'center',behavior:'instant'})});
 const origin=await page.evaluate(()=>({y:scrollY,r:(()=>{const r=document.querySelector('.ki-node-groups').getBoundingClientRect();return{x:r.left+r.width/2,y:Math.min(innerHeight-100,r.bottom-30)}})()}));
 // Chromium can use the first gesture to settle fractional nested scroll offsets.
 // Bound retries to three complete gestures; contain must still fail this check.
 let boundarySwipes=0;
 for(;boundarySwipes<3;boundarySwipes++) {
  await page.cdp('Input.synthesizeScrollGesture',{...origin.r,yDistance:-160,gestureSourceType:'touch',speed:300});
  if(await page.evaluate(y=>scrollY>y+20,origin.y)){boundarySwipes++;break;}
 }
 console.log({boundarySwipes});
 await page.waitForFunction(y=>scrollY>y+20,origin.y);
 await check('Swipe past grid boundary continues article scrolling',true);
 console.log({checks:results.length});
}
