from PIL import Image
import numpy as np

img = Image.open('design/LayoutDoApp.png')
arr = np.array(img)

# Let's inspect each phone's outer bezel rectangle:
# For each column and row, let's find the exact bezel coordinates:
col_hints = [52, 300, 548, 797, 1046]
row_hints = [125, 473, 825]

# Let's find the exact dark bezel for each phone:
# We know each phone frame is an iPhone mockup.
# Let's check the width and height of the mockups:
# Let's find left and right bezel at mid-height of each phone.
# Mid-height for row 0: y ~ 280
# Mid-height for row 1: y ~ 630
# Mid-height for row 2: y ~ 980

results = []

row_y_mids = [280, 630, 980]

for r, ry in enumerate(row_y_mids):
    row_phones = []
    for c, cx in enumerate(col_hints):
        # We can find left bezel by scanning around cx:
        # Looking at slice at ry from cx-10 to cx+30:
        # The bezel is a dark band (RGB < 60)
        # Inside the bezel is the inner screen.
        # Let's find the inner screen x_left and x_right:
        
        # Left inner screen edge:
        # scan from cx to cx+25, find the dark bezel and the first pixel after it that enters screen
        # Let's search for the minimum brightness (bezel center) then where it rises:
        slice_left = [np.mean(arr[ry, x][:3]) for x in range(cx, cx+25)]
        min_idx = np.argmin(slice_left)
        bezel_x_left = cx + min_idx
        # from bezel_x_left, walk right until brightness > 70 or edge
        # let's look at pixel values:
        x_left = None
        for x in range(bezel_x_left, cx + 35):
            val = np.mean(arr[ry, x][:3])
            val_next = np.mean(arr[ry, x+1][:3])
            # when difference between adjacent pixels is sharp or brightness exceeds 80
            if val < 50 and val_next >= 50:
                x_left = x + 1
                break
        if x_left is None:
            x_left = cx + 8 # fallback
            
        # Right inner screen edge:
        # scan around cx + 210 to cx + 225
        slice_right = [np.mean(arr[ry, x][:3]) for x in range(cx + 200, cx + 225)]
        min_idx_r = np.argmin(slice_right)
        bezel_x_right = cx + 200 + min_idx_r
        x_right = None
        for x in range(bezel_x_right - 10, bezel_x_right + 5):
            val = np.mean(arr[ry, x][:3])
            val_next = np.mean(arr[ry, x+1][:3])
            if val >= 50 and val_next < 50:
                x_right = x + 1
                break
        if x_right is None:
            x_right = cx + 212
            
        # Now for Y:
        # Top of inner screen:
        # We know status bar and dynamic island end at:
        # Row 0: y ~ 151
        # Row 1: y ~ 498
        # Row 2: y ~ 848
        # Bottom of inner screen (before bottom bezel):
        # Row 0: y ~ 456
        # Row 1: y ~ 809
        # Row 2: y ~ 1150
        
        # Let's measure for each phone individually:
        center_x = (x_left + x_right) // 2
        
        # Find dynamic island bottom for this phone:
        # In this phone, dynamic island is dark pill around center_x at top of phone
        top_hint = row_hints[r]
        # scan y from top_hint + 15 to top_hint + 45 at center_x:
        y_top = None
        for y in range(top_hint + 15, top_hint + 40):
            val = np.mean(arr[y, center_x][:3])
            val_next = np.mean(arr[y+1, center_x][:3])
            if val < 40 and val_next >= 40:
                y_top = y + 1
                break
        if y_top is None:
            y_top = top_hint + 26
            
        # Bottom of screen before bottom bezel:
        # scan y from top_hint + 320 to top_hint + 345 at center_x:
        y_bottom = None
        for y in range(top_hint + 320, top_hint + 345):
            val = np.mean(arr[y, center_x][:3])
            val_next = np.mean(arr[y+1, center_x][:3])
            if val >= 40 and val_next < 40:
                y_bottom = y + 1
                break
        if y_bottom is None:
            y_bottom = top_hint + 331
            
        row_phones.append((x_left, y_top, x_right, y_bottom))
        print(f"Phone R{r}C{c}: x=({x_left}, {x_right}) [w={x_right-x_left}], y=({y_top}, {y_bottom}) [h={y_bottom-y_top}]")
    results.append(row_phones)
