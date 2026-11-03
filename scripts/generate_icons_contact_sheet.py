from PIL import Image, ImageDraw, ImageFont
import os
import shutil

icons = [
    ("icon-bau", "Baú Fechado"),
    ("icon-bau-aberto", "Baú Aberto"),
    ("icon-chama", "Chama (Ofensiva)"),
    ("icon-xp", "Medalha XP"),
    ("icon-cadeado", "Cadeado Bloqueado"),
    ("icon-check-nivel", "Nível Concluído"),
    ("icon-trofeu", "Troféu Campeão"),
]

thumb_size = 220
pad_x = 24
pad_y = 30
header_h = 90
cols = 4
rows = 2
canvas_w = pad_x * (cols + 1) + thumb_size * cols
canvas_h = header_h + pad_y * (rows + 1) + (thumb_size + 36) * rows

canvas = Image.new("RGBA", (canvas_w, canvas_h), (248, 245, 252, 255))
draw = ImageDraw.Draw(canvas)

# Header
draw.text((pad_x, 24), "PurplePiggy — Ícones Extras do Desafio Piggy (Prompt N6)", fill=(67, 33, 113, 255))
draw.text((pad_x, 50), "Estilo 3D Macio, Fundo Transparente RGBA, Paleta Violeta & Ouro do PurplePiggy", fill=(125, 106, 156, 255))

for idx, (name, label) in enumerate(icons):
    r = idx // cols
    c = idx % cols
    x = pad_x + c * (thumb_size + pad_x)
    y = header_h + pad_y + r * (thumb_size + pad_y + 36)

    # Card background behind icon
    draw.rounded_rectangle([x, y, x + thumb_size, y + thumb_size], radius=24, fill=(255, 255, 255, 220), outline=(232, 222, 251, 255), width=2)
    
    # Icon image
    icon_path = f"public/assets/icons/{name}.png"
    if os.path.exists(icon_path):
        im = Image.open(icon_path)
        im_thumb = im.copy()
        im_thumb.thumbnail((thumb_size - 24, thumb_size - 24), Image.Resampling.LANCZOS)
        
        offset_x = x + (thumb_size - im_thumb.width) // 2
        offset_y = y + (thumb_size - im_thumb.height) // 2
        canvas.paste(im_thumb, (offset_x, offset_y), im_thumb)
    
    # Labels
    draw.text((x + 8, y + thumb_size + 8), name, fill=(67, 33, 113, 255))
    draw.text((x + 8, y + thumb_size + 24), label, fill=(125, 106, 156, 255))

out_path = "screenshots/icons_extras_contact_sheet.png"
canvas.save(out_path)
print(f"Contact sheet saved to: {out_path}")

artifact_dir = r"C:\Users\gsds0\.gemini\antigravity\brain\d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca"
shutil.copy(out_path, os.path.join(artifact_dir, "icons_extras_contact_sheet.png"))
print("Copied to artifacts successfully!")
