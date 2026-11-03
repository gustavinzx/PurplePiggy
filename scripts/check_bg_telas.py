from PIL import Image
import os

telas = ['01-splash.png', '02-boas-vindas.png', '03-cadastro.png', '06-home.png']
for t in telas:
    path = os.path.join('design/telas', t)
    if os.path.exists(path):
        img = Image.open(path)
        print(f"{t}: size={img.size}")
    else:
        print(f"NOT FOUND: {path}")
