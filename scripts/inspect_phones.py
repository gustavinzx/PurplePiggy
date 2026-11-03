from PIL import Image
import numpy as np

img = Image.open('design/LayoutDoApp.png')
arr = np.array(img)

# Let's inspect the phone mockup frames.
# How are the phone frames rendered?
# Let's find the black bezels:
# Each phone has an outer bezel rectangle that is dark/black (border width is ~6-8 pixels).
# Let's find the exact bounding boxes of the 15 phones.

col_approx = [52, 300, 548, 797, 1046]
row_approx = [125, 473, 825]

# Let's inspect a crop around each phone's corners and edges
for r_idx, ry in enumerate(row_approx):
    for c_idx, cx in enumerate(col_approx):
        # Look at vertical center of phone: cx + 110, ry + 170
        mid_x = cx + 110
        mid_y = ry + 170
        print(f"Phone ({r_idx}, {c_idx}): center approx ({mid_x}, {mid_y})")
