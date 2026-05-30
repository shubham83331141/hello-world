/* Main application logic: catalog, filtering, visualizer wiring, quote builder. */
(function () {
  'use strict';

  const TILES = window.TILES;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const money = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const state = {
    filters: { q: '', material: 'all', color: 'all', sort: 'featured' },
    current: TILES[0],
    vis: { mode: 'room', layout: 'grid', grout: 2, groutColor: '#cfc9bd', scale: 1 },
    quote: loadQuote()
  };

  /* ---------------- catalog ---------------- */

  function applyFilters() {
    const f = state.filters;
    let list = TILES.filter((t) => {
      if (f.material !== 'all' && t.material !== f.material) return false;
      if (f.color !== 'all' && t.color !== f.color) return false;
      if (f.q) {
        const hay = (t.name + ' ' + t.material + ' ' + t.finish + ' ' + t.tags.join(' ')).toLowerCase();
        if (!hay.includes(f.q.toLowerCase())) return false;
      }
      return true;
    });
    if (f.sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (f.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (f.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  function renderCatalog() {
    const grid = $('#catalog');
    const list = applyFilters();
    grid.innerHTML = '';
    $('#result-count').textContent = list.length + (list.length === 1 ? ' tile' : ' tiles');
    if (!list.length) {
      grid.innerHTML = '<p class="empty">No tiles match your filters.</p>';
      return;
    }
    list.forEach((t) => {
      const card = document.createElement('article');
      card.className = 'card';
      if (t === state.current) card.classList.add('active');

      const sw = window.TileTexture.swatch(t, 220);
      sw.className = 'swatch';
      card.appendChild(sw);

      const body = document.createElement('div');
      body.className = 'card-body';
      body.innerHTML =
        '<h3>' + t.name + '</h3>' +
        '<p class="meta">' + cap(t.material) + ' &middot; ' + t.finish + '</p>' +
        '<p class="meta">' + t.size + '</p>' +
        '<p class="price">' + money(t.price) + ' <span>/ m&sup2;</span></p>';
      const actions = document.createElement('div');
      actions.className = 'card-actions';

      const vBtn = document.createElement('button');
      vBtn.className = 'btn primary';
      vBtn.textContent = 'Visualize';
      vBtn.addEventListener('click', () => selectTile(t));

      const qBtn = document.createElement('button');
      qBtn.className = 'btn ghost';
      qBtn.textContent = 'Add to quote';
      qBtn.addEventListener('click', () => { addToQuote(t); flash(qBtn, 'Added'); });

      actions.appendChild(vBtn);
      actions.appendChild(qBtn);
      body.appendChild(actions);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function flash(btn, text) {
    const old = btn.textContent;
    btn.textContent = text;
    btn.disabled = true;
    setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 900);
  }

  /* ---------------- visualizer ---------------- */

  function selectTile(t) {
    state.current = t;
    $('#vis-name').textContent = t.name;
    $('#vis-sub').textContent = cap(t.material) + ' · ' + t.finish + ' · ' + t.size + ' · ' + money(t.price) + ' /m²';
    renderVis();
    renderCatalog();
    $('#visualizer').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderVis() {
    window.Visualizer.render($('#stage'), state.current, state.vis);
  }

  /* ---------------- quote ---------------- */

  function addToQuote(t) {
    const existing = state.quote.find((q) => q.id === t.id);
    if (existing) existing.area += 5;
    else state.quote.push({ id: t.id, area: 5 });
    saveQuote();
    renderQuote();
  }

  function renderQuote() {
    const wrap = $('#quote-items');
    wrap.innerHTML = '';
    if (!state.quote.length) {
      wrap.innerHTML = '<p class="empty">No tiles added yet. Add tiles to build a customer quote.</p>';
      $('#quote-total').textContent = money(0);
      $('#quote-count').textContent = '0';
      return;
    }
    let total = 0;
    state.quote.forEach((q) => {
      const tile = TILES.find((t) => t.id === q.id);
      const line = tile.price * q.area;
      total += line;
      const row = document.createElement('div');
      row.className = 'quote-row';

      const sw = window.TileTexture.swatch(tile, 52);
      sw.className = 'q-swatch';
      row.appendChild(sw);

      const info = document.createElement('div');
      info.className = 'q-info';
      info.innerHTML = '<strong>' + tile.name + '</strong><span>' + money(tile.price) + ' /m²</span>';
      row.appendChild(info);

      const areaWrap = document.createElement('div');
      areaWrap.className = 'q-area';
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.step = '0.5';
      input.value = q.area;
      input.setAttribute('aria-label', 'Area in square metres for ' + tile.name);
      input.addEventListener('input', () => {
        q.area = Math.max(0, parseFloat(input.value) || 0);
        saveQuote();
        renderQuote();
      });
      areaWrap.appendChild(input);
      const unit = document.createElement('span');
      unit.textContent = 'm²';
      areaWrap.appendChild(unit);
      row.appendChild(areaWrap);

      const lineEl = document.createElement('div');
      lineEl.className = 'q-line';
      lineEl.textContent = money(line);
      row.appendChild(lineEl);

      const rm = document.createElement('button');
      rm.className = 'q-remove';
      rm.setAttribute('aria-label', 'Remove ' + tile.name);
      rm.innerHTML = '&times;';
      rm.addEventListener('click', () => {
        state.quote = state.quote.filter((x) => x.id !== q.id);
        saveQuote();
        renderQuote();
      });
      row.appendChild(rm);

      wrap.appendChild(row);
    });
    $('#quote-total').textContent = money(total);
    $('#quote-count').textContent = String(state.quote.length);
  }

  function loadQuote() {
    try {
      const raw = localStorage.getItem('showroom.quote');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter((q) => TILES.some((t) => t.id === q.id)) : [];
    } catch (e) { return []; }
  }
  function saveQuote() {
    try { localStorage.setItem('showroom.quote', JSON.stringify(state.quote)); } catch (e) { /* ignore */ }
  }

  /* ---------------- controls wiring ---------------- */

  function wire() {
    $('#search').addEventListener('input', (e) => { state.filters.q = e.target.value; renderCatalog(); });
    $('#f-material').addEventListener('change', (e) => { state.filters.material = e.target.value; renderCatalog(); });
    $('#f-color').addEventListener('change', (e) => { state.filters.color = e.target.value; renderCatalog(); });
    $('#f-sort').addEventListener('change', (e) => { state.filters.sort = e.target.value; renderCatalog(); });

    $$('input[name="mode"]').forEach((r) => r.addEventListener('change', (e) => {
      state.vis.mode = e.target.value; renderVis();
    }));
    $$('input[name="layout"]').forEach((r) => r.addEventListener('change', (e) => {
      state.vis.layout = e.target.value; renderVis();
    }));
    $('#grout').addEventListener('input', (e) => {
      state.vis.grout = +e.target.value; $('#grout-val').textContent = e.target.value + ' px'; renderVis();
    });
    $('#grout-color').addEventListener('input', (e) => { state.vis.groutColor = e.target.value; renderVis(); });
    $('#scale').addEventListener('input', (e) => {
      state.vis.scale = +e.target.value; $('#scale-val').textContent = (+e.target.value).toFixed(1) + '×'; renderVis();
    });

    $('#clear-quote').addEventListener('click', () => {
      state.quote = []; saveQuote(); renderQuote();
    });
    $('#print-quote').addEventListener('click', () => window.print());

    let raf;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(renderVis);
    });
  }

  /* populate color filter dynamically */
  function buildColorFilter() {
    const colors = Array.from(new Set(TILES.map((t) => t.color))).sort();
    const sel = $('#f-color');
    colors.forEach((c) => {
      const o = document.createElement('option');
      o.value = c; o.textContent = cap(c);
      sel.appendChild(o);
    });
  }

  function init() {
    buildColorFilter();
    wire();
    renderCatalog();
    renderQuote();
    selectTile(state.current);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
