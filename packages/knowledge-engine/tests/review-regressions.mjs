// Pass a managed ego-browser Page on a built Hugo site and its runtime chunk URL.
export async function run(page, artifactDir, runtimeURL) {
  const results = [];
  const check = (name, pass) => {
    results.push({ name, pass: !!pass });
    if (!pass) throw Error(name);
  };
  await page.evaluate(async (url) => {
    const module = await import(url);
    // Rollup may expose the dynamically imported namespace under a generated name.
    const { mount } = typeof module.mount === 'function' ? module : Object.values(module).find(value => value && typeof value.mount === 'function');
    window.__kiReviewDisposers = [];
    for (let i = 0; i < 2; i++) {
      const host = document.createElement('section');
      host.className = 'ki';
      host.id = 'review-' + i;
      host.innerHTML = '<div data-ki-mount></div>';
      document.querySelector('main').prepend(host);
      window.__kiReviewDisposers.push(mount(host, {
        schemaVersion: 1, id: 'review-' + i, title: 'Review ' + i,
        description: 'Grouping and focus isolation',
        state: { selected: { type: 'string', initial: '' } },
        scene: { id: 'graph', type: 'Graph', props: {
          layout: 'grid', selected: { bind: { ref: 'state.selected' } },
          nodes: ['constructor', '__proto__'].map((group, index) => ({
            id: 'n' + index, label: 'Node ' + index, group,
          })),
        }, on: { select: [{ action: 'set', target: 'selected', value: { ref: 'event.value' } }] } },
      }));
    }
  }, runtimeURL);
  await page.waitForSelector('#review-0 .ki-node');
  check('Prototype-like group names render in independent instances', await page.evaluate(() =>
    document.querySelectorAll('#review-0 .ki-node, #review-1 .ki-node').length === 4));
  await page.click('#review-0 .ki-node >> nth=1');
  check('Special-name group selection remains isolated', await page.evaluate(() =>
    document.querySelectorAll('#review-0 .ki-node[aria-pressed="true"]').length === 1 &&
    document.querySelectorAll('#review-1 .ki-node[aria-pressed="true"]').length === 0));
  await page.click('#review-0 .ki-tools button:last-child');
  await page.waitForFunction(() => document.fullscreenElement?.id === 'review-0');
  await page.press('#review-0 .ki-tools button:last-child', 'Escape');
  await page.waitForFunction(() => !document.fullscreenElement);
  check('Exiting fullscreen restores focus only to its owning instance', await page.evaluate(() =>
    document.activeElement === document.querySelector('#review-0 .ki-tools button:last-child')));
  await page.evaluate(() => {
    window.__kiReviewDisposers.forEach(dispose => dispose());
    delete window.__kiReviewDisposers;
    document.querySelectorAll('#review-0, #review-1').forEach(host => host.remove());
  });
  const fs = await import('node:fs/promises');
  await fs.mkdir(artifactDir, { recursive: true });
  await fs.writeFile(artifactDir + '/review-regressions.json', JSON.stringify(results, null, 2));
  console.log(results);
}
