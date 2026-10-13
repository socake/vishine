/* Archify embed/theme URLs and the opt-out neutral surface adapter.
   Only known CSS variables in trusted same-origin embeds are synchronized;
   diagram markup, node colors and ordinary HTML frames remain author-owned. */
(function () {
  'use strict';
  document.querySelectorAll('[data-html-embed]').forEach(figure => {
    const viewport = figure.querySelector('.html-embed-viewport');
    const hint = figure.querySelector('.html-embed-hint');
    if (!hint) return;
    const frame = figure.querySelector('iframe');
    const button = figure.querySelector('.html-embed-fit');
    const minWidth = Number(figure.dataset.embedMinWidth) || 0;
    let fitWidth = figure.dataset.embedFit === 'width';
    const update = () => {
      const overflow = viewport.scrollWidth > viewport.clientWidth;
      hint.hidden = !overflow;
      viewport.tabIndex = overflow ? 0 : -1;
      viewport.setAttribute('aria-label', frame.title + (overflow ? ' — ' + hint.textContent : ''));
      if (button) {
        // Keep a focused control available if resizing makes both views equal.
        button.hidden = minWidth <= viewport.clientWidth && fitWidth && document.activeElement !== button;
        button.textContent = fitWidth ? button.dataset.detailLabel : button.dataset.fitLabel;
      }
    };
    if (button) button.addEventListener('click', () => {
      fitWidth = !fitWidth;
      figure.dataset.embedFit = fitWidth ? 'width' : 'scroll';
      frame.style.minWidth = (fitWidth ? 0 : minWidth) + 'px';
      viewport.scrollLeft = 0;
      update();
    });
    update();
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(viewport);
  });
  const frames = [...document.querySelectorAll('[data-embed-mode="archify"] iframe')];
  if (!frames.length) return;
  function syncSurface(frame) {
    const figure = frame.closest('[data-html-embed]');
    if (figure.dataset.embedSurface !== 'theme') return;
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return; }
    if (!doc?.body || doc.documentElement.dataset.embed !== 'true') return;
    const styles = getComputedStyle(figure);
    const tokens = {
      '--bg': '--card', '--panel': '--card', '--mask': '--card',
      '--text': '--ink', '--text-muted': '--ink-2', '--text-dim': '--ink-2',
      '--text-faint': '--ink-2', '--grid': '--line-2',
      '--panel-border': '--line', '--lane-stroke': '--line',
      '--lane-fill': '--paper-2', '--arrow': '--ink-2'
    };
    Object.entries(tokens).forEach(([child, parent]) => {
      const value = styles.getPropertyValue(parent).trim();
      if (value) doc.documentElement.style.setProperty(child, value);
    });
  }
  // Embed mode has a natural-height body. Observe that body, not the root's
  // viewport-sized scrollHeight, so widening or narrowing can also shrink it.
  frames.forEach(frame => {
    let observer;
    function measure() {
      if (observer) observer.disconnect();
      let doc;
      try { doc = frame.contentDocument; } catch (_) { return; }
      if (!doc?.body || doc.documentElement.dataset.embed !== 'true') return;
      syncSurface(frame);
      const resize = () => {
        const height = Math.ceil(doc.body.getBoundingClientRect().height);
        // The configured minimum is a loading fallback, not a floor for a
        // responsive diagram that can legitimately become shorter on phones.
        if (height > 0) frame.style.height = Math.min(1600, height) + 'px';
      };
      resize();
      if ('ResizeObserver' in window) {
        observer = new ResizeObserver(resize);
        observer.observe(doc.body);
      }
    }
    frame.addEventListener('load', measure);
    measure();
  });
  function syncTheme() {
    const theme = document.documentElement.dataset.scheme === 'dark' ? 'dark' : 'light';
    frames.forEach(frame => {
      const url = new URL(frame.dataset.embedSrc, location.href);
      url.searchParams.set('embed', '1');
      url.searchParams.set('theme', theme);
      if (frame.src !== url.href) frame.src = url.href;
      else syncSurface(frame);
    });
  }
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-scheme'] });
})();
