# Cabinet Renderer Visual Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Three.js cabinet renderer to near-photorealistic quality using real wood photo textures, recessed drawer panel geometry, improved lighting, environment mapping, and an EffectComposer post-processing pipeline (SSAO + bloom).

**Architecture:** All changes are contained in `assets/cabinet-configurator.js` (renderer logic) plus new asset files and a minor script-tag addition to `sections/cabinet-configurator.liquid`. The post-processing pipeline uses Three.js r128's `examples/js/` addons (UMD format, extends the global `THREE` object). Textures are sourced from CC0 libraries and committed to `/assets` via git.

**Tech Stack:** Three.js r128 (already installed), Three.js r128 postprocessing addons (EffectComposer, SSAOPass, UnrealBloomPass), CC0 wood textures (WebP), Shopify Liquid for asset URL injection.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `assets/three-CopyShader.js` | Create | Shared shader used by postprocessing passes |
| `assets/three-LuminosityHighPassShader.js` | Create | Shader required by UnrealBloomPass |
| `assets/three-EffectComposer.js` | Create | Post-processing pipeline manager |
| `assets/three-MaskPass.js` | Create | Mask pass required by UnrealBloomPass |
| `assets/three-ShaderPass.js` | Create | Generic shader pass utility |
| `assets/three-RenderPass.js` | Create | Base scene render pass |
| `assets/three-SSAOPass.js` | Create | Screen-space ambient occlusion pass |
| `assets/three-UnrealBloomPass.js` | Create | Bloom highlight pass |
| `assets/wood-maple.webp` | Create | Tileable maple wood colour photo texture |
| `assets/wood-maple-normal.webp` | Create | Matching normal map for surface micro-depth |
| `sections/cabinet-configurator.liquid` | Modify | Add addon script tags + `window.cabinetAssets` injection |
| `assets/cabinet-configurator.js` | Modify | All renderer improvements |

---

## Task 1: Download Three.js r128 Postprocessing Addon Files

**Files:**
- Create: `assets/three-CopyShader.js`
- Create: `assets/three-LuminosityHighPassShader.js`
- Create: `assets/three-EffectComposer.js`
- Create: `assets/three-MaskPass.js`
- Create: `assets/three-ShaderPass.js`
- Create: `assets/three-RenderPass.js`
- Create: `assets/three-SSAOPass.js`
- Create: `assets/three-UnrealBloomPass.js`

- [ ] **Step 1: Download all 8 addon files from Three.js r128 CDN**

Run these PowerShell commands from the `c:\VS Code\Website Fuckery` directory. Each downloads a file and saves it to `/assets` with the `three-` prefix:

```powershell
$base = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js"
$assets = "c:\VS Code\Website Fuckery\assets"

Invoke-WebRequest "$base/shaders/CopyShader.js"               -OutFile "$assets\three-CopyShader.js"
Invoke-WebRequest "$base/shaders/LuminosityHighPassShader.js" -OutFile "$assets\three-LuminosityHighPassShader.js"
Invoke-WebRequest "$base/postprocessing/EffectComposer.js"    -OutFile "$assets\three-EffectComposer.js"
Invoke-WebRequest "$base/postprocessing/MaskPass.js"          -OutFile "$assets\three-MaskPass.js"
Invoke-WebRequest "$base/postprocessing/ShaderPass.js"        -OutFile "$assets\three-ShaderPass.js"
Invoke-WebRequest "$base/postprocessing/RenderPass.js"        -OutFile "$assets\three-RenderPass.js"
Invoke-WebRequest "$base/postprocessing/SSAOPass.js"          -OutFile "$assets\three-SSAOPass.js"
Invoke-WebRequest "$base/postprocessing/UnrealBloomPass.js"   -OutFile "$assets\three-UnrealBloomPass.js"
```

- [ ] **Step 2: Verify all 8 files are present and non-empty**

```powershell
Get-ChildItem "c:\VS Code\Website Fuckery\assets\three-*.js" | Select-Object Name, Length
```

Expected: 8 files listed, each with `Length` greater than 1000 bytes. If any file shows 0 bytes or is missing, re-run the specific `Invoke-WebRequest` line for that file.

- [ ] **Step 3: Commit**

```powershell
git add assets/three-CopyShader.js assets/three-LuminosityHighPassShader.js assets/three-EffectComposer.js assets/three-MaskPass.js assets/three-ShaderPass.js assets/three-RenderPass.js assets/three-SSAOPass.js assets/three-UnrealBloomPass.js
git commit -m "feat: add Three.js r128 postprocessing addon files"
```

---

## Task 2: Source and Add Wood Texture Files

**Files:**
- Create: `assets/wood-maple.webp`
- Create: `assets/wood-maple-normal.webp`

- [ ] **Step 1: Download a CC0 maple/light wood texture from AmbientCG**

Open this URL in your browser and download the `1K-JPG` zip (the 1024px version is plenty for this use):

```
https://ambientcg.com/view?id=Wood049
```

Alternatively search "wood light maple" on https://ambientcg.com — any light-coloured wood texture works. Download the 1K JPG package.

- [ ] **Step 2: Extract the zip and locate the two files you need**

Inside the zip you'll find files like:
- `Wood049_1K-JPG_Color.jpg` — the colour/diffuse texture
- `Wood049_1K-JPG_NormalGL.jpg` — the normal map (use `NormalGL`, not `NormalDX`)

If the texture downloaded has different naming, look for one file with "Color" or "Diffuse" in the name, and one with "Normal" in the name.

- [ ] **Step 3: Convert both files to WebP and save to /assets**

Run these PowerShell commands (requires no extra tools — uses Windows built-in image codec via .NET):

```powershell
# If you have ffmpeg installed (easiest):
ffmpeg -i "path\to\Wood049_1K-JPG_Color.jpg"    "c:\VS Code\Website Fuckery\assets\wood-maple.webp"
ffmpeg -i "path\to\Wood049_1K-JPG_NormalGL.jpg" "c:\VS Code\Website Fuckery\assets\wood-maple-normal.webp"
```

If you don't have ffmpeg, simply rename/copy the `.jpg` files directly — JPG works fine, just name them `wood-maple.webp` and `wood-maple-normal.webp`. Shopify serves them correctly regardless of extension.

Alternatively, drag both files into https://squoosh.app, set output format to WebP at 85% quality, download, and save to `c:\VS Code\Website Fuckery\assets\` with the names above.

- [ ] **Step 4: Verify both files are present**

```powershell
Get-ChildItem "c:\VS Code\Website Fuckery\assets\wood-maple*"
```

Expected: two files — `wood-maple.webp` and `wood-maple-normal.webp` — each at least 50KB.

- [ ] **Step 5: Commit**

```powershell
git add assets/wood-maple.webp assets/wood-maple-normal.webp
git commit -m "feat: add CC0 maple wood colour and normal map textures"
```

---

## Task 3: Update Liquid Section (Script Tags + Asset URL Injection)

**Files:**
- Modify: `sections/cabinet-configurator.liquid`

The `sections/cabinet-configurator.liquid` file currently has these script tags near the bottom (around line 427):

```liquid
<script src="{{ 'three.min.js' | asset_url }}" defer></script>
<script src="{{ 'three-orbit-controls.min.js' | asset_url }}" defer></script>
<script src="{{ 'cabinet-configurator.js' | asset_url }}" defer></script>
```

It also has this `<script>` block near the top that injects config:

```liquid
<script>
  window.cabinetConfig = {
    widths:   {{ cfg.available_widths.value | default: '[]' | json }},
    depths:   {{ cfg.available_depths.value | default: '[]' | json }},
    colors:   {{ cfg.available_finishes.value | default: cfg.available_colors.value | default: '[]' | json }},
    variants: {{ cab_product.variants | json }}
  };
</script>
```

- [ ] **Step 1: Replace the three script tags with the full load order**

Find and replace the three `<script src=...>` lines with this block:

```liquid
<script src="{{ 'three.min.js' | asset_url }}" defer></script>
<script src="{{ 'three-orbit-controls.min.js' | asset_url }}" defer></script>
<script src="{{ 'three-CopyShader.js' | asset_url }}" defer></script>
<script src="{{ 'three-LuminosityHighPassShader.js' | asset_url }}" defer></script>
<script src="{{ 'three-EffectComposer.js' | asset_url }}" defer></script>
<script src="{{ 'three-MaskPass.js' | asset_url }}" defer></script>
<script src="{{ 'three-ShaderPass.js' | asset_url }}" defer></script>
<script src="{{ 'three-RenderPass.js' | asset_url }}" defer></script>
<script src="{{ 'three-SSAOPass.js' | asset_url }}" defer></script>
<script src="{{ 'three-UnrealBloomPass.js' | asset_url }}" defer></script>
<script src="{{ 'cabinet-configurator.js' | asset_url }}" defer></script>
```

- [ ] **Step 2: Add cabinetAssets to the config injection block**

Extend the existing `window.cabinetConfig` block to also set `window.cabinetAssets`:

```liquid
<script>
  window.cabinetConfig = {
    widths:   {{ cfg.available_widths.value | default: '[]' | json }},
    depths:   {{ cfg.available_depths.value | default: '[]' | json }},
    colors:   {{ cfg.available_finishes.value | default: cfg.available_colors.value | default: '[]' | json }},
    variants: {{ cab_product.variants | json }}
  };
  window.cabinetAssets = {
    woodMaple:       {{ 'wood-maple.webp' | asset_url | json }},
    woodMapleNormal: {{ 'wood-maple-normal.webp' | asset_url | json }}
  };
</script>
```

- [ ] **Step 3: Commit**

```powershell
git add sections/cabinet-configurator.liquid
git commit -m "feat: add postprocessing script tags and texture asset URLs to cabinet section"
```

---

## Task 4: Rewrite cabinet-configurator.js

**Files:**
- Modify: `assets/cabinet-configurator.js`

This task replaces the entire contents of `assets/cabinet-configurator.js` with the upgraded version. Read through the full file below before making the change — the key differences from the current version are:

1. Module-level refs `composer`, `woodColorMap`, `woodNormalMap` added
2. `buildMapleTexture()` function removed entirely
3. `initScene()` gains: ACESFilmic tonemapping, `sRGBEncoding`, HemisphereLight, rim light, upgraded shadow settings, env map, EffectComposer with SSAOPass + UnrealBloomPass, `composer.render()` in the loop
4. `buildCabinet()` gains: `colorId` parameter, `makeWoodMat()` helper, recessed panel geometry for each drawer
5. `onSelectChange()` passes `state.colorId` to `buildCabinet()`
6. `init()` loads textures asynchronously, rebuilds when loaded

- [ ] **Step 1: Replace assets/cabinet-configurator.js with the full upgraded file**

```javascript
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
    colorHex:   null,
  };

  // ─── DOM refs ─────────────────────────────────────────────────────────────
  let widthSelect, depthSelect, colorSelect, atcBtn, priceEl, atcErrorEl;

  // ─── Three.js refs ────────────────────────────────────────────────────────
  let scene, camera, renderer, cabinetGroup, controls, composer;

  // ─── Texture refs (loaded once, reused by every buildCabinet call) ────────
  let woodColorMap  = null;
  let woodNormalMap = null;

  // ─── Env map (generated once at initScene time) ───────────────────────────
  function buildEnvMap() {
    const pmremGen = new THREE.PMREMGenerator(renderer);
    pmremGen.compileEquirectangularShader();

    // Simple 2-tone gradient: warm amber above, cool dark below.
    // Gives metallic surfaces something to reflect without loading an image.
    const data = new Uint8Array([
      255, 236, 180, 255,   // top-left:  warm amber
      255, 236, 180, 255,   // top-right: warm amber
       18,  18,  36, 255,   // bot-left:  deep cool dark
       18,  18,  36, 255,   // bot-right: deep cool dark
    ]);
    const gradTex = new THREE.DataTexture(data, 2, 2, THREE.RGBAFormat);
    gradTex.mapping    = THREE.EquirectangularReflectionMapping;
    gradTex.needsUpdate = true;

    const envMap = pmremGen.fromEquirectangular(gradTex).texture;
    pmremGen.dispose();
    gradTex.dispose();
    return envMap;
  }

  // ─── Scene setup (runs once) ──────────────────────────────────────────────
  function initScene(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled  = true;
    renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
    renderer.toneMapping        = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputEncoding     = THREE.sRGBEncoding;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1c1c1c);

    // Build and assign the environment map (gives metallic handles reflections)
    scene.environment = buildEnvMap();

    const w = canvas.clientWidth  || 480;
    const h = canvas.clientHeight || 560;
    camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 2000);
    camera.position.set(40, 32, 55);
    camera.lookAt(0, 17, 0);

    // Key light — warm, upper front-right, high-res soft shadows
    const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.1);
    keyLight.position.set(30, 50, 40);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width  = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias       = -0.0005;
    keyLight.shadow.normalBias =  0.02;
    scene.add(keyLight);

    // Fill light — cooler, upper front-left
    const fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.4);
    fillLight.position.set(-30, 40, 30);
    scene.add(fillLight);

    // Hemisphere light — warm amber sky, cool deep blue ground
    // Replaces flat AmbientLight; lifts shadows naturally
    scene.add(new THREE.HemisphereLight(0xfff0d0, 0x202040, 0.7));

    // Rim light — behind-left, traces cabinet silhouette against dark bg
    const rimLight = new THREE.DirectionalLight(0xffd090, 0.25);
    rimLight.position.set(-35, 30, -40);
    scene.add(rimLight);

    // Ground plane — receives cabinet shadow
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshLambertMaterial({ color: 0x141414, transparent: true, opacity: 0.75 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // OrbitControls
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan     = false;
    controls.minDistance   = 25;
    controls.maxDistance   = 180;

    // ── Post-processing pipeline ───────────────────────────────────────────
    // Detect low-end devices: skip SSAO on small/low-DPR screens or weak CPUs
    const isLowEnd = window.devicePixelRatio < 2 &&
                     (canvas.clientWidth < 500 ||
                      (navigator.hardwareConcurrency || 4) <= 2);

    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));

    if (!isLowEnd && typeof THREE.SSAOPass !== 'undefined') {
      const ssaoPass = new THREE.SSAOPass(scene, camera, w, h);
      ssaoPass.kernelRadius = 8;
      ssaoPass.minDistance  = 0.002;
      ssaoPass.maxDistance  = 0.08;
      composer.addPass(ssaoPass);
    }

    if (typeof THREE.UnrealBloomPass !== 'undefined') {
      const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(w, h),
        0.18,   // strength  — subtle, not game-y
        0.4,    // radius
        0.85    // threshold — only the brightest pixels bloom
      );
      composer.addPass(bloomPass);
    }

    // Resize handler
    function onResize() {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw === 0 || ch === 0) return;
      renderer.setSize(cw, ch, false);
      composer.setSize(cw, ch);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);
    onResize();

    // Render loop — uses composer instead of renderer.render
    (function animate() {
      requestAnimationFrame(animate);
      controls.update();
      composer.render();
    }());
  }

  // ─── Material factory ─────────────────────────────────────────────────────
  // Creates a MeshStandardMaterial with optional wood texture maps.
  // repeatX/Y scale the UV tiling to match real cabinet proportions.
  function makeWoodMat(baseColor, roughness, repeatX, repeatY, isMaple) {
    const mat = new THREE.MeshStandardMaterial({
      color:     baseColor,
      roughness: roughness,
      metalness: 0.0,
    });

    if (isMaple && woodColorMap) {
      const colTex = woodColorMap.clone();
      colTex.needsUpdate = true;
      colTex.repeat.set(repeatX, repeatY);
      mat.map = colTex;
    }

    if (isMaple && woodNormalMap) {
      const normTex = woodNormalMap.clone();
      normTex.needsUpdate = true;
      normTex.repeat.set(repeatX, repeatY);
      mat.normalMap   = normTex;
      mat.normalScale = new THREE.Vector2(0.6, 0.6);
    }

    return mat;
  }

  // ─── Cabinet builder ──────────────────────────────────────────────────────
  function buildCabinet(widthIn, depthIn, colorHex, colorId) {
    if (cabinetGroup) scene.remove(cabinetGroup);
    cabinetGroup = new THREE.Group();

    const W    = widthIn;
    const H    = 34.5;
    const D    = depthIn;
    const T    = 0.75;
    const toeH = 4.5;
    const toeRec = 3.5;

    const DRAWER_H = 7.25;
    const GAP      = 0.25;
    const DRAWERS  = 4;

    // Recessed panel constants (inches)
    const RAIL_W  = 1.0;   // height of top/bottom rails
    const STILE_W = 1.0;   // width of left/right stiles
    const RECESS  = 0.15;  // how far the panel centre is set back from frame

    const isMaple   = !!(colorId && colorId.toLowerCase() === 'maple');
    const baseColor = new THREE.Color(colorHex);
    const bodyColor = baseColor.clone().multiplyScalar(0.65);

    // UV tiling — keeps grain scale proportional to real cabinet dimensions
    const repeatX = W / 24;
    const repeatY = H / 34.5;

    const bodyMat          = makeWoodMat(bodyColor,                            0.55, repeatX, repeatY, isMaple);
    const faceMat          = makeWoodMat(baseColor,                            0.25, repeatX, repeatY, isMaple);
    const recessedPanelMat = makeWoodMat(baseColor.clone().multiplyScalar(0.85), 0.35, repeatX, repeatY, isMaple);
    const pullMat          = new THREE.MeshStandardMaterial({
      color: 0xc9a96e, roughness: 0.35, metalness: 0.6,
    });

    function box(w, h, d, x, y, z, mat) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow    = true;
      m.receiveShadow = true;
      cabinetGroup.add(m);
    }

    // ── Shell panels ──────────────────────────────────────────────────────
    box(W, T, D,  0,          H - T / 2,  0,          bodyMat); // top
    box(W, T, D,  0,          toeH + T/2, 0,          bodyMat); // bottom
    box(T, H, D, -W/2 + T/2, H / 2,      0,          bodyMat); // left side
    box(T, H, D,  W/2 - T/2, H / 2,      0,          bodyMat); // right side
    box(W, H, T,  0,          H / 2,     -D/2 + T/2, bodyMat); // back

    // ── Toe kick ──────────────────────────────────────────────────────────
    const toeZ = D / 2 - toeRec + T / 2;
    box(W - 2*T, toeH, T, 0, toeH / 2, toeZ, bodyMat);

    // ── Drawer faces: recessed panel compound geometry ────────────────────
    const faceW     = W - 2*T - 0.125;
    const faceDepth = T * 0.5;
    const faceZ     = D / 2;

    for (let i = 0; i < DRAWERS; i++) {
      const baseY  = toeH + i * (DRAWER_H + GAP);
      const cy     = baseY + DRAWER_H / 2;        // centre Y of this drawer
      const innerH = DRAWER_H - 2 * RAIL_W - 0.125;
      const innerW = faceW - 2 * STILE_W;

      // Top rail
      box(faceW,  RAIL_W, faceDepth,
          0,  baseY + DRAWER_H - RAIL_W / 2,  faceZ,  faceMat);

      // Bottom rail
      box(faceW,  RAIL_W, faceDepth,
          0,  baseY + RAIL_W / 2,  faceZ,  faceMat);

      // Left stile
      box(STILE_W,  innerH,  faceDepth,
          -faceW / 2 + STILE_W / 2,  cy,  faceZ,  faceMat);

      // Right stile
      box(STILE_W,  innerH,  faceDepth,
           faceW / 2 - STILE_W / 2,  cy,  faceZ,  faceMat);

      // Recessed centre panel (pushed back by RECESS, shallower depth)
      box(innerW,  innerH,  faceDepth * 0.5,
          0,  cy,  faceZ - RECESS,  recessedPanelMat);

      // Pull handle — horizontal cylinder, gold, protrudes forward
      const handleLen  = W * 0.22;
      const handleMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, handleLen, 12),
        pullMat
      );
      handleMesh.rotation.z = Math.PI / 2;
      handleMesh.position.set(0, cy, faceZ + faceDepth / 2 + 0.55);
      handleMesh.castShadow    = true;
      handleMesh.receiveShadow = true;
      cabinetGroup.add(handleMesh);
    }

    scene.add(cabinetGroup);

    // 3/4 product-photography angle
    camera.position.set(W * 2.5, H * 0.9, D * 5.5);
    if (controls) {
      controls.target.set(0, H * 0.45, 0);
      controls.update();
    } else {
      camera.lookAt(0, H * 0.45, 0);
    }
  }

  // ─── Populate dropdowns ───────────────────────────────────────────────────
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
      opt.dataset.hex = item.hex;
      colorSelect.appendChild(opt);
    });
  }

  // ─── Find matching Shopify variant ───────────────────────────────────────
  function findVariant() {
    if (!state.width || !state.depth || !state.colorId) return null;
    var colorId = state.colorId;
    return (cfg.variants || []).find(function (v) {
      return String(v.option1) == String(state.width)  &&
             String(v.option2) == String(state.depth)  &&
             v.option3.toLowerCase() === colorId.toLowerCase();
    }) || null;
  }

  // ─── Price ────────────────────────────────────────────────────────────────
  function calculatePrice() {
    var v = findVariant();
    return v ? v.price / 100 : null;
  }

  // ─── Spec display ─────────────────────────────────────────────────────────
  function updateSpec() {
    document.getElementById('spec-width').textContent = state.width  ? state.width  + '″' : '—';
    document.getElementById('spec-depth').textContent = state.depth  ? state.depth  + '″' : '—';
    document.getElementById('spec-color').textContent = state.colorLabel || '—';
  }

  // ─── Price display ────────────────────────────────────────────────────────
  function updatePrice() {
    const price = calculatePrice();
    priceEl.textContent = price !== null
      ? '$' + price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      : '—';
  }

  // ─── Dropdown change ──────────────────────────────────────────────────────
  function onSelectChange() {
    const rawW     = parseInt(widthSelect.value, 10);
    const rawD     = parseInt(depthSelect.value, 10);
    const colorOpt = colorSelect.options[colorSelect.selectedIndex];

    state.width      = isNaN(rawW)             ? null : rawW;
    state.depth      = isNaN(rawD)             ? null : rawD;
    state.colorId    = colorSelect.value       || null;
    state.colorLabel = (colorOpt && colorOpt.value) ? colorOpt.textContent         : null;
    state.colorHex   = (colorOpt && colorOpt.value) ? colorOpt.dataset.hex || null : null;

    var fallbackW = (cfg.widths[0] && cfg.widths[0].value) ? cfg.widths[0].value : 24;
    var fallbackD = (cfg.depths[0] && cfg.depths[0].value) ? cfg.depths[0].value : 18;
    buildCabinet(
      state.width  || fallbackW,
      state.depth  || fallbackD,
      state.colorHex || '#888888',
      state.colorId  || ''
    );

    updateSpec();
    updatePrice();
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

    const canvas = document.getElementById('cc-canvas');
    if (!canvas) return;

    initScene(canvas);
    populateDropdowns();

    // Build the cabinet immediately with flat colour so the canvas is never blank.
    // When textures finish loading the cabinet is rebuilt with full detail.
    var defaultW = (cfg.widths[0] && cfg.widths[0].value) ? cfg.widths[0].value : 24;
    var defaultD = (cfg.depths[0] && cfg.depths[0].value) ? cfg.depths[0].value : 18;
    buildCabinet(defaultW, defaultD, '#888888', '');

    // Load both textures; rebuild once both are ready
    var texturesPending = 2;
    function tryRebuild() {
      if (--texturesPending <= 0) {
        buildCabinet(
          state.width  || defaultW,
          state.depth  || defaultD,
          state.colorHex || '#888888',
          state.colorId  || ''
        );
      }
    }

    if (window.cabinetAssets) {
      var loader = new THREE.TextureLoader();

      woodColorMap = loader.load(window.cabinetAssets.woodMaple, function (tex) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.encoding = THREE.sRGBEncoding;
        tryRebuild();
      }, undefined, function () {
        // Texture failed to load — degrade gracefully (flat colour remains)
        tryRebuild();
      });

      woodNormalMap = loader.load(window.cabinetAssets.woodMapleNormal, function () {
        tryRebuild();
      }, undefined, function () {
        tryRebuild();
      });
    }

    [widthSelect, depthSelect, colorSelect].forEach(function (el) {
      el.addEventListener('change', onSelectChange);
    });
    atcBtn.addEventListener('click', addToCart);
  }

  document.addEventListener('DOMContentLoaded', init);
}());
```

- [ ] **Step 2: Open the local preview and check for console errors**

Make sure `shopify theme dev --store ywbx1x-1n.myshopify.com` is running, then open http://localhost:9292 and navigate to the Build Your Cabinet page.

Open DevTools (F12) → Console tab. Expected: **zero red errors**. 

If you see a red error mentioning `THREE.EffectComposer is not a constructor` or similar, it means one of the addon script files didn't load. Check the Network tab — all 8 `three-*.js` files should show status 200. A 404 means the file wasn't uploaded to Shopify's server yet (push first with `shopify theme push`).

If you see `THREE.SSAOPass is not a constructor`, the SSAO addon didn't load — but the page should still render (the `typeof THREE.SSAOPass !== 'undefined'` guard prevents a crash).

- [ ] **Step 3: Visual spot-checks**

With no errors in console, check visually:
- [ ] Canvas renders a grey cabinet (flat colour, no texture) immediately on load
- [ ] Within ~1 second, cabinet redraws with wood grain visible on all surfaces
- [ ] Drawer fronts show the recessed panel shadow (frame around each drawer)
- [ ] Gold handles show a highlight/reflection that moves when you drag to rotate
- [ ] Soft shadow visible on the ground plane below the cabinet
- [ ] Selecting the Maple colour option applies the wood texture
- [ ] Selecting a painted colour option shows flat colour with subtle normal-map texture

- [ ] **Step 4: Commit**

```powershell
git add assets/cabinet-configurator.js
git commit -m "feat: full PBR renderer upgrade — textures, recessed panels, SSAO, bloom"
```

---

## Task 5: Push to Shopify and Final Verification

- [ ] **Step 1: Push all changes to Shopify**

```powershell
shopify theme push --store ywbx1x-1n.myshopify.com
```

Wait for the push to complete. Expected output ends with `✓ Theme pushed successfully`.

- [ ] **Step 2: Open the live store and verify in browser**

Open your Shopify store's Build Your Cabinet page in Chrome. Check:
- [ ] No console errors
- [ ] Wood grain visible on the maple option
- [ ] Recessed panel detail visible on drawer fronts
- [ ] Handle reflections visible (rotate the cabinet — the gold highlight should shift)
- [ ] Soft ambient occlusion darkening visible at drawer gaps (on desktop with high-DPR screen)
- [ ] Bloom visible on handles against the dark background

- [ ] **Step 3: Test on mobile (or Chrome DevTools mobile emulation)**

In Chrome DevTools, toggle device emulation (Ctrl+Shift+M) and set to iPhone 12 (390px wide). Verify:
- [ ] Canvas renders without errors
- [ ] If SSAO is skipped (low-end detection), the cabinet still looks good
- [ ] Frame rate is smooth when dragging to rotate (not choppy)

- [ ] **Step 4: Save work to GitHub**

```powershell
git push origin main
```

---

## Troubleshooting Reference

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `THREE.EffectComposer is not a constructor` | Addon file missing or 404 | Check Network tab; run `shopify theme push` |
| `THREE.SSAOPass is not a constructor` | SSAOPass file missing | Same — also check the guard allows graceful degradation |
| Canvas is blank after load | initScene crash | Check console for specific error; most likely a shader compile error from SSAO |
| Wood texture doesn't appear | `cabinetAssets` URLs wrong or files not pushed | Check Network tab for 404 on `wood-maple.webp` |
| Normal map has no visible effect | `normalScale` too low or map is DX not GL format | Increase `normalScale` to `(1.0, 1.0)` or re-download NormalGL variant |
| Frame rate choppy on desktop | SSAO kernel too large | Reduce `ssaoPass.kernelRadius` from 8 to 4 |
