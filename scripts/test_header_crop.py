from PIL import Image
import numpy as np

img = Image.open('design/LayoutDoApp.png')
# Header crop
# Let's see the header with a nice margin: x from 40 to 1272, y from 15 to 110
header = img.crop((40, 12, 1272, 112))
header.save('scripts/00-marca-test.png')
print("Saved 00-marca-test.png with size", header.size)
