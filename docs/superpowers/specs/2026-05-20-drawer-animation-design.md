# Drawer Opening Animation — Design Spec

**Date:** 2026-05-20
**Status:** Approved

---

## Overview

Add a looping top-drawer opening animation to the Oxford Wood Works cabinet experience. The animation serves as a passive product showcase — running automatically to demonstrate build quality and interior space without requiring any customer interaction.

The work has two phases:
1. **Blender preview** — set up and preview the animation in the reference Blender model
2. **Three.js integration** — implement the same animation in the existing Shopify cabinet renderer

---

## Behaviour

- **Trigger:** Auto-plays on page load after a 1.5s delay (gives the page time to settle)
- **Drawer:** Top drawer only (Drawer 4 in the Blender scene)
- **Loop:** Continuous — open → hold → close → hold → repeat
- **Interactivity:** OrbitControls (rotate/zoom) remain fully active throughout; animation runs underneath

### Timing

| Phase | Duration | Notes |
|---|---|---|
| Opening | 2s | Smooth ease-in-out |
| Hold open | 3s | Static, fully extended |
| Closing | 2s | Smooth ease-in-out |
| Hold closed | 3s | Static, fully retracted |
| **Total cycle** | **10s** | Loops continuously |

### Travel distance

The drawer extends **0.40m** forward (−Y direction in Blender/Three.js coordinates). This exposes roughly 70% of the drawer interior depth — enough to show the space without the drawer looking like it will fall out.

---

## Phase 1 — Blender Preview

### Scene setup

All 9 Drawer 4 objects are parented to a new Empty named `"Drawer 4 controller"`:

- `Drawer 4 box`
- `Drawer 4 black bar handle`
- `Drawer 4 bottom rail`
- `Drawer 4 handle post +4.2`
- `Drawer 4 handle post -4.2`
- `Drawer 4 left stile`
- `Drawer 4 recessed center panel`
- `Drawer 4 right stile`
- `Drawer 4 top rail`

Parent method: `Keep Transform` (objects don't move when parented).

### Keyframes (24fps)

| Frame | Empty Y | Phase |
|---|---|---|
| 1 | 0.0 | Closed (start) |
| 49 | −0.40 | Fully open |
| 121 | −0.40 | Hold open end |
| 169 | 0.0 | Closed |
| 240 | 0.0 | Hold closed end → loop |

Scene frame range: 1–240. Interpolation: `BEZIER` with `EASE_IN_OUT` on all keyframe handles.

---

## Phase 2 — Three.js Integration

### Approach

Add a lightweight state-machine animation loop inside the existing `render()` function in `assets/cabinet-configurator.js`. No new dependencies.

### State machine

```
waiting
  → opening   (2s, ease in-out, Y moves 0 → −0.40)
  → holding_open  (3s, static)
  → closing   (2s, ease in-out, Y moves −0.40 → 0)
  → holding_closed (3s, static)
  → opening   (loops)
```

### Easing

Use a cubic ease-in-out function:

```js
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
```

### Drawer mesh identification

Before implementation, read `cabinet-configurator.js` to confirm how the top drawer meshes are tracked. Expected: either a named `THREE.Group` or individual mesh references stored on scene creation. These need to be collected into a `topDrawerGroup` that the animation loop can move as a unit.

### Animation state object

```js
const drawerAnim = {
  phase: 'waiting',        // waiting | opening | holding_open | closing | holding_closed
  elapsed: 0,              // seconds within current phase
  offset: 0,               // current Y offset (0 = closed, -0.40 = open)
  startDelay: 1.5,         // seconds before first open
  openDuration: 2.0,
  holdOpenDuration: 3.0,
  closeDuration: 2.0,
  holdClosedDuration: 3.0,
  travel: 0.40,            // metres, in -Y direction
};
```

### Render loop integration

Each frame, `delta` (seconds since last frame) is added to `drawerAnim.elapsed`. On phase completion, transition to the next phase and reset elapsed. Apply `topDrawerGroup.position.y = drawerAnim.offset` each frame.

---

## Files to modify

| File | Change |
|---|---|
| `assets/cabinet-configurator.js` | Add `drawerAnim` state object + per-frame update logic in render loop |

No new files needed.

---

## Verification

1. **Blender:** Scrub through frames 1–240 — drawer opens and closes smoothly with no clipping against cabinet body or adjacent drawer
2. **Shopify (localhost):** Run `shopify theme dev`, open the cabinet page, wait 1.5s — drawer opens automatically and loops
3. **Interactivity check:** Orbit/zoom the cabinet while animation is running — controls must not be disrupted
4. **Mobile check:** Confirm animation runs at acceptable framerate on a mobile-sized browser window
