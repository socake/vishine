/* Pure collection/URL logic, also exercised by node --test. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VishineListState = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  const unique = values => [...new Set(values.filter(Boolean))];
  function read(url, initialPath, initialPage) {
    const params = url.searchParams;
    const page = Number(params.get('page') || (url.pathname === initialPath ? initialPage : 1));
    return {
      category: unique(params.getAll('cat')),
      tag: unique(params.getAll('tag')),
      page: Number.isSafeInteger(page) && page > 0 ? page : 1
    };
  }
  function select(items, state, pageSize) {
    const matches = items.filter(item =>
      (!state.category.length || state.category.some(value => item.categories.includes(value))) &&
      (!state.tag.length || state.tag.some(value => item.tags.includes(value))));
    const total = matches.length;
    const pages = Math.ceil(total / pageSize);
    const page = Math.min(Math.max(1, state.page), Math.max(1, pages));
    const start = (page - 1) * pageSize;
    return { items: matches.slice(start, start + pageSize), total, pages, page,
      from: total ? start + 1 : 0, to: Math.min(start + pageSize, total) };
  }
  function address(currentURL, baseURL, state) {
    const url = new URL(currentURL);
    url.pathname = new URL(baseURL, url).pathname;
    ['cat', 'tag', 'page'].forEach(key => url.searchParams.delete(key));
    state.category.forEach(value => url.searchParams.append('cat', value));
    state.tag.forEach(value => url.searchParams.append('tag', value));
    if (state.page > 1) url.searchParams.set('page', String(state.page));
    return url.pathname + url.search + url.hash;
  }
  return { read, select, address };
});
