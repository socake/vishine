/* ============================================================
   diagram.js — Mermaid 图表渲染（vishine）
   · 按需加载 self-host /js/mermaid.min.js（页面无 .mermaid 则零开销）
   · 主题色从 vishine CSS token 取，随三套 scheme 自动翻配色
   · scheme 切换 → 重渲染；reduced-motion 关闭曲线动画
   ============================================================ */
(function () {
  'use strict';
  var nodes = document.querySelectorAll('.mermaid');
  if (!nodes.length) return;

  // 缓存源码（重渲染需要原始图定义）
  [].forEach.call(nodes, function (el) {
    if (!el.dataset.src) el.dataset.src = (el.textContent || '').trim();
  });

  var libLoading = false, queue = [];
  function withLib(cb) {
    if (window.mermaid) return cb();
    queue.push(cb);
    if (libLoading) return;
    libLoading = true;
    var s = document.createElement('script');
    s.src = (window.VISHINE_MERMAID_SRC || '/js/mermaid.min.js');
    s.onload = function () { queue.forEach(function (f) { f(); }); queue = []; };
    s.onerror = function () { libLoading = false; };
    document.head.appendChild(s);
  }

  function tokenTheme() {
    var s = getComputedStyle(document.documentElement);
    var g = function (n) { return s.getPropertyValue(n).trim(); };
    return {
      background: g('--card'),
      primaryColor: g('--paper-2'),
      primaryTextColor: g('--ink'),
      primaryBorderColor: g('--c-docs'),
      secondaryColor: g('--c-play-bg'),
      secondaryBorderColor: g('--c-play'),
      tertiaryColor: g('--card'),
      tertiaryBorderColor: g('--line'),
      lineColor: g('--ink-3'),
      textColor: g('--ink'),
      nodeBorder: g('--c-docs'),
      clusterBkg: g('--paper'),
      clusterBorder: g('--line'),
      titleColor: g('--ink'),
      edgeLabelBackground: g('--card'),
      labelBoxBkgColor: g('--paper-2'),
      labelBoxBorderColor: g('--line'),
      actorBkg: g('--paper-2'),
      actorBorder: g('--c-docs'),
      noteBkgColor: g('--accent-soft'),
      noteBorderColor: g('--accent'),
      noteTextColor: g('--accent-ink'),
      actorTextColor: g('--ink'),
      actorLineColor: g('--ink-3'),
      fontFamily: getComputedStyle(document.body).fontFamily,
      fontSize: '14px'
    };
  }

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render() {
    withLib(function () {
      try {
        window.mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'base',
          themeVariables: tokenTheme(),
          flowchart: { curve: reduce ? 'linear' : 'basis', htmlLabels: true },
          sequence: { useMaxWidth: true }
        });
        var els = [].slice.call(document.querySelectorAll('.mermaid'));
        els.forEach(function (el) {
          el.removeAttribute('data-processed');
          el.innerHTML = el.dataset.src;
        });
        window.mermaid.run({ nodes: els }).catch(function () {});
      } catch (e) {}
    });
  }

  render();

  // scheme 切换 → 用新 token 重渲染（防抖）
  var t;
  new MutationObserver(function () {
    clearTimeout(t);
    t = setTimeout(render, 80);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-scheme'] });
})();
