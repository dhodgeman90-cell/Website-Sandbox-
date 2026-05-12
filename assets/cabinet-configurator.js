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
  function renderOptions() {}
  function renderPalette() {}
  function renderPreview() {}
  function updateSpecPanel() {}

  document.addEventListener('DOMContentLoaded', init);
})();
