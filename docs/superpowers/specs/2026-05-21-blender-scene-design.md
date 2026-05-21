# Blender Scene — Sub-project 1 Design Spec

**Date:** 2026-05-21
**Status:** Approved

---

## Overview

Build a full 3D environment in Blender around the existing shaker-style 4-drawer cabinet, matching a provided reference image (dark industrial office: exposed brick wall, large grid window, concrete floor, plant and books on cabinet, desk lamp, partial furniture in foreground).

This is Sub-project 1 of 2. Sub-project 2 (GLTF export + Three.js web integration) is scoped separately.

---

## Reference Image

Dark industrial office scene. Key characteristics:
- Exposed red/brown brick back wall
- Large black-framed industrial grid window, left wall, floor-to-near-ceiling
- Dark polished concrete floor
- Cabinet positioned centre-right in frame
- Large tropical plant (pot on cabinet top) + 2 stacked books
- Framed blueprint/technical art print, upper-right wall
- Black adjustable desk lamp, upper-right
- Partial dark desk + office chair, right side
- Partial warm-wood table, left foreground
- Area rug, right foreground

---

## Approach

**Hybrid:** hand-built room geometry + Poly Haven PBR textures for hero surfaces + BlenderKit assets for complex organic props.

---

## Existing Scene (preserved)

The current `.blend` file already contains:
- 4-drawer shaker cabinet (all geometry, materials, drawer boxes)
- `"Drawer 4 controller"` Empty with looping open/close animation (240 frames)
- Camera object (to be repositioned)
- Studio floor (to be replaced)
- Two area lights (to be replaced)

All cabinet geometry and animation are **untouched** by this spec.

---

## Section 1 — Room Geometry & Camera

### Room

Three surfaces only — no ceiling required (not visible at camera angle):

| Surface | Geometry | Notes |
|---|---|---|
| Back wall | Large flat plane/box | Brick texture applied |
| Left side wall | Large flat plane/box | Window opening cut into it |
| Floor | Large flat plane/box | Concrete texture applied |

Room scale: sized to comfortably contain the cabinet with visible floor extending forward. Back wall ~1m behind cabinet. Left wall starts at cabinet's left side and extends further left. Floor extends well forward of cabinet (foreground furniture needs to sit on it).

### Window

Built into the left wall geometry. A tall rectangular opening (~0.8W × 1.0H of wall height) with:
- **Outer frame:** dark near-black painted metal box extrusions around the opening perimeter
- **Glass pane:** thin plane filling the opening, slightly transparent + slightly reflective blue-tinted shader
- **Mullions:** 4 vertical + 5 horizontal thin box extrusions across the glass, creating a grid of ~20 panes (matching reference)

### Camera

Repositioned to match reference composition:
- Cabinet sits in the right ~40% of the frame
- Window and left wall visible in the left ~40% of the frame
- Slight elevation — camera roughly at mid-cabinet height, looking very slightly downward
- Existing camera object repositioned (not a new camera)

---

## Section 2 — Lighting

Remove existing lights: `"Large softbox key light"` and `"Gentle fill light"`.

Replace with three area lights:

| Light | Type | Position | Colour | Purpose |
|---|---|---|---|---|
| Window key | Area | Just outside left wall, aligned with window opening | Cool white ~6500K | Primary daylight source — casts soft directional shadows |
| Right fill | Area | Right side of scene, opposite window | Warm white, very dim (~10% of key) | Lifts shadows on cabinet right face, preserves dark dramatic look |
| Brick bounce | Area | Behind and below cabinet | Warm amber, very dim | Simulates warm bounce off brick wall, adds subtle warmth to back edges |

Shadow casting enabled on window key light. Fill and bounce lights have shadows disabled.

---

## Section 3 — Props

### On Cabinet Top (hand-built)

| Prop | Method | Details |
|---|---|---|
| 2 stacked books | Hand-built box geometry | Dark matte covers, simple coloured material, slight tilt on top book |
| Plant pot | Hand-built cylinder | Matte black, slightly tapered |
| Tropical plant | BlenderKit asset | Large-leaf variety (monstera or similar), positioned in pot |

### Wall (hand-built)

| Prop | Method | Details |
|---|---|---|
| Framed blueprint print | Hand-built | Dark metal frame, dark navy backing plane, white linework image texture |

### Right Side (BlenderKit)

| Prop | Method | Details |
|---|---|---|
| Desk lamp | BlenderKit | Black adjustable arm style, positioned on desk surface upper-right |
| Partial desk | BlenderKit or simple geometry | Dark metal legs, warm wood top — only left corner visible in frame |
| Office chair | BlenderKit | Dark grey/charcoal high-back — only right portion visible at frame edge |

### Left Foreground (BlenderKit or simple geometry)

| Prop | Method | Details |
|---|---|---|
| Partial table | BlenderKit or simple | Warm wood top, dark metal legs — only right corner visible in frame |

### Floor

| Prop | Method | Details |
|---|---|---|
| Area rug | Simple plane or BlenderKit | Neutral mid-grey woven — right foreground under desk/chair area |

---

## Section 4 — Textures

### Poly Haven Downloads Required

| Texture Set | Surface | Maps Needed |
|---|---|---|
| Aged red brick (e.g. `old_brick_wall`) | Back wall | Colour, Normal, Roughness |
| Dark polished concrete (e.g. `concrete_layers`) | Floor | Colour, Normal, Roughness, (add slight glossy mix in shader for floor sheen) |

Both are free with CC0 license at [polyhaven.com](https://polyhaven.com).

### Procedural Materials

| Surface | Roughness | Metalness | Notes |
|---|---|---|---|
| Window frame | 0.3 | 0.8 | Near-black dark painted metal |
| Window glass | 0.05 | 0.0 | Slight blue tint, ~15% transparent, ~20% reflective |
| Desk/table top | 0.6 | 0.0 | Warm walnut — procedural wood grain or Poly Haven texture |
| Metal furniture legs | 0.4 | 0.9 | Dark gunmetal |
| Books | 0.9 | 0.0 | Flat dark matte |
| Plant pot | 0.8 | 0.0 | Matte black |
| Rug | 0.95 | 0.0 | Mid-grey |

### Cabinet

Existing materials unchanged. Fine-tuning is scoped to Sub-project 2.

---

## Verification

1. Render a still frame at frame 1 (drawer closed) and compare side-by-side with reference image
2. Scrub animation to frame 49 (drawer open) — confirm drawer reads clearly against the room environment
3. No cabinet geometry or animation data should be modified at any point during this build

---

## Out of Scope (Sub-project 2)

- GLTF/GLB export
- Three.js integration
- Parametric colour/size wiring
- Cabinet material fine-tuning
