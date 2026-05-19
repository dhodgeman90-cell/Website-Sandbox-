# Cabinet Renderer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rotatable Three.js cabinet renderer with a fixed-angle render that places the cabinet in a room scene (brick back wall, grey left wall, warm wood floor), matching the client's reference image.

**Architecture:** Rewrite `initScene()` to remove OrbitControls and post-processing, add room geometry, and fix the camera. Rewrite `buildCabinet()` with new part breakdown (plinth, body shell, top cap, 4 drawer faces with recessed panels, rectangular bar handles). Strip dead script tags from the liquid file.

**Tech Stack:** Three.js (already loaded via `three.min.js`), Shopify Liquid, vanilla JS (ES5 IIFE pattern already in use)

---

## File Map

| File | Change |
|------|--------|
| `assets/cabinet-configurator.js` | Rewrite `initScene()` and `buildCabinet()`; remove `buildEnvMap()` and `controls`/`composer` refs |
| `sections/cabinet-configurator.liquid` | Remove 9 dead script tags; remove `.cab-rotate-hint` element and CSS |

Everything else (`populateDropdowns`, `findVariant`, `calculatePrice`, `updateSpec`, `updatePrice`, `onSelectChange`, `addToCart`, `init`, `makeWoodMat`, texture loading) is unchanged.

---

## Task 1: Rewrite `initScene()` and remove dead globals

**Files:**
- Modify: `assets/cabinet-configurator.js:22` (refs line)
- Modify: `assets/cabinet-configurator.js:30-198` (delete `buildEnvMap`, rewrite `initScene`)

- [ ] **Step 1: Remove `controls` and `composer` from the global refs declaration**

Find line 22:
```js
let scene, camera, renderer, cabinetGroup, controls, composer;
```
Replace with:
```js
let scene, camera, renderer, cabinetGroup;
```

- [ ] **Step 2: Delete `buildEnvMap()` entirely**

Delete lines 29–81 (the `// ─── Env map` comment block through the closing `}`).

- [ ] **Step 3: Replace `initScene()` with the new fixed-camera room-scene version**

Delete the old `initScene()` (lines 83–198) and replace with:

```js
// ─── Scene setup (runs once) ──────────────────────────────────────────────
function initScene(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8b6355); // brick-brown fallback colour

  var w = canvas.clientWidth  || 480;
  var h = canvas.clientHeight || 560;
  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
  camera.position.set(38, 48, 62);
  camera.lookAt(0, 17, 0);

  // Key light — overhead front-right, soft shadows
  var keyLight = new THREE.DirectionalLight(0xfff5e0, 1.4);
  keyLight.position.set(20, 60, 40);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width  = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.bias = -0.001;
  scene.add(keyLight);

  // Fill light — left side, weak, keeps left face readable
  var fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.35);
  fillLight.position.set(-30, 30, 20);
  scene.add(fillLight);

  // Ambient — no face is completely dark
  scene.add(new THREE.AmbientLight(0xfff8f0, 0.4));

  // Floor — warm tan, receives shadows
  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshLambertMaterial({ color: 0xc4a878 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Back wall — brick-brown, large enough to fill background at all sizes
  var backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 300),
    new THREE.MeshBasicMaterial({ color: 0x8b6355 })
  );
  backWall.position.set(0, 150, -25);
  scene.add(backWall);

  // Left wall — light grey, visible to the left of the cabinet
  var leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 300),
    new THREE.MeshBasicMaterial({ color: 0xc8c4be })
  );
  leftWall.position.set(-32, 150, 0);
  leftWall.rotation.y = Math.PI / 2;
  scene.add(leftWall);

  // Resize handler
  function onResize() {
    var cw = canvas.clientWidth;
    var ch = canvas.clientHeight;
    if (cw === 0 || ch === 0) return;
    renderer.setSize(cw, ch, false);
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);
  onResize();

  // Render loop — simple direct render, no composer
  (function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }());
}
```

- [ ] **Step 4: Verify the file has no remaining references to `controls`, `composer`, or `buildEnvMap`**

Run in PowerShell:
```powershell
Select-String -Path "assets\cabinet-configurator.js" -Pattern "controls|composer|buildEnvMap"
```
Expected: no matches.

---

## Task 2: Rewrite `buildCabinet()`

**Files:**
- Modify: `assets/cabinet-configurator.js:241-366` (old `buildCabinet` → replace)

- [ ] **Step 1: Replace the entire `buildCabinet()` function**

Delete the old function (from `// ─── Cabinet builder` through its closing `}`) and replace with:

```js
// ─── Cabinet builder ──────────────────────────────────────────────────────
function buildCabinet(widthIn, depthIn, colorHex, colorId) {
  if (cabinetGroup) {
    cabinetGroup.traverse(function (obj) {
      if (obj.isMesh) {
        obj.geometry.dispose();
        if (obj.material.map)          obj.material.map.dispose();
        if (obj.material.normalMap)    obj.material.normalMap.dispose();
        if (obj.material.roughnessMap) obj.material.roughnessMap.dispose();
        obj.material.dispose();
      }
    });
    scene.remove(cabinetGroup);
  }
  cabinetGroup = new THREE.Group();

  var W = widthIn;
  var H = 34.5;
  var D = depthIn;

  // All measurements in inches; 1 Three.js unit = 1 inch
  var WALL_T     = 0.75;   // carcass wall / shelf thickness
  var PLINTH_H   = 3.0;    // base plinth height
  var PLINTH_EXT = 0.75;   // plinth extends this far beyond body on each side
  var TOP_H      = 0.75;   // top cap thickness
  var TOP_EXT    = 0.5;    // top cap overhang beyond body on each side
  var DRAWERS    = 4;
  var DRAWER_GAP = 0.2;    // reveal gap between drawer faces
  var RAIL_W     = 1.0;    // drawer frame rail height
  var STILE_W    = 1.0;    // drawer frame stile width
  var RECESS     = 0.12;   // recessed panel depth behind frame
  var HANDLE_LEN = 4.5;    // bar handle length
  var HANDLE_T   = 0.35;   // bar handle cross-section (square)

  // Drawer height: divide usable interior height equally
  var drawerAreaH = H - PLINTH_H - TOP_H - WALL_T; // WALL_T for bottom shelf
  var drawerH     = (drawerAreaH - (DRAWERS - 1) * DRAWER_GAP) / DRAWERS;

  var isMaple   = !!(colorId && colorId.toLowerCase() === 'maple');
  var baseColor = new THREE.Color(colorHex);
  var repeatX   = W / 24;
  var repeatY   = H / 34.5;

  // Maple: near-white so the texture photo drives the colour.
  // Painted: hex from metafield. Body and panel slightly darker for depth.
  var faceColorVal  = isMaple ? new THREE.Color(1.00, 1.00, 1.00) : baseColor;
  var bodyColorVal  = isMaple ? new THREE.Color(0.92, 0.90, 0.88) : baseColor.clone().multiplyScalar(0.70);
  var panelColorVal = isMaple ? new THREE.Color(0.86, 0.84, 0.82) : baseColor.clone().multiplyScalar(0.88);

  var bodyMat   = makeWoodMat(bodyColorVal,  0.60, repeatX, repeatY, isMaple);
  var faceMat   = makeWoodMat(faceColorVal,  0.42, repeatX, repeatY, isMaple);
  var panelMat  = makeWoodMat(panelColorVal, 0.55, repeatX, repeatY, isMaple);
  var handleMat = new THREE.MeshStandardMaterial({
    color: 0x909090, roughness: 0.20, metalness: 0.90,
  });

  function box(w, h, d, x, y, z, mat) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow    = true;
    m.receiveShadow = true;
    cabinetGroup.add(m);
  }

  // ── Base plinth — wider and deeper than body ────────────────────────────
  box(W + 2*PLINTH_EXT, PLINTH_H, D + 2*PLINTH_EXT,
      0, PLINTH_H / 2, 0,
      bodyMat);

  // ── Carcass shell ────────────────────────────────────────────────────────
  var bodyY0 = PLINTH_H;
  var bodyY1 = H - TOP_H;
  var bodyH  = bodyY1 - bodyY0;
  var bodyCY = bodyY0 + bodyH / 2;

  box(W, WALL_T, D, 0, bodyY0 + WALL_T / 2,  0, bodyMat); // bottom shelf
  box(W, WALL_T, D, 0, bodyY1 - WALL_T / 2,  0, bodyMat); // top shelf
  box(WALL_T, bodyH, D, -W/2 + WALL_T/2, bodyCY, 0, bodyMat); // left side
  box(WALL_T, bodyH, D,  W/2 - WALL_T/2, bodyCY, 0, bodyMat); // right side
  box(W, bodyH, WALL_T, 0, bodyCY, -D/2 + WALL_T/2, bodyMat); // back panel

  // ── Top cap — thin slab, slight overhang on all sides ───────────────────
  box(W + 2*TOP_EXT, TOP_H, D + 2*TOP_EXT,
      0, H - TOP_H / 2, 0,
      bodyMat);

  // ── Drawer faces ─────────────────────────────────────────────────────────
  // Each face: a frame (rails + stiles) plus a recessed centre panel.
  // Faces sit flush with the front of the carcass.
  var faceW = W - 2*WALL_T;          // spans the interior width
  var faceT = WALL_T * 0.5;          // face thickness
  var faceZ = D / 2 + faceT / 2;     // centred so front face is flush with carcass front

  for (var i = 0; i < DRAWERS; i++) {
    var baseY  = bodyY0 + WALL_T + i * (drawerH + DRAWER_GAP);
    var cy     = baseY + drawerH / 2;
    var innerH = drawerH - 2 * RAIL_W;
    var innerW = faceW   - 2 * STILE_W;

    // Frame rails and stiles
    box(faceW, RAIL_W, faceT, 0, baseY + drawerH - RAIL_W/2, faceZ, faceMat); // top rail
    box(faceW, RAIL_W, faceT, 0, baseY + RAIL_W/2,           faceZ, faceMat); // bottom rail
    box(STILE_W, innerH, faceT, -faceW/2 + STILE_W/2, cy, faceZ, faceMat);    // left stile
    box(STILE_W, innerH, faceT,  faceW/2 - STILE_W/2, cy, faceZ, faceMat);    // right stile

    // Recessed centre panel — set back from the frame face
    box(innerW, innerH, faceT * 0.5, 0, cy, faceZ - RECESS, panelMat);

    // Bar handle — rectangular bar, centred on drawer, protrudes from face
    var handleZ = faceZ + faceT/2 + 0.25 + HANDLE_T/2;
    box(HANDLE_LEN, HANDLE_T, HANDLE_T, 0, cy, handleZ, handleMat);
  }

  scene.add(cabinetGroup);
  // Camera stays fixed — do NOT reposition here
}
```

- [ ] **Step 2: Confirm the old camera repositioning lines are gone**

The old `buildCabinet` ended with:
```js
camera.position.set(W * 2.5, H * 0.9, D * 5.5);
if (controls) { ... }
```
Verify neither line exists by running:
```powershell
Select-String -Path "assets\cabinet-configurator.js" -Pattern "W \* 2\.5|controls\.target"
```
Expected: no matches.

- [ ] **Step 3: Commit Task 1 + 2 together**

```powershell
git add assets/cabinet-configurator.js
git commit -m "feat: fixed-angle room scene renderer — remove OrbitControls and post-processing, rebuild cabinet geometry"
```

---

## Task 3: Clean up `sections/cabinet-configurator.liquid`

**Files:**
- Modify: `sections/cabinet-configurator.liquid:87` (remove rotate hint element)
- Modify: `sections/cabinet-configurator.liquid:280-288` (remove rotate hint CSS)
- Modify: `sections/cabinet-configurator.liquid:431-441` (remove dead script tags)

- [ ] **Step 1: Remove the rotate hint HTML element**

Find and delete this line (around line 87):
```html
    <div class="cab-rotate-hint">&#8635; Drag to rotate</div>
```

- [ ] **Step 2: Remove the rotate hint CSS block**

Find and delete this block from the `<style>` section:
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

- [ ] **Step 3: Replace the nine script tags with only the two that are still needed**

Find this block near the bottom of the file:
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

Replace with:
```liquid
<script src="{{ 'three.min.js' | asset_url }}" defer></script>
<script src="{{ 'cabinet-configurator.js' | asset_url }}" defer></script>
```

- [ ] **Step 4: Commit**

```powershell
git add sections/cabinet-configurator.liquid
git commit -m "chore: remove OrbitControls and post-processing script tags, remove rotate hint"
```

---

## Task 4: Visual verification

- [ ] **Step 1: Start the local preview**

```powershell
shopify theme dev --store ywbx1x-1n.myshopify.com
```

Open `http://localhost:9292` and navigate to the cabinet page (or whatever page the Cabinet Configurator section is on).

- [ ] **Step 2: Verify the room scene**

Check all of these:
- The canvas shows a **warm tan floor** visible in front of and beside the cabinet
- A **brick-brown back wall** fills the background behind the cabinet
- A **grey left wall** is visible to the left
- The cabinet has a **visible top face** (showing the slightly elevated camera angle)
- No rotate/drag controls work — clicking and dragging the canvas does nothing

- [ ] **Step 3: Verify cabinet geometry**

Check:
- **Base plinth** is visible at the bottom, slightly wider and deeper than the main body
- **Top cap** is visible at the top, slightly overhanging the sides and front
- **4 equal drawer faces** visible on the front, each with a recessed panel inset
- **Bar handles** are centred horizontally on each drawer, protrude from the face, metal-coloured
- **Right side face** is visible from the camera angle, showing the cabinet depth

- [ ] **Step 4: Verify controls**

- Change **Width** → cabinet gets wider/narrower, handles stay centred, camera does not move
- Change **Depth** → right side face gets deeper/shallower, camera does not move
- Change **Color/Finish** → wood material changes across all faces, handles stay metal grey

- [ ] **Step 5: Push to GitHub**

```powershell
git push origin main
```

Shopify will pick up the changes automatically via the GitHub integration.

---

## Camera Tuning Note

The camera is set to `position(38, 48, 62)` with `lookAt(0, 17, 0)` — this gives approximately 23° elevation and 32° horizontal offset from front, matching the reference image. If the angle needs adjustment after visual review:

- **More elevation** (see more top face): increase Y, e.g. `(38, 55, 62)`
- **More side face**: increase X, e.g. `(45, 48, 62)`
- **Cabinet too small**: decrease Z, e.g. `(38, 48, 52)`
- **Cabinet too large**: increase Z, e.g. `(38, 48, 72)`

Only edit `camera.position.set(...)` inside `initScene()`.
