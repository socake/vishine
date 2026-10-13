// Runtime text is generated from Hugo i18n, including host overrides.
const vishineWords = JSON.parse(document.getElementById('vishine-i18n')?.textContent || '{}');
function vishineText(key, values = {}) {
  return String(vishineWords[key] || key).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`);
}
// Section browser is a non-modal disclosure; native details works without JS.
document.querySelectorAll('.hub-browser').forEach(browser=>{
  const trigger=browser.querySelector('summary');
  browser.addEventListener('keydown',event=>{
    if(event.key==='Escape' && browser.open){event.preventDefault();browser.open=false;trigger.focus();}
  });
  document.addEventListener('pointerdown',event=>{if(!browser.contains(event.target)) browser.open=false;});
  browser.addEventListener('focusout',event=>{if(event.relatedTarget && !browser.contains(event.relatedTarget)) browser.open=false;});
});

  // ===== 配色方案切换（paper / clean / dark）=====
  const SCHEMES = ['paper','clean','dark'];
  const root = document.documentElement;
  const swBtns = [...document.querySelectorAll('.sw-btn')];

  function applyScheme(name){
    if(!SCHEMES.includes(name)) name = 'paper';
    root.setAttribute('data-scheme', name);
    swBtns.forEach(b=>{
      const selected=b.dataset.set===name;
      b.classList.toggle('on', selected);b.setAttribute('aria-pressed', String(selected));
    });
    try{ localStorage.setItem('vishine-scheme', name); }catch(e){}
  }
  window.applyScheme = applyScheme;
  swBtns.forEach(b=>b.addEventListener('click', ()=>applyScheme(b.dataset.set)));
  applyScheme(root.getAttribute('data-scheme') || 'paper');

  // ===== 入场 fade-up stagger（只首次，尊重 reduced-motion）=====
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals=[...document.querySelectorAll('.reveal')];
  if(reduceMotion || !('IntersectionObserver' in window)){
    reveals.forEach(el=>el.classList.add('in'));
  }else{
    const io=new IntersectionObserver((entries,obs)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); } });
    },{rootMargin:'0px 0px -8% 0px',threshold:.05});
    reveals.forEach(el=>io.observe(el));
    // Hide only after the observer is ready. Without JS, content stays visible.
    root.classList.add('js');
  }

  // ===== 顶栏滚动加实底/阴影 + 阅读进度条 =====
  const topbar=document.querySelector('.topbar');
  const readBar=document.getElementById('readBar');
  let ticking=false;
  function onScroll(){
    if(ticking) return;
    ticking=true;
    requestAnimationFrame(()=>{
      topbar.classList.toggle('scrolled', window.scrollY>10);
      const h=document.documentElement;
      const max=(h.scrollHeight - h.clientHeight) || 1;
      const pct=Math.min(100, Math.max(0, (window.scrollY/max)*100));
      readBar.style.width=pct.toFixed(2)+'%';
      ticking=false;
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll, {passive:true});
  onScroll();

  // ===== P0 全局交互（⌘K / 抽屉 / 返回顶部 / toast / 下拉键盘） =====
  (function(){
    const reduce = ()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

    /* ---------- TOAST API ---------- */
    const toastWrap = document.getElementById('toastWrap');
    window.toast = function(msg){
      const t = document.createElement('div');
      t.className = 'toast';
      t.setAttribute('role','status');
      t.setAttribute('aria-live','polite');
      t.innerHTML = '<span class="tk">✓</span><span>'+escapeHtml(msg)+'</span>';
      toastWrap.appendChild(t);
      requestAnimationFrame(()=>t.classList.add('show'));
      setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(), reduce()?0:220); }, 2000);
    };

    /* Shared modal lifecycle: inert background, focus containment and safe reopen. */
    let activeModal = null;
    function modal(layer, firstFocus, onChange = ()=>{}, duration = 180) {
      let opened = false, timer, frame, previousFocus, previousOverflow, blocked = [];
      const controller = {
        open() {
          if(opened) return;
          if(activeModal) activeModal.close();
          opened = true; activeModal = controller;
          previousFocus = document.activeElement;
          previousOverflow = document.body.style.overflow;
          clearTimeout(timer); layer.hidden = false;
          // Block siblings along the ancestor path, including page content and nav.
          for(let node=layer; node && node!==document.body; node=node.parentElement) {
            [...node.parentElement.children].forEach(sibling=>{
              if(sibling!==node && !sibling.inert && !['SCRIPT','STYLE'].includes(sibling.tagName)) {
                sibling.inert=true; blocked.push(sibling);
              }
            });
          }
          document.body.style.overflow='hidden';onChange(true);
          frame=requestAnimationFrame(()=>{layer.classList.add('open');firstFocus()?.focus({preventScroll:true});});
        },
        close(restore = true) {
          if(!opened) return;
          opened=false; cancelAnimationFrame(frame); layer.classList.remove('open');
          blocked.forEach(el=>el.inert=false);blocked=[];
          document.body.style.overflow=previousOverflow;
          if(activeModal===controller) activeModal=null;
          onChange(false);
          clearTimeout(timer);timer=setTimeout(()=>{layer.hidden=true;},reduce()?0:duration);
          if(restore && previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
        }
      };
      layer.addEventListener('keydown', e=>{
        if(!opened) return;
        if(e.key==='Escape') {e.preventDefault();e.stopPropagation();controller.close();}
        if(e.key==='Tab') {
          const focusable=[...layer.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')]
            .filter(el=>!el.disabled && el.tabIndex>=0 && !el.closest('[inert]') && el.getClientRects().length && getComputedStyle(el).visibility!=='hidden');
          const first=focusable[0],last=focusable[focusable.length-1];
          if(!first) {e.preventDefault();return;}
          if(e.shiftKey && (document.activeElement===first || !layer.contains(document.activeElement))) {e.preventDefault();last.focus();}
          else if(!e.shiftKey && document.activeElement===last) {e.preventDefault();first.focus();}
        }
      });
      layer.addEventListener('mousedown', e=>{if(e.target===layer) controller.close();});
      return controller;
    }

    /* ---------- ⌘K 命令面板 ---------- */
    const overlay = document.getElementById('cmdk');
    const input = document.getElementById('cmdkInput');
    const resultsEl = document.getElementById('cmdkResults');
    const searchStatus = document.getElementById('cmdkStatus');
    const searchState = document.getElementById('cmdkState');
    const searchScope = document.getElementById('cmdkScope');
    const words = vishineWords;
    const itemIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h9l5 5v13H5zM14 3v6h5M8 13h8M8 17h5"/></svg>';
    let searchData = null, loading = null, items = [], activeIndex = -1;
    const normalize = value=>String(value||'').normalize('NFKC').toLocaleLowerCase().trim();
    const searchModal=modal(overlay,()=>input,open=>input.setAttribute('aria-expanded',String(open)));

    function highlight(title, query) {
      const safe=escapeHtml(title);
      if(!query) return safe;
      const escaped=escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      return safe.replace(new RegExp(escaped,'ig'),m=>'<mark>'+m+'</mark>');
    }
    function setActive(index, scroll=true) {
      if(!items.length) return;
      activeIndex=(index+items.length)%items.length;
      items.forEach((item,i)=>{
        item.el.classList.toggle('active',i===activeIndex);
        item.el.setAttribute('aria-selected',String(i===activeIndex));
      });
      const el=items[activeIndex].el;
      if(scroll) el.scrollIntoView({block:'nearest'});
      input.setAttribute('aria-activedescendant',el.id);
    }
    function resetResults() {
      resultsEl.replaceChildren();searchState.replaceChildren();searchState.hidden=true;resultsEl.hidden=false;items=[];activeIndex=-1;input.removeAttribute('aria-activedescendant');
    }
    function message(text, retry=false) {
      resetResults();searchStatus.textContent=text;
      const empty=document.createElement('div');empty.className='cmdk-empty';empty.textContent=text;
      resultsEl.hidden=true;searchState.hidden=false;searchState.appendChild(empty);
      if(retry) {
        const btn=document.createElement('button');btn.className='cmdk-retry';btn.type='button';btn.textContent=words.retry;
        // Keep the listbox limited to options; the retry lives alongside it.
        btn.addEventListener('click',()=>{input.focus();loadIndex();});
        empty.appendChild(btn);
      }
    }
    function render(raw) {
      if(!searchData) return;
      resetResults();
      const query=normalize(raw);
      const matches=window.VishineSearch.find(searchData,raw,searchScope?.value || '');
      searchStatus.textContent=query ? matches.length+' '+words.results+(matches.length>50?' · '+words.limit:'') : words.recent;
      if(!matches.length) {message(words.empty);return;}
      matches.slice(0,50).forEach((d,i)=>{
        const type=[d.sectionLabel || d.type || '',d.color || 'blog'];
        const el=document.createElement('div');el.className='cmdk-item';el.id='cmdk-opt-'+i;
        el.setAttribute('role','option');el.style.setProperty('--ci-c','var(--c-'+type[1]+')');
        el.innerHTML='<div class="ci-ico">'+itemIcon+'</div><div class="ci-body"><div class="ci-title">'+highlight(d.title,raw.trim())+'</div><div class="ci-meta">'+escapeHtml([type[0],d.categories.join(' / '),d.date].filter(Boolean).join(' · '))+'</div><div class="ci-snippet">'+highlight((d.heading ? d.heading+' · ' : '')+d.snippet,raw.trim())+'</div></div><span class="ci-enter" aria-hidden="true">↵</span>';
        el.addEventListener('mousemove',()=>setActive(i,false));el.addEventListener('click',()=>openItem(i));
        items.push({el,data:d});resultsEl.appendChild(el);
      });
      if(items.length) setActive(0,false);
      resultsEl.scrollTop=0;
    }
    async function loadIndex() {
      if(searchData) {render(input.value);return;}
      if(loading) return loading;
      message(words.loading);resultsEl.setAttribute('aria-busy','true');
      loading=(async()=>{
        const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),10000);
        try {
          if(!overlay.dataset.index) throw new Error('No JSON output configured');
          const response=await fetch(overlay.dataset.index,{signal:abort.signal,cache:'no-cache'});
          if(!response.ok) throw new Error('Index unavailable');
          const data=await response.json();if(!Array.isArray(data)) throw new Error('Invalid index');
          searchData=window.VishineSearch.prepare(data.filter(d=>typeof d.title==='string' && typeof d.url==='string').map(d=>{
            const url=new URL(d.url,location.href);
            if(url.origin!==location.origin || !['https:','http:'].includes(url.protocol)) return null;
            const categories=Array.isArray(d.categories)?d.categories:[];
            const tags=Array.isArray(d.tags)?d.tags:[];
            return {...d,url:url.href,categories,tags,date:d.date||''};
          }).filter(Boolean));
          if(searchScope) {
            searchScope.replaceChildren(new Option(words.allSections,''));
            const sections=new Map(searchData.filter(d=>d.type).map(d=>[d.type,d.sectionLabel || d.type]));
            sections.forEach((label,value)=>searchScope.add(new Option(label,value)));
          }
          render(input.value);
        } catch(e) {message(words.error,true);}
        finally {clearTimeout(timer);resultsEl.removeAttribute('aria-busy');loading=null;}
      })();
      return loading;
    }
    function openItem(index) {
      if(!items[index]) return;
      const item=items[index].data, url=new URL(item.url);
      if(item.anchor) url.hash=item.anchor;
      closeCmdk();
      const samePage = url.pathname === location.pathname && url.search === location.search;
      location.assign(url.href);
      if(samePage && item.anchor) requestAnimationFrame(() => {
        const target=document.getElementById(item.anchor);
        if(target) {target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start'});}
      });
    }
    searchScope?.addEventListener('change',()=>render(input.value));
    function openCmdk() {
      if(!overlay.hidden && overlay.classList.contains('open')) return;
      input.value='';searchModal.open();loadIndex();
    }
    function closeCmdk() {searchModal.close();}
    window.openCmdk=openCmdk;window.closeCmdk=closeCmdk;
    input.addEventListener('input',()=>render(input.value));
    input.addEventListener('keydown',e=>{
      if(e.isComposing) return;
      if(e.key==='ArrowDown' || e.key==='ArrowUp') {e.preventDefault();setActive(activeIndex+(e.key==='ArrowDown'?1:-1));}
      else if(e.key==='Enter') {e.preventDefault();openItem(activeIndex);}
    });
    document.getElementById('cmdkClose').addEventListener('click',closeCmdk);
    const searchMini=document.getElementById('searchMini');
    searchMini.addEventListener('click',openCmdk);
    searchMini.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openCmdk();}});
    document.addEventListener('keydown',e=>{
      const typing=e.target.matches('input,textarea') || e.target.isContentEditable;
      if(e.isComposing) return;
      if((e.key==='k'||e.key==='K') && (e.metaKey||e.ctrlKey)) {e.preventDefault();overlay.classList.contains('open')?closeCmdk():openCmdk();}
      else if(e.key==='/' && !typing && !activeModal) {e.preventDefault();openCmdk();}
    });

    /* ---------- Dropdowns: one visible panel, pointer and keyboard parity ---------- */
    const navLinks = document.querySelector('.nav-links');
    const dropdowns = [...document.querySelectorAll('.nav-links .dropdown')];
    const menuControls = [];
    if(navLinks) navLinks.classList.add('js-menus');
    dropdowns.forEach((dd, index)=>{
      const btn = dd.querySelector('button');
      const menu = dd.querySelector('.menu');
      const links = [...menu.querySelectorAll('a')];
      let timer, openedByHover = false;
      menu.id = 'nav-dropdown-' + index;
      btn.setAttribute('aria-controls', menu.id);
      btn.setAttribute('aria-expanded','false');
      // These are ordinary navigation links, not an ARIA application menu.
      btn.removeAttribute('aria-haspopup');
      const close = ()=>{
        clearTimeout(timer); openedByHover = false;
        dd.classList.remove('open'); btn.setAttribute('aria-expanded','false');
      };
      const open = ()=>{
        clearTimeout(timer);
        menuControls.forEach(control=>{if(control.dd!==dd) control.close();});
        dd.classList.add('open'); btn.setAttribute('aria-expanded','true');
      };
      menuControls.push({dd,close});
      btn.addEventListener('click', e=>{
        e.preventDefault();
        if(dd.classList.contains('open') && !openedByHover) close();
        else open();
        openedByHover = false;
      });
      dd.addEventListener('mouseenter', ()=>{open();openedByHover=true;});
      dd.addEventListener('mouseleave', ()=>{
        timer=setTimeout(()=>{if(!dd.contains(document.activeElement)) close();},150);
      });
      dd.addEventListener('focusout', e=>{if(!dd.contains(e.relatedTarget)) close();});
      dd.addEventListener('keydown', e=>{
        if(e.key==='Escape') {e.preventDefault();close();btn.focus();return;}
        const i=links.indexOf(document.activeElement);
        if(e.key==='ArrowDown' || e.key==='ArrowUp') {
          e.preventDefault();open();openedByHover=false;
          const target=i<0 ? (e.key==='ArrowDown'?0:links.length-1) : (i+(e.key==='ArrowDown'?1:-1)+links.length)%links.length;
          if(links.length) links[target].focus();
        } else if(i>=0 && (e.key==='Home' || e.key==='End')) {
          e.preventDefault();links[e.key==='Home'?0:links.length-1].focus();
        }
      });
    });
    document.addEventListener('click', e=>{
      menuControls.forEach(control=>{if(!control.dd.contains(e.target)) control.close();});
    });

    /* ---------- 移动抽屉 ---------- */
    const drawer = document.getElementById('drawer');
    const hamburger = document.getElementById('hamburger');
    const drawerModal=modal(drawer,()=>drawer.querySelector('.drawer-close'),open=>hamburger.setAttribute('aria-expanded',String(open)),240);
    function openDrawer(){drawerModal.open();}
    function closeDrawer(){drawerModal.close();}
    hamburger.addEventListener('click',openDrawer);
    drawer.querySelector('.drawer-close').addEventListener('click',closeDrawer);
    document.getElementById('drawerSearch').addEventListener('click',()=>{closeDrawer();openCmdk();});
    drawer.querySelectorAll('.drawer-group>button').forEach(b=>{
      b.addEventListener('click', ()=>{
        const g = b.parentElement;
        const isOpen = g.classList.toggle('open');
        b.setAttribute('aria-expanded', isOpen?'true':'false');
      });
    });

    /* ---------- 返回顶部 ---------- */
    const toTop = document.getElementById('toTop');
    let tt = false;
    function onTotop(){
      if(tt) return; tt = true;
      requestAnimationFrame(()=>{ toTop.classList.toggle('show', window.scrollY>600); tt=false; });
    }
    window.addEventListener('scroll', onTotop, {passive:true});
    onTotop();
    toTop.addEventListener('click', ()=>{ window.scrollTo({top:0, behavior: reduce()?'auto':'smooth'}); });

    /* ---------- 复制 RSS 地址 ---------- */
    const rssCopy = document.getElementById('rssCopy');
    if(rssCopy) rssCopy.addEventListener('click', async ()=>{
      const ok = await copyText(rssCopy.dataset.rss);
      window.toast(ok ? words.copyRss : words.failed);
    });

    /* ============================================================
       ===== 详情页 L4 阅读交互 =====
       ============================================================ */
    async function copyText(text){
      try{ await navigator.clipboard.writeText(text); return true; }
      catch(e){
        try{
          const ta=document.createElement('textarea'); ta.value=text;
          ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta);
          const focused=document.activeElement;ta.select(); const ok=document.execCommand('copy'); ta.remove();
          focused?.focus({preventScroll:true});return ok;
        }catch(_){ return false; }
      }
    }

    /* ---------- 阅读宽度切换（comfortable / wide）---------- */
    const readWidthButtons = [...document.querySelectorAll('.read-width-btn')];
    function applyReadWidth(w){
      if(w !== 'wide') w = 'comfortable';
      document.documentElement.setAttribute('data-readwidth', w);
      const wide = w === 'wide';
      readWidthButtons.forEach(button=>{
        button.dataset.width = w;
        button.title = wide ? words.comfortableTitle : words.wideTitle;
        button.setAttribute('aria-label',button.title);
        const label=button.querySelector('.read-width-label');
        if(label) label.textContent=wide ? words.comfortable : words.wide;
      });
      try{ localStorage.setItem('vishine-readwidth', w); }catch(e){}
    }
    if(readWidthButtons.length){
      applyReadWidth(document.documentElement.getAttribute('data-readwidth') || 'comfortable');
      readWidthButtons.forEach(button=>button.addEventListener('click', ()=>{
        const cur = document.documentElement.getAttribute('data-readwidth') === 'wide' ? 'wide' : 'comfortable';
        applyReadWidth(cur === 'wide' ? 'comfortable' : 'wide');
      }));
    }

    // Markdown tables need a local scroll container, just like long code lines.
    document.querySelectorAll('.prose table').forEach(table=>{
      if(table.closest('.table-wrap,.code-block')) return;
      const wrap=document.createElement('div');wrap.className='table-wrap';wrap.tabIndex=0;
      wrap.setAttribute('role','region');wrap.setAttribute('aria-label',words.table);
      table.before(wrap);wrap.appendChild(table);
    });
    /* Heading links and progressive enhancement of the server-rendered outline. */
    const prose = document.getElementById('prose');
    if(!prose) return;
    // Keep cross-page browsing alongside the local outline in the sticky rail
    // and mobile drawer. Native links and both lists survive without JS.
    const outlines = [...document.querySelectorAll('[data-reading-outline]')];
    if(outlines.length) {
      const preferenceKey = 'vishine-outline:' + outlines[0].dataset.outlineKey;
      let selected = 'toc';
      try { if(sessionStorage.getItem(preferenceKey) === 'section') selected = 'section'; } catch (_) {}
      function selectOutline(value) {
        outlines.forEach(outline => {
          outline.querySelectorAll('[data-outline-tab]').forEach(tab => {
            const active = tab.dataset.outlineTab === value;
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
          });
          outline.querySelectorAll('[data-outline-panel]').forEach(panel => {
            panel.hidden = panel.dataset.outlinePanel !== value;
          });
        });
        try { sessionStorage.setItem(preferenceKey, value); } catch (_) {}
      }
      outlines.forEach(outline => {
        const tabs = [...outline.querySelectorAll('[data-outline-tab]')];
        outline.querySelectorAll('[data-outline-panel]').forEach(panel => {
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('aria-labelledby', panel.id + '-tab');
          panel.tabIndex = 0;
        });
        tabs.forEach((tab, index) => {
          tab.addEventListener('click', () => selectOutline(tab.dataset.outlineTab));
          tab.addEventListener('keydown', event => {
            let next;
            if(event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            else if(event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
            else if(event.key === 'Home') next = 0;
            else if(event.key === 'End') next = tabs.length - 1;
            else return;
            event.preventDefault();
            selectOutline(tabs[next].dataset.outlineTab);
            tabs[next].focus();
          });
        });
        outline.dataset.enhanced = '';
        outline.querySelector('[role="tablist"]').hidden = false;
      });
      selectOutline(selected);
    }
    const headings = [...prose.querySelectorAll('h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]')];
    headings.forEach(h => {
      let anchor = h.querySelector('a.anchor');
      if(!anchor) {
        anchor = document.createElement('a'); anchor.className = 'anchor';
        anchor.href = '#' + h.id; anchor.textContent = '#'; h.appendChild(anchor);
      }
      anchor.setAttribute('aria-label', words.copySection);
      anchor.addEventListener('click', async event => {
        event.preventDefault();
        const url = new URL(location.href); url.hash = h.id;
        history.replaceState(null, '', url);
        h.scrollIntoView({behavior: reduce() ? 'auto' : 'smooth', block:'start'});
        const ok = await copyText(url.href);
        window.toast(ok ? words.copiedSection : words.failed);
      });
    });
    const linkMap = new Map(), tocGroups = [];
    let closeTocSheet = () => {};
    function setCollapsed(item, collapsed) {
      item.list.hidden = collapsed;
      item.li.classList.toggle('collapsed', collapsed);
      item.button.setAttribute('aria-expanded', String(!collapsed));
    }
    [document.getElementById('tocList'), document.getElementById('tocListMobile')].forEach(rootList => {
      if(!rootList) return;
      rootList.querySelectorAll('a[data-id]').forEach(link => {
        const id = link.dataset.id;
        if(!linkMap.has(id)) linkMap.set(id, []);
        linkMap.get(id).push(link);
        link.addEventListener('click', () => {
          if(rootList.id === 'tocListMobile') closeTocSheet();
          setActiveToc(id);
        });
      });
      rootList.querySelectorAll('.toc-item').forEach(li => {
        const list = [...li.children].find(el => el.matches('ul'));
        if(!list) return;
        const row = li.querySelector('.toc-row');
        const button = document.createElement('button'); button.type = 'button'; button.className = 'toc-toggle';
        button.setAttribute('aria-label', words.toggleSection + ': ' + row.textContent.trim());
        button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
        row.appendChild(button);
        const item = {li, list, button, manual:false}; tocGroups.push(item);
        button.addEventListener('click', () => { item.manual = true; setCollapsed(item, !list.hidden); });
        setCollapsed(item, true);
      });
    });
    function setActiveToc(id) {
      linkMap.forEach((links, key) => links.forEach(link => {
        link.classList.toggle('active', key === id);
        if(key === id) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');
      }));
      tocGroups.forEach(item => {
        if(item.manual) return;
        const contains = [...item.li.querySelectorAll('a[data-id]')].some(link => link.dataset.id === id);
        setCollapsed(item, !contains);
      });
    }
    const tocHeadings = headings.filter(heading => linkMap.has(heading.id));
    if('IntersectionObserver' in window && tocHeadings.length) {
      const visible = new Set();
      const spy = new IntersectionObserver(entries => {
        entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
        const first = tocHeadings.find(heading => visible.has(heading));
        if(first) setActiveToc(first.id);
      }, {rootMargin:'-78px 0px -65% 0px',threshold:0});
      tocHeadings.forEach(heading => spy.observe(heading));
      let target = ''; try { target = decodeURIComponent(location.hash.slice(1)); } catch (_) {}
      setActiveToc(linkMap.has(target) ? target : tocHeadings[0].id);
    }

    /* ---------- 代码块复制 ---------- */
    document.querySelectorAll('.code-block').forEach(block=>{
      const btn = block.querySelector('.code-copy');
      const code = block.querySelector('pre');
      if(!btn || !code) return;
      code.tabIndex=0;code.setAttribute('role','region');code.setAttribute('aria-label',words.code);
      const label=btn.querySelector('.cc-txt');
      const original=label?.textContent || words.copy;
      let resetTimer;
      btn.addEventListener('click',async()=>{
        const ok=await copyText(code.innerText);
        clearTimeout(resetTimer);
        btn.classList.toggle('done',ok);btn.classList.toggle('failed',!ok);
        if(label) label.textContent=ok?words.copied:words.retry;
        window.toast(ok?words.copiedCode:words.failed);
        resetTimer=setTimeout(()=>{
          btn.classList.remove('done','failed');if(label) label.textContent=original;
        },1800);
      });
    });

    /* ---------- 复制本文链接 ---------- */
    const copyLinkBtn = document.getElementById('copyLink');
    if(copyLinkBtn) copyLinkBtn.addEventListener('click', async ()=>{
      const ok = await copyText(location.href.split('#')[0]);
      window.toast(ok ? words.copiedLink : words.failed);
    });

    /* ---------- 图片 zoom · Lightbox ---------- */
    const lightbox = document.getElementById('lightbox');
    const lightboxInner = document.getElementById('lightboxInner');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxModal=lightbox && lightboxClose ? modal(lightbox,()=>document.getElementById('viewerViewport'),()=>{},200) : null;
    if(lightboxModal) {
      window.VishineImageViewer({layer:lightbox,open:()=>lightboxModal.open(),words});
      lightboxClose.addEventListener('click',()=>lightboxModal.close());
    }

    /* ---------- 移动 TOC 抽屉 ---------- */
    const tocFab = document.getElementById('tocFab');
    const tocSheet = document.getElementById('tocSheet');
    const tocSheetClose = document.getElementById('tocSheetClose');
    if(tocFab && tocSheet && tocSheetClose) {
      const tocModal=modal(tocSheet,()=>tocSheetClose,open=>tocFab.setAttribute('aria-expanded',String(open)),240);
      closeTocSheet=()=>tocModal.close();
      tocFab.setAttribute('aria-controls','tocSheet');tocFab.setAttribute('aria-haspopup','dialog');
      tocFab.addEventListener('click',()=>tocModal.open());
      tocSheetClose.addEventListener('click',()=>tocModal.close());
    }

  })();

  /* ============ 面试题折叠（自测）：把每个 h3 题目折成可展开卡片 ============ */
  (function(){
    document.querySelectorAll('.prose.is-interview').forEach(function(prose){
      var h3s = [].slice.call(prose.querySelectorAll('h3'));
      if(!h3s.length) return;
      var items = [];
      h3s.forEach(function(h3){
        var item = document.createElement('div'); item.className = 'qa-item';
        // 收集答案：h3 之后的兄弟，直到下一个 h2/h3
        var ans = document.createElement('div'); ans.className = 'qa-a';
        var n = h3.nextSibling;
        while(n){
          var nx = n.nextSibling;
          if(n.nodeType === 1 && (n.tagName === 'H3' || n.tagName === 'H2')) break;
          if(n.nodeType === 1 && n.tagName === 'HR'){ n.remove(); n = nx; continue; }
          ans.appendChild(n); n = nx;
        }
        // 保留 h3 本体（连同 id / 锚点），只把它移进卡片当作可点击题头 —— TOC / 锚点 / scrollspy 继续可用
        h3.parentNode.insertBefore(item, h3);
        h3.classList.add('qa-q');
        var chev = document.createElementNS('http://www.w3.org/2000/svg','svg');
        chev.setAttribute('class','qa-chev'); chev.setAttribute('viewBox','0 0 24 24');
        chev.setAttribute('fill','none'); chev.setAttribute('stroke','currentColor');
        chev.setAttribute('stroke-width','2.4'); chev.setAttribute('stroke-linecap','round');
        chev.setAttribute('stroke-linejoin','round'); chev.setAttribute('aria-hidden','true');
        chev.innerHTML = '<path d="m9 6 6 6-6 6"/>';
        var button = document.createElement('button'); button.type = 'button'; button.className = 'qa-question';
        var anchor = h3.querySelector('a.anchor');
        [].slice.call(h3.childNodes).forEach(function(node){ if(node !== anchor) button.appendChild(node); });
        button.insertBefore(chev,button.firstChild); h3.insertBefore(button,h3.firstChild);
        ans.id = h3.id + '-answer'; button.setAttribute('aria-controls',ans.id);
        button.setAttribute('aria-expanded','false'); ans.hidden = true;
        item._setOpen = function(open){ item.classList.toggle('open',open); ans.hidden=!open; button.setAttribute('aria-expanded',String(open)); };
        item.appendChild(h3); item.appendChild(ans);
        button.addEventListener('click', function(){ item._setOpen(ans.hidden); });
        items.push(item);
      });
      if(!items.length) return;
      var bar = document.createElement('div'); bar.className = 'qa-controls';
      ['expand','collapse'].forEach(function(action){
        var button = document.createElement('button'); button.type='button'; button.className='qa-btn'; button.dataset.act=action;
        button.textContent = vishineWords[action === 'expand' ? 'expandAll' : 'collapseAll']; bar.appendChild(button);
      });
      items[0].parentNode.insertBefore(bar, items[0]);
      bar.addEventListener('click', function(e){
        var b = e.target.closest('.qa-btn'); if(!b) return;
        var open = b.dataset.act === 'expand';
        items.forEach(function(it){ it._setOpen(open); });
        bar.querySelector('[data-act=expand]').classList.toggle('on', open);
        bar.querySelector('[data-act=collapse]').classList.toggle('on', !open);
      });
      // 从 TOC / 锚点跳转过来时，自动展开对应题目
      function openFromHash(){
        var id; try { id=decodeURIComponent((location.hash || '').slice(1)); } catch (_) { return; } if(!id) return;
        var h = document.getElementById(id); if(!h) return;
        var it = h.closest('.qa-item'); if(it) it._setOpen(true);
      }
      var printState = [];
      window.addEventListener('beforeprint',function(){ printState=items.map(function(it){return it.classList.contains('open');});items.forEach(function(it){it._setOpen(true);}); });
      window.addEventListener('afterprint',function(){ items.forEach(function(it,i){it._setOpen(printState[i]);}); });
      openFromHash();
      window.addEventListener('hashchange', openFromHash);
    });
  })();
