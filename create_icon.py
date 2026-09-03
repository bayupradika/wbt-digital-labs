import os
from PIL import Image

image_path = 'C:/Users/Asus/.gemini/antigravity/brain/ac259619-c2c5-47a3-9939-2869993b7585/.user_uploaded/media_1788444344493.jpg'
build_dir = 'd:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/build'

if not os.path.exists(build_dir):
    os.makedirs(build_dir)

img = Image.open(image_path)
width, height = img.size

# Crop to center square
size = min(width, height)
left = (width - size) / 2
top = (height - size) / 2
right = (width + size) / 2
bottom = (height + size) / 2

img_cropped = img.crop((left, top, right, bottom))
img_cropped = img_cropped.resize((256, 256), Image.Resampling.LANCZOS)

# Save as PNG
png_path = os.path.join(build_dir, 'icon.png')
img_cropped.save(png_path, format='PNG')

# Save as ICO
ico_path = os.path.join(build_dir, 'icon.ico')
img_cropped.save(ico_path, format='ICO', sizes=[(256, 256)])

print("Icon created successfully.")
