import bpy, os
bpy.ops.wm.read_factory_settings(use_empty=True)
glb_path = r'D:\Produk-Sell\game\Core-Stone-Assets\Reference Character\Model3D\Character\player.glb'
fbx_path = r'D:\Produk-Sell\game\Core-Stone-Assets\Reference Character\Model3D\Character\player.fbx'
obj_path = r'D:\Produk-Sell\game\Core-Stone-Assets\Reference Character\Model3D\Character\player.obj'

bpy.ops.import_scene.gltf(filepath=glb_path)
bpy.ops.export_scene.fbx(filepath=fbx_path, path_mode='COPY', embed_textures=True)
print('Exported FBX successfully!')
try:
    bpy.ops.wm.obj_export(filepath=obj_path, export_materials=True, path_mode='COPY')
    print('Exported OBJ successfully!')
except Exception as e:
    print('OBJ export note:', e)
