from PIL import Image
import numpy as np

img = Image.open('design/LayoutDoApp.png')
arr = np.array(img)

# Let's inspect phone (0,0) located around x in [40, 280], y in [110, 480]
# What is the background color around the phones?
# Let's check pixel colors at (x=20, y=200), (x=50, y=200), (x=60, y=200), etc.
print("Horizontal slice at y=250 across first two phones:")
for x in range(30, 320, 5):
    print(f"x={x}: RGB={arr[250, x].tolist()}")

# Let's find dark pixels corresponding to the phone frame / bezels
# In mobile device mockups, the bezel is black or dark gray (e.g. RGB < 50)
print("\nVertical slice at x=150 (middle of first phone):")
for y in range(110, 480, 5):
    print(f"y={y}: RGB={arr[y, 150].tolist()}")
