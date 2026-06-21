  // ===== 配色方案切换（paper / clean / dark）=====
  const SCHEMES = ['paper','clean','dark'];
  const root = document.documentElement;
  const swBtns = [...document.querySelectorAll('.sw-btn')];

  function applyScheme(name){
    if(!SCHEMES.includes(name)) name = 'paper';
    root.setAttribute('data-scheme', name);
    swBtns.forEach(b=>b.classList.toggle('on', b.dataset.set===name));
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

    /* ---------- ⌘K 命令面板 ---------- */
    const ORDER = ['article','playbook','category','tag'];
    const CMDK_TYPES = {
      article:{label:'文章', color:'var(--c-blog)'},
      playbook:{label:'实战手册', color:'var(--c-play)'},
      category:{label:'分类', color:'var(--c-docs)'},
      tag:{label:'标签', color:'var(--c-res)'},
    };
    const ICONS = {
      article:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5h16M4 10h16M4 15h10M4 20h7"/></svg>',
      playbook:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h11l5 5v11H4z"/><path d="M14 4v5h5"/></svg>',
      category:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>',
      tag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11V5a2 2 0 0 1 2-2h6l9 9-8 8z"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/></svg>',
    };
    const CMDK_DATA = [
      {type:'article', title:'Nacos 一文通：配置中心与服务发现实战', meta:'中间件 · 04-18'},
      {type:'article', title:'多云中间件横向速查与跨环境隔离实战', meta:'中间件 · 多云 · 04-15'},
      {type:'article', title:'OpenCost FinOps：Kubernetes 成本可视化实战', meta:'FinOps · 04-10'},
      {type:'article', title:'故障排查实录：Terway CRD IPAM IP 泄漏导致 Pod 无法调度', meta:'故障复盘 · 04-06'},
      {type:'article', title:'运维工程师的 AI 工具实践', meta:'AI 工具 · 04-02'},
      {type:'article', title:'Multi-Cloud MQ：跨云消息队列选型与容灾', meta:'中间件 · 云原生'},
      {type:'article', title:'Karpenter 弹性伸缩与 Spot 实例成本优化', meta:'Kubernetes · FinOps'},
      {type:'playbook', title:'每-PR 独立环境：从零搭建预览环境', meta:'实战手册 · guide'},
      {type:'playbook', title:'K8s 成本优化 · Karpenter 落地手册', meta:'实战手册 · guide'},
      {type:'playbook', title:'CI/CD 流水线模板化实战手册', meta:'实战手册 · guide'},
      {type:'category', title:'Kubernetes', meta:'分类 · 38 篇'},
      {type:'category', title:'中间件', meta:'分类 · 22 篇'},
      {type:'category', title:'云原生', meta:'分类 · 19 篇'},
      {type:'category', title:'AWS', meta:'分类 · 17 篇'},
      {type:'tag', title:'GitOps', meta:'标签'},
      {type:'tag', title:'FinOps', meta:'标签'},
      {type:'tag', title:'Nacos', meta:'标签 · 12 篇'},
      {type:'tag', title:'RAG', meta:'标签 · 8 篇'},
    ];

    const overlay = document.getElementById('cmdk');
    const input = document.getElementById('cmdkInput');
    const resultsEl = document.getElementById('cmdkResults');
    let items = []; let activeIndex = -1; let lastFocus = null;

    function highlight(title, q){
      const safe = escapeHtml(title);
      if(!q) return safe;
      const eq = escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      try{ return safe.replace(new RegExp(eq,'ig'), m=>'<mark>'+m+'</mark>'); }
      catch(e){ return safe; }
    }
    function makeItem(d, query){
      const idx = items.length;
      const el = document.createElement('div');
      el.className = 'cmdk-item';
      el.setAttribute('role','option');
      el.id = 'cmdk-opt-'+idx;
      el.style.setProperty('--ci-c', CMDK_TYPES[d.type].color);
      el.innerHTML =
        '<div class="ci-ico">'+ICONS[d.type]+'</div>'+
        '<div class="ci-body"><div class="ci-title">'+highlight(d.title, query)+'</div>'+
        '<div class="ci-meta">'+escapeHtml(d.meta)+'</div></div>'+
        '<span class="ci-enter">↵</span>';
      el.addEventListener('mousemove', ()=>setActive(idx));
      el.addEventListener('click', ()=>openItem(idx));
      items.push({el, data:d});
      return el;
    }
    function render(raw){
      const q = (raw||'').trim();
      const query = q.toLowerCase();
      resultsEl.innerHTML = ''; items = []; activeIndex = -1;
      if(!query){
        const head = document.createElement('div');
        head.className = 'cmdk-group-label';
        head.textContent = '热门 · 最近';
        resultsEl.appendChild(head);
        CMDK_DATA.slice(0,6).forEach(d=>resultsEl.appendChild(makeItem(d,'')));
      } else {
        const matched = CMDK_DATA.filter(d=>
          d.title.toLowerCase().includes(query) || d.meta.toLowerCase().includes(query));
        if(!matched.length){
          const e = document.createElement('div');
          e.className = 'cmdk-empty';
          e.innerHTML = '没有匹配 <b>「'+escapeHtml(q)+'」</b> 的内容';
          resultsEl.appendChild(e);
          input.setAttribute('aria-activedescendant','');
          return;
        }
        ORDER.forEach(type=>{
          const group = matched.filter(d=>d.type===type);
          if(!group.length) return;
          const label = document.createElement('div');
          label.className = 'cmdk-group-label';
          label.textContent = CMDK_TYPES[type].label;
          resultsEl.appendChild(label);
          group.forEach(d=>resultsEl.appendChild(makeItem(d, query)));
        });
      }
      if(items.length) setActive(0);
    }
    function setActive(i){
      if(!items.length){ activeIndex=-1; return; }
      if(i<0) i = items.length-1;
      if(i>=items.length) i = 0;
      items.forEach((it,n)=>it.el.classList.toggle('active', n===i));
      activeIndex = i;
      const el = items[i].el;
      el.scrollIntoView({block:'nearest'});
      input.setAttribute('aria-activedescendant', el.id);
    }
    function openItem(i){
      if(i<0 || i>=items.length) return;
      const d = items[i].data;
      closeCmdk();
      window.toast('打开：'+d.title);
    }
    function openCmdk(){
      if(!overlay.hidden) return;
      lastFocus = document.activeElement;
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
      input.value = '';
      render('');
      requestAnimationFrame(()=>{ overlay.classList.add('open'); input.focus(); });
    }
    function closeCmdk(){
      if(overlay.hidden) return;
      overlay.classList.remove('open');
      const done = ()=>{ overlay.hidden = true; };
      reduce() ? done() : setTimeout(done, 180);
      document.body.style.overflow = '';
      if(lastFocus && lastFocus.focus) lastFocus.focus();
    }
    window.openCmdk = openCmdk;
    window.closeCmdk = closeCmdk;

    input.addEventListener('input', ()=>render(input.value));
    overlay.addEventListener('mousedown', e=>{ if(e.target===overlay) closeCmdk(); });
    overlay.addEventListener('keydown', e=>{
      if(e.key==='Escape'){ e.preventDefault(); closeCmdk(); }
      else if(e.key==='ArrowDown'){ e.preventDefault(); setActive(activeIndex+1); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); setActive(activeIndex-1); }
      else if(e.key==='Enter'){ e.preventDefault(); openItem(activeIndex); }
    });

    const searchMini = document.getElementById('searchMini');
    searchMini.addEventListener('click', openCmdk);
    searchMini.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openCmdk(); } });

    document.addEventListener('keydown', e=>{
      const tag = (e.target.tagName||'').toLowerCase();
      const typing = tag==='input' || tag==='textarea' || e.target.isContentEditable;
      if((e.key==='k' || e.key==='K') && (e.metaKey || e.ctrlKey)){
        e.preventDefault(); overlay.hidden ? openCmdk() : closeCmdk();
      } else if(e.key==='/' && !typing && overlay.hidden){ e.preventDefault(); openCmdk(); }
    });

    /* ---------- 下拉菜单 ---------- */
    const dropdowns = [...document.querySelectorAll('.nav-links .dropdown')];
    dropdowns.forEach(dd=>{
      const btn = dd.querySelector('button');
      btn.setAttribute('aria-haspopup','true');
      btn.setAttribute('aria-expanded','false');
      let timer;
      const open = ()=>{ dd.classList.add('open'); btn.setAttribute('aria-expanded','true'); };
      const close = ()=>{ dd.classList.remove('open'); btn.setAttribute('aria-expanded','false'); };
      btn.addEventListener('click', e=>{ e.preventDefault(); dd.classList.contains('open')?close():open(); });
      btn.addEventListener('keydown', e=>{
        if(e.key==='Escape'){ close(); btn.focus(); }
        else if(e.key==='ArrowDown'){ e.preventDefault(); open(); const a=dd.querySelector('.menu a'); if(a) a.focus(); }
      });
      dd.addEventListener('mouseenter', ()=>clearTimeout(timer));
      dd.addEventListener('mouseleave', ()=>{ timer=setTimeout(close,150); });
      dd.querySelectorAll('.menu a').forEach(a=>{
        a.addEventListener('keydown', e=>{ if(e.key==='Escape'){ close(); btn.focus(); } });
      });
    });
    document.addEventListener('click', e=>{
      dropdowns.forEach(dd=>{
        if(!dd.contains(e.target)){ dd.classList.remove('open'); dd.querySelector('button').setAttribute('aria-expanded','false'); }
      });
    });

    /* ---------- 移动抽屉 ---------- */
    const drawer = document.getElementById('drawer');
    const hamburger = document.getElementById('hamburger');
    function openDrawer(){
      if(!drawer.hidden) return;
      drawer.hidden = false;
      document.body.style.overflow = 'hidden';
      hamburger.setAttribute('aria-expanded','true');
      requestAnimationFrame(()=>{ drawer.classList.add('open'); const f = drawer.querySelector('.drawer-close'); if(f) f.focus(); });
    }
    function closeDrawer(){
      if(drawer.hidden) return;
      drawer.classList.remove('open');
      hamburger.setAttribute('aria-expanded','false');
      const done = ()=>{ drawer.hidden = true; };
      reduce() ? done() : setTimeout(done, 240);
      document.body.style.overflow = '';
      hamburger.focus();
    }
    hamburger.addEventListener('click', openDrawer);
    drawer.addEventListener('mousedown', e=>{ if(e.target===drawer) closeDrawer(); });
    drawer.addEventListener('keydown', e=>{ if(e.key==='Escape'){ e.preventDefault(); closeDrawer(); } });
    drawer.querySelector('.drawer-close').addEventListener('click', closeDrawer);
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
          ta.select(); document.execCommand('copy'); ta.remove(); return true;
        }catch(_){ return false; }
      }
    }

    /* ---------- 阅读宽度切换（comfortable / wide）---------- */
    const readWidthBtn = document.getElementById('readWidthBtn');
    function applyReadWidth(w){
      if(w !== 'wide') w = 'comfortable';
      document.documentElement.setAttribute('data-readwidth', w);
      const wide = w === 'wide';
      if(readWidthBtn){
        readWidthBtn.setAttribute('aria-pressed', wide ? 'true' : 'false');
        readWidthBtn.title = wide ? '切换为舒适宽度' : '切换为宽屏阅读';
      }
      try{ localStorage.setItem('vishine-readwidth', w); }catch(e){}
    }
    if(readWidthBtn){
      applyReadWidth(document.documentElement.getAttribute('data-readwidth') || 'comfortable');
      readWidthBtn.addEventListener('click', ()=>{
        const cur = document.documentElement.getAttribute('data-readwidth') === 'wide' ? 'wide' : 'comfortable';
        applyReadWidth(cur === 'wide' ? 'comfortable' : 'wide');
      });
    }

    /* ---------- 标题锚点 + TOC 构建 ---------- */
    const prose = document.getElementById('prose');
    const headings = [...prose.querySelectorAll('h2, h3')];
    const tocList = document.getElementById('tocList');
    const tocListMobile = document.getElementById('tocListMobile');
    const linkMap = new Map(); // id -> [全部对应链接（桌面 h2/h3 + 移动 h2/h3）]

    headings.forEach((h, i)=>{
      const id = h.id || ('sec-' + (i+1));
      h.id = id;
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

    buildTree(tocList, null);
    buildTree(tocListMobile, ()=>closeTocSheet());

    function setActiveToc(id){
      linkMap.forEach((links, key)=>{
        const on = key===id;
        links.forEach(l=>l.classList.toggle('active', on));
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
      const label = btn.querySelector('.cc-txt');
      btn.addEventListener('click', async ()=>{
        const ok = await copyText(code.innerText);
        if(ok){
          btn.classList.add('done');
          const old = label ? label.textContent : '';
          if(label) label.textContent = '已复制';
          btn.querySelector('svg').style.display='none';
          window.toast('已复制代码');
          setTimeout(()=>{
            btn.classList.remove('done');
            if(label) label.textContent = old || '复制';
            btn.querySelector('svg').style.display='';
          }, 1600);
        }
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
    let lbFocus = null;
    function openLightbox(figEl){
      const dg = figEl.querySelector('.diagram');
      if(!dg) return;
      lbFocus = document.activeElement;
      lightboxInner.innerHTML = '';
      lightboxInner.appendChild(dg.cloneNode(true));
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(()=>{ lightbox.classList.add('open'); lightboxClose.focus(); });
    }
    function closeLightbox(){
      if(lightbox.hidden) return;
      lightbox.classList.remove('open');
      const done = ()=>{ lightbox.hidden = true; lightboxInner.innerHTML=''; };
      reduce() ? done() : setTimeout(done, 200);
      document.body.style.overflow = '';
      if(lbFocus && lbFocus.focus) lbFocus.focus();
    }
    document.querySelectorAll('.fig[role="button"]').forEach(fig=>{
      fig.addEventListener('click', ()=>openLightbox(fig));
      fig.addEventListener('keydown', e=>{
        if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openLightbox(fig); }
      });
    });
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('mousedown', e=>{ if(e.target===lightbox) closeLightbox(); });
    lightbox.addEventListener('keydown', e=>{ if(e.key==='Escape'){ e.preventDefault(); closeLightbox(); } });

    /* ---------- 移动 TOC 抽屉 ---------- */
    const tocFab = document.getElementById('tocFab');
    const tocSheet = document.getElementById('tocSheet');
    const tocSheetClose = document.getElementById('tocSheetClose');
    function openTocSheet(){
      if(!tocSheet.hidden) return;
      tocSheet.hidden = false;
      document.body.style.overflow = 'hidden';
      tocFab.setAttribute('aria-expanded','true');
      requestAnimationFrame(()=>{ tocSheet.classList.add('open'); tocSheetClose.focus(); });
    }
    function closeTocSheet(){
      if(tocSheet.hidden) return;
      tocSheet.classList.remove('open');
      tocFab.setAttribute('aria-expanded','false');
      const done = ()=>{ tocSheet.hidden = true; };
      reduce() ? done() : setTimeout(done, 240);
      document.body.style.overflow = '';
      tocFab.focus();
    }
    tocFab.addEventListener('click', openTocSheet);
    tocSheetClose.addEventListener('click', closeTocSheet);
    tocSheet.addEventListener('mousedown', e=>{ if(e.target===tocSheet) closeTocSheet(); });
    tocSheet.addEventListener('keydown', e=>{ if(e.key==='Escape'){ e.preventDefault(); closeTocSheet(); } });
  })();
