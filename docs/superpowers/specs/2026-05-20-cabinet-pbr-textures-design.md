# Cabinet Configurator — PBR Texture Upgrade

**Date:** 2026-05-20
**Scope:** Visual renderer only — no changes to layout, pricing, dropdowns, or Shopify integration
**Rollback tag:** `pre-texture-upgrade`

---

## Goal

Replace the procedurally generated maple wood grain with real PBR texture maps, and add ACES filmic tone mapping to improve the appearance of all four finishes. No new tools, no build pipeline, no architectural changes.

---

## Files Changed

| File | Change |
|------|--------|
| `sections/cabinet-configurator.liquid` | Add `textureUrls` to `window.cabinetConfig` |
| `assets/cabinet-configurator.js` | Load textures at startup; apply in `buildCabinet()`; add tone mapping to `initScene()` |

---

## Texture Files (already in repo, not yet used)

| File | Role in Three.js |
|------|-----------------|
| `assets/wood-maple (2).webp` | `map` (base colour/diffuse) |
| `assets/Wood048_2K-JPG_NormalGL.webp` | `normalMap` (surface micro-detail that reacts to light) |
| `assets/Wood048_2K-JPG_Roughness.webp` | `roughnessMap` (which parts are shiny vs matte) |

---

## Design

### 1. Tone mapping — `initScene()`

Add two lines immediately after `renderer` is created:

```js
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
```

This applies to all finishes, not just maple. ACES filmic is the industry-standard colour pipeline — it prevents highlights from blowing out and makes the whole scene look more natural.

### 2. Pass texture URLs from Liquid — `cabinet-configurator.liquid`

Extend the existing `window.cabinetConfig` object with a `textureUrls` block. Shopify Liquid resolves the CDN URLs at render time so JS never has to hardcode them:

```liquid
window.cabinetConfig = {
  widths:   ...,
  depths:   ...,
  colors:   ...,
  variants: ...,
  textureUrls: {
    mapleColor:     "{{ 'wood-maple (2).webp' | asset_url }}",
    mapleNormal:    "{{ 'Wood048_2K-JPG_NormalGL.webp' | asset_url }}",
    mapleRoughness: "{{ 'Wood048_2K-JPG_Roughness.webp' | asset_url }}"
  }
};
```

### 3. Load textures at startup — `cabinet-configurator.js`

Declare a module-level `textures` object and a `THREE.TextureLoader`. After `initScene()` is called in `init()`, kick off the three texture loads:

```js
var textures = { mapleColor: null, mapleNormal: null, mapleRoughness: null };

function loadTextures() {
  var urls = (cfg.textureUrls) || {};
  var loader = new THREE.TextureLoader();
  if (urls.mapleColor)     loader.load(urls.mapleColor,     function(t) { textures.mapleColor = t; });
  if (urls.mapleNormal)    loader.load(urls.mapleNormal,    function(t) { textures.mapleNormal = t; });
  if (urls.mapleRoughness) loader.load(urls.mapleRoughness, function(t) { textures.mapleRoughness = t; });
}
```

Textures load in the background. If all three arrive before the user selects Maple, they'll be ready. If not, the fallback applies (see below).

### 4. Apply textures in `buildCabinet()` — replace `buildMapleTexture()`

Remove `buildMapleTexture()` entirely. In the material setup block, update the maple branch:

```js
if (state.colorId && state.colorId.toLowerCase() === 'maple') {
  if (textures.mapleColor && textures.mapleNormal && textures.mapleRoughness) {
    // All three PBR maps loaded — full quality
    bodyMat.map          = textures.mapleColor;
    bodyMat.normalMap    = textures.mapleNormal;
    bodyMat.roughnessMap = textures.mapleRoughness;
    faceMat.map          = textures.mapleColor;
    faceMat.normalMap    = textures.mapleNormal;
    faceMat.roughnessMap = textures.mapleRoughness;
    bodyMat.color.set(0xffffff); // let the texture supply the colour
    faceMat.color.set(0xffffff);
    // Repeat texture so grain scales naturally (not stretched across a 36" panel)
    [textures.mapleColor, textures.mapleNormal, textures.mapleRoughness].forEach(function(t) {
      if (!t) return;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(W / 12, H / 12); // ~1 tile per 12 inches
    });
  }
  // If textures not yet loaded, materials stay as solid maple colour — no error
}
```

### 5. Fallback behaviour

If any texture fails to load or hasn't loaded yet, `textures.mapleColor` etc. remain `null`. The `if` check means the material silently stays as the solid colour already set above it. No error is shown; the cabinet still renders.

---

## What Does NOT Change

- Page layout (hero, how-it-works, callouts)
- Dropdowns and option logic
- Spec panel (width/depth/height/colour display)
- Pricing logic and Shopify variant lookup
- Add-to-cart and `/cart/add.js` fetch
- Black, White, Sage Green finishes (they benefit from tone mapping only)
- Shadow setup, OrbitControls, resize handler
- Three.js version (r128) and script loading tags

---

## Success Criteria

- Maple finish displays real photographed wood grain with surface depth
- All four finishes look more natural than before (tone mapping)
- No regression in add-to-cart, pricing, or dropdown behaviour
- If maple textures fail to load, a solid maple colour renders instead of a blank/broken canvas
