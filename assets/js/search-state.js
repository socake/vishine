/* Full text search with one best passage per page; no external service required. */
(function(root, factory) {
  const api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  else root.VishineSearch = api;
})(typeof window === 'undefined' ? globalThis : window, function() {
  const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase().trim();
  function prepare(entries) {
    return entries.map(entry => ({...entry,
      key:normalize(entry.title),
      meta:normalize([entry.title, ...(entry.categories || []), ...(entry.tags || []), entry.summary].join(' ')),
      passages:(entry.passages || []).map(passage => ({...passage, key:normalize(passage.heading), body:normalize(passage.text)}))
    })).sort((a,b) => String(b.date).localeCompare(String(a.date)));
  }
  function excerpt(text, terms, size = 160) {
    text = String(text || '').replace(/\s+/g, ' ');
    const lower = normalize(text);
    const hits = terms.map(term => lower.indexOf(term)).filter(index => index >= 0);
    const start = hits.length ? Math.max(0, Math.min(...hits) - 40) : 0;
    return (start ? '…' : '') + text.slice(start, start + size) + (text.length > start + size ? '…' : '');
  }
  function find(entries, raw, section = '') {
    const query = normalize(raw), terms = query.split(/\s+/).filter(Boolean);
    const candidates = entries.filter(entry => !section || entry.type === section);
    if(!query) return candidates.slice(0,8).map(entry => ({...entry, snippet:entry.summary || ''}));
    const results = [];
    for(const entry of candidates) {
      const titleMatch = terms.every(term => entry.key.includes(term));
      const metaMatch = terms.every(term => entry.meta.includes(term));
      let best, passageScore = 0;
      for(const passage of entry.passages) {
        const combined = entry.meta + ' ' + passage.key + ' ' + passage.body;
        if(!terms.every(term => combined.includes(term))) continue;
        const score = terms.reduce((sum, term) => sum + (passage.key.includes(term) ? 25 : 0) + (passage.body.includes(term) ? 5 : 0), 0);
        if(score > passageScore) {best = passage; passageScore = score;}
      }
      if(!metaMatch && !best) continue;
      const score = (entry.key === query ? 300 : titleMatch ? 200 : metaMatch ? 100 : 0) + passageScore;
      results.push({...entry, score, anchor:!titleMatch && best ? best.anchor : '',
        heading:best?.heading || '', snippet:excerpt(best?.text || entry.summary, terms)});
    }
    return results.sort((a,b) => b.score - a.score || String(b.date).localeCompare(String(a.date)));
  }
  return {normalize, prepare, find, excerpt};
});
