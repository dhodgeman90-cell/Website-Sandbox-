# 4-Drawer Base Cabinet — Blender Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a photorealistic soft-white shaker 4-drawer base cabinet (30"×34.5"×24") in Blender via MCP, with matte black bar pulls and Cycles studio lighting.

**Architecture:** Each cabinet component is a separate named mesh object. Materials are shared Principled BSDF datablocks assigned by name. Lighting uses area lights (no external HDRI file required). The scene uses metric millimetres (scale_length=0.001).

**Tech Stack:** Blender 4.x via `mcp__blender__execute_blender_code`, bpy, bmesh, Cycles renderer.

**Spec:** `docs/superpowers/specs/2026-05-20-blender-4-drawer-cabinet-design.md`

---

## Key Constants (all values in mm)

```
CAB_W   = 762      # 30"
CAB_H   = 876      # 34.5"
CAB_D   = 609.6    # 24"
T       = 18       # panel thickness (sides, top, bottom)
BT      = 6        # back panel thickness
TKH     = 88.9     # toe kick height (3.5")
TKR     = 76.2     # toe kick recess from face (3")
FF_W    = 38       # face frame stile/rail width (1.5")
FF_T    = 19       # face frame thickness (3/4")
DF_H    = 175.5    # drawer front height (4 equal drawers + 3 gaps in usable opening)
DF_W    = 692      # drawer front width (opening 686 + 3mm overlay each side)
DF_T    = 19       # drawer front thickness
FRAME_W = 44       # shaker rail/stile width
RECESS  = 8        # shaker panel recess depth
PULL_L  = 125      # bar pull total length
PULL_R  = 5        # bar pull bar radius (10mm diameter)
PULL_CC = 96       # bar pull center-to-center
STANDOFF = 20      # bar pull standoff from drawer face
POST_R  = 4        # mounting post radius
```

---

## Reusable Helper (include in every task that needs it)

```python
import bpy, bmesh, math

def make_box(name, x, y, z, w, d, h, collection=None):
    """Create a precise box. x,y,z = min corner. w=x-dim, d=y-dim, h=z-dim. All mm."""
    verts = [
        (x,   y,   z),   (x+w, y,   z),   (x+w, y+d, z),   (x,   y+d, z),
        (x,   y,   z+h), (x+w, y,   z+h), (x+w, y+d, z+h), (x,   y+d, z+h),
    ]
    faces = [(0,1,2,3),(4,5,6,7),(0,1,5,4),(2,3,7,6),(0,3,7,4),(1,2,6,5)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    coll = collection or bpy.context.scene.collection
    coll.objects.link(obj)
    return obj

def apply_boolean(base_obj, cutter_obj, operation='DIFFERENCE'):
    """Apply a boolean modifier and remove the cutter."""
    mod = base_obj.modifiers.new("bool_op", 'BOOLEAN')
    mod.operation = operation
    mod.object = cutter_obj
    mod.solver = 'EXACT'
    bpy.ops.object.select_all(action='DESELECT')
    base_obj.select_set(True)
    bpy.context.view_layer.objects.active = base_obj
    bpy.ops.object.modifier_apply(modifier="bool_op")
    bpy.data.objects.remove(cutter_obj, do_unlink=True)
```

---

## Task 1: Scene Setup

**Blender objects affected:** scene settings, world, render engine

- [ ] **Step 1: Configure scene units, renderer, and color management**

```python
import bpy

scene = bpy.context.scene

# Metric millimetres
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 0.001
scene.unit_settings.length_unit = 'MILLIMETERS'

# Cycles renderer
scene.render.engine = 'CYCLES'
scene.cycles.samples = 256
scene.cycles.use_denoising = True
try:
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'
except:
    scene.cycles.denoiser = 'NLM'

# Filmic color management
scene.view_settings.view_transform = 'Filmic'
scene.view_settings.look = 'Medium Contrast'

# Black world background (we'll add lights manually)
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.05, 0.05, 0.05, 1.0)
    bg.inputs[1].default_value = 0.0
scene.world = world

result = {"status": "scene configured", "engine": scene.render.engine,
          "units": scene.unit_settings.length_unit}
```

- [ ] **Step 2: Verify scene is configured**

Call `mcp__blender__get_objects_summary` — confirm scene is empty (no geometry objects).

---

## Task 2: Cabinet Box

**Blender objects created:** `cab_left`, `cab_right`, `cab_top`, `cab_bottom`, `cab_back`

Cabinet coordinate system:
- X: 0 (left outside face) → 762 (right outside face)
- Y: 0 (front face of box) → 609.6 (back)
- Z: 0 (floor) → 876 (top)

- [ ] **Step 1: Build the 5 box panels**

```python
import bpy, bmesh

def make_box(name, x, y, z, w, d, h):
    verts = [
        (x,   y,   z),   (x+w, y,   z),   (x+w, y+d, z),   (x,   y+d, z),
        (x,   y,   z+h), (x+w, y,   z+h), (x+w, y+d, z+h), (x,   y+d, z+h),
    ]
    faces = [(0,1,2,3),(4,5,6,7),(0,1,5,4),(2,3,7,6),(0,3,7,4),(1,2,6,5)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj

# Side panels (full height, full depth)
make_box("cab_left",  0,    0, 0,  18,  609.6, 876)
make_box("cab_right", 744,  0, 0,  18,  609.6, 876)

# Top panel (spans between inner faces of sides, flush at top)
make_box("cab_top",   18,   0, 858, 726, 609.6, 18)

# Bottom panel (sits above toe kick)
make_box("cab_bottom", 18,  0, 88.9, 726, 609.6, 18)

# Back panel (6mm, flush with back edge, full height)
make_box("cab_back",  18, 603.6, 0, 726, 6, 876)

result = {"status": "cabinet box created", "panels": ["cab_left","cab_right","cab_top","cab_bottom","cab_back"]}
```

- [ ] **Step 2: Take a viewport screenshot to verify box geometry**

Call `mcp__blender__get_screenshot_of_window_as_image`. Confirm 5 panel objects form a cabinet box shape. The front should be open (no face frame yet).

---

## Task 3: Face Frame

**Blender objects created:** `ff_left_stile`, `ff_right_stile`, `ff_top_rail`, `ff_bottom_rail`

Face frame sits at Y = -19 to 0 (19mm proud of the box front face).

- [ ] **Step 1: Build face frame pieces**

```python
import bpy

def make_box(name, x, y, z, w, d, h):
    verts = [
        (x,   y,   z),   (x+w, y,   z),   (x+w, y+d, z),   (x,   y+d, z),
        (x,   y,   z+h), (x+w, y,   z+h), (x+w, y+d, z+h), (x,   y+d, z+h),
    ]
    faces = [(0,1,2,3),(4,5,6,7),(0,1,5,4),(2,3,7,6),(0,3,7,4),(1,2,6,5)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj

# Left stile: full height, 38mm wide, 19mm deep
make_box("ff_left_stile",  0,   -19, 0,  38,  19, 876)

# Right stile: full height, 38mm wide
make_box("ff_right_stile", 724, -19, 0,  38,  19, 876)

# Top rail: spans between stiles, at top (below top panel)
# z = 876 - 38 = 838 (top of rail flush with top of cabinet)
make_box("ff_top_rail",    38,  -19, 838, 686, 19, 38)

# Bottom rail: sits at top of toe kick
# z = 88.9 (toe kick height), h = 38
make_box("ff_bottom_rail", 38,  -19, 88.9, 686, 19, 38)

result = {"status": "face frame created",
          "opening_width_mm": 686, "opening_height_mm": 711.1}
```

- [ ] **Step 2: Screenshot to verify face frame**

Call `mcp__blender__get_screenshot_of_window_as_image`. Confirm face frame stiles and rails form a rectangular opening on the cabinet front.

---

## Task 4: Toe Kick

**Blender objects created:** `toe_kick`

Toe kick: 88.9mm tall, recessed 76.2mm from the face, spans full cabinet width.

- [ ] **Step 1: Build toe kick**

```python
import bpy

def make_box(name, x, y, z, w, d, h):
    verts = [
        (x,   y,   z),   (x+w, y,   z),   (x+w, y+d, z),   (x,   y+d, z),
        (x,   y,   z+h), (x+w, y,   z+h), (x+w, y+d, z+h), (x,   y+d, z+h),
    ]
    faces = [(0,1,2,3),(4,5,6,7),(0,1,5,4),(2,3,7,6),(0,3,7,4),(1,2,6,5)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj

# Toe kick: x=0 full width, y=76.2 (recessed), z=0, height=88.9
# depth = box front (y=0) minus recess (y=76.2) → d = 609.6 - 76.2 = 533.4
make_box("toe_kick", 0, 76.2, 0, 762, 533.4, 88.9)

result = {"status": "toe kick created"}
```

- [ ] **Step 2: Screenshot to verify toe kick**

Call `mcp__blender__get_screenshot_of_window_as_image`. Confirm the toe kick sits at the base and is recessed from the face.

---

## Task 5: Drawer Fronts (Shaker Style)

**Blender objects created:** `drawer_front_1` through `drawer_front_4`

Each drawer front: 692mm wide × 175.5mm tall × 19mm deep. A 44mm-wide shaker frame is created by boolean-subtracting a recess 8mm deep from the front face. The fronts sit at Y = -38 to -19 (in front of the face frame).

Drawer Z positions (bottom edge of each front):
- Drawer 1 (bottom): 126.9
- Drawer 2: 305.4
- Drawer 3: 483.9
- Drawer 4: 662.4

X start: (762 - 692) / 2 = 35

- [ ] **Step 1: Build all 4 shaker drawer fronts**

```python
import bpy, bmesh

def make_box(name, x, y, z, w, d, h):
    verts = [
        (x,   y,   z),   (x+w, y,   z),   (x+w, y+d, z),   (x,   y+d, z),
        (x,   y,   z+h), (x+w, y,   z+h), (x+w, y+d, z+h), (x,   y+d, z+h),
    ]
    faces = [(0,1,2,3),(4,5,6,7),(0,1,5,4),(2,3,7,6),(0,3,7,4),(1,2,6,5)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj

def make_shaker_front(name, x, y, z, w=692, h=175.5, t=19, fw=44, recess=8):
    """Create a shaker drawer front with a recessed center panel."""
    base = make_box(name, x, y, z, w, t, h)

    # Inner dimensions for the recess
    inner_w = w - 2 * fw   # 692 - 88 = 604
    inner_h = h - 2 * fw   # 175.5 - 88 = 87.5

    # Cutter: starts at front face (y), cuts 8mm deep
    cutter = make_box(f"_cut_{name}", x + fw, y, z + fw, inner_w, recess, inner_h)

    # Apply boolean difference
    mod = base.modifiers.new("shaker", 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = cutter
    mod.solver = 'EXACT'
    bpy.ops.object.select_all(action='DESELECT')
    base.select_set(True)
    bpy.context.view_layer.objects.active = base
    bpy.ops.object.modifier_apply(modifier="shaker")
    bpy.data.objects.remove(cutter, do_unlink=True)
    return base

DF_W = 692
DF_H = 175.5
x_start = (762 - DF_W) / 2   # = 35
y_front = -38                  # in front of face frame

z_positions = [126.9, 305.4, 483.9, 662.4]

for i, z in enumerate(z_positions):
    make_shaker_front(f"drawer_front_{i+1}", x_start, y_front, z)

result = {"status": "4 shaker drawer fronts created",
          "x_start": x_start, "y": y_front, "z_positions": z_positions}
```

- [ ] **Step 2: Screenshot to verify drawer fronts**

Call `mcp__blender__get_screenshot_of_window_as_image`. Confirm 4 drawer fronts with visible shaker recesses are positioned in the face frame opening.

---

## Task 6: Bar Pull Handles

**Blender objects created:** `pull_bar_1`–`pull_bar_4`, `pull_post_L_1`–`pull_post_R_4`

Each pull: a horizontal cylinder (bar) + two vertical posts. Bar is 125mm long × 10mm diameter, posts are 8mm diameter × 20mm tall. All centered on the drawer front.

- [ ] **Step 1: Build one complete bar pull, then duplicate for all 4 drawers**

```python
import bpy, bmesh, math

def make_cylinder(name, cx, cy, cz, radius, height, axis='Z'):
    """Create a cylinder mesh. cx,cy,cz = center bottom. axis = extrusion axis."""
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()
    segs = 16
    if axis == 'X':
        # Horizontal bar along X
        bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs,
                               radius1=radius, radius2=radius, depth=height)
        # Rotate 90° around Y so it lies along X
        import mathutils
        mat = mathutils.Matrix.Rotation(math.radians(90), 4, 'Y')
        bmesh.ops.transform(bm, matrix=mat, verts=bm.verts)
    elif axis == 'Y':
        # Post along Y
        bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs,
                               radius1=radius, radius2=radius, depth=height)
        import mathutils
        mat = mathutils.Matrix.Rotation(math.radians(90), 4, 'X')
        bmesh.ops.transform(bm, matrix=mat, verts=bm.verts)
    else:
        bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs,
                               radius1=radius, radius2=radius, depth=height)

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj.location = (cx, cy, cz)
    return obj

DF_W = 692
DF_H = 175.5
x_start = 35.0
y_front = -38.0
PULL_L = 125.0
PULL_R = 5.0
PULL_CC = 96.0
POST_R = 4.0
STANDOFF = 20.0
z_positions = [126.9, 305.4, 483.9, 662.4]

for i, z_df in enumerate(z_positions):
    n = i + 1
    # Center of this drawer front
    cx = x_start + DF_W / 2      # 381
    cz = z_df + DF_H / 2         # vertical center of drawer front

    # Y position: bar sits STANDOFF mm in front of the drawer face
    # Drawer front face (front face) is at y = y_front = -38
    # Bar center Y: y_front - STANDOFF = -38 - 20 = -58
    bar_y = y_front - STANDOFF

    # Bar: horizontal cylinder centered at (cx, bar_y, cz)
    make_cylinder(f"pull_bar_{n}", cx, bar_y, cz, PULL_R, PULL_L, axis='X')

    # Left post: at left end of CC spacing, runs from bar_y back to drawer face
    # Post center X: cx - PULL_CC/2
    post_lx = cx - PULL_CC / 2
    post_rx = cx + PULL_CC / 2
    # Post runs along Y from bar_y to y_front, center Y = midpoint
    post_cy = (bar_y + y_front) / 2  # = (-58 + -38)/2 = -48
    post_len = abs(y_front - bar_y)   # = 20

    make_cylinder(f"pull_post_L_{n}", post_lx, post_cy, cz, POST_R, post_len, axis='Y')
    make_cylinder(f"pull_post_R_{n}", post_rx, post_cy, cz, POST_R, post_len, axis='Y')

result = {"status": "bar pulls created", "count": 4,
          "bar_y_position": -58, "bar_x_center": 381}
```

- [ ] **Step 2: Screenshot to verify handles**

Call `mcp__blender__get_screenshot_of_window_as_image`. Confirm bar pulls are centered on each drawer front and protrude correctly.

---

## Task 7: Materials

**Materials created:** `mat_cabinet_white`, `mat_toe_kick`, `mat_pull_black`

- [ ] **Step 1: Create the 3 materials**

```python
import bpy

def make_principled_material(name, base_color, roughness, metallic=0.0,
                              specular=0.5, sheen=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()

    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

    bsdf.inputs['Base Color'].default_value = (*base_color, 1.0)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    # Specular IOR level (Blender 4.x uses 'Specular IOR Level')
    try:
        bsdf.inputs['Specular IOR Level'].default_value = specular
    except KeyError:
        try:
            bsdf.inputs['Specular'].default_value = specular
        except KeyError:
            pass
    try:
        bsdf.inputs['Sheen Weight'].default_value = sheen
    except KeyError:
        try:
            bsdf.inputs['Sheen'].default_value = sheen
        except KeyError:
            pass
    return mat

# Soft white — Benjamin Moore White Dove approximation
mat_white = make_principled_material(
    "mat_cabinet_white",
    base_color=(0.96, 0.93, 0.90),
    roughness=0.55,
    metallic=0.0,
    specular=0.3,
    sheen=0.05
)

# Dark charcoal toe kick
mat_dark = make_principled_material(
    "mat_toe_kick",
    base_color=(0.04, 0.04, 0.04),
    roughness=0.85,
    metallic=0.0,
    specular=0.05
)

# Matte black metal for bar pulls
mat_pull = make_principled_material(
    "mat_pull_black",
    base_color=(0.02, 0.02, 0.02),
    roughness=0.4,
    metallic=1.0,
    specular=0.5
)

result = {"status": "materials created",
          "materials": ["mat_cabinet_white", "mat_toe_kick", "mat_pull_black"]}
```

- [ ] **Step 2: Assign materials to objects**

```python
import bpy

def assign_material(obj_name, mat_name):
    obj = bpy.data.objects.get(obj_name)
    mat = bpy.data.materials.get(mat_name)
    if obj and mat:
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)
        return True
    return False

# Cabinet box and face frame → white
white_objects = [
    "cab_left", "cab_right", "cab_top", "cab_bottom", "cab_back",
    "ff_left_stile", "ff_right_stile", "ff_top_rail", "ff_bottom_rail",
    "drawer_front_1", "drawer_front_2", "drawer_front_3", "drawer_front_4",
]
for name in white_objects:
    assign_material(name, "mat_cabinet_white")

# Toe kick → dark
assign_material("toe_kick", "mat_toe_kick")

# Bar pulls → matte black metal
pull_objects = [f"pull_bar_{i}" for i in range(1,5)] + \
               [f"pull_post_L_{i}" for i in range(1,5)] + \
               [f"pull_post_R_{i}" for i in range(1,5)]
for name in pull_objects:
    assign_material(name, "mat_pull_black")

result = {"status": "materials assigned", "white_count": len(white_objects),
          "pull_count": len(pull_objects)}
```

- [ ] **Step 3: Screenshot to check material colours in viewport**

Call `mcp__blender__get_screenshot_of_window_as_image`. Switch viewport shading to Material Preview first:

```python
import bpy
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'
result = {"status": "viewport set to material preview"}
```

---

## Task 8: Lighting & Camera

**Objects created:** `key_light`, `fill_light`, `rim_light`, camera `Cabinet_Camera`

Studio 3-point lighting + 85mm perspective camera at 3/4 angle.

- [ ] **Step 1: Add studio lights**

```python
import bpy, math

def add_area_light(name, location, rotation_euler_deg, energy, size=500):
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.active_object
    light.name = name
    light.data.energy = energy
    light.data.size = size
    light.rotation_euler = [math.radians(d) for d in rotation_euler_deg]
    return light

# Cabinet center is at (381, 304.8, 438) — x=W/2, y=D/2, z=H/2
# All light positions are in mm

# Key light: upper-left-front, warm white
add_area_light(
    "key_light",
    location=(-800, -1200, 1400),
    rotation_euler_deg=[45, 0, -30],
    energy=500000,
    size=600
)

# Fill light: right side, softer
add_area_light(
    "fill_light",
    location=(1600, -400, 900),
    rotation_euler_deg=[20, 0, 60],
    energy=150000,
    size=800
)

# Rim light: behind and above, creates edge separation
add_area_light(
    "rim_light",
    location=(0, 1800, 1600),
    rotation_euler_deg=[-50, 0, 0],
    energy=200000,
    size=400
)

result = {"status": "lights created", "lights": ["key_light","fill_light","rim_light"]}
```

- [ ] **Step 2: Add camera**

```python
import bpy, math

# Remove any existing cameras
for obj in list(bpy.data.objects):
    if obj.type == 'CAMERA':
        bpy.data.objects.remove(obj, do_unlink=True)

# Add camera
bpy.ops.object.camera_add()
cam = bpy.context.active_object
cam.name = "Cabinet_Camera"

# 85mm lens
cam.data.lens = 85
cam.data.lens_unit = 'MILLIMETERS'

# Position: 3/4 angle — left-front, slightly above center
# Cabinet occupies roughly X:0-762, Y:0-610, Z:0-876
# Place camera at X=-800 (left), Y=-2500 (front), Z=700 (slightly above center)
cam.location = (-800, -2500, 700)

# Point camera at cabinet center (381, 305, 438)
# Use track-to constraint
constraint = cam.constraints.new(type='TRACK_TO')
constraint.target = None  # We'll use a plain axes empty as target

# Create an empty at cabinet center to track to
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(381, 305, 438))
target = bpy.context.active_object
target.name = "cam_target"
constraint.target = target
constraint.track_axis = 'TRACK_NEGATIVE_Z'
constraint.up_axis = 'UP_Y'

# Set as active camera
bpy.context.scene.camera = cam

result = {"status": "camera set up", "lens_mm": 85,
          "location": list(cam.location)}
```

- [ ] **Step 3: Screenshot to verify camera angle and lighting**

Call `mcp__blender__get_screenshot_of_window_as_image`. Should show the cabinet from a 3/4 left-front angle with visible lighting.

To preview the camera view:
```python
import bpy
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.region_3d.view_perspective = 'CAMERA'
result = {"status": "switched to camera view"}
```

---

## Task 9: Test Render & Final Adjustments

- [ ] **Step 1: Set render resolution and do a quick 64-sample render**

```python
import bpy

scene = bpy.context.scene
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.cycles.samples = 64  # Fast preview first
scene.cycles.use_denoising = True

# Set output path
scene.render.filepath = "C:/Users/dhodg/Desktop/cabinet_preview.png"
scene.render.image_settings.file_format = 'PNG'

bpy.ops.render.render(write_still=True)
result = {"status": "preview render complete", "path": scene.render.filepath}
```

- [ ] **Step 2: Check the render**

Call `mcp__blender__get_screenshot_of_window_as_image` — switch to the rendered image first:
```python
import bpy
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'RENDERED'
result = {"status": "viewport set to rendered mode"}
```

- [ ] **Step 3: Final high-quality render at 512 samples**

After reviewing the preview and making any tweaks:

```python
import bpy
scene = bpy.context.scene
scene.cycles.samples = 512
scene.render.filepath = "C:/Users/dhodg/Desktop/cabinet_final.png"
bpy.ops.render.render(write_still=True)
result = {"status": "final render complete", "path": scene.render.filepath}
```

**Acceptance criteria:**
- Soft white reads as warm, not cold/blue
- Shaker recesses are visible with crisp shadow lines
- Bar pulls read as distinctly matte black with a subtle specular highlight
- Toe kick is dark and recessed
- Cabinet proportions match 30"×34.5"×24" spec
