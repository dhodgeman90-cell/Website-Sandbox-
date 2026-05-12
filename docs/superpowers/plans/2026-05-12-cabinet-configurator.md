# Cabinet Configurator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a metafield-driven, drag-and-drop cabinet configurator page on the Shopify Dawn theme that captures customer specifications as line item properties and delivers a formatted Mozaik spec via the order notification email.

**Architecture:** A self-contained Shopify section (`cabinet-configurator.liquid`) renders a 3-panel UI: options left, live cabinet preview centre, spec + price + cart right. All configurable options are stored in Shopify product metafields (`cabinet_config` namespace) so the merchant can update them in Shopify Admin without touching code. Customer selections are saved as `_cabinet_*` line item properties when added to cart. SortableJS handles drag-and-drop.

**Tech Stack:** Shopify Liquid, vanilla JavaScript (ES2020), SortableJS 1.15.2, Shopify Cart AJAX API, Dawn theme CSS variables.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `templates/page.cabinet-configurator.json` | Create | Page template — wires the section to a Shopify page |
| `sections/cabinet-configurator.liquid` | Create | HTML structure, scoped CSS, script + config data injection |
| `assets/cabinet-configurator.js` | Create | All configurator JS: state, rendering, drag-drop, cart |
| `assets/sortable.min.js` | Create | SortableJS library (copied from CDN, no runtime dependency) |
| Shopify Admin → Notifications | Edit in Admin | Order confirmation email — Mozaik spec block |

---

## Task 1: Define Metafield Schema in Shopify Admin

**No code files.** This is done entirely in Shopify Admin. Must be completed before any code can run.

- [ ] **Step 1: Open metafield definitions**

  In your browser: Shopify Admin → Settings → Custom data → Products → Add definition (repeat for each field below)

- [ ] **Step 2: Create `available_widths`**

  - Name: `Available Widths`
  - Namespace and key: `cabinet_config.available_widths`
  - Type: JSON
  - Description: `Array of width options. Each: {"label":"18\"","value":18,"price_add":0}`

- [ ] **Step 3: Create `available_heights`**

  - Name: `Available Heights`
  - Namespace and key: `cabinet_config.available_heights`
  - Type: JSON
  - Description: `Array of height options. Each: {"label":"24\"","value":24,"price_add":0}`

- [ ] **Step 4: Create `available_depths`**

  - Name: `Available Depths`
  - Namespace and key: `cabinet_config.available_depths`
  - Type: JSON
  - Description: `Array of depth options. Each: {"label":"10\"","value":10,"price_add":0}`

- [ ] **Step 5: Create `available_finishes`**

  - Name: `Available Finishes`
  - Namespace and key: `cabinet_config.available_finishes`
  - Type: JSON
  - Description: `Array of finish options. Each: {"id":"oak","label":"Oak","image":"https://...","price_add":25}`

- [ ] **Step 6: Create `drawer_types`**

  - Name: `Drawer Types`
  - Namespace and key: `cabinet_config.drawer_types`
  - Type: JSON
  - Description: `Array of drawer types. Each: {"id":"standard","label":"Standard Drawer","height_in":3,"price":45,"image":"https://..."}`

- [ ] **Step 7: Create `base_price`**

  - Name: `Base Price`
  - Namespace and key: `cabinet_config.base_price`
  - Type: Decimal number
  - Description: `Starting price before options and drawers`

- [ ] **Step 8: Create `max_drawers`**

  - Name: `Max Drawers`
  - Namespace and key: `cabinet_config.max_drawers`
  - Type: Integer
  - Description: `Maximum number of drawers allowed in cabinet`

- [ ] **Step 9: Create a test product and populate metafields**

  Shopify Admin → Products → Add product
  - Title: `Baseball Card Cabinet`
  - Price: `0.01` (configurator controls real price via line item properties — this is a placeholder)
  - Scroll to Metafields section, fill in:

  ```json
  available_widths:
  [{"label":"18\"","value":18,"price_add":0},{"label":"24\"","value":24,"price_add":20},{"label":"30\"","value":30,"price_add":45},{"label":"36\"","value":36,"price_add":75}]

  available_heights:
  [{"label":"24\"","value":24,"price_add":0},{"label":"36\"","value":36,"price_add":30},{"label":"48\"","value":48,"price_add":65},{"label":"60\"","value":60,"price_add":100}]

  available_depths:
  [{"label":"10\"","value":10,"price_add":0},{"label":"12\"","value":12,"price_add":15},{"label":"14\"","value":14,"price_add":30}]

  available_finishes:
  [{"id":"oak","label":"Oak","image":"","price_add":0},{"id":"walnut","label":"Walnut","image":"","price_add":35},{"id":"white","label":"White","image":"","price_add":0},{"id":"black","label":"Black","image":"","price_add":0}]

  drawer_types:
  [{"id":"standard","label":"Standard Drawer","height_in":3,"price":45,"image":""},{"id":"deep","label":"Deep Drawer","height_in":6,"price":65,"image":""},{"id":"display","label":"Display Top","height_in":4,"price":55,"image":""}]

  base_price: 149.00
  max_drawers: 6
  ```

  Save the product. Note its handle (e.g. `baseball-card-cabinet`).

- [ ] **Step 10: Commit placeholder note**

  ```bash
  git commit --allow-empty -m "config: metafield schema defined in Shopify Admin (cabinet_config namespace)"
  ```

---

## Task 2: Page Template

**Files:**
- Create: `templates/page.cabinet-configurator.json`

- [ ] **Step 1: Create the template file**

  ```json
  {
    "sections": {
      "main": {
        "type": "cabinet-configurator",
        "settings": {}
      }
    },
    "order": ["main"]
  }
  ```

- [ ] **Step 2: Create the Shopify page**

  Shopify Admin → Online Store → Pages → Add page
  - Title: `Build Your Cabinet`
  - Template: `cabinet-configurator` (appears after pushing this file)

- [ ] **Step 3: Commit**

  ```bash
  git add templates/page.cabinet-configurator.json
  git commit -m "feat: add cabinet configurator page template"
  ```

---

## Task 3: Section Shell and CSS

**Files:**
- Create: `sections/cabinet-configurator.liquid`

- [ ] **Step 1: Create the section with HTML shell and scoped CSS**

  ```liquid
  {%- liquid
    assign cab_product = all_products[section.settings.product]
    assign cfg = cab_product.metafields.cabinet_config
  -%}

  <section class="cabinet-configurator" id="cabinet-configurator">

    {%- comment -%} Config data for JS {%- endcomment -%}
    <script>
      window.cabinetConfig = {
        widths:      {{ cfg.available_widths.value | default: '[]' | json }},
        heights:     {{ cfg.available_heights.value | default: '[]' | json }},
        depths:      {{ cfg.available_depths.value | default: '[]' | json }},
        finishes:    {{ cfg.available_finishes.value | default: '[]' | json }},
        drawerTypes: {{ cfg.drawer_types.value | default: '[]' | json }},
        basePrice:   {{ cfg.base_price.value | default: 0 }},
        maxDrawers:  {{ cfg.max_drawers.value | default: 6 }},
        variantId:   {{ cab_product.selected_or_first_available_variant.id | default: 0 }}
      };
    </script>

    {%- comment -%} Left panel: options {%- endcomment -%}
    <div class="cab-panel cab-panel--options" id="cab-options">
      <div class="cab-section-label">Dimensions</div>

      <div class="cab-option-group" id="cab-widths">
        <div class="cab-option-label">Width</div>
        <div class="cab-pills" data-dimension="width"></div>
      </div>

      <div class="cab-option-group" id="cab-heights">
        <div class="cab-option-label">Height</div>
        <div class="cab-pills" data-dimension="height"></div>
      </div>

      <div class="cab-option-group" id="cab-depths">
        <div class="cab-option-label">Depth</div>
        <div class="cab-pills" data-dimension="depth"></div>
      </div>

      <div class="cab-section-label cab-section-label--spaced">Finish</div>
      <div class="cab-swatches" id="cab-finishes"></div>

      <div class="cab-section-label cab-section-label--spaced">Drawer Palette</div>
      <div class="cab-palette-hint">Drag into cabinet →</div>
      <div class="cab-palette" id="cab-palette"></div>
    </div>

    {%- comment -%} Centre panel: cabinet preview {%- endcomment -%}
    <div class="cab-panel cab-panel--preview">
      <div class="cab-preview-label" id="cab-preview-label">—</div>
      <div class="cab-cabinet" id="cab-cabinet">
        <div class="cab-drop-hint" id="cab-drop-hint">Drag a drawer from the left to start</div>
      </div>
      <div class="cab-preview-hint">Drag to reorder · click × to remove</div>
    </div>

    {%- comment -%} Right panel: spec + price + cart {%- endcomment -%}
    <div class="cab-panel cab-panel--spec">
      <div class="cab-section-label">Your Specs</div>
      <dl class="cab-spec-list" id="cab-spec-list">
        <div class="cab-spec-row"><dt>Width</dt><dd id="spec-width">—</dd></div>
        <div class="cab-spec-row"><dt>Height</dt><dd id="spec-height">—</dd></div>
        <div class="cab-spec-row"><dt>Depth</dt><dd id="spec-depth">—</dd></div>
        <div class="cab-spec-row"><dt>Finish</dt><dd id="spec-finish">—</dd></div>
        <div class="cab-spec-row"><dt>Drawers</dt><dd id="spec-drawers">0</dd></div>
      </dl>

      <div class="cab-price-block">
        <div class="cab-price-label">Total</div>
        <div class="cab-price" id="cab-price">$0</div>
        <div class="cab-price-note">updates as you build</div>
      </div>

      <button class="cab-atc-btn" id="cab-atc" disabled>
        Add to Cart
      </button>
      <div class="cab-atc-error" id="cab-atc-error" hidden></div>
      <div class="cab-atc-note">Made to order · Free shipping</div>
    </div>

  </section>

  <style>
    .cabinet-configurator {
      display: grid;
      grid-template-columns: 240px 1fr 200px;
      min-height: 560px;
      border: 1px solid #2e2e2e;
      border-radius: 8px;
      overflow: hidden;
      margin: 40px auto;
      max-width: 1100px;
      font-family: var(--font-body-family, 'Inter', sans-serif);
      background: #1c1c1c;
    }

    .cab-panel {
      padding: 20px 16px;
      border-right: 1px solid #2e2e2e;
    }
    .cab-panel:last-child { border-right: none; }

    .cab-section-label {
      font-size: 0.65rem;
      letter-spacing: 0.12em;
      color: #c9a96e;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .cab-section-label--spaced { margin-top: 20px; }

    .cab-option-group { margin-bottom: 12px; }
    .cab-option-label {
      font-size: 0.7rem;
      color: #888;
      margin-bottom: 5px;
    }

    .cab-pills { display: flex; flex-wrap: wrap; gap: 5px; }
    .cab-pill {
      padding: 4px 10px;
      border-radius: 3px;
      border: 1px solid #2e2e2e;
      background: #242424;
      color: #d4cfc9;
      font-size: 0.7rem;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
    }
    .cab-pill:hover { border-color: #555; }
    .cab-pill.is-active {
      background: #c9a96e;
      border-color: #c9a96e;
      color: #1c1c1c;
      font-weight: 600;
    }

    .cab-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
    .cab-swatch {
      width: 36px;
      height: 36px;
      border-radius: 4px;
      border: 2px solid transparent;
      cursor: pointer;
      overflow: hidden;
      transition: border-color 0.15s;
    }
    .cab-swatch img { width: 100%; height: 100%; object-fit: cover; }
    .cab-swatch .cab-swatch-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.5rem;
      color: #888;
    }
    .cab-swatch:hover, .cab-swatch.is-active { border-color: #c9a96e; }

    .cab-palette-hint {
      font-size: 0.65rem;
      color: #555;
      margin-bottom: 8px;
    }
    .cab-palette { display: flex; flex-direction: column; gap: 5px; }
    .cab-palette-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      background: #242424;
      border: 1px solid #2e2e2e;
      border-radius: 3px;
      font-size: 0.7rem;
      color: #d4cfc9;
      cursor: grab;
      user-select: none;
      transition: border-color 0.15s;
    }
    .cab-palette-item:hover { border-color: #555; }
    .cab-palette-item .cab-drag-handle { color: #555; flex-shrink: 0; }
    .cab-palette-item-price { margin-left: auto; color: #c9a96e; font-size: 0.65rem; }

    /* Centre panel */
    .cab-panel--preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding-top: 24px;
      background: #1c1c1c;
    }
    .cab-preview-label {
      font-size: 0.65rem;
      color: #888;
      letter-spacing: 0.1em;
      margin-bottom: 16px;
    }
    .cab-cabinet {
      width: 130px;
      min-height: 100px;
      border: 2px solid #c9a96e;
      border-radius: 4px;
      background: #242424;
      box-shadow: 0 0 30px rgba(201, 169, 110, 0.1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .cab-drop-hint {
      padding: 20px 12px;
      text-align: center;
      font-size: 0.65rem;
      color: #555;
      line-height: 1.5;
    }
    .cab-drawer-slot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 8px;
      background: #3a2e1e;
      border-bottom: 1px solid #2e2e2e;
      font-size: 0.6rem;
      color: #d4cfc9;
      cursor: grab;
      flex-shrink: 0;
    }
    .cab-drawer-slot:last-child { border-bottom: none; }
    .cab-drawer-remove {
      background: none;
      border: none;
      color: #555;
      cursor: pointer;
      font-size: 0.75rem;
      padding: 0 0 0 4px;
      line-height: 1;
      flex-shrink: 0;
    }
    .cab-drawer-remove:hover { color: #c27474; }
    .cab-cabinet-dropzone {
      border: 1px dashed #2e2e2e;
      min-height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.55rem;
      color: #555;
      margin: 4px;
      border-radius: 2px;
    }
    .cab-cabinet.sortable-over .cab-cabinet-dropzone {
      border-color: #c9a96e;
      color: #c9a96e;
    }
    .cab-preview-hint {
      margin-top: 10px;
      font-size: 0.6rem;
      color: #555;
      text-align: center;
    }

    /* Right panel */
    .cab-panel--spec {
      display: flex;
      flex-direction: column;
    }
    .cab-spec-list {
      margin: 0 0 20px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .cab-spec-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #2e2e2e;
      font-size: 0.7rem;
    }
    .cab-spec-row dt { color: #888; }
    .cab-spec-row dd { color: #f0ede8; margin: 0; font-weight: 500; }

    .cab-price-block { margin-top: auto; padding-top: 16px; border-top: 1px solid #2e2e2e; }
    .cab-price-label { font-size: 0.6rem; color: #888; letter-spacing: 0.1em; text-transform: uppercase; }
    .cab-price { font-size: 2rem; color: #c9a96e; font-weight: 700; line-height: 1.1; margin: 4px 0 2px; }
    .cab-price-note { font-size: 0.6rem; color: #555; margin-bottom: 16px; }

    .cab-atc-btn {
      width: 100%;
      background: #c9a96e;
      color: #1c1c1c;
      border: none;
      border-radius: 3px;
      padding: 10px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .cab-atc-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .cab-atc-btn:not(:disabled):hover { opacity: 0.85; }

    .cab-atc-error {
      margin-top: 8px;
      font-size: 0.7rem;
      color: #c27474;
      text-align: center;
    }
    .cab-atc-note {
      margin-top: 8px;
      font-size: 0.6rem;
      color: #555;
      text-align: center;
    }

    /* SortableJS ghost/chosen states */
    .sortable-ghost { opacity: 0.3; }
    .sortable-chosen { cursor: grabbing; }

    /* Mobile */
    @media (max-width: 768px) {
      .cabinet-configurator {
        grid-template-columns: 1fr;
        margin: 20px 16px;
      }
      .cab-panel { border-right: none; border-bottom: 1px solid #2e2e2e; }
      .cab-panel:last-child { border-bottom: none; }
    }
  </style>

  <script src="{{ 'sortable.min.js' | asset_url }}" defer></script>
  <script src="{{ 'cabinet-configurator.js' | asset_url }}" defer></script>

  {% schema %}
  {
    "name": "Cabinet Configurator",
    "tag": "section",
    "settings": [
      {
        "type": "product",
        "id": "product",
        "label": "Cabinet product",
        "info": "Must have cabinet_config metafields populated"
      }
    ],
    "presets": [
      {
        "name": "Cabinet Configurator"
      }
    ]
  }
  {% endschema %}
  ```

- [ ] **Step 2: Preview in dev server**

  ```powershell
  shopify theme dev --store ywbx1x-1n.myshopify.com
  ```

  Open http://localhost:9292/pages/build-your-cabinet — you should see the three-panel shell with no options yet (metafields exist but JS isn't wired yet). No errors in console.

- [ ] **Step 3: Commit**

  ```bash
  git add sections/cabinet-configurator.liquid
  git commit -m "feat: add cabinet configurator section shell and CSS"
  ```

---

## Task 4: Add SortableJS

**Files:**
- Create: `assets/sortable.min.js`

- [ ] **Step 1: Download SortableJS**

  ```powershell
  Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js" -OutFile "assets/sortable.min.js"
  ```

- [ ] **Step 2: Verify the file downloaded**

  ```powershell
  (Get-Item "assets/sortable.min.js").Length
  ```

  Expected: a number greater than 10000 (file is ~40kb minified)

- [ ] **Step 3: Commit**

  ```bash
  git add assets/sortable.min.js
  git commit -m "feat: add SortableJS 1.15.2 for drag-and-drop"
  ```

---

## Task 5: Configurator JavaScript — State, Config, and Price Calculation

**Files:**
- Create: `assets/cabinet-configurator.js`

This task creates the module foundation and the price calculation function, which is the most critical piece of business logic.

- [ ] **Step 1: Create `assets/cabinet-configurator.js` with state, config, and calculatePrice**

  ```javascript
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
  ```

- [ ] **Step 2: Verify `calculatePrice` logic in browser console**

  With `shopify theme dev` running and the page open, open browser DevTools console and run:

  ```javascript
  // Force a complete state and verify price
  const t = window._cabTest;
  t.state.width  = t.cfg.widths[0].value;
  t.state.height = t.cfg.heights[0].value;
  t.state.depth  = t.cfg.depths[0].value;
  t.state.finish = t.cfg.finishes[0].id;

  const expected = t.cfg.basePrice
    + t.cfg.widths[0].price_add
    + t.cfg.heights[0].price_add
    + t.cfg.depths[0].price_add
    + t.cfg.finishes[0].price_add;

  console.assert(t.calculatePrice() === expected,
    `Expected ${expected}, got ${t.calculatePrice()}`);
  console.log('calculatePrice (no drawers):', t.calculatePrice()); // should match basePrice

  // Add a drawer and recheck
  t.state.drawers.push({ uid: 1, id: 'standard', label: 'Standard', heightIn: 3, price: t.cfg.drawerTypes[0].price });
  console.assert(t.calculatePrice() === expected + t.cfg.drawerTypes[0].price,
    'Drawer price not added correctly');
  console.log('calculatePrice (1 drawer):', t.calculatePrice());

  // Reset
  t.state.width = null; t.state.drawers = [];
  console.assert(t.calculatePrice() === 0, 'Incomplete state should return 0');
  console.log('All calculatePrice assertions passed');
  ```

  Expected: no failed assertions, final log reads "All calculatePrice assertions passed"

- [ ] **Step 3: Commit**

  ```bash
  git add assets/cabinet-configurator.js
  git commit -m "feat: add configurator JS module with state and price calculation"
  ```

---

## Task 6: Options UI — Pill Buttons and Finish Swatches

**Files:**
- Modify: `assets/cabinet-configurator.js` — implement `renderOptions()`

- [ ] **Step 1: Replace the `renderOptions` stub with the full implementation**

  Replace the line `function renderOptions() {}` with:

  ```javascript
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
  ```

- [ ] **Step 2: Verify in browser**

  Reload http://localhost:9292/pages/build-your-cabinet
  - Width/height/depth pill buttons appear
  - Clicking a pill highlights it in gold
  - Finish swatches appear (fallback colours if no images yet)
  - Clicking a swatch highlights its border in gold
  - No console errors

- [ ] **Step 3: Commit**

  ```bash
  git add assets/cabinet-configurator.js
  git commit -m "feat: add dimension pill buttons and finish swatches"
  ```

---

## Task 7: Drawer Palette and Drag-and-Drop Cabinet Preview

**Files:**
- Modify: `assets/cabinet-configurator.js` — implement `renderPalette()` and `renderPreview()`

- [ ] **Step 1: Replace `renderPalette` stub**

  Replace `function renderPalette() {}` with:

  ```javascript
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
  ```

- [ ] **Step 2: Replace `renderPreview` stub**

  Replace `function renderPreview() {}` with:

  ```javascript
  function renderPreview() {
    const cabinet   = document.getElementById('cab-cabinet');
    const dropHint  = document.getElementById('cab-drop-hint');
    const label     = document.getElementById('cab-preview-label');

    // Update dimension label
    const wLabel = cfg.widths.find(o => o.value === state.width)?.label || '—';
    const hLabel = cfg.heights.find(o => o.value === state.height)?.label || '—';
    const dLabel = cfg.depths.find(o => o.value === state.depth)?.label || '—';
    label.textContent = (state.width && state.height && state.depth)
      ? `${wLabel} × ${hLabel} × ${dLabel}`
      : '—';

    // Show/hide drop hint
    if (dropHint) dropHint.style.display = state.drawers.length ? 'none' : 'block';

    // Remove existing drawer slots (not the drop hint)
    cabinet.querySelectorAll('.cab-drawer-slot').forEach(el => el.remove());
    const existingDropzone = cabinet.querySelector('.cab-cabinet-dropzone');
    if (existingDropzone) existingDropzone.remove();

    // Total height units for proportional sizing
    const totalUnits = state.drawers.reduce((s, d) => s + d.heightIn, 0) || 1;

    // Render each drawer slot
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

    // Drop zone at bottom
    if (state.drawers.length < cfg.maxDrawers) {
      const dz = document.createElement('div');
      dz.className = 'cab-cabinet-dropzone';
      dz.textContent = '+ drag here';
      cabinet.appendChild(dz);
    }

    // Init or re-init Sortable on cabinet (reorder existing drawers)
    if (cabinet._sortable) cabinet._sortable.destroy();
    cabinet._sortable = Sortable.create(cabinet, {
      group: { name: 'drawers', pull: false, put: true },
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      filter: '.cab-cabinet-dropzone, .cab-drop-hint, .cab-drawer-remove',
      onAdd(evt) {
        // A new drawer dragged from palette — always appends to end
        const typeId = evt.item.dataset.typeId;
        const type   = cfg.drawerTypes.find(t => t.id === typeId);
        evt.item.remove(); // remove clone — we manage DOM ourselves
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
        // Reorder within cabinet
        if (evt.from === cabinet && evt.to === cabinet && evt.oldIndex !== evt.newIndex) {
          const moved = state.drawers.splice(evt.oldIndex, 1)[0];
          state.drawers.splice(evt.newIndex, 0, moved);
          renderPreview();
        }
      },
    });
  }
  ```

- [ ] **Step 3: Verify in browser**

  Reload the page:
  - Drawer palette items appear in left panel with drag handles
  - Drag a drawer from palette → it drops into the cabinet centre panel
  - Cabinet shows the drawer slot; drop hint disappears
  - Drag a second drawer in → both slots appear, proportionally sized
  - Drag drawers within the cabinet to reorder → order updates
  - Click × on a drawer → it removes from cabinet and state
  - Adding 7 drawers when max is 6 → error shown, drawer rejected
  - No console errors

- [ ] **Step 4: Commit**

  ```bash
  git add assets/cabinet-configurator.js
  git commit -m "feat: add drawer palette and drag-and-drop cabinet preview"
  ```

---

## Task 8: Live Spec Panel and Price Counter

**Files:**
- Modify: `assets/cabinet-configurator.js` — implement `updateSpecPanel()`

- [ ] **Step 1: Replace `updateSpecPanel` stub**

  Replace `function updateSpecPanel() {}` with:

  ```javascript
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
    btn.textContent = isReady ? `Add to Cart — $${price.toLocaleString('en-US', { minimumFractionDigits: 0 })}` : 'Add to Cart';

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
  ```

- [ ] **Step 2: Verify in browser**

  - Select width, height, depth, finish → spec panel updates for each
  - Add drawers → drawer count updates, price counter ticks up
  - Add to Cart button stays disabled until ALL selections made + at least one drawer
  - Button label shows "Add to Cart — $349" with the live price
  - Remove a drawer → price decrements

- [ ] **Step 3: Commit**

  ```bash
  git add assets/cabinet-configurator.js
  git commit -m "feat: add live spec panel and price counter"
  ```

---

## Task 9: Add to Cart with Line Item Properties

**Files:**
- Modify: `assets/cabinet-configurator.js` — implement Add to Cart handler

- [ ] **Step 1: Add the `addToCart` function and wire it to the button**

  Add this function inside the IIFE (after `updateSpecPanel`):

  ```javascript
  function addToCart() {
    if (!cfg.variantId) return;

    const btn = document.getElementById('cab-atc');
    btn.disabled = true;
    btn.textContent = 'Adding…';
    clearAtcError();

    const properties = {
      '_cabinet_width':         state.width,
      '_cabinet_height':        state.height,
      '_cabinet_depth':         state.depth,
      '_cabinet_finish':        state.finish,
      '_cabinet_finish_label':  cfg.finishes.find(f => f.id === state.finish)?.label || state.finish,
      '_cabinet_drawer_count':  state.drawers.length,
      '_cabinet_drawers':       JSON.stringify(
        state.drawers.map((d, i) => ({ pos: i + 1, type: d.id, h: d.heightIn }))
      ),
      '_cabinet_price':         calculatePrice().toFixed(2),
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
  ```

  Then inside `init()`, add after `updateSpecPanel()`:

  ```javascript
  document.getElementById('cab-atc').addEventListener('click', addToCart);
  ```

- [ ] **Step 2: Verify the full Add to Cart flow**

  1. Select all options and add at least one drawer
  2. Click Add to Cart → button shows "Adding…" and disables
  3. Page redirects to `/cart`
  4. In cart: product "Baseball Card Cabinet" appears with line item properties visible
  5. In Shopify Admin → Orders → (place a test order) → all `_cabinet_*` fields visible in order detail

- [ ] **Step 3: Commit**

  ```bash
  git add assets/cabinet-configurator.js
  git commit -m "feat: add to cart with cabinet spec line item properties"
  ```

---

## Task 10: Order Notification Email — Mozaik Spec Block

**No code files.** Edited entirely in Shopify Admin.

- [ ] **Step 1: Open the order confirmation email template**

  Shopify Admin → Settings → Notifications → Order confirmation → Edit code

- [ ] **Step 2: Find the line items loop**

  Search for `{% for line in subtotal_line_items %}` or `{% for line in line_items %}`. Directly below the existing line item name/price output, add:

  ```liquid
  {% assign is_cabinet = false %}
  {% for p in line.properties %}
    {% if p.first == '_cabinet_width' %}{% assign is_cabinet = true %}{% endif %}
  {% endfor %}

  {% if is_cabinet %}
  <table style="width:100%;margin:8px 0 16px;border-collapse:collapse;font-size:13px;font-family:sans-serif">
    <tr><td colspan="2" style="padding:6px 8px;background:#f5f0e8;color:#5a4020;font-weight:bold;letter-spacing:0.05em;font-size:11px;text-transform:uppercase">Cabinet Specification</td></tr>
    {% for p in line.properties %}
      {% unless p.first == '_cabinet_drawers' or p.first == '_cabinet_price' %}
        {% unless p.first contains '_cabinet_finish' and p.first != '_cabinet_finish_label' %}
          <tr style="border-bottom:1px solid #e8e0d0">
            <td style="padding:5px 8px;color:#888;width:40%">
              {{ p.first | remove: '_cabinet_' | replace: '_', ' ' | capitalize }}
            </td>
            <td style="padding:5px 8px;color:#333;font-weight:500">{{ p.last }}</td>
          </tr>
        {% endunless %}
      {% endunless %}
    {% endfor %}
    {% for p in line.properties %}
      {% if p.first == '_cabinet_drawers' %}
        {% assign drawers_raw = p.last %}
      {% endif %}
    {% endfor %}
    {% if drawers_raw %}
    <tr><td colspan="2" style="padding:5px 8px;color:#888;font-style:italic;font-size:12px">Drawer layout: {{ drawers_raw }}</td></tr>
    {% endif %}
  </table>
  {% endif %}
  ```

- [ ] **Step 3: Send a test order notification**

  Shopify Admin → Settings → Notifications → Order confirmation → Send test email
  - Verify: cabinet spec table appears in the email
  - Verify: dimensions, finish, drawer count, and drawer layout JSON are all visible

- [ ] **Step 4: Note this change (not in git — it lives in Shopify Admin)**

  ```bash
  git commit --allow-empty -m "config: order notification email updated with Mozaik spec block (in Shopify Admin)"
  ```

---

## Task 11: End-to-End Verification

**No new code.** Run through the full verification checklist from the design spec.

- [ ] **Step 1: Verify metafields drive the UI**

  In Shopify Admin, add a 5th width option to `available_widths` (e.g. `{"label":"42\"","value":42,"price_add":110}`). Save. Reload the configurator page — the new width pill appears without any code change.

- [ ] **Step 2: Full happy-path walkthrough**

  1. Select width → spec panel updates
  2. Select height → price remains $0 (incomplete)
  3. Select depth → price remains $0
  4. Select finish → price remains $0 (no drawers yet)
  5. Drag one drawer → price jumps to `base_price + finish_price_add + drawer_price`
  6. Drag a second drawer → price increases correctly
  7. Reorder drawers by dragging → order reflects in spec panel drawer count
  8. Remove a drawer with × → price decrements, count updates
  9. Click Add to Cart → redirects to `/cart`
  10. Check cart: line item shows cabinet with properties

- [ ] **Step 3: Verify the order**

  Complete a test checkout (use Shopify's Bogus Gateway in test mode).
  In Shopify Admin → Orders → the test order → scroll to line item details.
  Confirm all `_cabinet_*` properties are present.

- [ ] **Step 4: Verify order email**

  Check the order confirmation email inbox. Cabinet spec table must be present and readable.

- [ ] **Step 5: Mobile check**

  Resize browser to 375px width. Panels stack vertically. Options usable. Dragging works (touch events). Add to Cart works.

- [ ] **Step 6: Final commit and push**

  ```bash
  git add .
  git status
  git commit -m "feat: cabinet configurator Phase 1 complete"
  git push origin main
  ```

---

## Phase 2 Trigger Conditions

Do not start Phase 2 until:
- [ ] Client confirms Mozaik's import format (CSV or XML) and field names
- [ ] Client confirms whether Mozaik accepts file imports via email attachment, FTP, or API
- [ ] Order volume justifies automation (manual email entry is acceptable for early orders)

Phase 2 work: serverless function (Vercel/Netlify) that receives the Shopify order webhook, reads `_cabinet_*` line item properties, generates a Mozaik-compatible file using the client-confirmed format, and emails or FTPs it to the cabinet shop.
