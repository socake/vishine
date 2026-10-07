/* Filter the complete section first, then paginate. Server HTML is the no-JS fallback. */
(function () {
  'use strict';
  const grid = document.getElementById('postGrid');
  if (!grid) return;
  const model = window.VishineListState;
  const pageSize = Number(grid.dataset.pageSize);
  const initialPath = location.pathname;
  const initialPage = Number(grid.dataset.page);
  const zh = document.documentElement.lang.toLowerCase().startsWith('zh');
  const bar = document.getElementById('filterBar');
  const chips = [...bar.querySelectorAll('.chip[data-type]')];
  const clear = document.getElementById('filterClear');
  const selection = document.getElementById('filterSelection');
  const count = document.getElementById('listCount');
  const empty = document.getElementById('listEmpty');
  const pager = document.getElementById('listPager');
  const prev = document.getElementById('listPrev');
  const next = document.getElementById('listNext');
  const pageStatus = document.getElementById('listPageStatus');
  const feedback = document.getElementById('listFeedback');
  const message = document.getElementById('listMessage');
  const retry = document.getElementById('listRetry');
  let items, loading, transaction = 0, pendingRetry;
  let state = { category: [], tag: [], page: initialPage };
  bar.hidden = false;

  function readURL() { return model.read(new URL(location.href), initialPath, initialPage); }
  function urlFor(value) { return model.address(location.href, grid.dataset.baseUrl, value); }
  async function loadCollection() {
    if (items) return items;
    if (!loading) {
      loading = (async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        try {
          const response = await fetch(grid.dataset.index, { signal: controller.signal });
          if (!response.ok) throw new Error('List index unavailable');
          const data = await response.json();
          if (!Array.isArray(data) || !data.every(item => typeof item.html === 'string' &&
            Array.isArray(item.categories) && Array.isArray(item.tags))) throw new Error('Invalid list index');
          items = data;
          return data;
        } finally { clearTimeout(timeout); loading = null; }
      })();
    }
    return loading;
  }
  function syncControls() {
    chips.forEach(chip => {
      const on = state[chip.dataset.type].includes(chip.dataset.value);
      chip.classList.toggle('on', on); chip.setAttribute('aria-pressed', String(on));
    });
    clear.hidden = !state.category.length && !state.tag.length;
    selection.replaceChildren();
    ['category', 'tag'].forEach(type => state[type].forEach(value => {
      const button = document.createElement('button');
      button.className = 'chip selected-filter'; button.type = 'button';
      button.textContent = (type === 'category' ? (zh ? '分类：' : 'Category: ') : (zh ? '标签：' : 'Tag: ')) + value + ' ×';
      button.setAttribute('aria-label', (zh ? '移除筛选：' : 'Remove filter: ') + value);
      button.addEventListener('click', () => update({ ...state, [type]: state[type].filter(v => v !== value), page: 1 }, 'push'));
      selection.appendChild(button);
    }));
    selection.hidden = clear.hidden;
  }
  function setBusy(busy) {
    grid.setAttribute('aria-busy', String(busy));
    bar.querySelectorAll('button').forEach(button => button.disabled = busy);
    selection.querySelectorAll('button').forEach(button => button.disabled = busy);
    pager.inert = busy;
  }
  async function update(desired, historyMode = 'push', focusResults = false) {
    const id = ++transaction;
    setBusy(true); feedback.hidden = false; retry.hidden = true;
    message.textContent = zh ? '正在加载完整列表…' : 'Loading the complete list…';
    try {
      const collection = await loadCollection();
      if (id !== transaction) return;
      const result = model.select(collection, desired, pageSize);
      state = { ...desired, page: result.page };
      // HTML comes exclusively from the same-site Hugo-generated, fingerprinted resource.
      grid.innerHTML = result.items.map(item => item.html).join('');
      count.textContent = result.total;
      empty.hidden = result.total !== 0;
      prev.hidden = state.page <= 1 || !result.total;
      next.hidden = state.page >= result.pages;
      prev.href = urlFor({ ...state, page: state.page - 1 });
      next.href = urlFor({ ...state, page: state.page + 1 });
      pageStatus.textContent = result.total
        ? (zh ? `第 ${state.page} / ${result.pages} 页 · 显示 ${result.from}–${result.to} / ${result.total} 篇`
          : `Page ${state.page} / ${result.pages} · ${result.from}–${result.to} of ${result.total}`)
        : (zh ? '0 篇结果' : '0 results');
      syncControls(); feedback.hidden = true; grid.hidden = false;
      const url = urlFor(state);
      if (historyMode === 'push' && url !== location.pathname + location.search + location.hash) history.pushState(null, '', url);
      else if (historyMode === 'replace') history.replaceState(null, '', url);
      if (focusResults) {
        grid.tabIndex = -1; grid.focus({ preventScroll: true });
        grid.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    } catch (error) {
      if (id !== transaction) return;
      grid.hidden = historyMode !== 'push';
      message.textContent = zh ? '完整列表加载失败，筛选结果尚未更新。请重试。' : 'The list could not load. Results have not been updated. Please retry.';
      retry.hidden = false;
      pendingRetry = () => update(desired, historyMode, focusResults);
    } finally { if (id === transaction) setBusy(false); }
  }
  chips.forEach(chip => chip.addEventListener('click', () => {
    const type = chip.dataset.type, value = chip.dataset.value;
    const values = state[type].includes(value) ? state[type].filter(v => v !== value) : [...state[type], value];
    update({ ...state, [type]: values, page: 1 });
  }));
  clear.addEventListener('click', () => update({ category: [], tag: [], page: 1 }));
  retry.addEventListener('click', () => pendingRetry?.());
  [[prev, -1], [next, 1]].forEach(([link, step]) => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); update({ ...state, page: state.page + step }, 'push', true);
  }));
  window.addEventListener('popstate', () => update(readURL(), 'none'));
  const requested = readURL();
  if (requested.category.length || requested.tag.length || location.search.includes('page=')) update(requested, 'replace');
  window.vishineList = {
    applyFilters: () => update(state, 'replace'),
    clearFilters: () => update({ category: [], tag: [], page: 1 })
  };
})();
