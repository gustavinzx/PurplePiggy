from PIL import Image, ImageDraw, ImageFont
import os

img = Image.open('design/LayoutDoApp.png')
w_total, h_total = img.size

os.makedirs('design/telas', exist_ok=True)

# 15 screens in order:
screen_names = [
    "01-splash", "02-boas-vindas", "03-cadastro", "04-login", "05-diagnostico",
    "06-home", "07-gastos", "08-detalhe", "09-orcamento", "10-metas",
    "11-aprender", "12-licao", "13-simulador", "14-perfil", "15-open-finance"
]

# Coordinates for columns:
# x1, x2 for each column (5 columns)
cols = [
    (61, 263),   # Col 0 (w=202)
    (305, 511),  # Col 1 (w=206)
    (553, 760),  # Col 2 (w=207)
    (802, 1009), # Col 3 (w=207)
    (1052, 1256) # Col 4 (w=204)
]

# Coordinates for rows:
# y1, y2 for each row (3 rows)
# Clean inner screen: below dynamic island and status bar, above bottom bezel
rows = [
    (151, 453),   # Row 0 (h=302)
    (498, 807),   # Row 1 (h=309)
    (848, 1143),  # Row 2 (h=295)
]

# 1 & 2. Crop each screen without interpolation (exact raw pixels)
crops = []
screen_data = []

for r in range(3):
    y1, y2 = rows[r]
    for c in range(5):
        idx = r * 5 + c
        name = screen_names[idx]
        x1, x2 = cols[c]
        
        cropped = img.crop((x1, y1, x2, y2))
        save_path = f"design/telas/{name}.png"
        cropped.save(save_path)
        
        cw, ch = cropped.size
        crops.append((name, cropped, x1, y1, x2, y2))
        screen_data.append({
            "name": name,
            "filename": f"{name}.png",
            "x1": x1, "y1": y1, "x2": x2, "y2": y2,
            "width": cw, "height": ch
        })
        print(f"Saved {save_path}: ({x1}, {y1}) to ({x2}, {y2}) -> {cw}x{ch} px")

# 3. Crop Header: 00-marca.png
# Logo, slogan e os 4 chips de topo
header_crop = img.crop((40, 12, 1272, 112))
header_path = "design/telas/00-marca.png"
header_crop.save(header_path)
hw, hh = header_crop.size
print(f"Saved {header_path}: (40, 12) to (1272, 112) -> {hw}x{hh} px")

# 4. Generate design/telas/README.md with width x height table and warnings
readme_content = """# Telas de Referência do PurplePiggy

Este diretório contém os recortes oficiais extraídos de `design/LayoutDoApp.png`.
Cada imagem representa SOMENTE a área interna da tela do celular (sem moldura, sem ilha dinâmica e sem a barra de status '9:41').

> [!WARNING]
> **Aviso de Resolução:** Todos os 15 recortes possuem largura entre 202px e 207px (menos de 400px de largura).
> Como a imagem fonte `LayoutDoApp.png` possui 1312x1199 pixels para acomodar a grade completa de 15 celulares,
> nenhum redimensionamento ou interpolação artificial foi aplicado aqui, preservando 100% da fidelidade e nitidez dos pixels originais.

---

## Tabela de Dimensões e Coordenadas

| # | Arquivo | Tela / Rota Correspondente | Coordenadas no Layout (X1, Y1, X2, Y2) | Largura x Altura | Menor que 400px? |
|---|---|---|---|---|---|
| **00** | `00-marca.png` | Cabeçalho (Logo, Slogan e 4 Chips de topo) | (40, 12, 1272, 112) | 1232 x 100 px | Não |
"""

for idx, data in enumerate(screen_data, start=1):
    warn = "Sim (< 400px)" if data["width"] < 400 else "Não"
    readme_content += f"| **{idx:02d}** | `{data['filename']}` | `{data['name']}` | ({data['x1']}, {data['y1']}, {data['x2']}, {data['y2']}) | {data['width']} x {data['height']} px | {warn} |\n"

readme_content += """
---

## Visualização da Grade
Consulte o arquivo `_grade.png` para conferência visual lado a lado com os números de 01 a 15.
"""

with open("design/telas/README.md", "w", encoding="utf-8") as f:
    f.write(readme_content)
print("Saved design/telas/README.md")

# 5. Generate design/telas/_grade.png with 15 numbered crops
# Let's create a composite image with padding, card frames and numbers:
cell_w = 230
cell_h = 350
padding = 20
header_space = 120
grid_w = padding + 5 * (cell_w + padding)
grid_h = header_space + padding + 3 * (cell_h + padding)

grade = Image.new('RGB', (grid_w, grid_h), color=(248, 245, 252))
draw = ImageDraw.Draw(grade)

# Draw Title and header in grade
# We can paste 00-marca at the top centered/scaled to fit
header_w = grid_w - 2 * padding
header_scaled = header_crop.resize((header_w, int(header_crop.height * (header_w / header_crop.width))), Image.Resampling.LANCZOS)
grade.paste(header_scaled, (padding, 10))

for r in range(3):
    for c in range(5):
        idx = r * 5 + c
        name, crop_img, x1, y1, x2, y2 = crops[idx]
        
        cx = padding + c * (cell_w + padding)
        cy = header_space + padding + r * (cell_h + padding)
        
        # Draw background card for each cell
        draw.rounded_rectangle([cx, cy, cx + cell_w, cy + cell_h], radius=16, fill=(255, 255, 255), outline=(225, 215, 240), width=2)
        
        # Draw badge/number at top of card
        draw.rounded_rectangle([cx + 10, cy + 8, cx + cell_w - 10, cy + 32], radius=8, fill=(125, 43, 214))
        draw.text((cx + cell_w // 2, cy + 20), f"{idx+1:02d}. {name}", fill=(255, 255, 255), anchor="mm")
        
        # Paste cropped screen inside the card
        # Center the screen image inside the card below the badge
        paste_x = cx + (cell_w - crop_img.width) // 2
        paste_y = cy + 38
        grade.paste(crop_img, (paste_x, paste_y))

grade.save('design/telas/_grade.png')
print("Saved design/telas/_grade.png")
