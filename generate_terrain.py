import bpy
import bmesh
import math
from mathutils.noise import noise

# USING FORWARD SLASHES TO AVOID ESCAPE CHARACTER BUGS
output_file = 'D:/Produk-Sell/game/Core-Stone-Assets/Reference Character/4_Peta_Lingkungan/terrain_fase1.fbx'

# Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Create a grid (Terrain) 100x100 meters
bpy.ops.mesh.primitive_grid_add(size=100, x_subdivisions=40, y_subdivisions=40)
terrain = bpy.context.active_object
terrain.name = 'Terrain_Fase1'

# Add displacement (hills/cliffs)
bpy.ops.object.mode_set(mode='EDIT')
bm = bmesh.from_edit_mesh(terrain.data)
for v in bm.verts:
    # 1. Perbukitan Acak (Noise)
    n = noise(v.co.xyz * 0.1) * 2.0
    
    # 2. Tebing Laut di Utara (Y > 20) untuk tempat CSM
    if v.co.y > 20:
        n += (v.co.y - 20) * 1.5
    
    # 3. Area Desa Datar di Tengah (X antara -15 s/d 15, Y antara -20 s/d 10)
    if -15 < v.co.x < 15 and -20 < v.co.y < 10:
        n = 0.0 # Tanah rata untuk bangun desa
        
    v.co.z = n

bmesh.update_edit_mesh(terrain.data)
bpy.ops.object.mode_set(mode='OBJECT')

# Beri warna material hijau dasar (Low Poly Look)
mat = bpy.data.materials.new(name='GrassMaterial')
mat.diffuse_color = (0.2, 0.6, 0.2, 1.0)
terrain.data.materials.append(mat)

# Terapkan Decimate sedikit agar terlihat Low-Poly bersudut (stylized)
mod = terrain.modifiers.new(name='Decimate', type='DECIMATE')
mod.ratio = 0.5
bpy.context.view_layer.objects.active = terrain
bpy.ops.object.modifier_apply(modifier='Decimate')

# Export FBX
bpy.ops.export_scene.fbx(filepath=output_file)
print('SUCCESS_TERRAIN')
