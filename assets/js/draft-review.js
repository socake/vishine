(() => {
  'use strict';
  const root = document.getElementById('draftReview');
  const prose = document.getElementById('prose');
  if (!root || !prose) return;
  const cfg = JSON.parse(document.getElementById('draftReviewConfig').textContent);
  const t = key => cfg.labels[key];
  const panel = root.querySelector('.dr-panel');
  const form = root.querySelector('form');
  const input = root.querySelector('textarea');
  const status = root.querySelector('.dr-status');
  const list = root.querySelector('.dr-list');
  const toggle = root.querySelector('[data-dr=toggle]');
  const selectionButton = root.querySelector('[data-dr=selection]');
  const excluded = 'button,script,style,[data-review-ui],.ki,.mermaid,figure,table,pre,iframe,a[aria-label]';
  const blocks = [...prose.querySelectorAll('p,li,h2,h3,blockquote')].filter(el => !el.closest(excluded) && !el.querySelector('p,li,blockquote'));
  let data = null, active = false, pending = null, editID = null, selected = null, busy = false;
  let snapshot = [], locations = new Map(), originalComment = '', notePage = 0;
  let returnFocus = toggle;
  function showPanel(open) { panel.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); }
  const node = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  };
  function textNodes(block) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement.closest(excluded) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const out = []; while (walker.nextNode()) out.push(walker.currentNode); return out;
  }
  const text = block => textNodes(block).map(n => n.data).join('');
  function heading(block) {
    let value = '';
    for (const h of prose.querySelectorAll('h2,h3')) {
      if (h === block || h.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING) value = text(h);
      else break;
    }
    return value;
  }
  function anchor(block, start, end, kind) {
    const value = text(block);
    return { kind, quote: value.slice(start, end), block: value, start, end, prefix: value.slice(Math.max(0, start - 64), start), suffix: value.slice(end, end + 64), heading: heading(block), index: blocks.indexOf(block) };
  }
  function rangeAt(block, start, end) {
    const range = document.createRange(); let at = 0, begun = false;
    for (const n of textNodes(block)) {
      if (!begun && start <= at + n.length) { range.setStart(n, Math.max(0, start - at)); begun = true; }
      if (begun && end <= at + n.length) { range.setEnd(n, Math.max(0, end - at)); return range; }
      at += n.length;
    }
    return null;
  }
  function locate(a) {
    if (locations.has(a)) return locations.get(a);
    // Never fall back to a numerical paragraph index after an edit.
    const matches = [];
    for (const { block, value, section } of snapshot) {
      let from = 0, pos;
      while ((pos = value.indexOf(a.quote, from)) !== -1) {
        const context = (!a.prefix || value.slice(Math.max(0, pos - a.prefix.length), pos) === a.prefix) && (!a.suffix || value.slice(pos + a.quote.length, pos + a.quote.length + a.suffix.length) === a.suffix);
        if (a.kind === 'paragraph' ? value === a.block : (value === a.block ? pos === a.start : context)) matches.push({ block, start: pos, end: pos + a.quote.length, section });
        from = pos + Math.max(1, a.quote.length);
      }
    }
    const scoped = matches.filter(m => m.section === a.heading);
    const result = matches.length === 1 ? matches[0] : scoped.length === 1 ? scoped[0] : null;
    locations.set(a, result);
    return result;
  }
  function paint() {
    blocks.forEach(b => b.classList.remove('dr-marked'));
    if (globalThis.CSS?.highlights) CSS.highlights.delete('draft-review');
    if (!active || !data) return;
    const ranges = [];
    for (const a of data.annotations.filter(a => a.status === 'open')) {
      const match = locate(a.anchor);
      if (match) {
        match.block.classList.add('dr-marked');
        const range = rangeAt(match.block, match.start, match.end); if (range) ranges.push(range);
      }
    }
    if (globalThis.CSS?.highlights && globalThis.Highlight) CSS.highlights.set('draft-review', new Highlight(...ranges));
  }
  async function request(operation, payload) {
    if (busy) return false;
    busy = true;
    input.disabled = true;
    root.querySelectorAll('button[type=submit]').forEach(b => b.disabled = true);
    status.textContent = t('pending');
    try {
      const response = await fetch(`${cfg.api}/reviews?article=${encodeURIComponent(cfg.article)}`, {
        method: operation ? 'POST' : 'GET', cache: 'no-store',
        headers: { 'X-Draft-Review': cfg.token, ...(operation ? { 'Content-Type': 'application/json' } : {}) },
        body: operation ? JSON.stringify({ version: data.version, operation, payload, sourceRevision: cfg.revision }) : undefined,
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw new Error(response.status === 409 ? 'conflict' : 'error');
      data = await response.json();
      status.textContent = data.sourceRevision !== cfg.revision ? t('changed') : (operation ? t('saved') : '');
      render(); return true;
    } catch (err) {
      status.textContent = t(err.message === 'conflict' ? 'conflict' : 'error'); return false;
    } finally { busy = false; input.disabled = false; root.querySelectorAll('button[type=submit]').forEach(b => b.disabled = false); }
  }
  function button(label, action) {
    const b = node('button', label); b.type = 'button'; b.addEventListener('click', action); return b;
  }
  function render() {
    // Read DOM text once per refresh, then reuse matching results for list and highlights.
    const sections = [...prose.querySelectorAll('h2,h3')];
    let section = '', at = 0;
    snapshot = blocks.map(block => {
      while (at < sections.length && (sections[at] === block || sections[at].compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING)) section = text(sections[at++]);
      return { block, value: text(block), section };
    });
    locations = new Map();
    list.replaceChildren();
    const items = data.annotations.filter(a => a.status !== 'archived');
    notePage = Math.min(notePage, Math.max(0, Math.ceil(items.length / 50) - 1));
    if (!items.length) list.append(node('p', t('empty'), 'dr-hint'));
    for (const a of items.slice(notePage * 50, (notePage + 1) * 50)) {
      const item = node('section', undefined, 'dr-note');
      const match = locate(a.anchor);
      item.append(node('div', `${t(a.status)} · ${a.anchor.heading || cfg.article}${match ? '' : ' · ' + t('unmatched')}`, 'dr-meta'), node('blockquote', a.anchor.quote), node('p', a.comment));
      if (a.sourceRevision !== data.sourceRevision) item.append(node('p', t('stale'), 'dr-meta'));
      if (a.resolution) item.append(node('p', a.resolution, 'dr-meta'));
      const actions = node('div', undefined, 'dr-actions');
      const locateButton = button(t('locate'), () => {
        if (match) { showPanel(false); match.block.scrollIntoView({ block: 'center', behavior: 'instant' }); match.block.querySelector('.dr-paragraph')?.focus({ preventScroll: true }); }
      });
      locateButton.disabled = !match;
      actions.append(locateButton, button(t('edit'), () => compose(a.anchor, a)), button(t(a.status === 'open' ? 'resolve' : 'reopen'), () => request('update', { id: a.id, status: a.status === 'open' ? 'resolved' : 'open' })), button(t('archive'), () => request('update', { id: a.id, status: 'archived' })));
      item.append(actions); list.append(item);
    }
    if (items.length > 50) {
      const pages = node('div', undefined, 'dr-actions');
      const previous = button(t('previous'), () => { notePage--; render(); });
      const next = button(t('next'), () => { notePage++; render(); });
      previous.disabled = notePage === 0;
      next.disabled = (notePage + 1) * 50 >= items.length;
      pages.append(previous, node('span', `${notePage + 1} / ${Math.ceil(items.length / 50)}`), next);
      list.append(pages);
    }
    paint();
  }
  function compose(a, existing) {
    if (busy) return;
    if (pending && input.value !== originalComment && input.value.trim() && !confirm(t('discard'))) return;
    selected = null;
    pending = a; editID = existing?.id || null;
    returnFocus = document.activeElement;
    showPanel(true); form.hidden = false;
    root.querySelector('#drQuote').textContent = a.quote;
    input.value = existing?.comment || '';
    originalComment = input.value;
    input.focus();
  }
  function cancel() { if (busy) return; pending = null; editID = null; form.hidden = true; input.value = ''; (returnFocus?.isConnected ? returnFocus : root.querySelector('[data-dr=refresh]')).focus({ preventScroll: true }); }
  async function enable() {
    if (active) { showPanel(panel.hidden); return; }
    if (!await request()) { showPanel(true); return; }
    active = true; showPanel(true); selectionButton.hidden = false;
    prose.classList.add('dr-reviewing');
    toggle.textContent = t('title'); toggle.setAttribute('aria-expanded', 'true');
    blocks.forEach(block => {
      const b = button(t('paragraph'), () => compose(anchor(block, 0, text(block).length, 'paragraph')));
      b.className = 'dr-paragraph'; b.textContent = ''; b.setAttribute('aria-label', t('paragraph')); b.title = t('paragraph'); b.dataset.reviewUi = '';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 16 16'); svg.setAttribute('width', '14'); svg.setAttribute('height', '14'); svg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS(svg.namespaceURI, 'path');
      path.setAttribute('d', 'M8 3v10M3 8h10'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-width', '1.5');
      svg.append(path); b.append(svg);
      block.classList.add('dr-review-block'); block.append(b);
    });
    paint();
  }
  toggle.addEventListener('click', enable);
  // Snapshot the range before toolbar focus clears a browser text selection.
  document.addEventListener('selectionchange', () => {
    const selection = getSelection();
    if (!active || !selection || selection.isCollapsed || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const block = blocks.find(b => b.contains(range.startContainer) && b.contains(range.endContainer));
    if (!block || !range.toString().trim()) { selected = null; return; }
    const before = range.cloneRange(); before.selectNodeContents(block); before.setEnd(range.startContainer, range.startOffset);
    const start = before.toString().length;
    const a = anchor(block, start, start + range.toString().length, 'text');
    selected = a.quote === range.toString() ? a : null;
  });
  selectionButton.addEventListener('click', () => { if (selected) compose(selected); else { showPanel(true); status.textContent = t('selectionHint'); } });
  root.querySelector('[data-dr=close]').addEventListener('click', () => { showPanel(false); toggle.focus(); });
  root.querySelector('[data-dr=cancel]').addEventListener('click', cancel);
  root.querySelector('[data-dr=refresh]').addEventListener('click', () => request());
  root.addEventListener('keydown', e => { if (e.key === 'Escape') { showPanel(false); toggle.focus(); } });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!pending || !data || !input.value.trim()) return;
    if (!editID && data.sourceRevision !== cfg.revision) { status.textContent = t('changed'); return; }
    const ok = await request(editID ? 'update' : 'add', editID ? { id: editID, comment: input.value } : { anchor: pending, comment: input.value });
    if (ok) cancel();
  });
})();
