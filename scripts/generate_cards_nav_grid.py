from PIL import Image, ImageDraw, ImageFont
import os
import shutil

# Carregar imagens de referência do layout
ref_06 = Image.open('design/telas/06-home.png').convert('RGB')
ref_07 = Image.open('design/telas/07-gastos.png').convert('RGB')
ref_09 = Image.open('design/telas/09-orcamento.png').convert('RGB')
ref_10 = Image.open('design/telas/10-metas.png').convert('RGB')

# Carregar capturas do design system do app
app_v1 = Image.open('screenshots/components/cards_nav_viewport1.png').convert('RGB')
app_v2 = Image.open('screenshots/components/cards_nav_viewport2.png').convert('RGB')
app_v3 = Image.open('screenshots/components/cards_nav_viewport3.png').convert('RGB')
app_v4 = Image.open('screenshots/components/cards_nav_viewport4.png').convert('RGB')

target_w = 280
target_h = 420

def resize_cover(img, w, h):
    return img.resize((w, h), Image.Resampling.LANCZOS)

r6 = resize_cover(ref_06, target_w, target_h)
r7 = resize_cover(ref_07, target_w, target_h)
r9 = resize_cover(ref_09, target_w, target_h)
r10 = resize_cover(ref_10, target_w, target_h)

av1 = resize_cover(app_v1, target_w, target_h)
av2 = resize_cover(app_v2, target_w, target_h)
av3 = resize_cover(app_v3, target_w, target_h)
av4 = resize_cover(app_v4, target_w, target_h)

pad = 20
header_h = 60
canvas_w = pad * 5 + target_w * 4
canvas_h = header_h + pad * 3 + target_h * 2 + 30

canvas = Image.new('RGB', (canvas_w, canvas_h), (248, 245, 252))
draw = ImageDraw.Draw(canvas)

# Cabeçalho
draw.text((pad, 15), "PurplePiggy — Comparativo de Cards, Progresso e Navegação (Prompt 11)", fill=(67, 33, 113))
draw.text((pad, 35), "Linha 1: Referências Oficiais (06, 07, 09, 10)  |  Linha 2: Componentes Canônicos Implementados", fill=(125, 106, 156))

cols = [
    ("Tela 06 (Início/Home)", "Card Saldo + Card Vidro", r6, av1),
    ("Tela 07 (Gastos)", "Tiles + FAB + Pílula", r7, av3),
    ("Tela 09 (Orçamento)", "Barra Empilhada + Progresso", r9, av2),
    ("Tela 10 (Metas)", "Anéis SVG Ouro + BottomNav", r10, av4),
]

for idx, (title_ref, title_comp, img_ref, img_comp) in enumerate(cols):
    x = pad + idx * (target_w + pad)
    
    # Linha 1 (Referência)
    y1 = header_h + pad
    draw.text((x, y1 - 18), title_ref, fill=(67, 33, 113))
    canvas.paste(img_ref, (x, y1))
    
    # Linha 2 (Implementação)
    y2 = y1 + target_h + pad + 20
    draw.text((x, y2 - 18), title_comp, fill=(176, 55, 248))
    canvas.paste(img_comp, (x, y2))

out_path = 'screenshots/components/cards_nav_comparison_grid.png'
canvas.save(out_path)
print(f"Grid comparativo de cards e navegação salvo em: {out_path}")

artifact_dir = r'C:\Users\gsds0\.gemini\antigravity\brain\d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca'
shutil.copy(out_path, os.path.join(artifact_dir, 'cards_nav_comparison_grid.png'))
shutil.copy('screenshots/components/cards_nav_viewport1.png', os.path.join(artifact_dir, 'cards_nav_viewport1.png'))
shutil.copy('screenshots/components/cards_nav_viewport2.png', os.path.join(artifact_dir, 'cards_nav_viewport2.png'))
shutil.copy('screenshots/components/cards_nav_viewport3.png', os.path.join(artifact_dir, 'cards_nav_viewport3.png'))
shutil.copy('screenshots/components/cards_nav_viewport4.png', os.path.join(artifact_dir, 'cards_nav_viewport4.png'))
print("Arquivos copiados para os artefatos com sucesso!")
