/* Archify's documented embed/theme URL options; no DOM or code is copied
   from the child document. Ordinary HTML frames do not need this adapter. */
(function () {
  'use strict';
  document.querySelectorAll('[data-html-embed]').forEach(figure => {
    const viewport = figure.querySelector('.html-embed-viewport');
    const hint = figure.querySelector('.html-embed-hint');
    if (!hint) return;
    const update = () => {
      const overflow = viewport.scrollWidth > viewport.clientWidth;
      hint.hidden = !overflow;
      viewport.tabIndex = overflow ? 0 : -1;
      viewport.setAttribute('aria-label', figure.querySelector('iframe').title + (overflow ? ' — ' + hint.textContent : ''));
    };
    update();
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(viewport);
  });
  const frames = [...document.querySelectorAll('[data-embed-mode="archify"] iframe')];
  if (!frames.length) return;
  // Embed mode has a natural-height body. Observe that body, not the root's
  // viewport-sized scrollHeight, so widening or narrowing can also shrink it.
  frames.forEach(frame => {
    let observer;
    function measure() {
      if (observer) observer.disconnect();
      let doc;
      try { doc = frame.contentDocument; } catch (_) { return; }
      if (!doc?.body || doc.documentElement.dataset.embed !== 'true') return;
      const resize = () => {
        const height = Math.ceil(doc.body.getBoundingClientRect().height);
        if (height > 0) frame.style.height = Math.min(1600, Math.max(160, height)) + 'px';
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
    });
  }
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-scheme'] });
})();
