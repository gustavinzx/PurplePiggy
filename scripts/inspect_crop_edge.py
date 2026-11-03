from PIL import Image
import numpy as np

# Let's inspect 06-home left and right edge
img = Image.open('design/LayoutDoApp.png')
# for 06-home: x1=60, x2=265, y1=498, y2=810
crop = np.array(img.crop((60, 498, 265, 810)))
print("06-home left edge (col 0):")
for y in range(0, crop.shape[0], 20):
    print(f"y={y}: left={crop[y, 0][:3].tolist()}, right={crop[y, -1][:3].tolist()}")

# Look at bottom edge:
print("\n06-home bottom edge (row -1):")
for x in range(0, crop.shape[1], 15):
    print(f"x={x}: bot={crop[-1, x][:3].tolist()}")
