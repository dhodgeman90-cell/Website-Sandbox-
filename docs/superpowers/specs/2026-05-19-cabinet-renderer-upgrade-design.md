# Cabinet Renderer Visual Upgrade — Design Spec
**Date:** 2026-05-19
**Status:** Approved, ready for implementation

## Goal

Upgrade the Three.js cabinet renderer in `assets/cabinet-configurator.js` to near-photorealistic quality, approaching the visual standard of Mozaik's product renderings. All improvements apply within the existing dark `#1c1c1c` background — no layout or page-structure changes.

---

## Section 1: Texture System

### New asset files
| File | Purpose |
|------|---------|
| `assets/wood-maple.webp` | Tileable maple wood colour photograph (~1024×2048px) |
| `assets/wood-maple-normal.webp` | Matching normal map for surface micro-depth |

Source: [Poly Haven](https://polyhaven.com) or [AmbientCG](https://ambientcg.com) — CC0 licence, no attribution required. Download as WebP and commit to `/assets/` via git (not the Shopify Admin uploader).

### Loading
- Both textures loaded once at startup via `THREE.TextureLoader` inside `initScene`
- Stored in module-level variables so `buildCabinet` can reference them without re-loading
- UV repeat set per-panel based on real-world dimensions: `texture.repeat.set(W / 24, H / 34.5)` so grain scale stays consistent regardless of cabinet size

### Material application
- `bodyMat` (shell panels, back, toe kick): colour map + normal map
- `faceMat` (drawer fronts — outer frame): colour map + normal map
- `recessedPanelMat` (drawer front centre inset): same maps, base colour multiplied by 0.85 to read slightly darker and catch shadow naturally
- Non-maple finishes: normal map still applies (simulates painted MDF texture); colour map replaced by the selected hex colour
- Remove the existing `buildMapleTexture()` canvas function entirely

---

## Section 2: Recessed Drawer Panel Geometry

### Replaces
The single `box(W - 2*T - 0.125, DRAWER_H - 0.125, faceDepth, 0, y, faceZ, faceMat)` call per drawer.

### New geometry per drawer front
Each drawer front becomes a compound group of 5 boxes:

```
┌──────────────────────────────┐
│  top rail  (full width)      │
│  ┌──────────────────────┐    │
│  │                      │
│  │   recessed centre    │  ← pushed back RECESS_Z = 4mm behind frame
│  │                      │
│  └──────────────────────┘
│  bottom rail (full width)    │
└──────────────────────────────┘
 left    right
 stile   stile
```

**Constants**
```js
const RAIL_W  = 1.0;   // top/bottom rail height in inches (~25mm)
const STILE_W = 1.0;   // left/right stile width in inches (~25mm)
const RECESS  = 0.15;  // how far the centre panel is pushed back (inches)
```

**Five pieces per drawer**
| Piece | Geometry | Material |
|-------|----------|----------|
| Top rail | `(faceW, RAIL_W, faceDepth)` at top of drawer Y | `faceMat` |
| Bottom rail | `(faceW, RAIL_W, faceDepth)` at bottom of drawer Y | `faceMat` |
| Left stile | `(STILE_W, innerH, faceDepth)` | `faceMat` |
| Right stile | `(STILE_W, innerH, faceDepth)` | `faceMat` |
| Recessed panel | `(innerW, innerH, faceDepth * 0.5)` shifted back by `RECESS` | `recessedPanelMat` |

Where `faceW = W - 2*T - 0.125`, `innerH = DRAWER_H - 2*RAIL_W - 0.125`, `innerW = faceW - 2*STILE_W`.

---

## Section 3: Lighting + Tone Mapping

### HemisphereLight replaces AmbientLight
```js
// Remove: scene.add(new THREE.AmbientLight(0x505060, 0.6));
// Add:
const hemiLight = new THREE.HemisphereLight(
  0xfff0d0,  // sky colour — warm amber ceiling
  0x202040,  // ground colour — cool deep blue floor reflection
  0.7        // intensity
);
scene.add(hemiLight);
```

### Key light shadow upgrade
- `keyLight.shadow.mapSize.width = 2048`
- `keyLight.shadow.mapSize.height = 2048`
- `keyLight.shadow.bias = -0.0005` (eliminates shadow acne on flat panels)
- `keyLight.shadow.normalBias = 0.02`

### Rim light (new)
```js
const rimLight = new THREE.DirectionalLight(0xffd090, 0.25);
rimLight.position.set(-35, 30, -40);  // behind-left
scene.add(rimLight);
// No shadow casting — this is a pure fill/rim effect
```

### ACESFilmic tone mapping
```js
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputEncoding = THREE.sRGBEncoding;  // correct colour space
```

---

## Section 4: Environment Map

### Purpose
Makes `metalness > 0` materials (handles, future metallic finishes) reflect their surroundings realistically.

### Implementation
Generated procedurally at startup — no image file required:
```js
function buildStudioEnvMap(renderer) {
  const pmremGen = new THREE.PMREMGenerator(renderer);
  pmremGen.compileEquirectangularShader();

  // Simple dark studio gradient rendered into a cube
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);
  // Warm ceiling panel
  const ceilLight = new THREE.DirectionalLight(0xfff0d0, 1.0);
  ceilLight.position.set(0, 1, 0);
  scene.add(ceilLight);

  const envMap = pmremGen.fromScene(
    new THREE.RoomEnvironment()  // built into Three.js r131+
  ).texture;
  pmremGen.dispose();
  return envMap;
}
```
Apply: `scene.environment = envMap;` — automatically applies to all MeshStandardMaterial instances.

**Fallback:** If `THREE.RoomEnvironment` is unavailable at the installed version, fall back to `pmremGen.fromScene(new THREE.Scene())` with a manually placed light. The implementation plan will verify which applies.

---

## Section 5: Post-Processing Pipeline

### New script files (self-hosted in `/assets/`)
Downloaded from Three.js r132 examples — same version as `three.min.js`:

| File | Source path in Three.js repo |
|------|------------------------------|
| `three-EffectComposer.js` | `examples/js/postprocessing/EffectComposer.js` |
| `three-RenderPass.js` | `examples/js/postprocessing/RenderPass.js` |
| `three-ShaderPass.js` | `examples/js/postprocessing/ShaderPass.js` |
| `three-SSAOPass.js` | `examples/js/postprocessing/SSAOPass.js` |
| `three-UnrealBloomPass.js` | `examples/js/postprocessing/UnrealBloomPass.js` |
| `three-CopyShader.js` | `examples/js/shaders/CopyShader.js` |

### Liquid load order (`sections/cabinet-configurator.liquid`)
```liquid
<script src="{{ 'three.min.js' | asset_url }}" defer></script>
<script src="{{ 'three-orbit-controls.min.js' | asset_url }}" defer></script>
<script src="{{ 'three-CopyShader.js' | asset_url }}" defer></script>
<script src="{{ 'three-ShaderPass.js' | asset_url }}" defer></script>
<script src="{{ 'three-EffectComposer.js' | asset_url }}" defer></script>
<script src="{{ 'three-RenderPass.js' | asset_url }}" defer></script>
<script src="{{ 'three-SSAOPass.js' | asset_url }}" defer></script>
<script src="{{ 'three-UnrealBloomPass.js' | asset_url }}" defer></script>
<script src="{{ 'cabinet-configurator.js' | asset_url }}" defer></script>
```

### EffectComposer setup (replaces direct `renderer.render` call)
```js
composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));

// SSAO — skip on low-end/small screens
const isLowEnd = window.devicePixelRatio < 2 &&
                 (canvas.clientWidth < 500 || navigator.hardwareConcurrency <= 2);

if (!isLowEnd) {
  const ssaoPass = new THREE.SSAOPass(scene, camera, canvas.clientWidth, canvas.clientHeight);
  ssaoPass.kernelRadius = 8;
  ssaoPass.minDistance  = 0.002;
  ssaoPass.maxDistance  = 0.08;
  composer.addPass(ssaoPass);
}

const bloomPass = new THREE.UnrealBloomPass(
  new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
  0.18,   // strength — subtle, not game-y
  0.4,    // radius
  0.85    // threshold — only brightest pixels bloom
);
composer.addPass(bloomPass);
```

### Render loop change
```js
// Remove: renderer.render(scene, camera);
// Add:
composer.render();
```

### Resize handling
`composer.setSize(cw, ch)` called alongside `renderer.setSize(cw, ch, false)` in the existing `onResize` handler.

---

## Files Changed

| File | Change |
|------|--------|
| `assets/cabinet-configurator.js` | All renderer improvements |
| `assets/wood-maple.webp` | New — wood colour texture |
| `assets/wood-maple-normal.webp` | New — wood normal map |
| `assets/three-EffectComposer.js` | New — post-processing addon |
| `assets/three-RenderPass.js` | New — post-processing addon |
| `assets/three-ShaderPass.js` | New — post-processing addon |
| `assets/three-SSAOPass.js` | New — post-processing addon |
| `assets/three-UnrealBloomPass.js` | New — post-processing addon |
| `assets/three-CopyShader.js` | New — post-processing addon |
| `sections/cabinet-configurator.liquid` | Updated script load order |

---

## Success Criteria

- Drawer fronts show visible recessed panel shadow at all cabinet sizes
- Maple finish shows photographic wood grain with visible normal-map depth under the key light
- Gold handles show specular reflections (visible highlight movement as cabinet is rotated)
- Ground shadow is crisp, not pixelated
- Soft AO darkening visible in corners between drawer faces and at cabinet base
- Subtle bloom on handle highlights visible on dark background
- Page loads and renders without errors on desktop Chrome, Safari, and Firefox
- Performance: smooth 60fps rotation on a mid-range laptop; acceptable (>30fps) on a mid-range phone
