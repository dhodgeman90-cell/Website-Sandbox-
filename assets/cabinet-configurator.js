(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  const state = {
    width: null,
    height: null,
    depth: null,
    finish: null,
    drawers: [], // [{uid, id, label, heightIn, price}]
  };

  // ─── Config (injected by Liquid into window.cabinetConfig) ────────────────
  const cfg = window.cabinetConfig || {
    widths: [], heights: [], depths: [], finishes: [],
    drawerTypes: [], basePrice: 0, maxDrawers: 6, variantId: 0,
  };

  let _uidCounter = 0;
  function uid() { return ++_uidCounter; }

  // ─── Price ────────────────────────────────────────────────────────────────
  function calculatePrice() {
    const w = cfg.widths.find(o => o.value === state.width);
    const h = cfg.heights.find(o => o.value === state.height);
    const d = cfg.depths.find(o => o.value === state.depth);
    const f = cfg.finishes.find(o => o.id === state.finish);
    if (!w || !h || !d || !f) return 0;

    const dimensionTotal = cfg.basePrice
      + (w.price_add || 0)
      + (h.price_add || 0)
      + (d.price_add || 0)
      + (f.price_add || 0);

    const drawerTotal = state.drawers.reduce((sum, dr) => sum + (dr.price || 0), 0);
    return dimensionTotal + drawerTotal;
  }

  // ─── Expose for manual testing in browser console ─────────────────────────
  window._cabTest = { state, cfg, calculatePrice };

  // ─── Init (called after DOM ready) ────────────────────────────────────────
  function init() {
    if (!cfg.variantId) {
      document.getElementById('cabinet-configurator').innerHTML =
        '<p style="padding:40px;color:#888;text-align:center">No cabinet product assigned to this section.</p>';
      return;
    }
    renderOptions();
    renderPalette();
    renderPreview();
    updateSpecPanel();
    document.getElementById('cab-atc').addEventListener('click', addToCart);
  }

  // Placeholder stubs — implemented in Tasks 6, 7, 8, 9
  function renderOptions() {
    renderPillGroup('width', cfg.widths);
    renderPillGroup('height', cfg.heights);
    renderPillGroup('depth', cfg.depths);
    renderFinishSwatches();
  }

  function renderPillGroup(dimension, options) {
    const container = document.querySelector(`.cab-pills[data-dimension="${dimension}"]`);
    if (!container) return;
    container.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'cab-pill';
      btn.textContent = opt.label;
      btn.dataset.value = opt.value;
      btn.type = 'button';
      btn.addEventListener('click', () => {
        state[dimension] = opt.value;
        container.querySelectorAll('.cab-pill').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        updateSpecPanel();
        renderPreview();
      });
      container.appendChild(btn);
    });
  }

  function renderFinishSwatches() {
    const container = document.getElementById('cab-finishes');
    if (!container) return;
    container.innerHTML = '';
    cfg.finishes.forEach(finish => {
      const swatch = document.createElement('button');
      swatch.className = 'cab-swatch';
      swatch.type = 'button';
      swatch.title = finish.label;
      swatch.dataset.id = finish.id;

      if (finish.image) {
        const img = document.createElement('img');
        img.src = finish.image;
        img.alt = finish.label;
        swatch.appendChild(img);
      } else {
        const fallback = document.createElement('div');
        fallback.className = 'cab-swatch-fallback';
        fallback.style.background = swatchFallbackColor(finish.id);
        swatch.appendChild(fallback);
      }

      swatch.addEventListener('click', () => {
        state.finish = finish.id;
        container.querySelectorAll('.cab-swatch').forEach(s => s.classList.remove('is-active'));
        swatch.classList.add('is-active');
        updateSpecPanel();
      });
      container.appendChild(swatch);
    });
  }

  function swatchFallbackColor(id) {
    const map = { oak: '#8B6914', walnut: '#3d2b1f', white: '#e8e8e8', black: '#1a1a1a' };
    return map[id] || '#555';
  }
  function renderPalette() {
    const container = document.getElementById('cab-palette');
    if (!container) return;
    container.innerHTML = '';
    cfg.drawerTypes.forEach(type => {
      const item = document.createElement('div');
      item.className = 'cab-palette-item';
      item.dataset.typeId = type.id;
      item.innerHTML = `
        <span class="cab-drag-handle">⠿</span>
        <span>${type.label}</span>
        <span class="cab-palette-item-price">+$${type.price}</span>
      `;
      container.appendChild(item);
    });

    Sortable.create(container, {
      group: { name: 'drawers', pull: 'clone', put: false },
      sort: false,
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
    });
  }
  function renderPreview() {
    const cabinet   = document.getElementById('cab-cabinet');
    const dropHint  = document.getElementById('cab-drop-hint');
    const label     = document.getElementById('cab-preview-label');

    const wLabel = cfg.widths.find(o => o.value === state.width)?.label || '—';
    const hLabel = cfg.heights.find(o => o.value === state.height)?.label || '—';
    const dLabel = cfg.depths.find(o => o.value === state.depth)?.label || '—';
    label.textContent = (state.width && state.height && state.depth)
      ? `${wLabel} × ${hLabel} × ${dLabel}`
      : '—';

    if (dropHint) dropHint.style.display = state.drawers.length ? 'none' : 'block';

    cabinet.querySelectorAll('.cab-drawer-slot').forEach(el => el.remove());
    const existingDropzone = cabinet.querySelector('.cab-cabinet-dropzone');
    if (existingDropzone) existingDropzone.remove();

    const totalUnits = state.drawers.reduce((s, d) => s + d.heightIn, 0) || 1;

    state.drawers.forEach(drawer => {
      const slot = document.createElement('div');
      slot.className = 'cab-drawer-slot';
      slot.dataset.uid = drawer.uid;
      const heightPx = Math.round((drawer.heightIn / totalUnits) * 180);
      slot.style.height = `${Math.max(heightPx, 22)}px`;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'cab-drawer-remove';
      removeBtn.type = 'button';
      removeBtn.textContent = '×';
      removeBtn.setAttribute('aria-label', `Remove ${drawer.label}`);
      removeBtn.addEventListener('click', () => {
        state.drawers = state.drawers.filter(d => d.uid !== drawer.uid);
        renderPreview();
        updateSpecPanel();
      });

      slot.innerHTML = `<span>${drawer.label}</span>`;
      slot.appendChild(removeBtn);
      cabinet.appendChild(slot);
    });

    if (state.drawers.length < cfg.maxDrawers) {
      const dz = document.createElement('div');
      dz.className = 'cab-cabinet-dropzone';
      dz.textContent = '+ drag here';
      cabinet.appendChild(dz);
    }

    if (cabinet._sortable) cabinet._sortable.destroy();
    cabinet._sortable = Sortable.create(cabinet, {
      group: { name: 'drawers', pull: false, put: true },
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      filter: '.cab-cabinet-dropzone, .cab-drop-hint, .cab-drawer-remove',
      onAdd(evt) {
        const typeId = evt.item.dataset.typeId;
        const type   = cfg.drawerTypes.find(t => t.id === typeId);
        evt.item.remove();
        if (!type) return;
        if (state.drawers.length >= cfg.maxDrawers) {
          showAtcError(`Maximum ${cfg.maxDrawers} drawers allowed`);
          return;
        }
        state.drawers.push({ uid: uid(), id: type.id, label: type.label, heightIn: type.height_in, price: type.price });
        renderPreview();
        updateSpecPanel();
      },
      onEnd(evt) {
        if (evt.from === cabinet && evt.to === cabinet && evt.oldIndex !== evt.newIndex) {
          const moved = state.drawers.splice(evt.oldIndex, 1)[0];
          state.drawers.splice(evt.newIndex, 0, moved);
          renderPreview();
        }
      },
    });
  }
  function updateSpecPanel() {
    const wLabel = cfg.widths.find(o => o.value === state.width)?.label || '—';
    const hLabel = cfg.heights.find(o => o.value === state.height)?.label || '—';
    const dLabel = cfg.depths.find(o => o.value === state.depth)?.label || '—';
    const fLabel = cfg.finishes.find(o => o.id === state.finish)?.label || '—';

    document.getElementById('spec-width').textContent   = wLabel;
    document.getElementById('spec-height').textContent  = hLabel;
    document.getElementById('spec-depth').textContent   = dLabel;
    document.getElementById('spec-finish').textContent  = fLabel;
    document.getElementById('spec-drawers').textContent = state.drawers.length;

    const price = calculatePrice();
    document.getElementById('cab-price').textContent = price > 0
      ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
      : '$0';

    const isReady = state.width && state.height && state.depth && state.finish && state.drawers.length > 0;
    const btn = document.getElementById('cab-atc');
    btn.disabled = !isReady;
    btn.textContent = isReady
      ? `Add to Cart — $${price.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
      : 'Add to Cart';

    clearAtcError();
  }

  function showAtcError(msg) {
    const el = document.getElementById('cab-atc-error');
    el.textContent = msg;
    el.hidden = false;
  }

  function clearAtcError() {
    const el = document.getElementById('cab-atc-error');
    el.textContent = '';
    el.hidden = true;
  }

  function addToCart() {
    if (!cfg.variantId) return;

    const btn = document.getElementById('cab-atc');
    btn.disabled = true;
    btn.textContent = 'Adding…';
    clearAtcError();

    const properties = {
      '_cabinet_width':        state.width,
      '_cabinet_height':       state.height,
      '_cabinet_depth':        state.depth,
      '_cabinet_finish':       state.finish,
      '_cabinet_finish_label': cfg.finishes.find(f => f.id === state.finish)?.label || state.finish,
      '_cabinet_drawer_count': state.drawers.length,
      '_cabinet_drawers':      JSON.stringify(
        state.drawers.map((d, i) => ({ pos: i + 1, type: d.id, h: d.heightIn }))
      ),
      '_cabinet_price':        calculatePrice().toFixed(2),
    };

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:         cfg.variantId,
        quantity:   1,
        properties: properties,
      }),
    })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw err; });
        return res.json();
      })
      .then(() => {
        window.location.href = '/cart';
      })
      .catch(err => {
        showAtcError(err.description || err.message || 'Could not add to cart. Please try again.');
        btn.disabled = false;
        updateSpecPanel();
      });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
