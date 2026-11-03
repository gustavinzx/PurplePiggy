from PIL import Image
import numpy as np

img = Image.open('design/LayoutDoApp.png')
w, h = img.size
arr = np.array(img)

# Let's inspect the header region (y from 0 to 125, x from 0 to w)
# Find the non-empty bounding box of the header elements:
# Logo, slogan, and 4 chips:
# Let's see what is inside y=0..125:
header = arr[0:125, :]
# Background of the image is light lilac, approx [245, 230, 253] or similar.
# Let's check the pixel values across y:
for y in range(0, 125, 5):
    # print mean and min color
    row = header[y]
    print(f"y={y:2d}: min={np.min(row, axis=0).tolist()}, mean={np.mean(row, axis=0).astype(int).tolist()}")

# Let's save a crop of y from 10 to 115 and x from 30 to 1280
header_img = img.crop((40, 10, 1270, 115))
header_img.save('scripts/test_header.png')
print("Saved test_header.png")
