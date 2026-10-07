/* Local, instantaneous tabs. Without JS every alternative remains readable. */
(function () {
  'use strict';
  const groups = [];
  document.querySelectorAll('[data-config-tabs]').forEach(group => {
    const panels = [...group.children].filter(el => el.matches('.config-panel'));
    if (panels.length < 2) return;
    const list = document.createElement('div');
    list.className = 'config-tablist'; list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', group.getAttribute('aria-label'));
    const buttons = panels.map((panel, i) => {
      panel.id = `${group.id}-panel-${i + 1}`;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'config-tab';
      button.id = `${group.id}-tab-${i + 1}`;
      button.textContent = panel.dataset.tabLabel;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', button.id); panel.removeAttribute('aria-label');
      panel.tabIndex = 0;
      list.appendChild(button);
      return button;
    });
    function select(index, focus = false, remember = false) {
      panels.forEach((panel, i) => {
        panel.hidden = i !== index;
        buttons[i].setAttribute('aria-selected', String(i === index));
        buttons[i].tabIndex = i === index ? 0 : -1;
      });
      if (focus) buttons[index].focus({ preventScroll: true });
      if (remember) {
        const target = panels[index].querySelector('[id]') || panels[index];
        const url = new URL(location.href); url.hash = target.id;
        history.replaceState(null, '', url);
      }
      // Only move the horizontal rail; never jump the article when choosing a tab.
      const button = buttons[index];
      const left = button.offsetLeft - list.offsetLeft;
      if (left < list.scrollLeft) list.scrollLeft = left;
      else if (left + button.offsetWidth > list.scrollLeft + list.clientWidth)
        list.scrollLeft = left + button.offsetWidth - list.clientWidth;
    }
    buttons.forEach((button, i) => {
      button.addEventListener('click', () => select(i, false, true));
      button.addEventListener('keydown', event => {
        let index;
        if (event.key === 'ArrowRight') index = (i + 1) % buttons.length;
        else if (event.key === 'ArrowLeft') index = (i + buttons.length - 1) % buttons.length;
        else if (event.key === 'Home') index = 0;
        else if (event.key === 'End') index = buttons.length - 1;
        else return;
        event.preventDefault(); select(index, true, true);
      });
    });
    group.insertBefore(list, panels[0]); group.dataset.enhanced = '';
    select(0); groups.push({ panels, select });
  });
  function revealHash() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    const target = id && document.getElementById(id);
    if (!target) return;
    groups.forEach(({ panels, select }) => {
      const index = panels.findIndex(panel => panel === target || panel.contains(target));
      if (index >= 0) select(index);
    });
    for (let node = target; node; node = node.parentElement) {
      if (node.matches('details')) node.open = true;
    }
    // Native hash scrolling can run before hidden panels have been revealed.
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }
  window.addEventListener('hashchange', revealHash);
  revealHash();
  let printClosed = [];
  window.addEventListener('beforeprint', () => {
    printClosed = [...document.querySelectorAll('.reading-details:not([open])')];
    printClosed.forEach(el => el.open = true);
  });
  window.addEventListener('afterprint', () => { printClosed.forEach(el => el.open = false); });
})();
