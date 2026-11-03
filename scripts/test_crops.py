from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os

img = Image.open('design/LayoutDoApp.png')
w_total, h_total = img.size
arr = np.array(img)

# Exact names in order:
screen_names = [
    "01-splash", "02-boas-vindas", "03-cadastro", "04-login", "05-diagnostico",
    "06-home", "07-gastos", "08-detalhe", "09-orcamento", "10-metas",
    "11-aprender", "12-licao", "13-simulador", "14-perfil", "15-open-finance"
]

# We need exact inner screen bounds for each of the 15 cells.
# Let's refine the exact x_left, y_top, x_right, y_bottom for each cell:
# To ensure NO bezel and NO dynamic island/status bar:
# Row 0: y_top = 151, y_bottom = 457
# Row 1: y_top = 498, y_bottom = 810
# Row 2: y_top = 848, y_bottom = 1150

# For X bounds:
# Column 0: x_left = 60, x_right = 264 (width = 204)
# Column 1: x_left = 304, x_right = 512 (width = 208)
# Column 2: x_left = 552, x_right = 761 (width = 209)
# Column 3: x_left = 801, x_right = 1010 (width = 209)
# Column 4: x_left = 1052, x_right = 1258 (width = 206)

# Let's verify for each row if columns have slight differences or if this is exact.
# In Row 1 and Row 2, let's check bezel positions for each cell:
cols_x = [
    [(60, 264), (304, 512), (552, 761), (801, 1010), (1051, 1257)],  # Row 0
    [(60, 265), (304, 513), (553, 762), (801, 1011), (1052, 1258)],  # Row 1
    [(60, 265), (304, 513), (553, 762), (802, 1012), (1052, 1258)],  # Row 2
]

rows_y = [
    (151, 457),   # Row 0
    (498, 810),   # Row 1
    (848, 1150),  # Row 2
]

crops = {}
stats = []

for r in range(3):
    y1, y2 = rows_y[r]
    for c in range(5):
        idx = r * 5 + c
        name = screen_names[idx]
        x1, x2 = cols_x[r][c]
        
        # Crop image without interpolation (exact raw pixels)
        cropped = img.crop((x1, y1, x2, y2))
        crops[name] = cropped
        cw, ch = cropped.size
        stats.append({
            "name": name,
            "filename": f"{name}.png",
            "x1": x1, "y1": y1, "x2": x2, "y2": y2,
            "width": cw, "height": ch
        })
        print(f"{name:16s}: ({x1:4d}, {y1:4d}, {x2:4d}, {y2:4d}) -> {cw}x{ch} px")

# Also Header: 00-marca.png
# Logo, slogan e os 4 chips de topo
header_crop = img.crop((40, 12, 1272, 112))
crops["00-marca"] = header_crop
hw, hh = header_crop.size
print(f"{'00-marca':16s}: (40, 12, 1272, 112) -> {hw}x{hh} px")
