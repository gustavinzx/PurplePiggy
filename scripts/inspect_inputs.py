from PIL import Image
import os

for fname in ['03-cadastro.png', '04-login.png', '05-diagnostico.png']:
    p = os.path.join('design/telas', fname)
    if os.path.exists(p):
        img = Image.open(p)
        print(f"Tela {fname}: {img.size}")
    else:
        print(f"Não encontrado: {p}")
