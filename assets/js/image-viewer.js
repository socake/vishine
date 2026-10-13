/* Zoom/pan is confined to the modal. The article keeps its normal page scroll. */
window.VishineImageViewer = function({layer, open, words}) {
  const viewport = layer.querySelector('#viewerViewport'), media = layer.querySelector('#viewerMedia');
  const scaleLabel = layer.querySelector('#viewerScale'), original = layer.querySelector('#viewerOriginal');
  const caption = layer.querySelector('#viewerCaption');
  let width = 1, height = 1, scale = 1, fitScale = 1, x = 0, y = 0, generation = 0;
  const pointers = new Map();
  function draw() {
    const bounds = viewport.getBoundingClientRect();
    const maxX = Math.max(0, (width * scale - bounds.width) / 2);
    const maxY = Math.max(0, (height * scale - bounds.height) / 2);
    x = Math.min(maxX, Math.max(-maxX, x)); y = Math.min(maxY, Math.max(-maxY, y));
    media.style.width = width + 'px'; media.style.height = height + 'px';
    media.style.left = (bounds.width - width) / 2 + 'px'; media.style.top = (bounds.height - height) / 2 + 'px';
    media.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
    scaleLabel.textContent = Math.round(scale * 100) + '%';
    viewport.classList.toggle('can-pan', maxX > 0 || maxY > 0);
  }
  function fit() {
    const bounds = viewport.getBoundingClientRect();
    fitScale = Math.min((bounds.width - 24) / width, (bounds.height - 24) / height, 1);
    scale = Math.max(.005, fitScale); x = y = 0; draw();
  }
  function zoom(next, clientX, clientY) {
    const bounds = viewport.getBoundingClientRect();
    const px = (clientX ?? bounds.left + bounds.width / 2) - bounds.left - bounds.width / 2;
    const py = (clientY ?? bounds.top + bounds.height / 2) - bounds.top - bounds.height / 2;
    next = Math.max(Math.min(fitScale, .1), Math.min(8, next));
    const ratio = next / scale; x = px - (px - x) * ratio; y = py - (py - y) * ratio;
    scale = next; draw();
  }
  function show(figure) {
    const image = figure.querySelector('img'), svg = figure.querySelector('.diagram svg, .mermaid svg');
    if(!image && !svg) return;
    const token = ++generation; pointers.clear(); original.hidden = !image;
    caption.textContent = image?.alt || figure.querySelector('figcaption')?.textContent || '';
    const content = (image || svg).cloneNode(true);
    content.removeAttribute('style');
    content.removeAttribute('width'); content.removeAttribute('height');
    if(image) {
      content.removeAttribute('id');
      content.removeAttribute('srcset'); content.removeAttribute('loading');
      width = Number(figure.dataset.imageWidth) || image.naturalWidth || image.clientWidth;
      height = Number(figure.dataset.imageHeight) || image.naturalHeight || image.clientHeight;
      const url = new URL(figure.dataset.original || image.currentSrc || image.src, location.href);
      if(['http:', 'https:'].includes(url.protocol)) original.href = url.href; else original.hidden = true;
      const full = new Image(); full.alt = image.alt; full.decoding = 'async';
      full.onload = () => {
        if(token !== generation) return;
        const displayedWidth = width * scale;
        width = full.naturalWidth || width; height = full.naturalHeight || height;
        media.replaceChildren(full); scale = displayedWidth / width; draw();
      };
      full.onerror = () => {if(token === generation) caption.textContent = words.zoomError;};
      // Loading starts only after opening; normal articles keep their thumbnail.
      full.src = url.href;
    } else {
      const box = svg.viewBox.baseVal;
      width = box.width || svg.clientWidth; height = box.height || svg.clientHeight;
      // Mermaid uses marker/label IDs. A second copy must not refer to the
      // original drawing or introduce duplicate IDs into the document.
      const ids = new Map();
      [content,...content.querySelectorAll('[id]')].filter(node => node.id).forEach(node => {
        const id = node.id, replacement = `viewer-${token}-${id}`;
        ids.set(id,replacement); node.id = replacement;
      });
      [content,...content.querySelectorAll('*')].forEach(node => {
        [...node.attributes].forEach(attribute => {
          let value = attribute.value.replace(/url\(#([^\)]+)\)/g,(match,id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
          if(['href','xlink:href'].includes(attribute.name) && ids.has(value.slice(1)) && value.startsWith('#')) value = '#' + ids.get(value.slice(1));
          if(['aria-labelledby','aria-describedby'].includes(attribute.name)) value = value.split(/\s+/).map(id => ids.get(id) || id).join(' ');
          if(value !== attribute.value) node.setAttribute(attribute.name,value);
        });
        if(node.tagName.toLowerCase() === 'style') {
          node.textContent = node.textContent.replace(/#([\w-]+)/g,(match,id) => ids.has(id) ? '#' + ids.get(id) : match);
        }
      });
    }
    media.replaceChildren(content); open(); fit(); viewport.focus({preventScroll:true});
  }
  document.addEventListener('click', event => {
    const figure = event.target.closest('.fig[role="button"], .diagram-mermaid[role="button"]');
    if(figure && !layer.contains(figure)) show(figure);
  });
  document.addEventListener('keydown', event => {
    if(event.target.matches('.fig[role="button"], .diagram-mermaid[role="button"]') && ['Enter',' '].includes(event.key)) {
      event.preventDefault(); show(event.target);
    }
  });
  layer.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.zoom;
    if(action === 'fit') fit(); else zoom(action === 'actual' ? 1 : scale * (action === 'in' ? 1.4 : 1 / 1.4));
  }));
  viewport.addEventListener('wheel', event => {event.preventDefault(); zoom(scale * Math.exp(-event.deltaY * .002),event.clientX,event.clientY);},{passive:false});
  viewport.addEventListener('dblclick', event => {if(Math.abs(scale - fitScale) < .01) zoom(1,event.clientX,event.clientY);else fit();});
  viewport.addEventListener('keydown', event => {
    if(event.ctrlKey || event.metaKey || event.altKey) return;
    if(['+','=','-','0','1','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) event.preventDefault();
    if(event.key === '+' || event.key === '=') zoom(scale * 1.4);
    else if(event.key === '-') zoom(scale / 1.4);
    else if(event.key === '0') fit();
    else if(event.key === '1') zoom(1);
    else if(event.key.startsWith('Arrow')) {
      if(event.key === 'ArrowLeft') x += 50; if(event.key === 'ArrowRight') x -= 50;
      if(event.key === 'ArrowUp') y += 50; if(event.key === 'ArrowDown') y -= 50; draw();
    }
  });
  viewport.addEventListener('pointerdown', event => {
    if(event.button !== 0) return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY}); viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', event => {
    const previous = pointers.get(event.pointerId); if(!previous) return;
    const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)?.[1];
    if(other) {
      const before = Math.hypot(previous.x-other.x,previous.y-other.y);
      const after = Math.hypot(event.clientX-other.x,event.clientY-other.y);
      if(before) zoom(scale * after / before,(event.clientX+other.x)/2,(event.clientY+other.y)/2);
    } else { x += event.clientX-previous.x; y += event.clientY-previous.y; draw(); }
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(name => viewport.addEventListener(name,event => pointers.delete(event.pointerId)));
  viewport.addEventListener('dragstart',event => event.preventDefault());
  window.addEventListener('resize', () => {if(!layer.hidden) fit();});
};
