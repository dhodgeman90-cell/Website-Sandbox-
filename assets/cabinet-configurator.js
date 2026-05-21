// @ts-nocheck
(function () {
  'use strict';

  // ─── Config (injected by Liquid into window.cabinetConfig) ────────────────
  const cfg = window.cabinetConfig || {
    widths: [], depths: [], colors: [], variants: [],
  };


  // ─── State ────────────────────────────────────────────────────────────────
  const state = {
    width:      null,
    depth:      null,
    colorId:    null,
    colorLabel: null,
  };

  // ─── DOM refs (assigned in init) ──────────────────────────────────────────
  let widthSelect, depthSelect, colorSelect, atcBtn, priceEl, atcErrorEl;

  // ─── Populate dropdowns from metafield config ─────────────────────────────
  function populateDropdowns() {
    (Array.isArray(cfg.widths) ? cfg.widths : []).forEach(function (item) {
      const opt = document.createElement('option');
      opt.value       = String(item.value);
      opt.textContent = item.label;
      widthSelect.appendChild(opt);
    });

    (Array.isArray(cfg.depths) ? cfg.depths : []).forEach(function (item) {
      const opt = document.createElement('option');
      opt.value       = String(item.value);
      opt.textContent = item.label;
      depthSelect.appendChild(opt);
    });

    (Array.isArray(cfg.colors) ? cfg.colors : []).forEach(function (item) {
      const opt = document.createElement('option');
      opt.value       = item.id;
      opt.textContent = item.label;
      colorSelect.appendChild(opt);
    });
  }

  // ─── Find the Shopify variant matching current selections ─────────────────
  function findVariant() {
    if (!state.width || !state.depth || !state.colorId) return null;
    var colorId = state.colorId;
    return (cfg.variants || []).find(function (v) {
      return String(v.option1) == String(state.width)  &&
             String(v.option2) == String(state.depth)  &&
             v.option3.toLowerCase() === colorId.toLowerCase();
    }) || null;
  }

  // ─── Price from variant (Shopify stores cents as integers) ────────────────
  function calculatePrice() {
    var v = findVariant();
    return v ? v.price / 100 : null;
  }

  // ─── Update colour overlay on preview image ───────────────────────────────
  function updateColorOverlay() {
    var overlay = document.getElementById('cab-color-overlay');
    if (!overlay) return;
    var colorData = state.colorId
      ? (cfg.colors || []).find(function (c) { return c.id.toLowerCase() === state.colorId.toLowerCase(); })
      : null;
    overlay.style.backgroundColor = (colorData && colorData.hex) || '';
  }

  // ─── Update right-panel spec display ──────────────────────────────────────
  function updateSpec() {
    document.getElementById('spec-width').textContent = state.width  ? state.width  + '″' : '—';
    document.getElementById('spec-depth').textContent = state.depth  ? state.depth  + '″' : '—';
    document.getElementById('spec-color').textContent = state.colorLabel || '—';
  }

  // ─── Update price display ─────────────────────────────────────────────────
  function updatePrice() {
    const price = calculatePrice();
    priceEl.textContent = price !== null
      ? '$' + price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      : '—';
  }

  // ─── Dropdown change handler ──────────────────────────────────────────────
  function onSelectChange() {
    const rawW     = parseInt(widthSelect.value, 10);
    const rawD     = parseInt(depthSelect.value, 10);
    const colorOpt = colorSelect.options[colorSelect.selectedIndex];

    state.width      = isNaN(rawW)           ? null : rawW;
    state.depth      = isNaN(rawD)           ? null : rawD;
    state.colorId    = colorSelect.value     || null;
    state.colorLabel = (colorOpt && colorOpt.value) ? colorOpt.textContent : null;

    updateSpec();
    updatePrice();
    updateColorOverlay();
    atcBtn.disabled = !findVariant();
  }

  // ─── Add to Cart ──────────────────────────────────────────────────────────
  function addToCart() {
    var v     = findVariant();
    var price = v ? v.price / 100 : null;
    if (!v || price === null) return;

    atcBtn.disabled    = true;
    atcBtn.textContent = 'Adding…';
    atcErrorEl.hidden  = true;

    fetch('/cart/add.js', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:       v.id,
        quantity: 1,
        properties: {
          '_cabinet_width':        state.width,
          '_cabinet_depth':        state.depth,
          '_cabinet_height':       34.5,
          '_cabinet_color':        state.colorId,
          '_cabinet_color_label':  state.colorLabel,
          '_cabinet_drawer_count': 4,
          '_cabinet_price':        price.toFixed(2),
        },
      }),
    })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (err) { throw err; });
        return res.json();
      })
      .then(function () {
        window.location.href = '/cart';
      })
      .catch(function (err) {
        atcErrorEl.textContent = err.description || err.message || 'Could not add to cart. Please try again.';
        atcErrorEl.hidden      = false;
        atcBtn.disabled        = false;
        atcBtn.textContent     = 'Add to Cart';
      });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    const section = document.getElementById('cabinet-configurator');
    if (!cfg.variants || cfg.variants.length === 0) {
      section.innerHTML = '<p style="padding:40px;color:#888;text-align:center">No cabinet product assigned to this section, or product has no variants.</p>';
      return;
    }

    widthSelect  = document.getElementById('cab-select-width');
    depthSelect  = document.getElementById('cab-select-depth');
    colorSelect  = document.getElementById('cab-select-color');
    atcBtn       = document.getElementById('cab-atc');
    priceEl      = document.getElementById('cab-price');
    atcErrorEl   = document.getElementById('cab-atc-error');

    populateDropdowns();

    [widthSelect, depthSelect, colorSelect].forEach(function (el) {
      el.addEventListener('change', onSelectChange);
    });
    atcBtn.addEventListener('click', addToCart);
  }

  document.addEventListener('DOMContentLoaded', init);
}());
