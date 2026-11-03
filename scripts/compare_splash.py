from PIL import Image, ImageDraw, ImageFont
import os
import shutil

ref_img = Image.open('design/telas/01-splash.png').convert('RGB')
app_img = Image.open('screenshots/screens/screen_01_splash.png').convert('RGB')

target_w = 390
target_h = 844

r_resized = ref_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
a_resized = app_img.resize((target_w, target_h), Image.Resampling.LANCZOS)

pad = 30
header_h = 80
canvas_w = pad * 3 + target_w * 2
canvas_h = header_h + pad * 2 + target_h

canvas = Image.new('RGB', (canvas_w, canvas_h), (248, 245, 252))
draw = ImageDraw.Draw(canvas)

draw.text((pad, 20), "PurplePiggy — Comparativo Tela 01: Splash (/)", fill=(67, 33, 113))
draw.text((pad, 45), "Esquerda: Referência Oficial (design/telas/01-splash.png)  |  Direita: App Implementado (390px)", fill=(125, 106, 156))

# Esquerda: Referência
x1 = pad
y1 = header_h + pad
draw.text((x1, y1 - 22), "Referência Oficial (design/telas/01-splash.png)", fill=(67, 33, 113))
canvas.paste(r_resized, (x1, y1))

# Direita: App
x2 = pad * 2 + target_w
draw.text((x2, y1 - 22), "App Implementado (fix/ui-splash @ 390px)", fill=(176, 55, 248))
canvas.paste(a_resized, (x2, y1))

out_path = 'screenshots/screens/comparison_01_splash.png'
canvas.save(out_path)
print(f"Comparativo da Splash salvo em: {out_path}")

artifact_dir = r'C:\Users\gsds0\.gemini\antigravity\brain\d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca'
shutil.copy(out_path, os.path.join(artifact_dir, 'comparison_01_splash.png'))
shutil.copy('screenshots/screens/screen_01_splash.png', os.path.join(artifact_dir, 'screen_01_splash.png'))
print("Artefatos copiados com sucesso!")
