// Native scroll regression on an article with a compact grid and the GPU tutorial.
// Pass managed ego-browser Page and explicit fixture URLs; no author-specific routes.
export async function run(page, artifactDir, urls) {
  if (!urls?.article || !urls?.gpu) throw new Error('Provide article and gpu fixture URLs');
  const fs = await import('node:fs/promises');
  await fs.mkdir(artifactDir, { recursive: true });
  const results = [];
  const check = async (name, pass) => {
    results.push({ name, pass: !!pass });
    await fs.writeFile(artifactDir + '/scroll-results.json', JSON.stringify(results, null, 2));
    console.log(pass ? 'PASS' : 'FAIL', name);
    if (!pass) throw Error(name);
  };
  const size = async (width, touch = false) => {
    await page.cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: touch });
    await page.cdp('Emulation.setTouchEmulationEnabled', { enabled: touch, maxTouchPoints: 1 });
  };
  const center = async selector => {
    await page.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }), selector);
    return page.evaluate(s => {
      const e = document.querySelector(s), r = e.getBoundingClientRect();
      return { y: scrollY, top: e.scrollTop, x: r.left + r.width / 2, cy: r.top + r.height / 2,
        overflow: e.scrollHeight - e.clientHeight, height: e.clientHeight };
    }, selector);
  };
  const wheel = async (point, delta = 180) => {
    await page.mouse.move(point.x, point.cy);
    await page.mouse.wheel(0, delta);
  };
  await page.goto(urls.article + '?scroll-regression=final');
  await size(1280);
  await page.evaluate(() => document.querySelector('[data-knowledge]').scrollIntoView({ behavior: 'instant' }));
  await page.waitForSelector('.ki-node-groups');
  let point = await center('.ki-node-groups');
  await check('Compact four-node grid has no internal overflow', point.overflow <= 1);
  await wheel(point);
  await check('Desktop wheel over compact grid scrolls article, not nodes', await page.evaluate(y =>
    scrollY > y + 100 && document.querySelector('.ki-node-groups').scrollTop === 0, point.y));
  point = await center('.ki-node-groups');
  await page.focus('.ki-node-groups');
  await page.press('.ki-node-groups', 'PageDown');
  await page.waitForFunction(y => scrollY > y + 50, point.y);
  await check('Keyboard PageDown is not trapped in compact grid', true);
  await size(390, true);
  point = await center('.ki-node-groups');
  await check('Mobile grid fits and uses coarse input', await page.evaluate(() => {
    const e = document.querySelector('.ki-node-groups');
    return e.scrollHeight <= e.clientHeight + 1 && matchMedia('(pointer:coarse)').matches;
  }));
  await page.cdp('Input.synthesizeScrollGesture', { x: point.x, y: point.cy, yDistance: -180, gestureSourceType: 'touch', speed: 300 });
  await check('Touch over compact grid scrolls article', await page.evaluate(y => scrollY > y + 50, point.y));
  await center('.ki-node-groups');
  await page.screenshot({ path: artifactDir + '/compact-mobile.png' });
  await size(1280);
  await page.evaluate(() => document.querySelectorAll('[data-knowledge]')[1].scrollIntoView({ behavior: 'instant' }));
  await page.waitForSelector('.ki-graph-scroll');
  for (const selector of ['.ki-graph-scroll', '.ki-table-scroll']) {
    point = await center(selector);
    await wheel(point);
    await check('Wheel passes through fitting ' + selector, await page.evaluate(y => scrollY > y + 100, point.y));
  }
  await page.evaluate(() => document.querySelectorAll('[data-knowledge]')[2].scrollIntoView({ behavior: 'instant' }));
  await page.waitForSelector('.ki-formula .katex');
  point = await center('.ki-formula');await wheel(point);
  await check('Wheel passes through formula', await page.evaluate(y => scrollY > y + 100, point.y));
  await page.goto(urls.gpu + '?scroll-regression=final');
  await size(1280);
  await page.evaluate(() => document.querySelector('[data-knowledge]').scrollIntoView({ behavior: 'instant' }));
  await page.waitForSelector('.ki-node-groups');
  point = await center('.ki-node-groups');
  await check('Dense GPU grid keeps bounded internal viewport', point.overflow > 100 && point.height <= 384);
  await page.evaluate(() => { document.querySelector('.ki-node-groups').scrollTop = 0; });
  point = await center('.ki-node-groups');await wheel(point);
  await check('Wheel inside large grid scrolls nodes without moving article', await page.evaluate(y =>
    document.querySelector('.ki-node-groups').scrollTop > 50 && Math.abs(scrollY - y) < 2, point.y));
  await page.evaluate(() => { const e = document.querySelector('.ki-node-groups');e.scrollTop = e.scrollHeight; });
  point = await center('.ki-node-groups');await wheel(point);
  await check('At grid bottom wheel continues article', await page.evaluate(y => scrollY > y + 50, point.y));
  await page.evaluate(() => { document.querySelector('.ki-node-groups').scrollTop = 0; });
  point = await center('.ki-node-groups');await wheel(point, -180);
  await check('At grid top wheel continues article upwards', await page.evaluate(y => scrollY < y - 50, point.y));
  await page.screenshot({ path: artifactDir + '/dense-desktop.png' });
  console.log({ checks: results.length });
}
