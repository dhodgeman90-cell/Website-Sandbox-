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
  function renderPalette() {}
  function renderPreview() {}
  function updateSpecPanel() {}

  document.addEventListener('DOMContentLoaded', init);
})();
