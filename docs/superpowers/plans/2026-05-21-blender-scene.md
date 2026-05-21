# Blender Scene — Sub-project 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full industrial-office 3D environment in Blender around the existing shaker cabinet, matching a provided reference image.

**Architecture:** Extend the existing `.blend` scene in-memory via the Blender MCP (`mcp__blender__execute_blender_code`). Room geometry built from primitive meshes, PBR textures from Poly Haven applied via Python material nodes, complex props sourced from BlenderKit. Cabinet and drawer animation are untouched throughout. Verification at each phase via `mcp__blender__get_screenshot_of_window_as_image`.

**Tech Stack:** Blender 5.1 Python API (`bpy`), Blender MCP, Poly Haven (free PBR textures), BlenderKit (free asset library add-on)

---

## File map

| Asset | Source | Notes |
|---|---|---|
| Blender scene (in-memory) | Modified in-place | Cabinet + animation untouched |
| `assets/textures/brick/` | Poly Haven download | colour, normal, roughness maps |
| `assets/textures/concrete/` | Poly Haven download | colour, normal, roughness, + gloss mix |

---

## Coordinate reference

The existing cabinet occupies:
- X: −0.2953 to +0.2953 (width 0.6096m)
- Y: −0.3096 (front face) to +0.2953 (back panel)
- Z: 0.0 (floor) to 0.8763 (top)

Room walls are built relative to these anchors. All positions are in metres.

---

## Task 1: Scene cleanup

**Files:** Blender scene (MCP)

- [ ] **Step 1: Remove studio floor and existing lights via MCP**

```python
import bpy

to_remove = ["studio floor", "Large softbox key light", "Gentle fill light"]
for name in to_remove:
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)

result = {"removed": to_remove, "remaining_objects": [o.name for o in bpy.data.objects]}
print(result)
```

- [ ] **Step 2: Verify cabinet and animation are still intact via MCP**

```python
import bpy

check = [
    "back panel", "bottom panel", "left side panel", "right side panel",
    "Drawer 4 controller", "Drawer 1 box", "Camera"
]
result = {name: (bpy.data.objects.get(name) is not None) for name in check}
print(result)
```

Expected: all values `True`.

- [ ] **Step 3: Screenshot to confirm scene state**

Run `mcp__blender__get_screenshot_of_window_as_image`. Confirm: cabinet visible, no studio floor, no studio lights.

---

## Task 2: Room geometry

**Files:** Blender scene (MCP)

Three surfaces: back wall (brick), left side wall (holds window), and floor (concrete). Walls are thin boxes rather than planes so they receive shadows properly.

- [ ] **Step 1: Create back wall, left wall, and floor via MCP**

```python
import bpy

def add_room_surface(name, location, scale):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(scale=True)
    obj.cycles_visibility = obj.cycles_visibility  # ensure visibility flags default
    return obj

# Back wall — behind cabinet, spans wide and tall
# Cabinet back panel is at Y=+0.2953; wall sits just behind it
back_wall = add_room_surface(
    "room_back_wall",
    location=(0.0, 0.42, 1.25),
    scale=(3.0, 0.05, 2.5)
)

# Left side wall — perpendicular to back wall, holds window
# Positioned to camera's left; extends forward past cabinet
left_wall = add_room_surface(
    "room_left_wall",
    location=(-0.80, -0.15, 1.25),
    scale=(0.05, 2.5, 2.5)
)

# Floor — large plane at Z=0
floor = add_room_surface(
    "room_floor",
    location=(0.0, -0.15, -0.025),
    scale=(4.0, 4.0, 0.05)
)

# Enable shadow receiving
for obj in [back_wall, left_wall, floor]:
    obj.cycles.is_shadow_catcher = False
    obj.visible_shadow = True

result = {"created": [back_wall.name, left_wall.name, floor.name]}
print(result)
```

- [ ] **Step 2: Screenshot — confirm room surfaces visible around cabinet**

Run `mcp__blender__get_screenshot_of_window_as_image`. The cabinet should sit on the floor with the back wall behind it and the left wall to the side. Adjust `location` values in Step 1 if walls are misaligned — re-run after adjusting.

- [ ] **Step 3: Commit scene checkpoint**

Save Blender file if it has a path, or note in-memory. Then:

```bash
git add -A
git commit -m "feat: add Blender room geometry (back wall, left wall, floor)"
```

---

## Task 3: Window geometry

**Files:** Blender scene (MCP)

The window is built as four frame pieces + one glass pane + mullion grid, all parented to a `"window_root"` empty.

- [ ] **Step 1: Create window root empty and frame pieces via MCP**

```python
import bpy

# Window position on left wall
# Opening: X at left_wall X (−0.80), Y from −0.30 to +0.38, Z from 0.05 to 2.10
WIN_X   = -0.775   # face of the left wall (slightly in front of wall centre)
WIN_Y_C = 0.04     # centre Y of opening ((−0.30 + 0.38) / 2)
WIN_Y_H = 0.34     # half-height of Y span (0.68 / 2)
WIN_Z_B = 0.05     # Z bottom of opening
WIN_Z_T = 2.10     # Z top of opening
WIN_Z_C = (WIN_Z_B + WIN_Z_T) / 2   # 1.075
WIN_Z_H = (WIN_Z_T - WIN_Z_B) / 2   # 1.025
WIN_W   = WIN_Y_H * 2                # full Y width of opening (0.68)

T = 0.04   # frame thickness

# Root empty
root = bpy.data.objects.new("window_root", None)
root.location = (WIN_X, WIN_Y_C, WIN_Z_C)
root.empty_display_size = 0.05
bpy.context.collection.objects.link(root)

def frame_piece(name, loc, scale):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(scale=True)
    obj.parent = root
    obj.matrix_parent_inverse = root.matrix_world.inverted()
    return obj

# Top frame
frame_piece("window_frame_top",
    loc=(WIN_X, WIN_Y_C, WIN_Z_T + T/2),
    scale=(T, WIN_W + 2*T, T))

# Bottom frame (sill)
frame_piece("window_frame_bottom",
    loc=(WIN_X, WIN_Y_C, WIN_Z_B - T/2),
    scale=(T, WIN_W + 2*T, T))

# Left frame
frame_piece("window_frame_left",
    loc=(WIN_X, WIN_Y_C - WIN_W/2 - T/2, WIN_Z_C),
    scale=(T, T, WIN_Z_H * 2))

# Right frame
frame_piece("window_frame_right",
    loc=(WIN_X, WIN_Y_C + WIN_W/2 + T/2, WIN_Z_C),
    scale=(T, T, WIN_Z_H * 2))

# Glass pane — thin cube so it sits in the YZ plane without needing rotation
bpy.ops.mesh.primitive_cube_add(size=1,
    location=(WIN_X - 0.01, WIN_Y_C, WIN_Z_C))
glass = bpy.context.active_object
glass.name = "window_glass"
glass.scale = (0.005, WIN_W, WIN_Z_H * 2)   # near-zero X = thin sheet; Y = width; Z = height
bpy.ops.object.select_all(action='DESELECT')
glass.select_set(True)
bpy.context.view_layer.objects.active = glass
bpy.ops.object.transform_apply(scale=True)
glass.parent = root
glass.matrix_parent_inverse = root.matrix_world.inverted()

result = {"window_pieces": ["window_frame_top","window_frame_bottom","window_frame_left","window_frame_right","window_glass"]}
print(result)
```

- [ ] **Step 2: Add mullion grid via MCP**

```python
import bpy

# 4 vertical + 5 horizontal mullions across the glass opening
WIN_X   = -0.775
WIN_Y_C = 0.04
WIN_Y_H = 0.34   # half Y-width
WIN_Z_B = 0.05
WIN_Z_T = 2.10
WIN_Z_C = (WIN_Z_B + WIN_Z_T) / 2
WIN_Z_H = (WIN_Z_T - WIN_Z_B) / 2
MT = 0.018   # mullion thickness

root = bpy.data.objects.get("window_root")

mullions = []

# Vertical mullions (divide Y axis into 5 sections = 4 dividers)
for i in range(1, 5):
    y = WIN_Y_C - WIN_Y_H + (WIN_Y_H * 2) * i / 5
    bpy.ops.mesh.primitive_cube_add(size=1, location=(WIN_X - 0.005, y, WIN_Z_C))
    m = bpy.context.active_object
    m.name = f"window_mullion_v_{i}"
    m.scale = (MT, MT, WIN_Z_H * 2)
    bpy.ops.object.select_all(action='DESELECT')
    m.select_set(True)
    bpy.context.view_layer.objects.active = m
    bpy.ops.object.transform_apply(scale=True)
    m.parent = root
    m.matrix_parent_inverse = root.matrix_world.inverted()
    mullions.append(m.name)

# Horizontal mullions (divide Z axis into 6 sections = 5 dividers)
for i in range(1, 6):
    z = WIN_Z_B + (WIN_Z_T - WIN_Z_B) * i / 6
    bpy.ops.mesh.primitive_cube_add(size=1, location=(WIN_X - 0.005, WIN_Y_C, z))
    m = bpy.context.active_object
    m.name = f"window_mullion_h_{i}"
    m.scale = (MT, WIN_Y_H * 2, MT)
    bpy.ops.object.select_all(action='DESELECT')
    m.select_set(True)
    bpy.context.view_layer.objects.active = m
    bpy.ops.object.transform_apply(scale=True)
    m.parent = root
    m.matrix_parent_inverse = root.matrix_world.inverted()
    mullions.append(m.name)

result = {"mullions_created": len(mullions), "names": mullions}
print(result)
```

- [ ] **Step 3: Screenshot to confirm window visible in scene**

Run `mcp__blender__get_screenshot_of_window_as_image`. Confirm window frame and mullion grid visible against the left wall.

---

## Task 4: Camera reposition

**Files:** Blender scene (MCP)

Reframe to match reference: cabinet on right side of frame, window on left.

- [ ] **Step 1: Reposition camera via MCP**

```python
import bpy
import math

cam = bpy.data.objects.get("Camera")
if not cam:
    raise RuntimeError("Camera object not found")

# Pull camera further left and back so window fills left side of frame
# Cabinet should occupy roughly the right 40% of frame
cam.location = (-0.80, -1.80, 0.75)
cam.rotation_euler = (
    math.radians(80),   # tilt: nearly level, looking very slightly down
    math.radians(0),
    math.radians(-15)   # yaw: rotate to face cabinet from left-front
)

# Switch viewport to camera view
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.region_3d.view_perspective = 'CAMERA'

result = {"camera_location": list(cam.location), "camera_rotation_deg": [math.degrees(r) for r in cam.rotation_euler]}
print(result)
```

- [ ] **Step 2: Screenshot from camera view**

Run `mcp__blender__get_screenshot_of_window_as_image`. Compare to reference image: cabinet should sit right-of-centre, window/left wall on the left. If composition is off, adjust `cam.location` and `cam.rotation_euler` values and re-run Step 1 until composition matches.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add window geometry, reposition camera to match reference composition"
```

---

## Task 5: Download Poly Haven textures

**Files:** `assets/textures/brick/`, `assets/textures/concrete/`

This task requires manual browser downloads.

- [ ] **Step 1: Create texture directories**

```powershell
New-Item -ItemType Directory -Force "c:\VS Code\Website Fuckery\assets\textures\brick"
New-Item -ItemType Directory -Force "c:\VS Code\Website Fuckery\assets\textures\concrete"
```

- [ ] **Step 2: Download brick texture set**

Go to [https://polyhaven.com/textures](https://polyhaven.com/textures), search for **"old brick wall"** or **"red brick"**. Pick a dark reddish-brown aged brick. Download at **2K resolution**:
- Colour/Diffuse map → save as `assets/textures/brick/brick_col.jpg`
- Normal map (GL) → save as `assets/textures/brick/brick_nor.jpg`
- Roughness map → save as `assets/textures/brick/brick_rough.jpg`

- [ ] **Step 3: Download concrete texture set**

Search for **"concrete"** — pick a dark, smooth/polished variety. Download at **2K resolution**:
- Colour/Diffuse map → save as `assets/textures/concrete/concrete_col.jpg`
- Normal map (GL) → save as `assets/textures/concrete/concrete_nor.jpg`
- Roughness map → save as `assets/textures/concrete/concrete_rough.jpg`

- [ ] **Step 4: Confirm files exist**

```powershell
Get-ChildItem "c:\VS Code\Website Fuckery\assets\textures" -Recurse | Select-Object Name
```

Expected: 6 files listed (3 brick + 3 concrete).

---

## Task 6: Brick material on back wall

**Files:** Blender scene (MCP)

- [ ] **Step 1: Create and apply PBR brick material via MCP**

```python
import bpy

TEX_BASE = "c:/VS Code/Website Fuckery/assets/textures/brick/"

# Create material
mat = bpy.data.materials.new(name="brick_wall")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# Output
out = nodes.new('ShaderNodeOutputMaterial')
out.location = (600, 0)

# Principled BSDF
bsdf = nodes.new('ShaderNodeBsdfPrincipled')
bsdf.location = (300, 0)
links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

# Texture coordinate + mapping (scale brick pattern)
coord = nodes.new('ShaderNodeTexCoord')
coord.location = (-600, 0)
mapping = nodes.new('ShaderNodeMapping')
mapping.location = (-400, 0)
mapping.inputs['Scale'].default_value = (3.0, 3.0, 3.0)  # tiles 3× across wall
links.new(coord.outputs['UV'], mapping.inputs['Vector'])

def load_tex(path, non_color=False):
    img = bpy.data.images.load(path)
    if non_color:
        img.colorspace_settings.name = 'Non-Color'
    node = nodes.new('ShaderNodeTexImage')
    node.image = img
    links.new(mapping.outputs['Vector'], node.inputs['Vector'])
    return node

# Colour
col_node = load_tex(TEX_BASE + "brick_col.jpg")
col_node.location = (-100, 200)
links.new(col_node.outputs['Color'], bsdf.inputs['Base Color'])

# Roughness
rough_node = load_tex(TEX_BASE + "brick_rough.jpg", non_color=True)
rough_node.location = (-100, -50)
links.new(rough_node.outputs['Color'], bsdf.inputs['Roughness'])

# Normal
nor_node = load_tex(TEX_BASE + "brick_nor.jpg", non_color=True)
nor_node.location = (-100, -300)
normal_map = nodes.new('ShaderNodeNormalMap')
normal_map.location = (100, -300)
links.new(nor_node.outputs['Color'], normal_map.inputs['Color'])
links.new(normal_map.outputs['Normal'], bsdf.inputs['Normal'])

# Apply to back wall
wall = bpy.data.objects.get("room_back_wall")
wall.data.materials.clear()
wall.data.materials.append(mat)

result = {"material": mat.name, "applied_to": wall.name}
print(result)
```

- [ ] **Step 2: Screenshot to verify brick texture on back wall**

Run `mcp__blender__get_screenshot_of_window_as_image`. The back wall should show a brick pattern. If tiling is too large or small, adjust the `mapping.inputs['Scale'].default_value` and re-run.

---

## Task 7: Concrete material on floor

**Files:** Blender scene (MCP)

- [ ] **Step 1: Create and apply concrete PBR material with gloss mix via MCP**

```python
import bpy

TEX_BASE = "c:/VS Code/Website Fuckery/assets/textures/concrete/"

mat = bpy.data.materials.new(name="concrete_floor")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

out = nodes.new('ShaderNodeOutputMaterial')
out.location = (800, 0)

# Mix concrete diffuse with glossy for polished sheen
mix = nodes.new('ShaderNodeMixShader')
mix.location = (550, 0)
mix.inputs['Fac'].default_value = 0.12   # 12% glossy = subtle sheen
links.new(mix.outputs['Shader'], out.inputs['Surface'])

bsdf = nodes.new('ShaderNodeBsdfPrincipled')
bsdf.location = (300, 100)
bsdf.inputs['Roughness'].default_value = 0.55
links.new(bsdf.outputs['BSDF'], mix.inputs[1])

glossy = nodes.new('ShaderNodeBsdfGlossy')
glossy.location = (300, -100)
glossy.inputs['Roughness'].default_value = 0.08
links.new(glossy.outputs['BSDF'], mix.inputs[2])

coord = nodes.new('ShaderNodeTexCoord')
coord.location = (-600, 0)
mapping = nodes.new('ShaderNodeMapping')
mapping.location = (-400, 0)
mapping.inputs['Scale'].default_value = (4.0, 4.0, 4.0)
links.new(coord.outputs['UV'], mapping.inputs['Vector'])

def load_tex(path, non_color=False):
    img = bpy.data.images.load(path)
    if non_color:
        img.colorspace_settings.name = 'Non-Color'
    node = nodes.new('ShaderNodeTexImage')
    node.image = img
    links.new(mapping.outputs['Vector'], node.inputs['Vector'])
    return node

col_node = load_tex(TEX_BASE + "concrete_col.jpg")
col_node.location = (-100, 200)
links.new(col_node.outputs['Color'], bsdf.inputs['Base Color'])
links.new(col_node.outputs['Color'], glossy.inputs['Color'])

rough_node = load_tex(TEX_BASE + "concrete_rough.jpg", non_color=True)
rough_node.location = (-100, -50)
links.new(rough_node.outputs['Color'], bsdf.inputs['Roughness'])

nor_node = load_tex(TEX_BASE + "concrete_nor.jpg", non_color=True)
nor_node.location = (-100, -300)
normal_map = nodes.new('ShaderNodeNormalMap')
normal_map.location = (100, -300)
links.new(nor_node.outputs['Color'], normal_map.inputs['Color'])
links.new(normal_map.outputs['Normal'], bsdf.inputs['Normal'])

floor = bpy.data.objects.get("room_floor")
floor.data.materials.clear()
floor.data.materials.append(mat)

result = {"material": mat.name, "applied_to": floor.name}
print(result)
```

- [ ] **Step 2: Screenshot to verify concrete floor with subtle sheen**

---

## Task 8: Window frame and glass materials

**Files:** Blender scene (MCP)

- [ ] **Step 1: Apply dark metal material to all window frame and mullion objects via MCP**

```python
import bpy

# Dark painted metal for frame + mullions
mat_frame = bpy.data.materials.new(name="window_frame_metal")
mat_frame.use_nodes = True
bsdf = mat_frame.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.02, 0.02, 0.02, 1.0)   # near-black
bsdf.inputs["Roughness"].default_value = 0.35
bsdf.inputs["Metallic"].default_value = 0.85

frame_objects = [o for o in bpy.data.objects
                 if o.name.startswith("window_frame") or o.name.startswith("window_mullion")]
for obj in frame_objects:
    obj.data.materials.clear()
    obj.data.materials.append(mat_frame)

result = {"frame_material_applied_to": [o.name for o in frame_objects]}
print(result)
```

- [ ] **Step 2: Apply glass material to window pane via MCP**

```python
import bpy

mat_glass = bpy.data.materials.new(name="window_glass")
mat_glass.use_nodes = True
mat_glass.blend_method = 'BLEND'
nodes = mat_glass.node_tree.nodes
links = mat_glass.node_tree.links
nodes.clear()

out = nodes.new('ShaderNodeOutputMaterial')
out.location = (400, 0)

glass_bsdf = nodes.new('ShaderNodeBsdfGlass')
glass_bsdf.location = (100, 0)
glass_bsdf.inputs['Color'].default_value = (0.88, 0.93, 1.0, 1.0)   # slight blue tint
glass_bsdf.inputs['Roughness'].default_value = 0.02
glass_bsdf.inputs['IOR'].default_value = 1.45
links.new(glass_bsdf.outputs['BSDF'], out.inputs['Surface'])

pane = bpy.data.objects.get("window_glass")
if pane:
    pane.data.materials.clear()
    pane.data.materials.append(mat_glass)

result = {"glass_material_applied": pane.name if pane else "NOT FOUND"}
print(result)
```

- [ ] **Step 3: Screenshot to verify window materials**

---

## Task 9: Three-light system

**Files:** Blender scene (MCP)

- [ ] **Step 1: Create window key light, right fill, and brick bounce via MCP**

```python
import bpy

def add_area_light(name, location, rotation_euler, energy, color, size):
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.active_object
    light.name = name
    light.rotation_euler = rotation_euler
    light.data.energy = energy
    light.data.color = color
    light.data.size = size
    return light

import math

# Window key — large area light outside the left wall, shines through window
# Positioned just beyond the window in the -X direction, angled to shine inward (+X)
add_area_light(
    name="light_window_key",
    location=(-1.20, 0.04, 1.20),
    rotation_euler=(math.radians(5), math.radians(90), 0),
    energy=400,
    color=(1.0, 0.97, 0.90),   # slightly warm daylight
    size=1.2
)

# Right fill — dim warm light opposite the window
add_area_light(
    name="light_fill_right",
    location=(1.50, 0.0, 1.0),
    rotation_euler=(0, math.radians(-90), 0),
    energy=20,
    color=(1.0, 0.92, 0.80),   # warm fill
    size=0.8
)

# Brick bounce — low warm light behind cabinet simulating brick wall bounce
add_area_light(
    name="light_bounce_brick",
    location=(0.0, 0.38, 0.30),
    rotation_euler=(math.radians(-30), 0, 0),
    energy=15,
    color=(0.95, 0.75, 0.55),   # warm amber bounce
    size=0.6
)

result = {"lights_created": ["light_window_key", "light_fill_right", "light_bounce_brick"]}
print(result)
```

- [ ] **Step 2: Set render engine to Cycles for accurate lighting preview via MCP**

```python
import bpy
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.samples = 64   # low samples for fast preview
```

- [ ] **Step 3: Render viewport preview to file**

```python
import bpy
bpy.context.scene.render.filepath = "c:/VS Code/Website Fuckery/assets/textures/preview_lighting.png"
bpy.context.scene.render.image_settings.file_format = 'PNG'
bpy.ops.render.render(write_still=True)
print({"rendered_to": bpy.context.scene.render.filepath})
```

- [ ] **Step 4: Screenshot — confirm lighting matches reference**

Key light should create bright left face on cabinet, shadow on right side. Adjust `energy` values if too bright or dark and re-run Step 1.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: apply PBR textures, window materials, and three-light system"
```

---

## Task 10: Books and plant pot

**Files:** Blender scene (MCP)

Cabinet top surface is at Z ≈ 0.8763m. Props sit on top of this.

- [ ] **Step 1: Create two stacked books via MCP**

```python
import bpy
import math

# Books sit on top of cabinet, slightly right of centre
# Cabinet top Z = 0.8763; books start from there

def make_book(name, location, scale, color, tilt_z=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    obj.rotation_euler.z = math.radians(tilt_z)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(scale=True, rotation=True)

    mat = bpy.data.materials.new(name=name + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.90
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj

# Bottom book (larger)
make_book("prop_book_1",
    location=(0.08, 0.05, 0.8763 + 0.018),
    scale=(0.22, 0.17, 0.036),
    color=(0.06, 0.06, 0.08),
    tilt_z=3)

# Top book (slightly offset and rotated)
make_book("prop_book_2",
    location=(0.07, 0.04, 0.8763 + 0.036 + 0.015),
    scale=(0.20, 0.16, 0.030),
    color=(0.10, 0.08, 0.06),
    tilt_z=-5)

result = {"created": ["prop_book_1", "prop_book_2"]}
print(result)
```

- [ ] **Step 2: Create plant pot via MCP**

```python
import bpy

# Matte black tapered cylinder (pot)
bpy.ops.mesh.primitive_cylinder_add(
    vertices=32,
    radius=0.12,
    depth=0.22,
    location=(-0.08, 0.02, 0.8763 + 0.11)   # sits on cabinet top
)
pot = bpy.context.active_object
pot.name = "prop_plant_pot"

mat = bpy.data.materials.new(name="plant_pot_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.03, 0.03, 0.03, 1.0)
bsdf.inputs["Roughness"].default_value = 0.85
pot.data.materials.clear()
pot.data.materials.append(mat)

result = {"created": pot.name}
print(result)
```

- [ ] **Step 3: Screenshot to confirm books and pot position on cabinet top**

---

## Task 11: BlenderKit plant asset

**Files:** Blender scene (BlenderKit UI + MCP for positioning)

BlenderKit requires UI interaction. This task uses the Blender interface directly.

- [ ] **Step 1: Open BlenderKit panel in Blender**

In Blender, press `N` to open the side panel → click the **BlenderKit** tab. Log in if prompted (free account required).

- [ ] **Step 2: Search for and download a large-leaf tropical plant**

In the BlenderKit search bar, type: **"monstera plant"** or **"tropical plant pot"**. Filter by **Models**. Download a large-leaf variety that matches the reference image — full, lush green leaves, ideally without its own pot (since we built the pot already), or with a pot that can be hidden.

- [ ] **Step 3: Place and position the plant via MCP**

After downloading, the asset appears at the scene origin. Rename and position it:

```python
import bpy

# Find the newly added plant object (likely named after the asset)
# Replace "Monstera" with whatever BlenderKit named it
plant_candidates = [o for o in bpy.data.objects
                    if any(kw in o.name.lower() for kw in ["monstera", "plant", "ficus", "tropical"])]

if plant_candidates:
    plant = plant_candidates[0]
    plant.name = "prop_plant"
    # Position above the pot opening (pot top at Z = 0.8763 + 0.22 = 1.096)
    plant.location = (-0.08, 0.02, 1.00)
    plant.scale = (0.9, 0.9, 0.9)   # adjust scale to match reference
    bpy.ops.object.select_all(action='DESELECT')
    plant.select_set(True)
    bpy.context.view_layer.objects.active = plant
    bpy.ops.object.transform_apply(scale=True)
    result = {"positioned": plant.name, "location": list(plant.location)}
else:
    result = {"error": "No plant object found — check BlenderKit download"}
print(result)
```

- [ ] **Step 4: Screenshot to confirm plant visible on cabinet**

---

## Task 12: Framed blueprint art print

**Files:** Blender scene (MCP)

The framed print hangs on the back brick wall, upper-right as in the reference.

- [ ] **Step 1: Build frame and backing via MCP**

```python
import bpy

# Print position: upper-right on back wall
# Back wall at Y = 0.42; print hangs flush against it
PRINT_X =  0.35    # offset right of centre
PRINT_Y =  0.40    # against back wall face
PRINT_Z =  1.55    # centre height (upper portion of wall)
PRINT_W =  0.40    # width
PRINT_H =  0.50    # height
FT       =  0.025  # frame thickness

def box(name, loc, scale, color, roughness=0.9, metalness=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(scale=True)
    mat = bpy.data.materials.new(name + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metalness
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj

# Dark frame pieces (4 sides)
box("prop_art_frame_top",    (PRINT_X, PRINT_Y, PRINT_Z + PRINT_H/2 + FT/2), (PRINT_W + 2*FT, FT, FT), (0.05,0.05,0.05), 0.4, 0.7)
box("prop_art_frame_bottom", (PRINT_X, PRINT_Y, PRINT_Z - PRINT_H/2 - FT/2), (PRINT_W + 2*FT, FT, FT), (0.05,0.05,0.05), 0.4, 0.7)
box("prop_art_frame_left",   (PRINT_X - PRINT_W/2 - FT/2, PRINT_Y, PRINT_Z), (FT, FT, PRINT_H), (0.05,0.05,0.05), 0.4, 0.7)
box("prop_art_frame_right",  (PRINT_X + PRINT_W/2 + FT/2, PRINT_Y, PRINT_Z), (FT, FT, PRINT_H), (0.05,0.05,0.05), 0.4, 0.7)

# Dark navy backing
box("prop_art_backing", (PRINT_X, PRINT_Y - 0.005, PRINT_Z), (PRINT_W, 0.01, PRINT_H), (0.05, 0.08, 0.14))

result = {"created": ["prop_art_frame_top","prop_art_frame_bottom","prop_art_frame_left","prop_art_frame_right","prop_art_backing"]}
print(result)
```

- [ ] **Step 2: Screenshot to confirm art print position on back wall**

---

## Task 13: Right-side furniture (BlenderKit)

**Files:** Blender scene (BlenderKit UI + MCP for positioning)

- [ ] **Step 1: Import desk lamp from BlenderKit**

In the BlenderKit panel, search: **"desk lamp"** or **"adjustable arm lamp"**. Pick a black industrial-style lamp. Download and place in scene.

- [ ] **Step 2: Position desk lamp via MCP**

```python
import bpy

lamp_candidates = [o for o in bpy.data.objects
                   if any(kw in o.name.lower() for kw in ["lamp", "light_fixture", "desk lamp"])]
if lamp_candidates:
    lamp = lamp_candidates[0]
    lamp.name = "prop_desk_lamp"
    lamp.location = (0.55, 0.15, 0.90)   # upper-right, near back wall
    result = {"positioned": lamp.name}
else:
    result = {"error": "lamp not found — rename manually and re-run"}
print(result)
```

- [ ] **Step 3: Import partial desk from BlenderKit**

Search: **"office desk"** or **"industrial desk"**. Pick dark metal frame + wood top. Download.

- [ ] **Step 4: Position desk via MCP (only right edge visible in frame)**

```python
import bpy

desk_candidates = [o for o in bpy.data.objects
                   if any(kw in o.name.lower() for kw in ["desk", "table_office"])]
if desk_candidates:
    desk = desk_candidates[0]
    desk.name = "prop_desk"
    desk.location = (0.90, -0.20, 0.0)   # partially off right edge of frame
    result = {"positioned": desk.name}
else:
    result = {"error": "desk not found — rename manually"}
print(result)
```

- [ ] **Step 5: Import office chair from BlenderKit**

Search: **"office chair"** or **"task chair"**. Pick dark grey/charcoal high-back style. Download.

- [ ] **Step 6: Position chair via MCP (only partially visible at right frame edge)**

```python
import bpy

chair_candidates = [o for o in bpy.data.objects
                    if any(kw in o.name.lower() for kw in ["chair", "seat"])]
if chair_candidates:
    chair = chair_candidates[0]
    chair.name = "prop_chair"
    chair.location = (1.10, -0.30, 0.0)   # partially off right edge
    result = {"positioned": chair.name}
else:
    result = {"error": "chair not found — rename manually"}
print(result)
```

- [ ] **Step 7: Screenshot to confirm right-side furniture partially visible**

---

## Task 14: Left foreground table and area rug

**Files:** Blender scene (BlenderKit UI + MCP)

- [ ] **Step 1: Import or build partial foreground table**

Option A (BlenderKit): search **"dining table"** or **"side table"**, pick warm-wood + dark metal legs.

Option B (hand-built) if no suitable BlenderKit asset:

```python
import bpy

def box(name, loc, scale, color, roughness=0.7, metalness=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(scale=True)
    mat = bpy.data.materials.new(name + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metalness
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj

# Table top (warm walnut)
box("prop_table_top",    (-1.10, -0.80, 0.73), (0.8, 1.2, 0.04), (0.35, 0.22, 0.12))
# Legs (dark metal)
for i, (x, y) in enumerate([(-0.9,-0.3),(-0.9,-1.2),(-1.4,-0.3),(-1.4,-1.2)]):
    box(f"prop_table_leg_{i+1}", (x, y, 0.365), (0.05, 0.05, 0.73), (0.08,0.08,0.08), 0.4, 0.8)

result = {"created": "prop_table (top + 4 legs)"}
print(result)
```

- [ ] **Step 2: Position table (only right edge visible, left foreground)**

```python
import bpy

table = bpy.data.objects.get("prop_table_top")
if table:
    # Only the right corner should peek into the left edge of the camera frame
    table.location.x = -1.10
    table.location.y = -0.80
    print({"adjusted": table.name, "location": list(table.location)})
```

- [ ] **Step 3: Add area rug via MCP**

```python
import bpy

bpy.ops.mesh.primitive_plane_add(size=1, location=(0.60, -0.60, 0.002))
rug = bpy.context.active_object
rug.name = "prop_rug"
rug.scale = (1.2, 0.9, 1)
bpy.ops.object.select_all(action='DESELECT')
rug.select_set(True)
bpy.context.view_layer.objects.active = rug
bpy.ops.object.transform_apply(scale=True)

mat = bpy.data.materials.new("rug_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.28, 0.26, 0.24, 1.0)   # warm mid-grey
bsdf.inputs["Roughness"].default_value = 0.98
rug.data.materials.clear()
rug.data.materials.append(mat)

result = {"created": rug.name}
print(result)
```

- [ ] **Step 4: Screenshot to confirm foreground props visible in camera view**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add all scene props (books, plant, art, furniture, rug)"
```

---

## Task 15: Final render verification

**Files:** Blender scene (MCP)

- [ ] **Step 1: Set frame to 1 (drawer closed) and render still via MCP**

```python
import bpy

bpy.context.scene.frame_set(1)
bpy.context.scene.render.filepath = "c:/VS Code/Website Fuckery/assets/textures/render_final_closed.png"
bpy.context.scene.render.image_settings.file_format = 'PNG'
bpy.context.scene.cycles.samples = 128
bpy.ops.render.render(write_still=True)
print({"rendered": bpy.context.scene.render.filepath})
```

- [ ] **Step 2: Set frame to 49 (drawer open) and render via MCP**

```python
import bpy

bpy.context.scene.frame_set(49)
bpy.context.scene.render.filepath = "c:/VS Code/Website Fuckery/assets/textures/render_final_open.png"
bpy.ops.render.render(write_still=True)
print({"rendered": bpy.context.scene.render.filepath})
```

- [ ] **Step 3: Compare renders to reference image**

Open `assets/textures/render_final_closed.png` and compare side-by-side with the reference image. Check:
- [ ] Brick wall visible behind cabinet, similar colour and scale
- [ ] Window visible left side, light casting inward
- [ ] Cabinet in right portion of frame
- [ ] Props on cabinet top (plant, books)
- [ ] Art print on back wall, upper right
- [ ] Partial desk/chair visible right edge
- [ ] Floor has slight sheen
- [ ] Lighting: bright left face, dark right face on cabinet

- [ ] **Step 4: Verify drawer open render (frame 49)**

- [ ] Drawer protrudes correctly with no clipping into room elements
- [ ] Cabinet right side still in shadow (dramatic look preserved)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Blender scene Sub-project 1 complete — industrial office environment"
```
