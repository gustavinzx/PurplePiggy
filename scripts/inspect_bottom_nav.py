from PIL import Image
import numpy as np

img = Image.open('design/LayoutDoApp.png')
arr = np.array(img)

print("06-home y=780..812 at x=70, 100, 160, 220:")
for y in range(780, 812):
    print(f"y={y}: x=70:{arr[y, 70][:3].tolist()} x=100:{arr[y, 100][:3].tolist()} x=160:{arr[y, 160][:3].tolist()} x=220:{arr[y, 220][:3].tolist()}")
