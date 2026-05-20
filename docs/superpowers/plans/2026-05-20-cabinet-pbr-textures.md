# Cabinet PBR Texture Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the procedurally drawn maple wood grain with real PBR texture maps and add ACES filmic tone mapping to improve all four cabinet finishes.

**Architecture:** All changes are confined to two existing files. The Liquid section passes Shopify CDN texture URLs into `window.cabinetConfig`. The JS reads those URLs, loads the textures once at page load, and applies them to `MeshStandardMaterial` when Maple is selected. Tone mapping is a two-line addition to the renderer setup.

**Tech Stack:** Three.js r128 (already loaded), Shopify Liquid, vanilla JS. No new libraries, no build step.

---

## File Map

| File | What changes |
|------|-------------|
| `sections/cabinet-configurator.liquid` | Add `textureUrls` block to `window.cabinetConfig` |
| `assets/cabinet-configurator.js` | Add tone mapping; add `textures` object + `loadTextures()`; remove `buildMapleTexture()`; apply PBR maps in `buildCabinet()` |

---

## Before You Start

Make sure the local preview server is running. Open PowerShell and run:

```powershell
shopify theme dev --store ywbx1x-1n.myshopify.com
```

Then open `http://localhost:9292` and navigate to the cabinet page. Keep this tab open — it hot-reloads when you save files.

---

## Task 1: Add ACES Filmic Tone Mapping

This is a two-line change to the renderer setup. It improves colour rendering for all four finishes. It has zero effect on layout, pricing, or cart.

**Files:**
- Modify: `assets/cabinet-configurator.js` (lines 28–29, immediately after renderer is created)

- [ ] **Step 1: Add tone mapping lines**

Open `assets/cabinet-configurator.js`. Find this block (around line 28):

```js
renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
```

Replace it with:

```js
renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
```

- [ ] **Step 2: Verify in browser**

Save the file. The browser tab at `http://localhost:9292` will reload. Select any finish from the colour dropdown. The cabinet colours should look slightly warmer and more natural — less flat and washed out. No errors in the browser console (press F12 to open it).

- [ ] **Step 3: Commit**

```powershell
git add assets/cabinet-configurator.js
git commit -m "feat: add ACESFilmic tone mapping to cabinet renderer"
```

---

## Task 2: Pass Texture URLs From Liquid to JavaScript

Shopify serves assets from a CDN with a hashed URL. The only way to get the real URL into JavaScript is via Liquid. We extend the existing `window.cabinetConfig` object with a `textureUrls` block.

**Files:**
- Modify: `sections/cabinet-configurator.liquid` (the `window.cabinetConfig` script block, around line 6)

- [ ] **Step 1: Add textureUrls to cabinetConfig**

Open `sections/cabinet-configurator.liquid`. Find this block:

```liquid
window.cabinetConfig = {
  widths:   {{ cfg.available_widths.value | default: '[]' | json }},
  depths:   [{"value":12,"label":"12\""}, {"value":15,"label":"15\""}, {"value":18,"label":"18\""}, {"value":21,"label":"21\""}, {"value":28,"label":"28\""}],
  colors:   {{ cfg.available_finishes.value | default: cfg.available_colors.value | default: '[]' | json }},
  variants: {{ cab_product.variants | json }}
};
```

Replace it with:

```liquid
window.cabinetConfig = {
  widths:   {{ cfg.available_widths.value | default: '[]' | json }},
  depths:   [{"value":12,"label":"12\""}, {"value":15,"label":"15\""}, {"value":18,"label":"18\""}, {"value":21,"label":"21\""}, {"value":28,"label":"28\""}],
  colors:   {{ cfg.available_finishes.value | default: cfg.available_colors.value | default: '[]' | json }},
  variants: {{ cab_product.variants | json }},
  textureUrls: {
    mapleColor:     {{ 'wood-maple (2).webp' | asset_url | json }},
    mapleNormal:    {{ 'Wood048_2K-JPG_NormalGL.webp' | asset_url | json }},
    mapleRoughness: {{ 'Wood048_2K-JPG_Roughness.webp' | asset_url | json }}
  }
};
```

- [ ] **Step 2: Verify URLs appear in browser console**

Save the file. In the browser tab, open the console (F12 → Console tab) and type:

```js
window.cabinetConfig.textureUrls
```

You should see an object with three keys, each containing a full CDN URL ending in `.webp`. If you see `undefined`, the Liquid filter didn't render — check for typos in the file names (they are case-sensitive).

- [ ] **Step 3: Commit**

```powershell
git add sections/cabinet-configurator.liquid
git commit -m "feat: pass PBR texture CDN URLs to cabinetConfig"
```

---

## Task 3: Load Textures at Page Startup

Add a module-level `textures` object and a `loadTextures()` function to the JS. Call `loadTextures()` from `init()` after the scene is set up. Textures load in the background — the cabinet still renders immediately with its existing colour while they arrive.

**Files:**
- Modify: `assets/cabinet-configurator.js`

- [ ] **Step 1: Add the `textures` object at the top of the module**

Find the existing module-level declarations block near the top of the file (around lines 22–24):

```js
// ─── Three.js refs ────────────────────────────────────────────────────────
let scene, camera, renderer, cabinetGroup, controls;
```

Add the textures object immediately after it:

```js
// ─── Three.js refs ────────────────────────────────────────────────────────
let scene, camera, renderer, cabinetGroup, controls;

// ─── PBR texture cache ────────────────────────────────────────────────────
var textures = { mapleColor: null, mapleNormal: null, mapleRoughness: null };
```

- [ ] **Step 2: Add the `loadTextures()` function**

Add this function immediately before the `initScene` function (around line 27):

```js
// ─── PBR texture loader ───────────────────────────────────────────────────
function loadTextures() {
  var urls = (cfg.textureUrls) || {};
  var loader = new THREE.TextureLoader();
  if (urls.mapleColor)     loader.load(urls.mapleColor,     function(t) { textures.mapleColor = t; });
  if (urls.mapleNormal)    loader.load(urls.mapleNormal,    function(t) { textures.mapleNormal = t; });
  if (urls.mapleRoughness) loader.load(urls.mapleRoughness, function(t) { textures.mapleRoughness = t; });
}
```

- [ ] **Step 3: Call `loadTextures()` from `init()`**

Find the `init()` function (near the bottom of the file). Find this line inside it:

```js
initScene(canvas);
```

Add the call immediately after:

```js
initScene(canvas);
loadTextures();
```

- [ ] **Step 4: Verify textures load in the browser console**

Save the file. In the browser console, wait 2–3 seconds then type:

```js
window.cabinetConfig  // confirm textureUrls are there
```

Then open the Network tab (F12 → Network), reload the page, and filter by "webp". You should see three `.webp` requests with status 200. If any show 404, the file name in the Liquid template doesn't exactly match the file in `assets/`.

- [ ] **Step 5: Commit**

```powershell
git add assets/cabinet-configurator.js
git commit -m "feat: add PBR texture loading infrastructure"
```

---

## Task 4: Apply PBR Textures in `buildCabinet()` and Remove Old Grain Function

This is the main visual change. Replace the procedural maple grain with the real texture maps. Remove the now-unused `buildMapleTexture()` function.

**Files:**
- Modify: `assets/cabinet-configurator.js`

- [ ] **Step 1: Replace the maple texture block in `buildCabinet()`**

Find this block inside `buildCabinet()` (around lines 152–158):

```js
// Apply wood grain texture for maple finish
if (state.colorId && state.colorId.toLowerCase() === 'maple') {
  var mapleMap = buildMapleTexture();
  bodyMat.map = mapleMap;
  faceMat.map = mapleMap;
  bodyMat.needsUpdate = true;
  faceMat.needsUpdate = true;
}
```

Replace it with:

```js
// Apply PBR textures for maple finish
if (state.colorId && state.colorId.toLowerCase() === 'maple') {
  if (textures.mapleColor && textures.mapleNormal && textures.mapleRoughness) {
    [textures.mapleColor, textures.mapleNormal, textures.mapleRoughness].forEach(function(t) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(W / 12, H / 12);
    });
    bodyMat.map          = textures.mapleColor;
    bodyMat.normalMap    = textures.mapleNormal;
    bodyMat.roughnessMap = textures.mapleRoughness;
    bodyMat.color.set(0xffffff);
    faceMat.map          = textures.mapleColor;
    faceMat.normalMap    = textures.mapleNormal;
    faceMat.roughnessMap = textures.mapleRoughness;
    faceMat.color.set(0xffffff);
  }
}
```

- [ ] **Step 2: Remove `buildMapleTexture()`**

Find and delete the entire `buildMapleTexture` function (approximately lines 96–121):

```js
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

Delete the entire block above — nothing else references it.

- [ ] **Step 3: Visual check — Maple finish**

Save the file. In the browser, select Maple from the colour dropdown. The cabinet should display real photographed wood grain with surface depth. Rotate it by dragging — you should see the grain reacting slightly to the lights (that's the normal map working).

If the cabinet shows a solid colour instead of grain, the textures haven't finished loading yet. Wait 5 seconds and change the colour dropdown away from Maple and back — this triggers a rebuild and picks up the now-loaded textures.

- [ ] **Step 4: Visual check — other finishes**

Switch to Black, White, and Sage Green. They should look the same as before (or slightly better due to tone mapping from Task 1). No broken canvas, no console errors.

- [ ] **Step 5: Functional check — add to cart**

Select a width, depth, and Maple finish. The price should appear and the "Add to Cart" button should become active. Click it — the cart page should load with the correct item.

- [ ] **Step 6: Commit**

```powershell
git add assets/cabinet-configurator.js
git commit -m "feat: apply PBR wood textures to maple finish, remove procedural grain"
```

---

## Task 5: Push to GitHub

- [ ] **Step 1: Push all commits**

```powershell
git push origin main
```

Shopify will automatically pull the update from GitHub within a minute or two (the GitHub integration does this). You can confirm by checking Shopify Admin → Online Store → Themes — it will show "Syncing" briefly then go back to normal.

- [ ] **Step 2: Verify on live site**

Open the live cabinet page (not localhost) and repeat the visual checks from Task 4 Steps 3–5.
