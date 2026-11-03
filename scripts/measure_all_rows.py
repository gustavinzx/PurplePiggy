from PIL import Image
import numpy as np

img = Image.open('design/LayoutDoApp.png')
arr = np.array(img)

# For row 1:
print("Row 1 Phone 0 (x=160, y from 470 to 510):")
for y in range(470, 510):
    print(f"y={y:3d}: center={arr[y, 160][:3].tolist()} left={arr[y, 80][:3].tolist()} right={arr[y, 240][:3].tolist()}")

print("\nRow 1 Phone 0 bottom (x=160, y from 800 to 825):")
for y in range(800, 825):
    print(f"y={y:3d}: center={arr[y, 160][:3].tolist()} left={arr[y, 80][:3].tolist()}")

# For row 2:
print("\nRow 2 Phone 0 top (x=160, y from 820 to 860):")
for y in range(820, 860):
    print(f"y={y:3d}: center={arr[y, 160][:3].tolist()} left={arr[y, 80][:3].tolist()} right={arr[y, 240][:3].tolist()}")

print("\nRow 2 Phone 0 bottom (x=160, y from 1150 to 1180):")
for y in range(1150, 1180):
    print(f"y={y:3d}: center={arr[y, 160][:3].tolist()} left={arr[y, 80][:3].tolist()}")
