"""Build a standalone Blender asset from cabinet-hero-main.jpg.

Run with Blender 4.2+:
    blender --background --python build_apex_cabinet.py

The script writes apex_archive_cabinet.blend, apex_archive_cabinet.glb,
and apex_archive_cabinet_preview.png beside itself.
"""

import math
import os
from pathlib import Path

import bpy
from mathutils import Vector


SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_BLEND = SCRIPT_DIR / "apex_archive_cabinet.blend"
OUTPUT_GLB = SCRIPT_DIR / "apex_archive_cabinet.glb"
OUTPUT_RENDER = SCRIPT_DIR / "apex_archive_cabinet_preview.png"
REFERENCE_IMAGE = SCRIPT_DIR.parent / "assets" / "cabinet-hero-main.jpg"

# Dimensions inferred from the single supplied photograph (meters).
WIDTH = 0.920
DEPTH = 0.470
HEIGHT = 1.650
PLINTH_HEIGHT = 0.115
FRONT_MARGIN = 0.018
DRAWER_GAP = 0.008
DRAWER_FRONT_DEPTH = 0.022
EDGE_RADIUS = 0.004


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def collection(name, parent=None):
    coll = bpy.data.collections.new(name)
    (parent.children if parent else bpy.context.scene.collection.children).link(coll)
    return coll


def move_to_collection(obj, target):
    for coll in list(obj.users_collection):
        coll.objects.unlink(obj)
    target.objects.link(obj)


def make_box(name, dimensions, location, material, coll, bevel=EDGE_RADIUS):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    move_to_collection(obj, coll)
    if material:
        obj.data.materials.append(material)
    if bevel:
        mod = obj.modifiers.new("Soft furniture edges", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        mod.limit_method = "ANGLE"
    return obj


def make_wood_material():
    mat = bpy.data.materials.new("Pale Ash - procedural vertical grain")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (720, 0)
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.location = (440, 0)
    shader.inputs["Roughness"].default_value = 0.43
    shader.inputs["IOR"].default_value = 1.46

    texcoord = nodes.new("ShaderNodeTexCoord")
    texcoord.location = (-900, 30)
    mapping = nodes.new("ShaderNodeMapping")
    mapping.location = (-700, 30)
    # Compress Z in texture space so the noise stretches vertically.
    mapping.inputs["Scale"].default_value = (5.5, 5.5, 0.42)

    noise = nodes.new("ShaderNodeTexNoise")
    noise.location = (-430, 80)
    noise.noise_dimensions = "4D"
    noise.inputs["Scale"].default_value = 3.2
    noise.inputs["Detail"].default_value = 7.0
    noise.inputs["Roughness"].default_value = 0.68
    noise.inputs["Lacunarity"].default_value = 2.2
    noise.inputs["Distortion"].default_value = 0.32

    obj_info = nodes.new("ShaderNodeObjectInfo")
    obj_info.location = (-690, -210)
    random_scale = nodes.new("ShaderNodeMath")
    random_scale.operation = "MULTIPLY"
    random_scale.inputs[1].default_value = 9.0
    random_scale.location = (-450, -210)

    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.location = (-120, 80)
    ramp.color_ramp.elements.remove(ramp.color_ramp.elements[1])
    colors = [
        (0.22, (0.135, 0.105, 0.075, 1.0)),
        (0.39, (0.250, 0.205, 0.150, 1.0)),
        (0.57, (0.440, 0.365, 0.270, 1.0)),
        (0.73, (0.205, 0.155, 0.105, 1.0)),
        (0.88, (0.345, 0.275, 0.195, 1.0)),
    ]
    first = ramp.color_ramp.elements[0]
    first.position, first.color = colors[0]
    for pos, color in colors[1:]:
        elem = ramp.color_ramp.elements.new(pos)
        elem.color = color

    bump = nodes.new("ShaderNodeBump")
    bump.location = (180, -140)
    bump.inputs["Strength"].default_value = 0.14
    bump.inputs["Distance"].default_value = 0.002

    links.new(texcoord.outputs["Generated"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
    links.new(obj_info.outputs["Random"], random_scale.inputs[0])
    links.new(random_scale.outputs[0], noise.inputs["W"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], shader.inputs["Base Color"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    links.new(shader.outputs["BSDF"], out.inputs["Surface"])
    return mat


def simple_material(name, color, roughness=0.5, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def build_cabinet(asset_coll, wood, shadow):
    root = bpy.data.objects.new("Apex Cabinet | 920W x 470D x 1650H mm", None)
    asset_coll.objects.link(root)
    root.empty_display_type = "CUBE"
    root.empty_display_size = 0.24
    root["source_reference"] = "cabinet-hero-main.jpg"
    root["dimensions_mm"] = "920 W x 470 D x 1650 H"
    root["construction"] = "Four handleless drawer fronts; recessed plinth"

    # A flush carcass is visible at the top and both sides in the reference.
    carcass = make_box(
        "Carcass - pale ash veneer",
        (WIDTH, DEPTH, HEIGHT - PLINTH_HEIGHT),
        (0, 0, PLINTH_HEIGHT + (HEIGHT - PLINTH_HEIGHT) / 2),
        wood,
        asset_coll,
        bevel=0.006,
    )
    carcass.parent = root

    # Recessed toe-kick: a shadowed void and a visible veneered front rail.
    kick_shadow = make_box(
        "Plinth top shadow line",
        (WIDTH - 0.055, 0.016, 0.008),
        (0, -DEPTH / 2 + 0.021, PLINTH_HEIGHT - 0.004),
        shadow,
        asset_coll,
        bevel=0.002,
    )
    kick_shadow.parent = root
    plinth = make_box(
        "Recessed plinth front",
        (WIDTH - 0.070, 0.018, PLINTH_HEIGHT - 0.030),
        (0, -DEPTH / 2 + 0.030, (PLINTH_HEIGHT - 0.030) / 2),
        wood,
        asset_coll,
        bevel=0.003,
    )
    plinth.parent = root

    # Four nearly equal slab fronts, separated by narrow pull/shadow reveals.
    drawer_zone_bottom = PLINTH_HEIGHT + 0.020
    drawer_zone_top = HEIGHT - 0.016
    drawer_zone_height = drawer_zone_top - drawer_zone_bottom
    front_height = (drawer_zone_height - 3 * DRAWER_GAP) / 4
    front_width = WIDTH - 2 * FRONT_MARGIN
    front_y = -DEPTH / 2 - DRAWER_FRONT_DEPTH / 2 + 0.002

    for index in range(4):
        z = drawer_zone_top - front_height / 2 - index * (front_height + DRAWER_GAP)
        front = make_box(
            f"Drawer {index + 1:02d} - slab front",
            (front_width, DRAWER_FRONT_DEPTH, front_height),
            (0, front_y, z),
            wood,
            asset_coll,
            bevel=0.0035,
        )
        front.parent = root
        front["drawer_number"] = index + 1
        front["front_height_mm"] = round(front_height * 1000, 1)

        # A shallow internal box makes the model useful if a front is pulled out.
        box_depth = DEPTH - 0.075
        drawer_box = make_box(
            f"Drawer {index + 1:02d} - concealed box",
            (front_width - 0.060, box_depth, max(front_height - 0.075, 0.18)),
            (0, 0.015, z - 0.012),
            shadow,
            asset_coll,
            bevel=0.002,
        )
        drawer_box.parent = front
        drawer_box.hide_viewport = True
        drawer_box.hide_render = True

    # Fine dark reveals at the slab boundaries create the handleless reading.
    for index in range(3):
        seam_z = drawer_zone_top - (index + 1) * front_height - index * DRAWER_GAP - DRAWER_GAP / 2
        seam = make_box(
            f"Horizontal reveal {index + 1:02d}",
            (front_width - 0.010, 0.004, DRAWER_GAP * 0.72),
            (0, -DEPTH / 2 - 0.010, seam_z),
            shadow,
            asset_coll,
            bevel=0.001,
        )
        seam.parent = root

    # A narrow base reveal is visible between the lowest front and plinth.
    seam = make_box(
        "Lower plinth reveal",
        (front_width - 0.010, 0.004, 0.006),
        (0, -DEPTH / 2 - 0.009, drawer_zone_bottom - 0.004),
        shadow,
        asset_coll,
        bevel=0.001,
    )
    seam.parent = root
    return root


def aim_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_studio(studio_coll, floor_mat, backdrop_mat):
    floor = make_box("Studio floor", (10.0, 8.0, 0.035), (0, 0, -0.020), floor_mat, studio_coll, 0.008)
    wall = make_box("Studio backdrop", (10.0, 0.040, 4.0), (0, 1.50, 2.0), backdrop_mat, studio_coll, 0.010)

    bpy.ops.object.light_add(type="AREA", location=(-2.2, -2.8, 3.2))
    key = bpy.context.object
    key.name = "Key - large softbox"
    key.data.energy = 720
    key.data.shape = "RECTANGLE"
    key.data.size = 2.3
    key.data.size_y = 2.3
    aim_at(key, (0, 0, 0.85))
    move_to_collection(key, studio_coll)

    bpy.ops.object.light_add(type="AREA", location=(2.4, -1.0, 2.2))
    fill = bpy.context.object
    fill.name = "Fill - right"
    fill.data.energy = 430
    fill.data.size = 1.8
    aim_at(fill, (0, 0, 0.9))
    move_to_collection(fill, studio_coll)

    bpy.ops.object.light_add(type="AREA", location=(0.3, 1.1, 2.9))
    rim = bpy.context.object
    rim.name = "Rim - top rear"
    rim.data.energy = 520
    rim.data.size = 1.4
    aim_at(rim, (0, 0, 1.0))
    move_to_collection(rim, studio_coll)


def add_camera(studio_coll):
    bpy.ops.object.camera_add(location=(2.55, -3.55, 2.25))
    camera = bpy.context.object
    camera.name = "Camera - product three-quarter"
    camera.data.lens = 57
    aim_at(camera, (0, 0, 0.83))
    move_to_collection(camera, studio_coll)
    bpy.context.scene.camera = camera


def add_build_notes():
    notes = bpy.data.texts.new("README - Apex Cabinet")
    notes.write(
        "Apex Archive cabinet reproduction\n"
        "===================================\n"
        "Source: assets/cabinet-hero-main.jpg\n"
        "Inferred size: 920 W x 470 D x 1650 H mm\n"
        "The photograph is a single perspective view, so dimensions and hidden\n"
        "construction are informed estimates. Main asset objects live in the\n"
        "CABINET_ASSET collection. STUDIO can be hidden or deleted.\n\n"
        "Rebuild with: blender --background --python build_apex_cabinet.py\n"
    )
    if REFERENCE_IMAGE.exists():
        image = bpy.data.images.load(str(REFERENCE_IMAGE), check_existing=True)
        image.name = "REFERENCE - cabinet-hero-main.jpg"
        image.pack()


def configure_scene():
    scene = bpy.context.scene
    # Blender 5.x shortened the enum back to BLENDER_EEVEE.
    available_engines = {item.identifier for item in scene.render.bl_rna.properties["engine"].enum_items}
    scene.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in available_engines else "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 760
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = str(OUTPUT_RENDER)
    scene.render.film_transparent = False
    scene.render.image_settings.color_depth = "8"
    scene.render.resolution_percentage = 100
    scene.render.fps = 24
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.world.color = (0.035, 0.035, 0.035)
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "METERS"
    scene.unit_settings.scale_length = 1.0


def export_glb(asset_coll):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in asset_coll.all_objects:
        if obj.type in {"MESH", "EMPTY"} and not obj.hide_render:
            obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT_GLB),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
    )


def main():
    reset_scene()
    configure_scene()
    asset_coll = collection("CABINET_ASSET")
    studio_coll = collection("STUDIO")
    wood = make_wood_material()
    shadow = simple_material("Deep warm shadow", (0.022, 0.018, 0.014, 1.0), 0.58)
    floor_mat = simple_material("Studio floor warm gray", (0.13, 0.12, 0.105, 1.0), 0.72)
    backdrop_mat = simple_material("Studio backdrop taupe", (0.20, 0.18, 0.155, 1.0), 0.82)
    root = build_cabinet(asset_coll, wood, shadow)
    add_studio(studio_coll, floor_mat, backdrop_mat)
    add_camera(studio_coll)
    add_build_notes()

    bpy.context.view_layer.objects.active = root
    root.select_set(True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    bpy.ops.render.render(write_still=True)
    export_glb(asset_coll)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"WROTE_BLEND={OUTPUT_BLEND}")
    print(f"WROTE_RENDER={OUTPUT_RENDER}")
    print(f"WROTE_GLB={OUTPUT_GLB}")


if __name__ == "__main__":
    main()
