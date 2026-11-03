from PIL import Image, ImageDraw, ImageFont
import os
import shutil

# Carregar imagens
ref_splash = Image.open('design/telas/01-splash.png').convert('RGB')
ref_welcome = Image.open('design/telas/02-boas-vindas.png').convert('RGB')
ref_cadastro = Image.open('design/telas/03-cadastro.png').convert('RGB')
ref_home = Image.open('design/telas/06-home.png').convert('RGB')

app_splash = Image.open('screenshots/atmosphere/atmosphere_splash.png').convert('RGB')
app_auth = Image.open('screenshots/atmosphere/atmosphere_auth.png').convert('RGB')
app_app = Image.open('screenshots/atmosphere/atmosphere_app.png').convert('RGB')

# Criar um painel comparativo de 4 colunas x 2 linhas
# Linha 1: Telas de Referência do Layout (01, 02, 03, 06)
# Linha 2: Renderização do Componente <Atmosphere>
target_w = 260
target_h = 420

def resize_cover(img, w, h):
    return img.resize((w, h), Image.Resampling.LANCZOS)

r1 = resize_cover(ref_splash, target_w, target_h)
r2 = resize_cover(ref_welcome, target_w, target_h)
r3 = resize_cover(ref_cadastro, target_w, target_h)
r6 = resize_cover(ref_home, target_w, target_h)

a1 = resize_cover(app_splash, target_w, target_h)
a2 = resize_cover(app_splash, target_w, target_h) # mesma variante splash
a3 = resize_cover(app_auth, target_w, target_h)
a6 = resize_cover(app_app, target_w, target_h)

pad = 20
header_h = 60
canvas_w = pad * 5 + target_w * 4
canvas_h = header_h + pad * 3 + target_h * 2 + 50

canvas = Image.new('RGB', (canvas_w, canvas_h), (248, 245, 252))
draw = ImageDraw.Draw(canvas)

# Títulos
draw.text((pad, 15), "PurplePiggy — Comparativo da Atmosfera (Prompt 09)", fill=(67, 33, 113))
draw.text((pad, 35), "Linha 1: Referência do Layout (01, 02, 03, 06)  |  Linha 2: Componente <Atmosphere variant='splash | auth | app' />", fill=(125, 106, 156))

cols = [
    ("Tela 01 (Splash)", "variant='splash'", r1, a1),
    ("Tela 02 (Boas-Vindas)", "variant='splash'", r2, a2),
    ("Tela 03 (Cadastro)", "variant='auth'", r3, a3),
    ("Tela 06 (Início/App)", "variant='app'", r6, a6),
]

for idx, (title_ref, title_comp, img_ref, img_comp) in enumerate(cols):
    x = pad + idx * (target_w + pad)
    
    # Linha 1 (Referência)
    y1 = header_h + pad
    draw.text((x, y1 - 18), title_ref, fill=(67, 33, 113))
    canvas.paste(img_ref, (x, y1))
    
    # Linha 2 (Atmosphere)
    y2 = y1 + target_h + pad + 20
    draw.text((x, y2 - 18), f"<Atmosphere {title_comp}>", fill=(176, 55, 248))
    canvas.paste(img_comp, (x, y2))

out_path = 'screenshots/atmosphere/atmosphere_comparison_grid.png'
canvas.save(out_path)
print(f"Grid comparativo salvo em: {out_path}")

# Copiar para o diretório de artefatos
artifact_dir = r'C:\Users\gsds0\.gemini\antigravity\brain\d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca'
shutil.copy(out_path, os.path.join(artifact_dir, 'atmosphere_comparison_grid.png'))
shutil.copy('screenshots/atmosphere/atmosphere_splash.png', os.path.join(artifact_dir, 'atmosphere_splash.png'))
shutil.copy('screenshots/atmosphere/atmosphere_auth.png', os.path.join(artifact_dir, 'atmosphere_auth.png'))
shutil.copy('screenshots/atmosphere/atmosphere_app.png', os.path.join(artifact_dir, 'atmosphere_app.png'))
print("Arquivos copiados para o diretório de artefatos com sucesso!")
