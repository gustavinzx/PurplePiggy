from PIL import Image, ImageDraw, ImageFont
import os
import shutil

# Carregar imagens
ref_03 = Image.open('design/telas/03-cadastro.png').convert('RGB')
ref_04 = Image.open('design/telas/04-login.png').convert('RGB')
ref_05 = Image.open('design/telas/05-diagnostico.png').convert('RGB')

app_v1 = Image.open('screenshots/components/design_system_viewport1.png').convert('RGB')
app_v2 = Image.open('screenshots/components/design_system_viewport2.png').convert('RGB')

target_w = 300
target_h = 440

def resize_cover(img, w, h):
    return img.resize((w, h), Image.Resampling.LANCZOS)

r3 = resize_cover(ref_03, target_w, target_h)
r4 = resize_cover(ref_04, target_w, target_h)
r5 = resize_cover(ref_05, target_w, target_h)

av1 = resize_cover(app_v1, target_w, target_h)
av2 = resize_cover(app_v2, target_w, target_h)

pad = 20
header_h = 60
canvas_w = pad * 4 + target_w * 3
canvas_h = header_h + pad * 3 + target_h * 2 + 30

canvas = Image.new('RGB', (canvas_w, canvas_h), (248, 245, 252))
draw = ImageDraw.Draw(canvas)

# Cabeçalho
draw.text((pad, 15), "PurplePiggy — Comparativo de Botões, Inputs, Rádio e Chips (Prompt 10)", fill=(67, 33, 113))
draw.text((pad, 35), "Linha 1: Referências Oficiais (03, 04, 05)  |  Linha 2: Componentes Canônicos Implementados", fill=(125, 106, 156))

cols = [
    ("Tela 03 (Cadastro)", "Inputs + Botão Primário", r3, av1),
    ("Tela 04 (Login)", "Botão Secundário + Links", r4, av1),
    ("Tela 05 (Diagnóstico)", "Select + Rádio Cards + Chips", r5, av2),
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

out_path = 'screenshots/components/components_comparison_grid.png'
canvas.save(out_path)
print(f"Grid comparativo de componentes salvo em: {out_path}")

artifact_dir = r'C:\Users\gsds0\.gemini\antigravity\brain\d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca'
shutil.copy(out_path, os.path.join(artifact_dir, 'components_comparison_grid.png'))
shutil.copy('screenshots/components/design_system_viewport1.png', os.path.join(artifact_dir, 'design_system_viewport1.png'))
shutil.copy('screenshots/components/design_system_viewport2.png', os.path.join(artifact_dir, 'design_system_viewport2.png'))
print("Arquivos copiados para os artefatos com sucesso!")
