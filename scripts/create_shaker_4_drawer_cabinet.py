"""
Create a photorealistic-ish 4 drawer shaker cabinet in Blender.

How to use:
1. Open Blender.
2. Go to the Scripting workspace.
3. Open this file in Blender's text editor.
4. Press Run Script.

The model uses real dimensions:
- 34.5 inches tall
- 24 inches deep
- 24 inches wide by default
- 4 equal-height shaker drawer fronts
- soft white painted cabinet
- matte black handles
"""

import math
import os

import bpy
from mathutils import Vector


INCH_TO_METER = 0.0254
AUTO_SAVE_BLEND_FILE = False


def inch(value):
    return value * INCH_TO_METER


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def get_output_path(filename):
    """Save beside this script so Blender does not guess a protected folder."""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
    except NameError:
        script_dir = os.getcwd()
    return os.path.join(script_dir, filename)


def make_material(name, color, roughness=0.45, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def add_cube(name, location_in, scale_in, material, bevel_in=0.03):
    bpy.ops.mesh.primitive_cube_add(size=1, location=[inch(v) for v in location_in])
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = [inch(v) for v in scale_in]
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    if material:
        obj.data.materials.append(material)

    if bevel_in > 0:
        bevel = obj.modifiers.new("Small real-world edge bevel", "BEVEL")
        bevel.width = inch(bevel_in)
        bevel.segments = 3
        bevel.affect = "EDGES"

        normals = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
        normals.keep_sharp = True

    return obj


def add_cylinder_between(name, start_in, end_in, radius_in, material, vertices=32):
    start = Vector([inch(v) for v in start_in])
    end = Vector([inch(v) for v in end_in])
    midpoint = (start + end) / 2
    direction = end - start
    length = direction.length

    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=inch(radius_in), depth=length, location=midpoint)
    obj = bpy.context.object
    obj.name = name

    # Blender cylinders point along Z by default. Rotate so the cylinder spans start -> end.
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()

    if material:
        obj.data.materials.append(material)

    bevel = obj.modifiers.new("Soft metal edge", "BEVEL")
    bevel.width = inch(0.015)
    bevel.segments = 2
    obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return obj


def add_shaker_drawer_front(index, center_z, drawer_h, dims, mats):
    width = dims["width"]
    depth = dims["depth"]
    front_y = -depth / 2 - 0.04
    face_thickness = 0.75
    face_width = width - 1.25

    rail = 2.0
    stile = 2.0
    frame_depth = 0.18
    panel_depth = 0.12

    prefix = f"Drawer {index}"

    # Slightly recessed flat center panel.
    add_cube(
        f"{prefix} recessed center panel",
        (0, front_y - panel_depth / 2, center_z),
        (face_width - 2 * stile, panel_depth, drawer_h - 2 * rail),
        mats["white"],
        bevel_in=0.025,
    )

    # Shaker frame: left/right stiles and top/bottom rails.
    add_cube(
        f"{prefix} left stile",
        (-(face_width / 2 - stile / 2), front_y - frame_depth / 2, center_z),
        (stile, frame_depth, drawer_h),
        mats["white"],
        bevel_in=0.035,
    )
    add_cube(
        f"{prefix} right stile",
        ((face_width / 2 - stile / 2), front_y - frame_depth / 2, center_z),
        (stile, frame_depth, drawer_h),
        mats["white"],
        bevel_in=0.035,
    )
    add_cube(
        f"{prefix} top rail",
        (0, front_y - frame_depth / 2, center_z + drawer_h / 2 - rail / 2),
        (face_width, frame_depth, rail),
        mats["white"],
        bevel_in=0.035,
    )
    add_cube(
        f"{prefix} bottom rail",
        (0, front_y - frame_depth / 2, center_z - drawer_h / 2 + rail / 2),
        (face_width, frame_depth, rail),
        mats["white"],
        bevel_in=0.035,
    )

    # Matte black handle: a slim horizontal pull plus two posts.
    handle_z = center_z
    handle_y = front_y - 0.55
    handle_width = min(10.0, face_width * 0.45)
    post_spacing = handle_width - 1.5

    add_cylinder_between(
        f"{prefix} black bar handle",
        (-handle_width / 2, handle_y, handle_z),
        (handle_width / 2, handle_y, handle_z),
        0.18,
        mats["black"],
    )
    for x in (-post_spacing / 2, post_spacing / 2):
        add_cylinder_between(
            f"{prefix} handle post {x:+.1f}",
            (x, front_y - 0.12, handle_z),
            (x, handle_y + 0.05, handle_z),
            0.14,
            mats["black"],
            vertices=24,
        )


def add_lighting_and_camera(dims):
    width = dims["width"]
    depth = dims["depth"]
    height = dims["height"]

    bpy.ops.object.light_add(type="AREA", location=(inch(-28), inch(-42), inch(72)))
    key = bpy.context.object
    key.name = "Large softbox key light"
    key.data.energy = 650
    key.data.size = inch(42)

    bpy.ops.object.light_add(type="AREA", location=(inch(36), inch(24), inch(48)))
    fill = bpy.context.object
    fill.name = "Gentle fill light"
    fill.data.energy = 90
    fill.data.size = inch(56)

    bpy.ops.object.camera_add(location=(inch(34), inch(-54), inch(27)), rotation=(math.radians(64), 0, math.radians(34)))
    camera = bpy.context.object
    bpy.context.scene.camera = camera

    target = Vector((0, inch(-depth / 2), inch(height / 2)))
    direction = target - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 42
    camera.data.dof.use_dof = True
    camera.data.dof.focus_distance = direction.length
    camera.data.dof.aperture_fstop = 7.5

    # A simple matte floor gives shadows somewhere to land.
    floor_mat = make_material("warm gray studio floor", (0.55, 0.54, 0.50, 1), roughness=0.75)
    add_cube("studio floor", (0, 0, -0.04), (84, 84, 0.08), floor_mat, bevel_in=0)


def create_cabinet():
    clear_scene()

    bpy.context.scene.unit_settings.system = "IMPERIAL"
    bpy.context.scene.unit_settings.scale_length = 1.0

    dims = {
        "width": 24.0,
        "depth": 24.0,
        "height": 34.5,
    }

    mats = {
        "white": make_material("soft warm white satin painted wood", (0.86, 0.84, 0.78, 1), roughness=0.58),
        "black": make_material("matte black metal", (0.002, 0.002, 0.002, 1), roughness=0.38, metallic=0.75),
        "shadow": make_material("deep cabinet shadow", (0.015, 0.013, 0.011, 1), roughness=0.8),
    }

    width = dims["width"]
    depth = dims["depth"]
    height = dims["height"]
    panel_t = 0.75
    toe_h = 4.0
    toe_setback = 3.0

    # Cabinet carcass.
    add_cube("left side panel", (-(width / 2 - panel_t / 2), 0, height / 2), (panel_t, depth, height), mats["white"])
    add_cube("right side panel", ((width / 2 - panel_t / 2), 0, height / 2), (panel_t, depth, height), mats["white"])
    add_cube("bottom panel", (0, 0, panel_t / 2), (width, depth, panel_t), mats["white"])
    add_cube("back panel", (0, depth / 2 - panel_t / 2, height / 2), (width, panel_t, height), mats["white"])
    add_cube("top front rail", (0, -depth / 2 + panel_t / 2, height - panel_t / 2), (width, panel_t, panel_t), mats["white"])
    add_cube("top back rail", (0, depth / 2 - panel_t / 2, height - panel_t / 2), (width, panel_t, panel_t), mats["white"])

    # Recessed toe kick.
    add_cube(
        "recessed black toe kick",
        (0, -depth / 2 + toe_setback, toe_h / 2),
        (width - 1.5, panel_t, toe_h),
        mats["shadow"],
        bevel_in=0.02,
    )

    # Four equal-height drawer fronts above the toe kick.
    reveal = 0.125
    drawer_zone_bottom = toe_h + 0.5
    drawer_zone_top = height - 0.75
    drawer_h = (drawer_zone_top - drawer_zone_bottom - 3 * reveal) / 4

    for i in range(4):
        z = drawer_zone_bottom + drawer_h / 2 + i * (drawer_h + reveal)
        add_shaker_drawer_front(i + 1, z, drawer_h, dims, mats)

    add_lighting_and_camera(dims)

    bpy.context.scene.render.engine = "CYCLES"
    bpy.context.scene.cycles.samples = 96
    bpy.context.scene.view_settings.view_transform = "Filmic"
    bpy.context.scene.view_settings.look = "Medium High Contrast"
    bpy.context.scene.render.resolution_x = 1600
    bpy.context.scene.render.resolution_y = 1200

    # Organize the view nicely.
    for obj in bpy.context.scene.objects:
        obj.select_set(False)
    if AUTO_SAVE_BLEND_FILE:
        bpy.ops.wm.save_as_mainfile(filepath=get_output_path("shaker_4_drawer_cabinet.blend"))

    print("Created the 4 drawer shaker cabinet. Use File > Save As in Blender when you are ready to save it.")


if __name__ == "__main__":
    create_cabinet()
