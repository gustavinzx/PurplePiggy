from PIL import Image
import numpy as np

# Let's inspect the border rows and columns for each crop
screen_names = [
    "01-splash", "02-boas-vindas", "03-cadastro", "04-login", "05-diagnostico",
    "06-home", "07-gastos", "08-detalhe", "09-orcamento", "10-metas",
    "11-aprender", "12-licao", "13-simulador", "14-perfil", "15-open-finance"
]

cols_x = [
    [(60, 264), (304, 512), (552, 761), (801, 1010), (1051, 1257)],
    [(60, 265), (304, 513), (553, 762), (801, 1011), (1052, 1258)],
    [(60, 265), (304, 513), (553, 762), (802, 1012), (1052, 1258)],
]

rows_y = [
    (151, 457),
    (498, 810),
    (848, 1150),
]

img = Image.open('design/LayoutDoApp.png')

for r in range(3):
    y1, y2 = rows_y[r]
    for c in range(5):
        idx = r * 5 + c
        name = screen_names[idx]
        x1, x2 = cols_x[r][c]
        crop = np.array(img.crop((x1, y1, x2, y2)))
        
        # Check top row, bottom row, left col, right col:
        top_mean = np.mean(crop[0, :, :3])
        bot_mean = np.mean(crop[-1, :, :3])
        left_mean = np.mean(crop[:, 0, :3])
        right_mean = np.mean(crop[:, -1, :3])
        
        # Check min values to see if any pure black bezel pixel exists
        top_min = np.min(crop[0, :, :3])
        bot_min = np.min(crop[-1, :, :3])
        left_min = np.min(crop[:, 0, :3])
        right_min = np.min(crop[:, -1, :3])
        
        print(f"{name:16s}: top_min={top_min:3d}, bot_min={bot_min:3d}, left_min={left_min:3d}, right_min={right_min:3d}")
