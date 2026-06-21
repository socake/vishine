/* ============================================================
   list.js — 列表页交互（vishine）
   依赖全局：window.toast（main.js 提供，缺失时静默降级）
   暴露 API（window.vishineList）：
     .setView(mode)        切换视图 'card'|'list'|'compact'（写 localStorage）
     .applyFilters()       依据当前激活 chip 重新过滤已加载卡片
     .clearFilters()       清空全部筛选
   交互：
     · 多选筛选：分类/标签 chip 即时过滤（同类 OR、跨类 AND）+ URL query 同步 + 计数更新 + 空状态
     · 视图切换：卡片/列表/紧凑，localStorage['vishine-listview'] 持久化
     · 加载更多：拦截 .load-more，fetch 下一页、抽取 .card 追加、续接下一页链接（无 JS 时退化为普通翻页链接）
   reduced-motion 下不做滚入动画。
   ============================================================ */
(function () {
  'use strict';
  var grid = document.getElementById('postGrid');
  if (!grid) return;

  var VIEW_KEY = 'vishine-listview';
  var VIEWS = ['card', 'list', 'compact'];
  var toast = function (m) { if (typeof window.toast === 'function') window.toast(m); };

  /* ---------------- 视图切换 ---------------- */
  var viewBtns = [].slice.call(document.querySelectorAll('.view-btn'));

  function setView(mode) {
    if (VIEWS.indexOf(mode) < 0) mode = 'card';
    VIEWS.forEach(function (v) { grid.classList.toggle('view-' + v, v === mode); });
    viewBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.view === mode ? 'true' : 'false'); });
    try { localStorage.setItem(VIEW_KEY, mode); } catch (e) {}
  }
  viewBtns.forEach(function (b) {
    b.addEventListener('click', function () { setView(b.dataset.view); });
  });
  (function () {
    var saved = 'card';
    try { saved = localStorage.getItem(VIEW_KEY) || 'card'; } catch (e) {}
    setView(saved);
  })();

  /* ---------------- 多选筛选 ---------------- */
  var chips = [].slice.call(document.querySelectorAll('.chip[data-type]'));
  var clearBtn = document.getElementById('filterClear');
  var emptyEl = document.getElementById('listEmpty');
  var countEl = document.getElementById('listCount');
  var active = { category: [], tag: [] };

  function cardValues(card, attr) {
    var raw = card.getAttribute(attr) || '';
    return raw ? raw.split('|').filter(Boolean) : [];
  }
  function some(values, sel) { return sel.some(function (s) { return values.indexOf(s) > -1; }); }

  function applyFilters() {
    var cards = [].slice.call(grid.querySelectorAll('.feed-item'));
    var shown = 0;
    cards.forEach(function (card) {
      var cats = cardValues(card, 'data-categories');
      var tags = cardValues(card, 'data-tags');
      var okCat = active.category.length === 0 || some(cats, active.category);
      var okTag = active.tag.length === 0 || some(tags, active.tag);
      var show = okCat && okTag;
      card.classList.toggle('is-hidden', !show);
      if (show) shown++;
    });
    if (emptyEl) emptyEl.hidden = shown !== 0;
    if (countEl) countEl.textContent = shown;
    var has = active.category.length || active.tag.length;
    if (clearBtn) clearBtn.hidden = !has;
    syncURL();
  }

  function syncURL() {
    if (!window.history || !history.replaceState) return;
    var p = new URLSearchParams();
    if (active.category.length) p.set('cat', active.category.join(','));
    if (active.tag.length) p.set('tag', active.tag.join(','));
    var qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  function toggleChip(chip) {
    var type = chip.dataset.type, val = chip.dataset.value;
    var arr = active[type];
    var i = arr.indexOf(val);
    if (i > -1) { arr.splice(i, 1); chip.setAttribute('aria-pressed', 'false'); chip.classList.remove('on'); }
    else { arr.push(val); chip.setAttribute('aria-pressed', 'true'); chip.classList.add('on'); }
    applyFilters();
  }
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () { toggleChip(chip); });
  });

  function clearFilters() {
    active.category = []; active.tag = [];
    chips.forEach(function (c) { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
    applyFilters();
  }
  if (clearBtn) clearBtn.addEventListener('click', clearFilters);

  // 从 URL 恢复初始筛选
  (function () {
    var p = new URLSearchParams(location.search);
    ['cat', 'tag'].forEach(function (k) {
      var type = k === 'cat' ? 'category' : 'tag';
      var v = p.get(k);
      if (!v) return;
      v.split(',').forEach(function (val) {
        active[type].push(val);
        var chip = chips.filter(function (c) { return c.dataset.type === type && c.dataset.value === val; })[0];
        if (chip) { chip.classList.add('on'); chip.setAttribute('aria-pressed', 'true'); }
      });
    });
    if (active.category.length || active.tag.length) applyFilters();
  })();

  /* ---------------- 加载更多（渐进增强） ---------------- */
  var loadMore = document.getElementById('loadMore');
  function bindLoadMore(btn) {
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (btn.classList.contains('is-loading')) return;
      btn.classList.add('is-loading');
      var url = btn.getAttribute('href');
      fetch(url, { headers: { 'X-Requested-With': 'fetch' } })
        .then(function (r) { return r.text(); })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var newCards = [].slice.call(doc.querySelectorAll('#postGrid > .feed-item'));
          newCards.forEach(function (c) { grid.appendChild(document.importNode(c, true)); });
          applyFilters();
          var nextBtn = doc.getElementById('loadMore');
          if (nextBtn) {
            btn.setAttribute('href', nextBtn.getAttribute('href'));
            btn.classList.remove('is-loading');
          } else {
            var wrap = btn.closest('.load-more-wrap');
            if (wrap) wrap.remove();
          }
          toast('已加载 ' + newCards.length + ' 篇');
        })
        .catch(function () {
          btn.classList.remove('is-loading');
          // 失败则退化为正常跳转
          location.href = url;
        });
    });
  }
  bindLoadMore(loadMore);

  /* ---------------- 暴露 API ---------------- */
  window.vishineList = {
    setView: setView,
    applyFilters: applyFilters,
    clearFilters: clearFilters
  };
})();
