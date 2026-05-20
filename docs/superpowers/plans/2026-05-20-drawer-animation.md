# Drawer Opening Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a looping top-drawer open/close animation — auto-plays on page load, runs continuously, leaves OrbitControls fully intact.

**Architecture:** Phase 1 sets up and previews the animation in Blender (MCP). Phase 2 adds a state-machine animation loop to the existing Three.js renderer in `cabinet-configurator.js`, capturing the top drawer face and handle into a `THREE.Group` that the loop moves each frame.

**Tech Stack:** Blender Python (bpy, via MCP), Three.js r132, vanilla JS (no new dependencies)

---

## File map

| File | Change |
|---|---|
| `assets/cabinet-configurator.js` | Add `topDrawerGroup`, `drawerAnim` state, `easeInOutCubic()`, `updateDrawerAnimation()`, modify drawer loop in `buildCabinet()`, add delta time to render loop |
| Blender scene (via MCP) | Create Empty controller, parent Drawer 4 objects, set keyframes |

---

## Phase 1 — Blender Preview

### Task 1: Create the Empty controller and parent all Drawer 4 objects

**Files:**
- Blender scene (execute via `mcp__blender__execute_blender_code`)

- [ ] **Step 1: Run the following Python in Blender via MCP**

```python
import bpy

drawer4_names = [
    "Drawer 4 box",
    "Drawer 4 black bar handle",
    "Drawer 4 bottom rail",
    "Drawer 4 handle post +4.2",
    "Drawer 4 handle post -4.2",
    "Drawer 4 left stile",
    "Drawer 4 recessed center panel",
    "Drawer 4 right stile",
    "Drawer 4 top rail",
]

# Remove existing controller if re-running
existing = bpy.data.objects.get("Drawer 4 controller")
if existing:
    bpy.data.objects.remove(existing, do_unlink=True)

# Create the empty
empty = bpy.data.objects.new("Drawer 4 controller", None)
empty.empty_display_type = 'ARROWS'
empty.empty_display_size = 0.05
empty.location = (0.0, 0.0, 0.0)
bpy.context.collection.objects.link(empty)

# Parent each Drawer 4 object to the empty, keeping world position
for name in drawer4_names:
    obj = bpy.data.objects.get(name)
    if obj:
        obj.parent = empty
        obj.matrix_parent_inverse = empty.matrix_world.inverted()

result = {"parented": [n for n in drawer4_names if bpy.data.objects.get(n)]}
print(result)
```

Expected output: `{'parented': ['Drawer 4 box', 'Drawer 4 black bar handle', ...]}`  — all 9 objects listed.

---

### Task 2: Set keyframes with correct timing and easing

**Files:**
- Blender scene (execute via `mcp__blender__execute_blender_code`)

- [ ] **Step 1: Run the following Python in Blender via MCP**

```python
import bpy

empty = bpy.data.objects.get("Drawer 4 controller")
if not empty:
    raise RuntimeError("Drawer 4 controller not found — run Task 1 first")

# Clear any existing animation on the empty
empty.animation_data_clear()

# Scene settings
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = 240
bpy.context.scene.frame_set(1)

# Keyframe data: (frame, y_offset)
# Drawer opens in -Y direction (toward viewer in Blender)
# 24fps: 48f=2s open, 72f=3s hold, 48f=2s close, 72f=3s hold = 240f total
keyframes = [
    (1,   0.0),    # closed — start
    (49,  -0.40),  # fully open
    (121, -0.40),  # hold open — end
    (169,  0.0),   # closed
    (240,  0.0),   # hold closed — end (loops back to frame 1)
]

for frame, y_val in keyframes:
    bpy.context.scene.frame_set(frame)
    empty.location.y = y_val
    empty.keyframe_insert(data_path="location", index=1, frame=frame)

# Set smooth ease-in-out on all keyframe handles
if empty.animation_data and empty.animation_data.action:
    for fcurve in empty.animation_data.action.fcurves:
        if fcurve.data_path == "location" and fcurve.array_index == 1:
            for kp in fcurve.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.easing        = 'EASE_IN_OUT'
            fcurve.update()

# Jump to frame 49 (fully open) for visual check
bpy.context.scene.frame_set(49)
bpy.context.view_layer.update()

result = {"keyframes_set": [k[0] for k in keyframes], "current_frame": 49}
print(result)
```

Expected output: `{'keyframes_set': [1, 49, 121, 169, 240], 'current_frame': 49}`

- [ ] **Step 2: Take a viewport screenshot via MCP (`mcp__blender__get_screenshot_of_window_as_image`)**

Confirm: top drawer is visibly pulled open, no clipping with adjacent drawer or side panels.

- [ ] **Step 3: Check mid-close (frame 145)**

```python
import bpy
bpy.context.scene.frame_set(145)
bpy.context.view_layer.update()
```

Take another screenshot. Confirm drawer is partially closed (roughly halfway between open and closed).

- [ ] **Step 4: Commit Blender file**

Save the `.blend` file if it lives in the repo, or note that the Blender preview is complete.

---

## Phase 2 — Three.js Integration

### Task 3: Add module-level animation state variables

**Files:**
- Modify: `assets/cabinet-configurator.js:23-28`

- [ ] **Step 1: Add `topDrawerGroup`, `drawerAnim`, and `lastTime` after the existing module-level refs**

Find this block (lines 23–27):

```js
  // ─── Three.js refs ────────────────────────────────────────────────────────
  let scene, camera, renderer, cabinetGroup, controls;
```

Replace with:

```js
  // ─── Three.js refs ────────────────────────────────────────────────────────
  let scene, camera, renderer, cabinetGroup, controls;
  let topDrawerGroup = null;
  let lastTime = 0;

  // ─── Drawer animation state ───────────────────────────────────────────────
  const drawerAnim = {
    phase:              'waiting',  // waiting | opening | holding_open | closing | holding_closed
    elapsed:            0,          // seconds spent in current phase
    offset:             0,          // current Z offset (inches); 0 = closed
    travel:             0,          // set by buildCabinet() based on depth
    startDelay:         1.5,
    openDuration:       2.0,
    holdOpenDuration:   3.0,
    closeDuration:      2.0,
    holdClosedDuration: 3.0,
  };
```

- [ ] **Step 2: Verify the file still loads without errors**

Open `assets/cabinet-configurator.js` in VS Code — no red squiggles on the new block.

---

### Task 4: Capture the top drawer into `topDrawerGroup` in `buildCabinet`

**Files:**
- Modify: `assets/cabinet-configurator.js:175-198`

The existing drawer loop adds both face and handle meshes directly to `cabinetGroup` for all 4 drawers. We split the top drawer (index 3) into its own group.

- [ ] **Step 1: Replace the drawer loop and the lines immediately before it**

Find this block (lines 175–198 — the `faceDepth`/`faceZ` setup and the entire `for` loop):

```js
    // ── 4 drawer faces + pull handles ─────────────────────────────────────
    const faceDepth = T * 0.5;
    const faceZ     = D / 2;

    for (let i = 0; i < DRAWERS; i++) {
      const y = toeH + i * (DRAWER_H + GAP) + DRAWER_H / 2;

      // Drawer face — sits flush with cabinet front
      box(W - 2*T - 0.125, DRAWER_H - 0.125, faceDepth, 0, y, faceZ, faceMat);

      // Bar handle — horizontal cylinder, gold, protrudes forward
      const handleLen = W * 0.22;
      const handleMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, handleLen, 12),
        pullMat
      );
      handleMesh.rotation.z  = Math.PI / 2;
      handleMesh.position.set(0, y, faceZ + faceDepth / 2 + 0.55);
      handleMesh.castShadow    = true;
      handleMesh.receiveShadow = true;
      cabinetGroup.add(handleMesh);
    }
```

Replace with:

```js
    // ── 4 drawer faces + pull handles ─────────────────────────────────────
    const faceDepth = T * 0.5;
    const faceZ     = D / 2;

    // Top-drawer animation group — reset each time cabinet is rebuilt
    topDrawerGroup = new THREE.Group();
    cabinetGroup.add(topDrawerGroup);
    drawerAnim.travel  = D * 0.65;  // 65% of depth (~16" on a 24" cabinet)
    drawerAnim.phase   = 'waiting';
    drawerAnim.elapsed = 0;
    drawerAnim.offset  = 0;
    topDrawerGroup.position.z = 0;

    for (let i = 0; i < DRAWERS; i++) {
      const y = toeH + i * (DRAWER_H + GAP) + DRAWER_H / 2;
      const handleLen = W * 0.22;

      if (i === DRAWERS - 1) {
        // Top drawer — meshes go into topDrawerGroup so the animation moves them
        const faceMesh = new THREE.Mesh(
          new THREE.BoxGeometry(W - 2*T - 0.125, DRAWER_H - 0.125, faceDepth),
          faceMat
        );
        faceMesh.position.set(0, y, faceZ);
        faceMesh.castShadow    = true;
        faceMesh.receiveShadow = true;
        topDrawerGroup.add(faceMesh);

        const handleMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, handleLen, 12),
          pullMat
        );
        handleMesh.rotation.z  = Math.PI / 2;
        handleMesh.position.set(0, y, faceZ + faceDepth / 2 + 0.55);
        handleMesh.castShadow    = true;
        handleMesh.receiveShadow = true;
        topDrawerGroup.add(handleMesh);
      } else {
        // Other drawers — unchanged, added to cabinetGroup
        box(W - 2*T - 0.125, DRAWER_H - 0.125, faceDepth, 0, y, faceZ, faceMat);

        const handleMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, handleLen, 12),
          pullMat
        );
        handleMesh.rotation.z  = Math.PI / 2;
        handleMesh.position.set(0, y, faceZ + faceDepth / 2 + 0.55);
        handleMesh.castShadow    = true;
        handleMesh.receiveShadow = true;
        cabinetGroup.add(handleMesh);
      }
    }
```

- [ ] **Step 2: Verify the file has no syntax errors**

In VS Code terminal: `node --check assets/cabinet-configurator.js`

Expected: no output (clean parse).

---

### Task 5: Add `easeInOutCubic` and `updateDrawerAnimation`

**Files:**
- Modify: `assets/cabinet-configurator.js` — add two functions before `initScene`

- [ ] **Step 1: Insert the two functions immediately before the `// ─── Scene setup` comment (line 38)**

```js
  // ─── Drawer animation helpers ─────────────────────────────────────────────
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function updateDrawerAnimation(delta) {
    if (!topDrawerGroup) return;

    drawerAnim.elapsed += delta;

    switch (drawerAnim.phase) {
      case 'waiting':
        if (drawerAnim.elapsed >= drawerAnim.startDelay) {
          drawerAnim.phase   = 'opening';
          drawerAnim.elapsed = 0;
        }
        break;

      case 'opening': {
        const t = Math.min(drawerAnim.elapsed / drawerAnim.openDuration, 1);
        drawerAnim.offset = easeInOutCubic(t) * drawerAnim.travel;
        if (t >= 1) {
          drawerAnim.phase   = 'holding_open';
          drawerAnim.elapsed = 0;
        }
        break;
      }

      case 'holding_open':
        if (drawerAnim.elapsed >= drawerAnim.holdOpenDuration) {
          drawerAnim.phase   = 'closing';
          drawerAnim.elapsed = 0;
        }
        break;

      case 'closing': {
        const t = Math.min(drawerAnim.elapsed / drawerAnim.closeDuration, 1);
        drawerAnim.offset = (1 - easeInOutCubic(t)) * drawerAnim.travel;
        if (t >= 1) {
          drawerAnim.phase   = 'holding_closed';
          drawerAnim.elapsed = 0;
        }
        break;
      }

      case 'holding_closed':
        if (drawerAnim.elapsed >= drawerAnim.holdClosedDuration) {
          drawerAnim.phase   = 'opening';
          drawerAnim.elapsed = 0;
        }
        break;
    }

    topDrawerGroup.position.z = drawerAnim.offset;
  }
```

- [ ] **Step 2: Verify no syntax errors**

`node --check assets/cabinet-configurator.js`

Expected: no output.

---

### Task 6: Wire delta time and animation update into the render loop

**Files:**
- Modify: `assets/cabinet-configurator.js:100-108`

- [ ] **Step 1: Replace the render loop inside `initScene`**

Find:

```js
    // Render loop
    (function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }());
```

Replace with:

```js
    // Render loop — tracks delta time for smooth animation
    lastTime = performance.now();
    (function animate(now) {
      requestAnimationFrame(animate);
      const delta = Math.min((now - lastTime) / 1000, 0.1); // cap at 100ms (tab visibility)
      lastTime = now;
      controls.update();
      updateDrawerAnimation(delta);
      renderer.render(scene, camera);
    }(performance.now()));
```

- [ ] **Step 2: Final syntax check**

`node --check assets/cabinet-configurator.js`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add assets/cabinet-configurator.js
git commit -m "feat: add looping top-drawer open/close animation to cabinet renderer"
```

---

### Task 7: Visual verification in the browser

**Files:**
- No changes — this is a verification task

- [ ] **Step 1: Start the Shopify dev server**

```powershell
shopify theme dev --store ywbx1x-1n.myshopify.com
```

- [ ] **Step 2: Open the cabinet configurator page**

Navigate to `http://localhost:9292` → find the cabinet configurator page.

- [ ] **Step 3: Verify the animation**

Wait 1.5 seconds after page load — the top drawer should begin opening slowly.

Check each phase:
- [ ] Drawer opens smoothly over ~2 seconds (ease-in at start, ease-out as it stops)
- [ ] Holds open for ~3 seconds
- [ ] Closes smoothly over ~2 seconds
- [ ] Holds closed for ~3 seconds
- [ ] Loops continuously without stuttering

- [ ] **Step 4: Verify OrbitControls still work**

While the animation is running: click-drag to rotate the cabinet, scroll to zoom.
Expected: full rotation and zoom work normally throughout the animation.

- [ ] **Step 5: Verify rebuild resets correctly**

Change the Width dropdown to a different value.
Expected: drawer snaps to closed, waits 1.5s, then begins opening again.

- [ ] **Step 6: Verify on narrow viewport (mobile)**

Resize browser to ~390px wide.
Expected: animation runs at smooth framerate, no layout breakage.

- [ ] **Step 7: Final commit if any tweaks were made during verification**

```bash
git add assets/cabinet-configurator.js
git commit -m "fix: tweak drawer animation timing after visual review"
```
