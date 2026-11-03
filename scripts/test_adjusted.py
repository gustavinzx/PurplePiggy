from PIL import Image
import numpy as np

img = Image.open('design/LayoutDoApp.png')
crop = np.array(img.crop((61, 500, 264, 808)))
print("06-home adjusted corners:")
print("Top-left:", crop[0, 0][:3].tolist())
print("Top-right:", crop[0, -1][:3].tolist())
print("Bottom-left:", crop[-1, 0][:3].tolist())
print("Bottom-right:", crop[-1, -1][:3].tolist())
print("Min brightness in entire crop:", np.min(crop))
