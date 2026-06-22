// @ts-nocheck
(function () {
  'use strict';

  // ─── Config (injected by Liquid into window.cabinetConfig) ────────────────
  const cfg = window.cabinetConfig || {
    widths: [], depths: [], colors: [], variants: [], defaultImageSrc: '',
  };

  // ─── Card capacity by cabinet width × depth ───────────────────────────────
  // Values from the published capacity table: [pennySleeved, gradedCards].
  // Table columns are DRAWER depth (13/15/18/21"); the configurator selects
  // CABINET depth (13/16/19/22"), which corresponds 1:1 by position.
  const CARD_CAPACITY = {
    '17.625': { '13': [5280, 704],  '16': [6720, 896],  '19': [8160, 1088],  '22': [9600, 1280] },
    '21.375': { '13': [6600, 880],  '16': [8400, 1120], '19': [10200, 1360], '22': [12000, 1600] },
    '25.125': { '13': [7920, 1056], '16': [10080, 1344], '19': [12240, 1632], '22': [14400, 1920] },
    '28.875': { '13': [9240, 1232], '16': [11760, 1568], '19': [14280, 1904], '22': [16800, 2240] },
    '32.625': { '13': [10560, 1408], '16': [13440, 1792], '19': [16320, 2176], '22': [19200, 2560] },
  };

  // ─── Apex Backstops included with each cabinet ────────────────────────────
  // Included count = rows (by cabinet width) × backstops per row (by depth).
  // Width keys are the configurator's exact values (nominal 17/21/25/28/32").
  const BACKSTOP_ROWS_BY_WIDTH = {
    '17.625': 4, '21.375': 5, '25.125': 6, '28.875': 7, '32.625': 8,
  };
  const BACKSTOPS_PER_ROW_BY_DEPTH = {
    '13': 1, '16': 1, '19': 2, '22': 2,
  };

  function includedBackstops() {
    if (!state.width || !state.depth) return 0;
    return (BACKSTOP_ROWS_BY_WIDTH[state.width] || 0) *
           (BACKSTOPS_PER_ROW_BY_DEPTH[state.depth] || 0);
  }

  // ─── Asset folder URL (strip filename from default src) ───────────────────
  const assetFolder = cfg.defaultImageSrc
    ? cfg.defaultImageSrc.substring(0, cfg.defaultImageSrc.lastIndexOf('/') + 1)
    : '';


  // ─── State ────────────────────────────────────────────────────────────────
  const state = {
    width:      null,
    widthLabel: null,
    depth:      null,
    colorId:    null,
    colorLabel: null,
    backstops:  0,
  };

  // ─── DOM refs (assigned in init) ──────────────────────────────────────────
  let widthSelect, depthSelect, colorSelect, backstopInput, atcBtn, priceEl, atcErrorEl;

  // ─── Backstops are sold in packs; one cart unit = one pack ────────────────
  const PACK_SIZE = 12;

  // ─── Price of one pack of backstops (dollars) ─────────────────────────────
  // Source of truth is the Shopify add-on product variant; falls back to $10.
  function backstopPackPrice() {
    return (cfg.backstop && cfg.backstop.price ? cfg.backstop.price : 1000) / 100;
  }

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

  // ─── Price: variant + backstop add-ons (Shopify stores cents as integers) ──
  function calculatePrice() {
    var v = findVariant();
    if (!v) return null;
    return v.price / 100 + (state.backstops / PACK_SIZE) * backstopPackPrice();
  }

  // ─── Swap preview image when colour changes ───────────────────────────────
  function updatePreviewImage() {
    var img = document.getElementById('cab-preview-img');
    if (!img) return;
    var newSrc = (state.colorId && cfg.imageUrls && cfg.imageUrls[state.colorId])
      ? cfg.imageUrls[state.colorId]
      : cfg.defaultImageSrc;
    if (img.src === newSrc) return;
    img.style.opacity = '0';
    img.onload = function () { img.style.opacity = '1'; };
    img.onerror = function () { img.src = cfg.defaultImageSrc; img.style.opacity = '1'; };
    img.src = newSrc;
  }

  // ─── Cursor-follow zoom on the preview image ──────────────────────────────
  // Scale comes from CSS :hover; here we just move the zoom origin to the cursor
  // so the image pans toward wherever the mouse is.
  function setupImageZoom() {
    var panel = document.querySelector('.cab-panel--preview');
    var img   = document.getElementById('cab-preview-img');
    if (!panel || !img) return;
    panel.addEventListener('mousemove', function (e) {
      var r = panel.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width)  * 100;
      var y = ((e.clientY - r.top)  / r.height) * 100;
      img.style.transformOrigin = x + '% ' + y + '%';
    });
    panel.addEventListener('mouseleave', function () {
      img.style.transformOrigin = 'center center';
    });
  }

  // ─── Update right-panel spec display ──────────────────────────────────────
  function updateSpec() {
    document.getElementById('spec-width').textContent = state.widthLabel || '—';
    document.getElementById('spec-depth').textContent = state.depth  ? state.depth  + '″' : '—';
    document.getElementById('spec-color').textContent = state.colorLabel || '—';
    document.getElementById('spec-backstops').textContent = includedBackstops() + state.backstops;
    updateCapacity();
  }

  // ─── Card capacity display (needs width + depth) ──────────────────────────
  function updateCapacity() {
    var pennyEl  = document.getElementById('spec-cap-penny');
    var gradedEl = document.getElementById('spec-cap-graded');
    if (!pennyEl || !gradedEl) return;
    var cap = (state.width && state.depth && CARD_CAPACITY[state.width])
      ? CARD_CAPACITY[state.width][state.depth]
      : null;
    pennyEl.textContent  = cap ? cap[0].toLocaleString('en-US') : '—';
    gradedEl.textContent = cap ? cap[1].toLocaleString('en-US') : '—';
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
    const widthOpt = widthSelect.options[widthSelect.selectedIndex];
    const colorOpt = colorSelect.options[colorSelect.selectedIndex];

    state.width      = widthSelect.value || null;
    state.widthLabel = (widthOpt && widthOpt.value) ? widthOpt.textContent : null;
    state.depth      = depthSelect.value  || null;
    state.colorId    = colorSelect.value  || null;
    state.colorLabel = (colorOpt && colorOpt.value) ? colorOpt.textContent : null;

    updateSpec();
    updatePrice();
    updatePreviewImage();
    atcBtn.disabled = !findVariant();
  }

  // ─── Backstop quantity change handler ─────────────────────────────────────
  function onBackstopChange() {
    var n = parseInt(backstopInput.value, 10);
    if (isNaN(n) || n < 0) n = 0;
    n = Math.round(n / PACK_SIZE) * PACK_SIZE;   // snap to whole packs of 12
    backstopInput.value = n;
    state.backstops = n;
    updateSpec();
    updatePrice();
  }

  // ─── Add to Cart ──────────────────────────────────────────────────────────
  function addToCart() {
    var v     = findVariant();
    var total = calculatePrice();
    if (!v || total === null) return;

    atcBtn.disabled    = true;
    atcBtn.textContent = 'Adding…';
    atcErrorEl.hidden  = true;

    // Cabinet line item; total records the full price incl. backstops.
    var items = [{
      id:       v.id,
      quantity: 1,
      properties: {
        '_cabinet_width':        state.width,
        '_cabinet_depth':        state.depth,
        '_cabinet_height':       36,
        '_cabinet_color':        state.colorId,
        '_cabinet_color_label':  state.colorLabel,
        '_cabinet_drawer_count': 4,
        '_cabinet_backstops':    state.backstops,
        '_cabinet_price':        total.toFixed(2),
      },
    }];

    // Add-on backstops as a separate line item so they actually bill.
    if (state.backstops > 0 && cfg.backstop && cfg.backstop.variantId) {
      items.push({ id: cfg.backstop.variantId, quantity: state.backstops / PACK_SIZE });
    }

    fetch('/cart/add.js', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items }),
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

    widthSelect   = document.getElementById('cab-select-width');
    depthSelect   = document.getElementById('cab-select-depth');
    colorSelect   = document.getElementById('cab-select-color');
    backstopInput = document.getElementById('cab-input-backstops');
    atcBtn        = document.getElementById('cab-atc');
    priceEl       = document.getElementById('cab-price');
    atcErrorEl    = document.getElementById('cab-atc-error');

    populateDropdowns();

    [widthSelect, depthSelect, colorSelect].forEach(function (el) {
      el.addEventListener('change', onSelectChange);
    });
    backstopInput.addEventListener('change', onBackstopChange);
    atcBtn.addEventListener('click', addToCart);

    setupImageZoom();
  }

  document.addEventListener('DOMContentLoaded', init);
}());
