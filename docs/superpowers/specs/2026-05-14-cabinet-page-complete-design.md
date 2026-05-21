# Build Your Cabinet — Complete Page Design

**Date:** 2026-05-14
**Status:** Approved
**Scope:** Full page rebuild around the existing 3D configurator widget — page structure, 3D renderer upgrade, and Shopify variant-based pricing fix.

---

## Context

The cabinet configurator (Phase 1) is functional but incomplete:
- The page has no surrounding context — no hero, no explanation, no callouts
- The Three.js renderer uses flat `MeshPhongMaterial` with a near-front-on camera — it does not read as a real 3D object
- The Shopify cart adds at $0.01 because the product uses a single placeholder variant

This design completes the page as a customer-facing product experience.

---

## Files Changed

| File | Change |
|------|--------|
| `sections/cabinet-configurator.liquid` | Add hero, how-it-works, callouts sections; extend CSS |
| `assets/cabinet-configurator.js` | Renderer upgrade (PBR, camera, handles, OrbitControls wiring, variant pricing) |
| `assets/three-orbit-controls.min.js` | New — OrbitControls from Three.js r128 |

**Not changed:** `templates/page.cabinet-configurator.json`, `assets/three.min.js`, `assets/sortable.min.js`

---

## Page Structure

Single Shopify section (`cabinet-configurator.liquid`), top to bottom:

### 1. Hero
- Dark background (#1c1c1c), full-width
- Gold eyebrow label: "Made to Order · CNC Precision"
- Headline: "Build Your Baseball Card Cabinet"
- Sub-copy: "Choose your width, depth, and finish. We cut it to spec in our CNC shop and ship it to your door."
- Gold CTA button: "Start Configuring ↓" — smooth-scrolls to the configurator widget via anchor `#cc-configurator`

### 2. How It Works
- Section label: "How it works" (gold uppercase)
- 3 steps in a row, each with a gold numbered circle:
  1. **Configure** — "Pick your size and finish. See it in 3D as you go."
  2. **Order** — "Add to cart. Your exact specs are locked in at checkout."
  3. **Delivered** — "CNC-cut in our shop and shipped flat-packed with hardware."

### 3. 3D Configurator (existing widget, upgraded)
- Existing 3-panel layout unchanged (options left, canvas centre, spec+price+cart right)
- Anchor `id="cc-configurator"` on this section for CTA scroll target
- "Drag to rotate" hint label on the canvas panel

### 4. Feature Callouts
- 3 columns, bordered cards:
  - **Made to Order** — "Every cabinet is cut to your exact dimensions in our CNC shop."
  - **Free Shipping** — "Flat-packed and shipped to your door at no extra cost."
  - **Ships in 5–7 Days** — "Quick turnaround from order to delivery."

---

## 3D Renderer Upgrades

### Materials
Switch all materials from `MeshPhongMaterial` to `MeshStandardMaterial` (PBR).

| Surface | `roughness` | `metalness` | Notes |
|---------|-------------|-------------|-------|
| Cabinet body (sides, top, back, bottom) | 0.55 | 0.0 | Darker variant of finish color (×0.65) |
| Drawer faces | 0.25 | 0.0 | Base finish color at full brightness |
| Toe kick | 0.65 | 0.0 | Matches body |
| Bar handles | 0.35 | 0.6 | Gold (#c9a96e), metallic |
| Ground plane | 1.0 | 0.0 | Near-black, receives shadow only |

**Maple wood grain:** When finish is Natural Maple, generate a procedural texture at runtime using Canvas 2D API — vertical grain streaks with randomised lightness variation over a base maple tone (#c8a050). Applied as `map` on both body and face materials. All other finishes use solid color only.

### Camera
Replace the near-front-on camera with a 3/4 product-photography angle:
```
camera.position.set(W * 1.3, H * 0.8, D * 2.8)
camera.lookAt(0, H * 0.45, 0)
```
Recalculated on every `buildCabinet()` call so proportions hold at all sizes.

### OrbitControls
Add `OrbitControls` from Three.js r128 (`assets/three-orbit-controls.min.js`, loaded after `three.min.js`). Configuration:
- `enableDamping: true, dampingFactor: 0.08` — smooth inertia
- `enablePan: false` — no panning, cabinet stays centred
- `minDistance / maxDistance` — clamp zoom so cabinet stays in frame
- Reset to default camera position on each finish/size change (call `controls.reset()` after `buildCabinet()`)
- Call `controls.update()` inside the render loop

### Handles
Replace flat `BoxGeometry` handles with `CylinderGeometry` bar handles:
- Horizontal cylinder, radius 0.18", length = W × 0.20"
- Rotated 90° on Z axis to lay horizontal
- Centred on each drawer face, protruding ~0.45" forward
- Material: `pullMat` (gold, `roughness: 0.35, metalness: 0.6`)

### Lighting
Two-light setup replacing the current single directional light:
- **Key light:** `DirectionalLight(0xfff5e0, 1.1)` — upper front-right, casts soft shadows (`PCFSoftShadowMap`, 1024px map)
- **Fill light:** `DirectionalLight(0xd0e8ff, 0.4)` — upper front-left, no shadows — lifts the shadow side so it doesn't go pure black
- **Ambient:** `AmbientLight(0x505060, 0.6)` — soft base fill, slightly cool

---

## Pricing Fix — Shopify Variants

### Shopify Admin Setup (one-time, done by store owner)
1. Edit the cabinet product
2. Add 3 options: **Width**, **Depth**, **Finish**
3. Finish values must exactly match the `id` fields in the `available_colors` metafield (e.g. `"maple"`, `"black"`, `"white"`, `"sage"`)
4. Set the correct price on each variant in Shopify admin
5. **Variant limit:** Shopify caps at 100 variants per product. With 4 finishes, maximum 25 width × depth combinations (e.g. 5 widths × 5 depths)

### Liquid Change
Replace single `variantId` injection with full variants array:
```liquid
variants: {{ cab_product.variants | json }},
```
Remove the single `variantId` line. `cab_product.variants | json` serialises all variant fields including `id`, `option1`, `option2`, `option3`, and `price` (price is in cents as an integer).

### JS Changes
- Remove `variantId` from config; add `variants` array
- Add `findVariant(width, depth, colorId)` — iterates `cfg.variants`, matches all three options. **Type note:** Shopify variant `option1`/`option2` are strings (e.g. `"24"`); `state.width`/`state.depth` are numbers. Compare with `==` (loose equality) or coerce: `String(state.width)`. `option3` matches `colorId` with `.toLowerCase()`.
- On each selection change: call `findVariant()`, store result as `state.variant`
- **Price display:** Use `state.variant.price / 100` (Shopify stores prices in cents) — removes dependency on metafield `price_add` values
- **Add to Cart:** Use `state.variant.id` instead of `cfg.variantId`
- Disable Add to Cart button if `findVariant()` returns null (combo not found)

---

## Finishes

| Label | ID | Type | Hex |
|-------|----|------|-----|
| Natural Maple | `maple` | Wood grain texture | `#c8a050` base |
| Black | `black` | Painted satin | `#2a2a2a` |
| White | `white` | Painted satin | `#f0ede8` |
| Sage Green | `sage` | Painted satin | `#7a9e7e` |

---

## Verification

1. Run `shopify theme dev --store ywbx1x-1n.myshopify.com` and open the Build Your Cabinet page
2. **Hero:** CTA button scrolls smoothly to the configurator
3. **How it works:** All 3 steps visible and readable
4. **Renderer:** Cabinet appears at 3/4 angle on load; maple finish shows wood grain; painted finishes show smooth satin; handles are cylindrical gold bars
5. **Rotation:** Click-drag on the canvas rotates the cabinet; releasing has damped inertia
6. **Size change:** Changing width/depth rebuilds cabinet and resets camera to 3/4 default
7. **Finish change:** Material updates instantly; maple ↔ painted transition is correct
8. **Pricing:** Selecting all three options shows the correct price from the Shopify variant (not $0.01); mismatched combos disable the button
9. **Add to Cart:** Adds the correct variant; cart total matches configurator price
10. **Callouts:** 3 feature cards visible below the configurator
11. **Mobile:** Page stacks vertically; canvas has minimum height of 380px
