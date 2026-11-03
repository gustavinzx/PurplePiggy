from PIL import Image
import numpy as np

img = Image.open('design/LayoutDoApp.png')
w, h = img.size
print(f"Image size: {w}x{h}")

arr = np.array(img)

# Save a crop around phone 0 and header to scripts/
crop_phone_0 = img.crop((30, 100, 300, 480))
crop_phone_0.save('scripts/crop_phone_0.png')

crop_header = img.crop((0, 0, w, 130))
crop_header.save('scripts/crop_header.png')

print("Saved crop_phone_0.png and crop_header.png")
