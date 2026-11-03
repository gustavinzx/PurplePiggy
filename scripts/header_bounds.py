from PIL import Image
import numpy as np

img = Image.open('design/LayoutDoApp.png')
arr = np.array(img)

# Let's inspect x bounds of header (y from 10 to 110)
# background color around (0, 0) is ~ [237, 210, 249]
# find pixels that differ from background:
bg = np.array([238, 212, 250])
diff = np.abs(arr[10:115, :, :3].astype(int) - bg)
mask = np.sum(diff, axis=2) > 40

# find horizontal range where mask is True
x_proj = np.any(mask, axis=0)
x_indices = np.where(x_proj)[0]
y_proj = np.any(mask, axis=1)
y_indices = np.where(y_proj)[0]

print(f"Header elements: x from {x_indices[0]} to {x_indices[-1]}, y from {y_indices[0] + 10} to {y_indices[-1] + 10}")
