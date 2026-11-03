from PIL import Image
import numpy as np

img = Image.open('design/LayoutDoApp.png')
arr = np.array(img)

# Let's check each of the 3 rows:
# For each row, let's look at the top bezel and bottom bezel.
# At what y does the phone outer frame start and inner screen start?
# Also where does the status bar ("9:41") and dynamic island end?

# In row 0:
# Phone 0 (0,0):
# Let's inspect x around 150 (horizontal center) from y=120 to y=165:
# At y=125, outer bezel starts.
# Between y=134 and y=149: dynamic island (pill shape, centered at ~162).
# What about the status bar? Where does "9:41" start and end?
# Let's inspect a horizontal slice across the status bar at y=140 from x=60 to x=260:

print("Row 0 Phone 0 status bar y=135..155:")
for y in range(130, 160):
    # dynamic island is around x=145..175
    # let's check left side (x=80) and right side (x=240) and center (x=160)
    print(f"y={y:3d}: left={arr[y, 80][:3].tolist()} center={arr[y, 160][:3].tolist()} right={arr[y, 240][:3].tolist()}")
