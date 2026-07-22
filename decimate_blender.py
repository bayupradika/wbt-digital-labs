import bpy
import sys

input_file = r'D:\Produk-Sell\game\Core-Stone-Assets\Reference Character\Model3D\Character\player.obj'
output_file = r'D:\Produk-Sell\game\Core-Stone-Assets\Reference Character\Model3D\Character\player_lowpoly.fbx'

# Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import OBJ (OBJ is cleaner for applying modifiers than FBX which might have rigs)
bpy.ops.wm.obj_import(filepath=input_file)

# Decimate all meshes to 15% (Low poly look)
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        mod = obj.modifiers.new(name='Decimate', type='DECIMATE')
        mod.ratio = 0.15 # Keep only 15% of polygons
        
        # Apply the modifier
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier='Decimate')

# Export FBX
bpy.ops.export_scene.fbx(filepath=output_file, path_mode='COPY', embed_textures=True)
print('SUCCESS_DECIMATE')
