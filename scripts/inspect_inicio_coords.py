from PIL import Image
import numpy as np

im = Image.open('design/v2/01-inicio.png').convert('RGB')
w, h = im.size
arr = np.array(im)

# Let's crop into regions to inspect
# 1. Header & Bell
# In top-right (x from 200 to 250, y from 0 to 40)
# Look for the bell circle:
print("Header text area: x 0..190, y 0..40")
# The balance card starts around y = 48
# Let's find exactly where the balance card top edge is:
# Look along vertical line x = 50 (left side of balance card, well away from mascot)
for y in range(30, 80):
    r, g, b = arr[y, 50]
    # Balance card is purple (r ~ 130, g ~ 40, b ~ 210)
    if r > 100 and b > 180 and g < 60:
        print(f"Balance card top at x=50: y={y} (scaled to 390px: {y * 390/250:.1f}px)")
        break

# Let's find balance card bottom at x = 50:
for y in range(80, 160):
    r, g, b = arr[y, 50]
    if not (r > 80 and b > 140 and g < 70):
        print(f"Balance card bottom at x=50: y={y} (scaled to 390px: {y * 390/250:.1f}px)")
        break

# Let's find bell button center and radius:
# In region x > 200, y < 40:
# The bell button is white circle surrounded by lilac background
for y in range(0, 45):
    for x in range(200, 250):
        r, g, b = arr[y, x]
        # pure white / very bright (r > 245, g > 245, b > 250)
# Let's find center of white circle
white_pixels = []
for y in range(0, 45):
    for x in range(200, 250):
        r, g, b = arr[y, x]
        if r > 240 and g > 240 and b > 245:
            white_pixels.append((x, y))

if white_pixels:
    xs = [p[0] for p in white_pixels]
    ys = [p[1] for p in white_pixels]
    print(f"Bell button bounds: x in [{min(xs)}, {max(xs)}], y in [{min(ys)}, {max(ys)}]")
    print(f"Bell button scaled to 390px: x in [{min(xs)*1.56:.1f}, {max(xs)*1.56:.1f}], y in [{min(ys)*1.56:.1f}, {max(ys)*1.56:.1f}]")
    print(f"Bell diameter in ref: {max(xs)-min(xs)}px (scaled: {(max(xs)-min(xs))*1.56:.1f}px)")

# Let's inspect mascot position:
# Mascot in ref:
pink_pixels = []
for y in range(15, 130):
    for x in range(150, 250):
        r, g, b = arr[y, x]
        # Pink tone of pig
        if r > 210 and g > 140 and g < 210 and b > 180 and b < 240:
            pink_pixels.append((x, y))

if pink_pixels:
    pxs = [p[0] for p in pink_pixels]
    pys = [p[1] for p in pink_pixels]
    print(f"Mascot bounds in ref: x in [{min(pxs)}, {max(pxs)}], y in [{min(pys)}, {max(pys)}]")
    print(f"Mascot bounds scaled: x in [{min(pxs)*1.56:.1f}, {max(pxs)*1.56:.1f}], y in [{min(pys)*1.56:.1f}, {max(pys)*1.56:.1f}]")
    print(f"Mascot width: {(max(pxs)-min(pxs))*1.56:.1f}px, height: {(max(pys)-min(pys))*1.56:.1f}px")
