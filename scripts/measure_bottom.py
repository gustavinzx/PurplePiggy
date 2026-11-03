from PIL import Image
import numpy as np

img = Image.open('design/LayoutDoApp.png')
arr = np.array(img)

print("Row 0 Phone 0 bottom y=435..460 at x=160 (center):")
for y in range(435, 462):
    print(f"y={y:3d}: center={arr[y, 160][:3].tolist()} left={arr[y, 80][:3].tolist()}")
