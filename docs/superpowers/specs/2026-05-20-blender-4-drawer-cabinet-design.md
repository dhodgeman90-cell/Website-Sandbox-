# 4-Drawer Base Cabinet — Blender Design Spec

**Date:** 2026-05-20
**Tool:** Blender (via MCP)
**Goal:** Photorealistic 3D model of a soft white shaker-style 4-drawer base cabinet

---

## Dimensions

| Property | Value |
|----------|-------|
| Width | 30" (762 mm) |
| Height | 34.5" (876 mm) |
| Depth | 24" (609.6 mm) |
| Toe kick height | 3.5" (88.9 mm) |
| Toe kick recess | 3" (76.2 mm) from face |

All modelling in millimetres. 1 inch = 25.4 mm.

---

## Cabinet Structure

### Box
- Two side panels: 18mm thick, full height × full depth
- Top panel: 18mm thick, spans between sides, flush with top
- Bottom panel: 18mm thick, sits above toe kick
- Back panel: 6mm thick, inset into a rabbet on sides/top/bottom
- No fixed shelves (drawer cabinet)

### Face Frame
- Two vertical stiles: 38mm (1.5") wide × full cabinet height
- Top rail: 38mm wide × spans between stiles
- Bottom rail: 38mm wide × spans between stiles, sits at toe kick top
- Face frame sits proud of box sides by ~1.5mm (slight overlay)

### Toe Kick
- Separate piece, 88.9mm tall, recessed 76.2mm from the cabinet face
- Material: same painted finish as cabinet body

---

## Drawer Fronts — Shaker Style

4 equal-height drawers. Usable face frame opening height (above toe kick to underside of top rail):
- 876 - 88.9 (toe kick) - 38 (top rail) - 38 (bottom rail) = ~711mm usable
- 4 drawers × ~175mm each with 3mm gaps between (3 gaps = 9mm, 4 drawers = ~175.5mm each)

### Each Drawer Front
- Face frame opening width: 762 - 2×38 = 686mm
- Drawer front width: 686 + 2×3mm overlay = 692mm (slightly wider than opening, overlaps face frame by 3mm each side)
- Drawer front height: ~175mm tall
- Frame (rail & stile): 44mm (1.75") wide on all 4 sides
- Center panel: recessed 8mm (5/16") from face of frame
- Panel thickness: 9mm
- Frame corners: square (not rounded) — standard shaker profile
- Gap between drawer fronts: 3mm reveal

### Bar Pull Hardware
- Style: Matte black bar pull, 96mm center-to-center (standard)
- Overall length: ~125mm
- Diameter: ~10mm round bar
- Positioned: horizontally centered on drawer front width, centered vertically on drawer front height
- Standoff from drawer face: ~20mm
- Material: Matte black metal

---

## Materials & Finish

### Cabinet Body + Drawer Fronts
- **Base color:** Warm off-white — RGB (0.96, 0.93, 0.90) — approximates Benjamin Moore OC-17 White Dove
- **BSDF type:** Principled BSDF
- **Roughness:** 0.55 (satin, not gloss)
- **Specular:** 0.3
- **Metallic:** 0.0
- **Normal map:** subtle wood-grain or micro-bump texture (strength 0.08) for painted surface realism
- **Sheen:** 0.05 (subtle soft sheen on painted surface)

### Toe Kick
- **Base color:** Very dark charcoal — RGB (0.04, 0.04, 0.04)
- **Roughness:** 0.85 (matte)

### Bar Pull Handles
- **Base color:** Dark charcoal — RGB (0.02, 0.02, 0.02)
- **Metallic:** 1.0
- **Roughness:** 0.4 (matte black metal — slight reflection)
- **Specular:** 0.5

---

## Blender Scene Setup

### Units
- Metric, millimetres
- Scale: 1 unit = 1mm

### Lighting
- World: HDRI studio lighting — neutral white/warm studio setup
- HDRI strength: 1.0
- Optional: single area light (500mm × 500mm) positioned upper-left at 45° for key light
- No harsh shadows — diffuse wrap lighting typical of product photography

### Camera
- Type: Perspective
- Focal length: 85mm (flatters cabinet proportions, minimal distortion)
- Position: 3/4 angle — slightly left of center, slightly above eye level
- Distance: enough to see full cabinet with comfortable padding
- Target: center of cabinet

### Renderer
- Engine: Cycles
- Samples: 256 (preview), 1024 (final render)
- Denoising: Intel OpenImageDenoise or NLM
- Color management: Filmic, Medium contrast

---

## Build Order

1. Set scene units to metric/mm
2. Build cabinet box (sides, top, bottom, back)
3. Build face frame (stiles and rails)
4. Build toe kick
5. Build 4 drawer fronts (shaker panel detail)
6. Model bar pull handle (single mesh, then array/copy to all 4 drawers)
7. Apply all materials
8. Set up HDRI lighting
9. Position camera
10. Test render — adjust materials/lighting as needed

---

## Verification

- Render a full-resolution Cycles render at 1024 samples
- Check shaker panel reveals look crisp under lighting
- Confirm bar pulls read as clearly matte black with subtle specular highlight
- Confirm soft white reads as warm (not cold/blue) under studio lighting
- Take a screenshot via `mcp__blender__get_screenshot_of_window_as_image` to verify geometry before final render
