# Cabinet Renderer Redesign — Design Spec
_2026-05-19_

## Overview

Replace the current rotatable Three.js cabinet renderer with a stationary, fixed-angle render that closely matches the client's reference image. The cabinet sits in a simple room context (brick back wall, grey side wall, light wood floor). Only width and depth change the cabinet shape; height is fixed at 34.5″ with 4 drawers always.

---

## Scene Architecture

### Camera
- `PerspectiveCamera`, FOV 45°
- Fixed position: ~35° right of centre, ~25° above horizontal — matching the reference image angle
- `lookAt` the cabinet centre
- **No OrbitControls** — camera never moves

### Room Context
- **Back wall**: flat `PlaneGeometry` behind the cabinet, colour `#8b6355` (brick-brown). No texture needed — the colour read is sufficient at this scale.
- **Left wall**: flat `PlaneGeometry` on the left side, colour `#c8c4be` (light grey). Visible when cabinet is narrow.
- **Floor**: flat `PlaneGeometry`, `MeshLambertMaterial`, colour `#c4a878` (warm tan). Extends in front of and beside the cabinet.

### Lighting
- `DirectionalLight` from above-front (key light) — simulates overhead soft box, creates highlight on cabinet top face
- `DirectionalLight` from the left at low intensity (fill light) — keeps left side face readable
- `AmbientLight` at low intensity — ensures no face is completely unlit
- **Remove** existing SSAO, bloom, and post-processing composer — unnecessary complexity for a fixed render

---

## Cabinet Geometry

All dimensions in inches, converted to Three.js units at 1 unit = 1 inch.

### Parts (bottom to top)

| Part | Description |
|------|-------------|
| **Base plinth** | Slightly wider and deeper than main body (~0.75″ each side). Height ~3″. Sits on the floor. |
| **Main body** | Cabinet carcass. Height = 34.5″ − plinth height − top cap height. Full width and depth. |
| **4 drawer fronts** | Equal height. Full cabinet width. 3mm reveal gap between each. Each has a recessed panel inset ~0.15″. |
| **Top cap** | Thin slab (~0.5″) sitting on top of carcass. Overhangs front and sides by ~0.4″. |
| **Bar handles** | One per drawer, centred horizontally and vertically. Fixed ~5″ length, thin rectangular bar. Metal material. |

### Dynamic behaviour

| User selects | What changes |
|---|---|
| Width | Body, all drawer fronts, top cap, and plinth scale on X axis. Handles re-centre. |
| Depth | Body and plinth scale on Z axis. More depth = more right side face visible at camera angle. |
| Finish | Wood material colour/texture swaps across all wood geometry. Handles unchanged. |

Height is always 34.5″. Drawer count is always 4.

---

## Materials

### Wood — Maple finish
- `MeshStandardMaterial` with colour multiplier near white (`#fafafa`) so the photo texture drives the colour
- Apply existing texture maps: `wood-maple.webp` (colour), `wood-maple-normal.webp` (normal), `wood-maple-roughness.webp` (roughness)
- UV tiling scales with cabinet width so grain density stays proportional
- **Note**: maple texture accuracy is a known open issue — to be revisited separately

### Wood — Painted finishes
- `MeshStandardMaterial` with the hex colour from the metafield
- Roughness ~0.4, metalness 0.0
- No texture maps

### Handles (all finishes)
- `MeshStandardMaterial`, colour `#909090`, roughness ~0.2, metalness ~0.9
- Brushed metal look

### Floor
- `MeshLambertMaterial`, colour `#c4a878`

### Walls
- `MeshBasicMaterial` — flat unlit colours, no need for lighting interaction

---

## Interaction

- User selects width, depth, finish from existing dropdown controls (no UI changes)
- On any change: `buildCabinet()` is called, existing `cabinetGroup` is disposed, new geometry is built and added to scene
- Camera and room geometry never rebuild — only the cabinet group

---

## What Is Removed

- `OrbitControls` import and instantiation
- SSAO post-processing (`EffectComposer`, `SSAOPass`)
- Bloom post-processing
- Tone mapping / exposure settings
- Env map generator (`buildEnvMap`)
- All `controls.update()` calls in the render loop

---

## Files Changed

| File | Change |
|------|--------|
| `assets/cabinet-configurator.js` | Full rewrite of `initScene()`, `buildCabinet()`, render loop |
| `sections/cabinet-configurator.liquid` | No changes required — roughness map asset reference stays |
