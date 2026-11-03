from PIL import Image
import numpy as np

img = Image.open('design/LayoutDoApp.png')
arr = np.array(img)

# Let's inspect the first column, first row in detail:
# x from 45 to 275, y from 120 to 470
# Let's print the exact boundary where the bezel becomes the screen:
# For y in range(120, 160): print colors at x=100 (left side of dynamic island, under status bar time 9:41)
print("Looking at top of screen for col 0:")
for y in range(120, 160):
    # check x=70 (left side where 9:41 is) and x=150 (center where dynamic island is)
    print(f"y={y}: x=70 RGB={arr[y, 70].tolist()}, x=150 RGB={arr[y, 150].tolist()}")

print("\nLooking at bottom of screen for col 0:")
for y in range(450, 470):
    print(f"y={y}: x=150 RGB={arr[y, 150].tolist()}")

print("\nLooking at left edge of screen for col 0:")
for x in range(48, 65):
    print(f"x={x}: y=250 RGB={arr[250, x].tolist()}")

print("\nLooking at right edge of screen for col 0:")
for x in range(255, 275):
    print(f"x={x}: y=250 RGB={arr[250, x].tolist()}")
