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
    const zh = document.documentElement.lang.toLowerCase().startsWith('zh');
    const words = zh ? {
      recent:'最近更新', loading:'正在加载搜索索引…', error:'搜索暂时不可用，请重试。', retry:'重新加载',
      empty:'没有找到相关内容，试试更短的标题或技术关键词。', results:'条结果', limit:'显示前 50 条', copied:'已复制', failed:'复制失败，请手动选择代码'
    } : {
      recent:'Recently updated', loading:'Loading search…', error:'Search is unavailable. Please retry.', retry:'Retry',
      empty:'No results. Try a shorter title or a technical keyword.', results:'results', limit:'First 50 shown', copied:'Copied', failed:'Copy failed. Please select the code manually.'
    };
    const types = {
      posts:[zh?'文章':'Articles','blog'], playbook:[zh?'实战手册':'Playbooks','play'],
      docs:[zh?'运维文档':'Documentation','docs'], roadmap:[zh?'学习路线':'Learning paths','road'],
      resources:[zh?'资源':'Resources','res'], books:[zh?'书籍':'Books','res'],
      page:[zh?'页面':'Pages','blog']
    };
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
      const query=normalize(raw), terms=query.split(/\s+/).filter(Boolean);
      const matches=query ? searchData.map(d=>({d,score:d.key===query?100:d.key.includes(query)?60:terms.every(t=>d.key.includes(t))?40:10}))
        .filter(({d})=>terms.every(t=>d.text.includes(t))).sort((a,b)=>b.score-a.score || b.d.date.localeCompare(a.d.date)).map(x=>x.d)
        : searchData.slice(0,8);
      searchStatus.textContent=query ? matches.length+' '+words.results+(matches.length>50?' · '+words.limit:'') : words.recent;
      if(!matches.length) {message(words.empty);return;}
      matches.slice(0,50).forEach((d,i)=>{
        const type=types[d.type]||types.page;
        const el=document.createElement('div');el.className='cmdk-item';el.id='cmdk-opt-'+i;
        el.setAttribute('role','option');el.style.setProperty('--ci-c','var(--c-'+type[1]+')');
        el.innerHTML='<div class="ci-ico">'+itemIcon+'</div><div class="ci-body"><div class="ci-title">'+highlight(d.title,raw.trim())+'</div><div class="ci-meta">'+escapeHtml([type[0],d.categories.join(' / '),d.date].filter(Boolean).join(' · '))+'</div></div><span class="ci-enter" aria-hidden="true">↵</span>';
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
          searchData=data.filter(d=>typeof d.title==='string' && typeof d.url==='string').map(d=>{
            const url=new URL(d.url,location.href);
            if(url.origin!==location.origin || !['https:','http:'].includes(url.protocol)) return null;
            const categories=Array.isArray(d.categories)?d.categories:[];
            const tags=Array.isArray(d.tags)?d.tags:[];
            return {...d,url:url.href,categories,date:d.date||'',key:normalize(d.title),text:normalize([d.title,...categories,...tags,d.summary||''].join(' '))};
          }).filter(Boolean).sort((a,b)=>b.date.localeCompare(a.date));
          render(input.value);
        } catch(e) {message(words.error,true);}
        finally {clearTimeout(timer);resultsEl.removeAttribute('aria-busy');loading=null;}
      })();
      return loading;
    }
    function openItem(index) {if(items[index]) location.assign(items[index].data.url);}
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
      const url = location.origin + '/index.xml';
      try{ await navigator.clipboard.writeText(url); }catch(e){}
      window.toast('已复制 RSS 地址');
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
        button.title = wide ? (zh?'切换为舒适宽度':'Use comfortable width') : (zh?'切换为宽屏阅读':'Use wide reading');
        button.setAttribute('aria-label',button.title);
        const label=button.querySelector('.read-width-label');
        if(label) label.textContent=wide ? (zh?'切回舒适':'Comfortable') : (zh?'切到宽屏':'Wide reading');
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
      wrap.setAttribute('role','region');wrap.setAttribute('aria-label',zh?'表格，可横向滚动':'Table, scroll horizontally');
      table.before(wrap);wrap.appendChild(table);
    });
    /* ---------- 标题锚点 + TOC 构建 ---------- */
    const prose = document.getElementById('prose');
    if(!prose) return; // Home/list pages do not mount article-only controls.
    const headings = [...prose.querySelectorAll('h2, h3')];
    const tocList = document.getElementById('tocList');
    const tocListMobile = document.getElementById('tocListMobile');
    const linkMap = new Map(); // id -> [全部对应链接（桌面 h2/h3 + 移动 h2/h3）]

    headings.forEach((h, i)=>{
      const id = h.id || ('sec-' + (i+1));
      h.id = id;
      // 去掉 render-heading 钩子在服务端生成的锚点，避免与下面 JS 锚点重复（悬停出现 ##），
      // 同时防止其 # 文本污染 TOC（textContent 会把锚点的 # 也算进去）。
      const srvAnchor = h.querySelector('a.anchor'); if(srvAnchor) srvAnchor.remove();
      const text = h.textContent.trim();

      // 锚点 #
      const a = document.createElement('a');
      a.className = 'anchor';
      a.href = '#' + id;
      a.setAttribute('aria-label','复制本节链接');
      a.textContent = '#';
      a.addEventListener('click', async (e)=>{
        e.preventDefault();
        history.replaceState(null,'','#'+id);
        h.scrollIntoView({behavior: reduce()?'auto':'smooth', block:'start'});
        await copyText(location.href.split('#')[0] + '#' + id);
        window.toast('已复制本节链接');
      });
      h.appendChild(a);

      // 文本暂存，供后续构建折叠树
      h._tocText = text;
    });

    /* ---------- 折叠目录树：H2 父 / H3 子 ---------- */
    const h3Parent = new Map();  // h3 id -> 所属 h2 id
    const itemReg  = new Map();  // h2 id -> [{li, toggle}]（含桌面 + 移动两份）
    const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

    function addLink(id, a){
      if(!linkMap.has(id)) linkMap.set(id, []);
      linkMap.get(id).push(a);
    }
    // 手动点击折叠/展开：标记为「干预态」，此后 scrollspy 不再自动管理这一组
    function toggleItem(li, btn){
      li.dataset.manual = '1';
      const collapsed = li.classList.toggle('collapsed');
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }
    function setCollapsed(it, collapsed){
      it.li.classList.toggle('collapsed', collapsed);
      if(it.toggle) it.toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }
    // 自动态（非干预）：只展开当前所在的 H2 组，其余全部收起；
    // 用户手动开/合过的组带 data-manual，scrollspy 一律不碰，尊重手动操作。
    function autoManage(id){
      const activeH2 = h3Parent.has(id) ? h3Parent.get(id) : id;
      itemReg.forEach((items, h2id)=>{
        const wantCollapsed = h2id !== activeH2;
        items.forEach(it=>{
          if(it.li.dataset.manual) return;   // 干预态：不自动管理
          if(!it.toggle) return;             // 无子项的 H2 没有折叠器
          setCollapsed(it, wantCollapsed);
        });
      });
    }
    function buildTree(rootUl, onNav){
      if(!rootUl) return;
      let childrenUl = null, curH2 = null;
      const pending = [];
      headings.forEach(h=>{
        const id = h.id, text = h._tocText || h.textContent.trim();
        if(h.tagName === 'H2'){
          const li  = document.createElement('li'); li.className = 'toc-item';
          const row = document.createElement('div'); row.className = 'toc-row';
          const a   = document.createElement('a');
          a.className = 'toc-h2'; a.href = '#'+id; a.textContent = text; a.dataset.id = id;
          if(onNav) a.addEventListener('click', onNav);
          row.appendChild(a); li.appendChild(row);
          childrenUl = document.createElement('ul'); childrenUl.className = 'toc-children';
          li.appendChild(childrenUl);
          rootUl.appendChild(li);
          addLink(id, a);
          curH2 = id;
          pending.push({id, li, row, childrenUl, toggle:null});
        }else{
          const li = document.createElement('li');
          const a  = document.createElement('a');
          a.className = 'toc-h3'; a.href = '#'+id; a.textContent = text; a.dataset.id = id;
          if(onNav) a.addEventListener('click', onNav);
          li.appendChild(a);
          (childrenUl || rootUl).appendChild(li);
          addLink(id, a);
          if(curH2) h3Parent.set(id, curH2);
        }
      });
      // 仅「有 H3 子项」的 H2 才加折叠触发器（原生 button，Enter/Space 即可触发）
      pending.forEach(it=>{
        if(it.childrenUl.children.length){
          const btn = document.createElement('button');
          btn.className = 'toc-toggle'; btn.type = 'button';
          btn.setAttribute('aria-expanded','false');   // 默认折叠（目录当大纲用）
          btn.setAttribute('aria-label','折叠或展开此节');
          btn.innerHTML = CHEV;
          btn.addEventListener('click', ()=>toggleItem(it.li, btn));
          it.row.appendChild(btn);
          it.toggle = btn;
          it.li.classList.add('collapsed');            // 默认折叠态
        }
        if(!itemReg.has(it.id)) itemReg.set(it.id, []);
        itemReg.get(it.id).push({li:it.li, toggle:it.toggle});
      });
    }

    let closeTocSheet=()=>{};
    buildTree(tocList, null);
    buildTree(tocListMobile, ()=>closeTocSheet());

    function setActiveToc(id){
      linkMap.forEach((links, key)=>{
        const on = key===id;
        links.forEach(l=>{l.classList.toggle('active',on);if(on) l.setAttribute('aria-current','location');else l.removeAttribute('aria-current');});
      });
      autoManage(id); // 自动态：只展开当前组、收起其它（干预态除外）
    }

    /* ---------- TOC scrollspy（IntersectionObserver）---------- */
    if('IntersectionObserver' in window && headings.length){
      headings.forEach(h=>{ h._vis=false; });
      const spy = new IntersectionObserver(entries=>{
        entries.forEach(e=>{ e.target._vis = e.isIntersecting; });
        const vis = headings.filter(h=>h._vis);
        if(vis.length){ setActiveToc(vis[0].id); }
      }, {rootMargin:'-78px 0px -72% 0px', threshold:0});
      headings.forEach(h=>spy.observe(h));
      // 初始：选中第一个
      setActiveToc(headings[0].id);
    }

    /* ---------- 代码块复制 ---------- */
    document.querySelectorAll('.code-block').forEach(block=>{
      const btn = block.querySelector('.code-copy');
      const code = block.querySelector('pre');
      if(!btn || !code) return;
      code.tabIndex=0;code.setAttribute('role','region');code.setAttribute('aria-label',zh?'代码，可横向滚动':'Code, scroll horizontally');
      const label=btn.querySelector('.cc-txt');
      const original=label?.textContent || (zh?'复制':'Copy');
      let resetTimer;
      btn.addEventListener('click',async()=>{
        const ok=await copyText(code.innerText);
        clearTimeout(resetTimer);
        btn.classList.toggle('done',ok);btn.classList.toggle('failed',!ok);
        if(label) label.textContent=ok?words.copied:(zh?'重试':'Retry');
        window.toast(ok?(zh?'已复制代码':'Code copied'):words.failed);
        resetTimer=setTimeout(()=>{
          btn.classList.remove('done','failed');if(label) label.textContent=original;
        },1800);
      });
    });

    /* ---------- 复制本文链接 ---------- */
    const copyLinkBtn = document.getElementById('copyLink');
    if(copyLinkBtn) copyLinkBtn.addEventListener('click', async ()=>{
      await copyText(location.href.split('#')[0]);
      window.toast('已复制链接');
    });

    /* ---------- 图片 zoom · Lightbox ---------- */
    const lightbox = document.getElementById('lightbox');
    const lightboxInner = document.getElementById('lightboxInner');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxModal=lightbox && lightboxClose ? modal(lightbox,()=>lightboxClose,()=>{},200) : null;
    function openLightbox(figEl){
      const dg=figEl.querySelector('.diagram');
      if(!dg || !lightboxModal) return;
      lightboxInner.replaceChildren(dg.cloneNode(true));lightboxModal.open();
    }
    function closeLightbox(){lightboxModal?.close();}
    document.querySelectorAll('.fig[role="button"]').forEach(fig=>{
      fig.addEventListener('click', ()=>openLightbox(fig));
      fig.addEventListener('keydown', e=>{
        if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openLightbox(fig); }
      });
    });
    if(lightbox && lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);


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
        h3.insertBefore(chev, h3.firstChild);
        item.appendChild(h3); item.appendChild(ans);
        h3.addEventListener('click', function(e){
          if(e.target.closest && e.target.closest('a.anchor')) return; // 点 # 复制链接，不折叠
          item.classList.toggle('open');
        });
        items.push(item);
      });
      if(!items.length) return;
      var bar = document.createElement('div'); bar.className = 'qa-controls';
      bar.innerHTML = '<button class="qa-btn" type="button" data-act="expand">展开全部</button><button class="qa-btn on" type="button" data-act="collapse">收起全部 · 自测</button>';
      items[0].parentNode.insertBefore(bar, items[0]);
      bar.addEventListener('click', function(e){
        var b = e.target.closest('.qa-btn'); if(!b) return;
        var open = b.dataset.act === 'expand';
        items.forEach(function(it){ it.classList.toggle('open', open); });
        bar.querySelector('[data-act=expand]').classList.toggle('on', open);
        bar.querySelector('[data-act=collapse]').classList.toggle('on', !open);
      });
      // 从 TOC / 锚点跳转过来时，自动展开对应题目
      function openFromHash(){
        var id = decodeURIComponent((location.hash || '').slice(1)); if(!id) return;
        var h = document.getElementById(id); if(!h) return;
        var it = h.closest('.qa-item'); if(it) it.classList.add('open');
      }
      openFromHash();
      window.addEventListener('hashchange', openFromHash);
    });
  })();
