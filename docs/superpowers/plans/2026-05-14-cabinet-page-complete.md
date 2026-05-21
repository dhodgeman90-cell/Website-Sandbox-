# Build Your Cabinet — Complete Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing cabinet configurator into a complete customer-facing product page — photorealistic 3D renderer (PBR materials, wood grain, 3/4 camera, OrbitControls), full page structure (hero, how-it-works, callouts), and real checkout pricing via Shopify variants.

**Architecture:** All HTML/CSS lives in `sections/cabinet-configurator.liquid` (extended). All Three.js logic lives in `assets/cabinet-configurator.js` (upgraded in-place). One new asset file is added for OrbitControls. Pricing shifts from a single $0.01 placeholder variant to a full Shopify variant matrix looked up by width + depth + finish at runtime.

**Tech Stack:** Shopify Online Store 2.0 (Dawn), Three.js r128, Three.js OrbitControls r128, Canvas 2D API (procedural wood grain texture)

**Design spec:** `docs/superpowers/specs/2026-05-14-cabinet-page-complete-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `assets/three-orbit-controls.min.js` | Create (download) | OrbitControls from Three.js r128 |
| `assets/cabinet-configurator.js` | Modify | Three.js scene, materials, camera, handles, pricing logic |
| `sections/cabinet-configurator.liquid` | Modify | Page HTML structure, CSS, Liquid config injection, script tags |

---

### Task 1: Download OrbitControls and add to project

**Files:**
- Create: `assets/three-orbit-controls.min.js`
- Modify: `sections/cabinet-configurator.liquid` (script tag only)

- [ ] **Step 1: Download OrbitControls for Three.js r128**

Run in PowerShell from the project root (`c:\VS Code\Website Fuckery`):
```powershell
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js" -OutFile "assets/three-orbit-controls.min.js"
```
Expected: file `assets/three-orbit-controls.min.js` created, roughly 20–25 KB.

- [ ] **Step 2: Add OrbitControls script tag to the Liquid file**

Open `sections/cabinet-configurator.liquid`. Find lines 238–239:
```liquid
<script src="{{ 'three.min.js' | asset_url }}" defer></script>
<script src="{{ 'cabinet-configurator.js' | asset_url }}" defer></script>
```
Replace with:
```liquid
<script src="{{ 'three.min.js' | asset_url }}" defer></script>
<script src="{{ 'three-orbit-controls.min.js' | asset_url }}" defer></script>
<script src="{{ 'cabinet-configurator.js' | asset_url }}" defer></script>
```
Order is critical: Three → OrbitControls → app logic.

- [ ] **Step 3: Commit**
```powershell
git add assets/three-orbit-controls.min.js sections/cabinet-configurator.liquid
git commit -m "feat: add Three.js OrbitControls r128 asset"
```

---

### Task 2: Upgrade materials to PBR and improve lighting

**Files:**
- Modify: `assets/cabinet-configurator.js` (lines 99–106 materials, lines 40–49 lighting)

- [ ] **Step 1: Add `controls` to the module-level declarations**

At the top of `assets/cabinet-configurator.js`, find line 22:
```javascript
  let widthSelect, depthSelect, colorSelect, atcBtn, priceEl, atcErrorEl;
```
Find line 22–23 (Three.js refs):
```javascript
  let scene, camera, renderer, cabinetGroup;
```
Replace with:
```javascript
  let scene, camera, renderer, cabinetGroup, controls;
```

- [ ] **Step 2: Replace lighting in `initScene()`**

In `initScene()`, find lines 41–49:
```javascript
    // Warm directional light — casts shadows, positioned upper-front-right
    const dirLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    dirLight.position.set(30, 50, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width  = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Soft ambient fill
    scene.add(new THREE.AmbientLight(0x606060, 0.8));
```
Replace with:
```javascript
    // Key light — warm, upper front-right, casts soft shadows
    const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.1);
    keyLight.position.set(30, 50, 40);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width  = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Fill light — cooler, upper front-left, no shadows (lifts shadow side)
    const fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.4);
    fillLight.position.set(-30, 40, 30);
    scene.add(fillLight);

    // Ambient base fill
    scene.add(new THREE.AmbientLight(0x505060, 0.6));
```

- [ ] **Step 3: Replace materials in `buildCabinet()` with MeshStandardMaterial**

In `buildCabinet()`, find lines 99–106:
```javascript
    // Materials
    const baseColor  = new THREE.Color(colorHex);
    const bodyColor  = baseColor.clone().multiplyScalar(0.70);

    const bodyMat = new THREE.MeshPhongMaterial({ color: bodyColor, shininess: 30 });
    const faceMat = new THREE.MeshPhongMaterial({ color: baseColor, shininess: 70 });
    const pullMat = new THREE.MeshPhongMaterial({ color: 0xc9a96e,  shininess: 120 });
```
Replace with:
```javascript
    // Materials — PBR (MeshStandardMaterial)
    const baseColor = new THREE.Color(colorHex);
    const bodyColor = baseColor.clone().multiplyScalar(0.65);

    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.55, metalness: 0.0 });
    const faceMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.25, metalness: 0.0 });
    const pullMat = new THREE.MeshStandardMaterial({ color: 0xc9a96e, roughness: 0.35, metalness: 0.6 });
```

- [ ] **Step 4: Verify in browser**

Run `shopify theme dev --store ywbx1x-1n.myshopify.com` and open the Build Your Cabinet page. Select width, depth, and a non-maple color. The cabinet should look noticeably more polished — painted finishes should appear smooth and slightly shiny rather than flat. The handles will still be box-shaped (fixed in Task 5).

- [ ] **Step 5: Commit**
```powershell
git add assets/cabinet-configurator.js
git commit -m "feat: upgrade cabinet renderer to PBR materials and two-point lighting"
```

---

### Task 3: Add maple wood grain procedural texture

**Files:**
- Modify: `assets/cabinet-configurator.js` (new function + conditional texture application)

- [ ] **Step 1: Add the `buildMapleTexture()` function**

In `assets/cabinet-configurator.js`, add this new function immediately before `buildCabinet()` (before line 82):
```javascript
  // ─── Maple wood grain texture (Canvas-generated, no external image needed) ─
  function buildMapleTexture() {
    var c = document.createElement('canvas');
    c.width  = 256;
    c.height = 512;
    var ctx = c.getContext('2d');

    // Base maple tone
    ctx.fillStyle = '#c8a050';
    ctx.fillRect(0, 0, 256, 512);

    // Randomised grain streaks — vertical, varying width and opacity
    for (var i = 0; i < 100; i++) {
      var x      = Math.random() * 256;
      var segY   = Math.random() * 512;
      var segH   = 60 + Math.random() * 320;
      var w      = 0.5 + Math.random() * 2.5;
      var isLight = Math.random() < 0.38;
      var opacity = 0.04 + Math.random() * 0.10;
      ctx.fillStyle = isLight
        ? 'rgba(255,210,130,' + opacity + ')'
        : 'rgba(50,25,0,'     + opacity + ')';
      ctx.fillRect(x, segY, w, segH);
    }

    return new THREE.CanvasTexture(c);
  }

```

- [ ] **Step 2: Apply texture conditionally in `buildCabinet()`**

In `buildCabinet()`, after the materials block (after the `pullMat` line), add:
```javascript
    // Apply wood grain texture for maple finish
    if (state.colorId && state.colorId.toLowerCase() === 'maple') {
      var mapleMap = buildMapleTexture();
      bodyMat.map = mapleMap;
      faceMat.map = mapleMap;
      bodyMat.needsUpdate = true;
      faceMat.needsUpdate = true;
    }
```

- [ ] **Step 3: Verify in browser**

Select Natural Maple from the color dropdown. The cabinet should show visible vertical wood grain streaks. Switch to Black or White — no grain texture, smooth solid color.

- [ ] **Step 4: Commit**
```powershell
git add assets/cabinet-configurator.js
git commit -m "feat: procedural maple wood grain texture via Canvas 2D"
```

---

### Task 4: Reposition camera to 3/4 view

**Files:**
- Modify: `assets/cabinet-configurator.js` (camera in `initScene` and `buildCabinet`)

- [ ] **Step 1: Update initial camera position in `initScene()`**

In `initScene()`, find lines 36–38:
```javascript
    const w = canvas.clientWidth  || 480;
    const h = canvas.clientHeight || 560;
    camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 2000);
    camera.position.set(20, 28, 50);
    camera.lookAt(0, 17, 0);
```
Replace with:
```javascript
    const w = canvas.clientWidth  || 480;
    const h = canvas.clientHeight || 560;
    camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 2000);
    camera.position.set(40, 32, 55);
    camera.lookAt(0, 17, 0);
```

- [ ] **Step 2: Update camera repositioning at end of `buildCabinet()`**

Find lines 143–145 (end of `buildCabinet()`):
```javascript
    // Reposition camera so the cabinet fills the canvas at this size
    camera.position.set(W * 0.78, H * 0.88, D * 2.9);
    camera.lookAt(0, H / 2, 0);
```
Replace with:
```javascript
    // 3/4 product-photography angle — shows front face, right side, and top
    camera.position.set(W * 1.3, H * 0.8, D * 2.8);
    if (controls) {
      controls.target.set(0, H * 0.45, 0);
      controls.update();
    } else {
      camera.lookAt(0, H * 0.45, 0);
    }
```

- [ ] **Step 3: Verify in browser**

Reload the page. The cabinet should now appear at a clear 3/4 angle — you can see the front face, the right side panel, and the top surface simultaneously. Changing width or depth should rebuild the cabinet and reset to this angle.

- [ ] **Step 4: Commit**
```powershell
git add assets/cabinet-configurator.js
git commit -m "feat: 3/4 product-photography camera angle for cabinet 3D view"
```

---

### Task 5: Replace box handles with cylindrical bar handles

**Files:**
- Modify: `assets/cabinet-configurator.js` (drawer loop inside `buildCabinet()`)

- [ ] **Step 1: Replace the handle geometry in the drawer loop**

In `buildCabinet()`, find lines 130–138 (the drawer loop):
```javascript
    for (let i = 0; i < DRAWERS; i++) {
      const y = toeH + i * (DRAWER_H + GAP) + DRAWER_H / 2;

      // Drawer face — sits flush with cabinet front
      box(W - 2*T - 0.125, DRAWER_H - 0.125, faceDepth, 0, y, faceZ, faceMat);

      // Pull handle — centred on drawer, protrudes forward
      box(W * 0.15, 0.45, 0.45, 0, y, faceZ + faceDepth / 2 + 0.35, pullMat);
    }
```
Replace with:
```javascript
    for (let i = 0; i < DRAWERS; i++) {
      const y = toeH + i * (DRAWER_H + GAP) + DRAWER_H / 2;

      // Drawer face — sits flush with cabinet front
      box(W - 2*T - 0.125, DRAWER_H - 0.125, faceDepth, 0, y, faceZ, faceMat);

      // Bar handle — horizontal cylinder, gold, protrudes forward
      const handleLen = W * 0.22;
      const handleMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, handleLen, 12),
        pullMat
      );
      handleMesh.rotation.z  = Math.PI / 2;
      handleMesh.position.set(0, y, faceZ + faceDepth / 2 + 0.55);
      handleMesh.castShadow    = true;
      handleMesh.receiveShadow = true;
      cabinetGroup.add(handleMesh);
    }
```

- [ ] **Step 2: Verify in browser**

The four drawer handles should now be horizontal cylindrical bars rather than flat boxes. They should catch the key light and show a specular highlight, reading clearly as metal.

- [ ] **Step 3: Commit**
```powershell
git add assets/cabinet-configurator.js
git commit -m "feat: cylindrical gold bar handles on cabinet drawers"
```

---

### Task 6: Wire up OrbitControls

**Files:**
- Modify: `assets/cabinet-configurator.js` (`initScene()` and render loop)

- [ ] **Step 1: Initialise OrbitControls inside `initScene()`**

At the end of `initScene()`, directly before the `// Resize handler` comment (around line 61), add:
```javascript
    // OrbitControls — lets customer drag to rotate cabinet
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping  = true;
    controls.dampingFactor  = 0.08;
    controls.enablePan      = false;
    controls.minDistance    = 25;
    controls.maxDistance    = 180;

```

- [ ] **Step 2: Call `controls.update()` in the render loop**

Find the render loop (lines 73–76):
```javascript
    // Render loop
    (function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }());
```
Replace with:
```javascript
    // Render loop
    (function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }());
```

- [ ] **Step 3: Add a "drag to rotate" hint label to the Liquid HTML**

In `sections/cabinet-configurator.liquid`, find the centre panel block (around line 49–52):
```liquid
  {%- comment -%} Centre panel: Three.js 3D preview {%- endcomment -%}
  <div class="cab-panel cab-panel--preview">
    <canvas id="cc-canvas"></canvas>
  </div>
```
Replace with:
```liquid
  {%- comment -%} Centre panel: Three.js 3D preview {%- endcomment -%}
  <div class="cab-panel cab-panel--preview">
    <canvas id="cc-canvas"></canvas>
    <div class="cab-rotate-hint">&#8635; Drag to rotate</div>
  </div>
```

Then in the `<style>` block, add before the `/* ── Responsive */` comment:
```css
  .cab-rotate-hint {
    position: absolute;
    bottom: 10px;
    right: 12px;
    font-size: 0.55rem;
    color: #444;
    letter-spacing: 0.06em;
    pointer-events: none;
  }
```

- [ ] **Step 4: Verify in browser**

Click and drag on the 3D canvas. The cabinet should rotate smoothly. Releasing should have gentle damped inertia (the cabinet keeps spinning briefly then slows). Changing a dropdown should reset to the 3/4 default angle.

- [ ] **Step 5: Commit**
```powershell
git add assets/cabinet-configurator.js sections/cabinet-configurator.liquid
git commit -m "feat: OrbitControls drag-to-rotate on 3D cabinet canvas"
```

---

### Task 7: Set up Shopify product variants (admin — no code changes)

This is a one-time manual setup in Shopify Admin. The code in Task 8 depends on these variants existing.

- [ ] **Step 1: Open the cabinet product in Shopify Admin**

Go to: Shopify Admin → Products → find "Baseball Card Cabinet" → click Edit.

- [ ] **Step 2: Set up the three product options**

Under the Variants section, click "Edit options". Add or rename options to exactly these three:

| Option name | Values (one per line) |
|-------------|----------------------|
| `Width` | One entry per width you sell, using the numeric inch value (e.g. `18`, `24`, `30`, `36`). These must exactly match the `value` field in the `available_widths` metafield. |
| `Depth` | One entry per depth you sell (e.g. `14`, `18`, `22`). Must match `available_depths` metafield `value` fields. |
| `Finish` | Exactly four values: `maple`, `black`, `white`, `sage` — lowercase, matching the `id` field in `available_colors` metafield. |

- [ ] **Step 3: Set correct prices on each variant**

Shopify generates all combinations automatically. Go through each variant and set its price in the Shopify admin Variants table. The price for each variant should equal: base price + width add-on + depth add-on + finish add-on (from your metafield config). For example, if base = $299, 24" adds $0, 18" depth adds $0, maple adds $50 → that variant = $349.

**Variant limit:** Shopify allows 100 variants max. With 4 finishes, you can have at most 25 width × depth combinations (e.g. 5 widths × 5 depths = 25 × 4 = 100). Plan accordingly.

- [ ] **Step 4: Save the product**

Click Save. Shopify will generate all variant combinations.

---

### Task 8: Switch to variant-based pricing

**Files:**
- Modify: `sections/cabinet-configurator.liquid` (config injection block)
- Modify: `assets/cabinet-configurator.js` (findVariant, calculatePrice, addToCart, onSelectChange)

- [ ] **Step 1: Update the fallback config in `cabinet-configurator.js`**

At the top of `assets/cabinet-configurator.js`, find lines 5–7:
```javascript
  const cfg = window.cabinetConfig || {
    widths: [], depths: [], colors: [], basePrice: 0, variantId: 0,
  };
```
Replace with:
```javascript
  const cfg = window.cabinetConfig || {
    widths: [], depths: [], colors: [], variants: [],
  };
```

- [ ] **Step 2: Update the Liquid config injection**

In `sections/cabinet-configurator.liquid`, find lines 9–21 (the `<script>` block):
```liquid
  <script>
    window.cabinetConfig = {
      widths:    {{ cfg.available_widths.value  | default: '[]' | json }},
      depths:    {{ cfg.available_depths.value  | default: '[]' | json }},
      colors:    {{ cfg.available_colors.value  | default: '[]' | json }},
      basePrice: {{ cfg.base_price.value        | default: 0 }},
      variantId: {{ cab_product.selected_or_first_available_variant.id | default: 0 }}
    };
    // DEBUG — remove after confirming product link works
    console.log('section product setting:', {{ section.settings.product | json }});
    console.log('product found:', {{ cab_product.title | default: 'nil' | json }});
    console.log('variantId:', {{ cab_product.selected_or_first_available_variant.id | default: 0 }});
  </script>
```
Replace with:
```liquid
  <script>
    window.cabinetConfig = {
      widths:   {{ cfg.available_widths.value | default: '[]' | json }},
      depths:   {{ cfg.available_depths.value | default: '[]' | json }},
      colors:   {{ cfg.available_colors.value | default: '[]' | json }},
      variants: {{ cab_product.variants | json }}
    };
  </script>
```

- [ ] **Step 3: Add `findVariant()` to `cabinet-configurator.js`**

In `assets/cabinet-configurator.js`, replace the `calculatePrice()` function (lines 173–182) with:
```javascript
  // ─── Find the Shopify variant matching current selections ─────────────────
  // Shopify option1/option2 are strings; state.width/depth are numbers — use ==
  function findVariant() {
    if (!state.width || !state.depth || !state.colorId) return null;
    return (cfg.variants || []).find(function (v) {
      return String(v.option1) == String(state.width)  &&
             String(v.option2) == String(state.depth)  &&
             v.option3.toLowerCase() === state.colorId.toLowerCase();
    }) || null;
  }

  // ─── Price from variant (Shopify stores cents as integers) ────────────────
  function calculatePrice() {
    var v = findVariant();
    return v ? v.price / 100 : null;
  }
```

- [ ] **Step 4: Update `addToCart()` to use the variant ID**

Find `addToCart()` (around line 221). Replace the function body entirely:
```javascript
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
```

- [ ] **Step 5: Update `onSelectChange()` to use `findVariant()` for button state**

In `onSelectChange()`, find the last line:
```javascript
    atcBtn.disabled = !(state.width && state.depth && state.colorId);
```
Replace with:
```javascript
    atcBtn.disabled = !findVariant();
```

- [ ] **Step 6: Update `init()` — remove the variantId check**

In `init()`, find lines 264–267:
```javascript
    if (!cfg.variantId) {
      section.innerHTML = '<p style="padding:40px;color:#888;text-align:center">No cabinet product assigned to this section.</p>';
      return;
    }
```
Replace with:
```javascript
    if (!cfg.variants || cfg.variants.length === 0) {
      section.innerHTML = '<p style="padding:40px;color:#888;text-align:center">No cabinet product assigned to this section, or product has no variants.</p>';
      return;
    }
```

- [ ] **Step 7: Verify pricing in browser**

Open the page. Select a width, depth, and finish combination that matches a variant you set up in Task 7. The price displayed should match what you set in Shopify admin (not the metafield calculation). Select a combination with no matching variant — the Add to Cart button should stay disabled.

Open browser DevTools → Network tab → click Add to Cart. The request payload should show the correct variant `id` (not 0 or 1). Check Shopify Admin → Orders after test purchase — total should match the variant price.

- [ ] **Step 8: Commit**
```powershell
git add sections/cabinet-configurator.liquid assets/cabinet-configurator.js
git commit -m "feat: variant-based pricing — real checkout price from Shopify variants"
```

---

### Task 9: Add hero section

**Files:**
- Modify: `sections/cabinet-configurator.liquid` (HTML + CSS)

- [ ] **Step 1: Add hero HTML at the top of the section**

In `sections/cabinet-configurator.liquid`, the file currently starts with the `{%- liquid ... -%}` block, then the `<script>` block, then the `<section class="cabinet-configurator">` element.

Add the hero HTML between the `</script>` closing tag and the `<section class="cabinet-configurator"` line. Also add a scroll-anchor `<div>` immediately before the section — this keeps the existing `id="cabinet-configurator"` intact on the section element (the JS in `init()` looks it up by that id):
```liquid
  {%- comment -%} Hero ─────────────────────────────────────────────────────── {%- endcomment -%}
  <div class="cab-hero">
    <div class="cab-hero__eyebrow">Made to Order &middot; CNC Precision</div>
    <h1 class="cab-hero__headline">Build Your Baseball Card Cabinet</h1>
    <p class="cab-hero__sub">Choose your width, depth, and finish. We cut it to spec in our CNC shop and ship it to your door.</p>
    <a href="#cc-configurator" class="cab-hero__cta">Start Configuring &#8595;</a>
  </div>

  {%- comment -%} Scroll anchor for hero CTA — separate from section id used by JS {%- endcomment -%}
  <div id="cc-configurator" style="scroll-margin-top:20px;"></div>
```

**Do not change** the `id="cabinet-configurator"` on the `<section>` tag — that id is used by `init()` in `cabinet-configurator.js`.

- [ ] **Step 2: Add hero CSS**

In the `<style>` block, add these rules before the `/* ── Responsive */` comment:
```css
  /* ── Hero ───────────────────────────────────────────────────────────────── */
  .cab-hero {
    text-align: center;
    padding: 64px 24px 48px;
    max-width: 640px;
    margin: 0 auto;
  }
  .cab-hero__eyebrow {
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #c9a96e;
    margin-bottom: 14px;
  }
  .cab-hero__headline {
    font-size: clamp(1.6rem, 4vw, 2.6rem);
    font-weight: 700;
    color: #f0ede8;
    line-height: 1.15;
    margin: 0 0 14px;
  }
  .cab-hero__sub {
    font-size: 0.85rem;
    color: #888;
    line-height: 1.7;
    margin: 0 0 28px;
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
  }
  .cab-hero__cta {
    display: inline-block;
    background: #c9a96e;
    color: #1c1c1c;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-decoration: none;
    padding: 12px 28px;
    border-radius: 3px;
    transition: opacity 0.15s;
  }
  .cab-hero__cta:hover { opacity: 0.85; }
```

- [ ] **Step 3: Add smooth-scroll behaviour**

Add a small inline script directly after the OrbitControls `<script>` tag (at the bottom of the file, before the `{% schema %}` block):
```liquid
  <script>
    document.addEventListener('DOMContentLoaded', function () {
      var cta = document.querySelector('.cab-hero__cta');
      if (cta) {
        cta.addEventListener('click', function (e) {
          e.preventDefault();
          var target = document.getElementById('cc-configurator');
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
      }
    });
  </script>
```

- [ ] **Step 4: Verify in browser**

The hero should appear above the 3-panel configurator: eyebrow label in gold, large headline, sub-copy in grey, gold CTA button. Clicking the CTA should smoothly scroll down to the configurator widget.

- [ ] **Step 5: Commit**
```powershell
git add sections/cabinet-configurator.liquid
git commit -m "feat: add hero section to Build Your Cabinet page"
```

---

### Task 10: Add "How it works" section

**Files:**
- Modify: `sections/cabinet-configurator.liquid` (HTML + CSS)

- [ ] **Step 1: Add "How it works" HTML between hero and configurator**

After the hero `</div>` and before the `<section class="cabinet-configurator"` opening tag, add:
```liquid
  {%- comment -%} How it works ─────────────────────────────────────────────── {%- endcomment -%}
  <div class="cab-steps">
    <div class="cab-section-label cab-steps__label">How it works</div>
    <div class="cab-steps__grid">

      <div class="cab-step">
        <div class="cab-step__num">1</div>
        <div class="cab-step__title">Configure</div>
        <div class="cab-step__desc">Pick your size and finish. See it in 3D as you go.</div>
      </div>

      <div class="cab-step">
        <div class="cab-step__num">2</div>
        <div class="cab-step__title">Order</div>
        <div class="cab-step__desc">Add to cart. Your exact specs are locked in at checkout.</div>
      </div>

      <div class="cab-step">
        <div class="cab-step__num">3</div>
        <div class="cab-step__title">Delivered</div>
        <div class="cab-step__desc">CNC-cut in our shop and shipped flat-packed with hardware.</div>
      </div>

    </div>
  </div>
```

- [ ] **Step 2: Add "How it works" CSS**

In the `<style>` block, add after the hero CSS rules:
```css
  /* ── How it works ───────────────────────────────────────────────────────── */
  .cab-steps {
    padding: 0 24px 48px;
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
  }
  .cab-steps__label {
    margin-bottom: 28px;
  }
  .cab-steps__grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 24px;
  }
  .cab-step__num {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid #c9a96e;
    background: #242424;
    color: #c9a96e;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
  }
  .cab-step__title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #f0ede8;
    margin-bottom: 6px;
  }
  .cab-step__desc {
    font-size: 0.65rem;
    color: #888;
    line-height: 1.6;
  }
```

- [ ] **Step 3: Verify in browser**

Three numbered steps should appear between the hero and the configurator widget: gold numbered circles, bold titles, grey descriptor text, evenly spaced in a row.

- [ ] **Step 4: Commit**
```powershell
git add sections/cabinet-configurator.liquid
git commit -m "feat: add how it works steps section to cabinet page"
```

---

### Task 11: Add feature callouts section

**Files:**
- Modify: `sections/cabinet-configurator.liquid` (HTML + CSS)

- [ ] **Step 1: Add callouts HTML below the configurator section**

After the closing `</section>` tag of the `cabinet-configurator` section (and before the `<style>` block), add:
```liquid
  {%- comment -%} Feature callouts ────────────────────────────────────────── {%- endcomment -%}
  <div class="cab-callouts">
    <div class="cab-callout">
      <div class="cab-callout__icon">&#10022;</div>
      <div class="cab-callout__title">Made to Order</div>
      <div class="cab-callout__desc">Every cabinet is cut to your exact dimensions in our CNC shop.</div>
    </div>
    <div class="cab-callout">
      <div class="cab-callout__icon">&#10022;</div>
      <div class="cab-callout__title">Free Shipping</div>
      <div class="cab-callout__desc">Flat-packed and shipped to your door at no extra cost.</div>
    </div>
    <div class="cab-callout">
      <div class="cab-callout__icon">&#10022;</div>
      <div class="cab-callout__title">Ships in 5&ndash;7 Days</div>
      <div class="cab-callout__desc">Quick turnaround from order to delivery.</div>
    </div>
  </div>
```

- [ ] **Step 2: Add callouts CSS**

In the `<style>` block, add after the "How it works" CSS rules:
```css
  /* ── Feature callouts ───────────────────────────────────────────────────── */
  .cab-callouts {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    max-width: 1100px;
    margin: 32px auto 48px;
    padding: 0 24px;
  }
  .cab-callout {
    padding: 20px;
    border: 1px solid #2e2e2e;
    border-radius: 6px;
    text-align: center;
  }
  .cab-callout__icon {
    font-size: 1.1rem;
    color: #c9a96e;
    margin-bottom: 10px;
  }
  .cab-callout__title {
    font-size: 0.7rem;
    font-weight: 600;
    color: #f0ede8;
    margin-bottom: 6px;
  }
  .cab-callout__desc {
    font-size: 0.62rem;
    color: #888;
    line-height: 1.6;
  }
```

- [ ] **Step 3: Update responsive CSS for new sections**

Find the `@media (max-width: 768px)` block. After the existing mobile rules, add:
```css
    .cab-steps__grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    .cab-callouts {
      grid-template-columns: 1fr;
    }
    .cab-hero {
      padding: 40px 20px 32px;
    }
```

- [ ] **Step 4: Verify in browser**

Three feature callout cards should appear below the configurator — gold diamond icons, bold titles, grey descriptions. Resize the browser to mobile width — all three columns should stack vertically.

- [ ] **Step 5: Commit**
```powershell
git add sections/cabinet-configurator.liquid
git commit -m "feat: add feature callouts section below cabinet configurator"
```

---

### Task 12: End-to-end verification

Run `shopify theme dev --store ywbx1x-1n.myshopify.com`, open the Build Your Cabinet page, and check all 11 points from the spec:

- [ ] **1. Hero** — CTA button scrolls smoothly to the configurator
- [ ] **2. How it works** — all 3 steps visible and readable
- [ ] **3. Renderer — angle** — cabinet appears at 3/4 angle on load (front face, right side, top all visible)
- [ ] **4. Renderer — maple** — Natural Maple shows visible vertical wood grain
- [ ] **5. Renderer — painted** — Black/White/Sage are smooth satin, no grain
- [ ] **6. Renderer — handles** — horizontal cylindrical gold bars, catch light from key light
- [ ] **7. Rotation** — click-drag on the canvas rotates cabinet; damped inertia on release
- [ ] **8. Size change** — changing width or depth rebuilds cabinet, resets to 3/4 default angle
- [ ] **9. Pricing** — selecting all three options shows the Shopify variant price; mismatched combo disables button
- [ ] **10. Add to Cart** — correct variant added; cart total matches configurator price (not $0.01)
- [ ] **11. Mobile** — page stacks vertically; canvas has minimum height; callouts stack to single column

- [ ] **Final commit**
```powershell
git add .
git commit -m "feat: Build Your Cabinet page — complete (renderer, page structure, pricing)"
git push origin main
```
