from PIL import Image, ImageDraw, ImageFont
import os

def create_comparison():
    ref_path = "design/v2/01-inicio.png"
    app_path = "docs/v2-inicio/inicio-390x844.png"
    out_path = "docs/v2-inicio/comparacao-lado-a-lado.png"

    if not os.path.exists(ref_path) or not os.path.exists(app_path):
        print("Arquivos de imagem não encontrados!")
        return

    ref_img = Image.open(ref_path).convert("RGBA")
    app_img = Image.open(app_path).convert("RGBA")

    target_h = app_img.height # 1688
    target_w_ref = int(ref_img.width * (target_h / ref_img.height))
    ref_resized = ref_img.resize((target_w_ref, target_h), Image.Resampling.LANCZOS)

    total_w = ref_resized.width + app_img.width + 60
    header_h = 130
    canvas_h = target_h + header_h + 40

    canvas = Image.new("RGBA", (total_w, canvas_h), (248, 245, 252, 255))
    draw = ImageDraw.Draw(canvas)

    # Fonts
    try:
        font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 36)
        font_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 20)
        font_badge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 22)
    except Exception:
        font_title = font_sub = font_badge = ImageFont.load_default()

    # Header banner
    draw.rectangle([(0, 0), (total_w, header_h)], fill=(125, 43, 214, 255))
    draw.text((30, 20), "PurplePiggy V2 — Comparação de Telas (/inicio)", fill=(255, 255, 255, 255), font=font_title)
    draw.text((30, 68), "Referência Mockup (design/v2/01-inicio.png) vs. App Implementado (390x844 Playwright)", fill=(233, 213, 255, 255), font=font_sub)

    # Paste Ref
    x_ref = 20
    y_content = header_h + 50
    canvas.paste(ref_resized, (x_ref, y_content), ref_resized)

    # Label Ref (placed above the screen, NOT on top of it)
    draw.rounded_rectangle([(x_ref, header_h + 10), (x_ref + 240, header_h + 44)], radius=8, fill=(67, 33, 113, 255))
    draw.text((x_ref + 16, header_h + 16), "REFERÊNCIA V2", fill=(255, 255, 255, 255), font=font_badge)

    # Paste App
    x_app = x_ref + ref_resized.width + 20
    canvas.paste(app_img, (x_app, y_content), app_img)

    # Label App (placed above the screen, NOT on top of it)
    draw.rounded_rectangle([(x_app, header_h + 10), (x_app + 260, header_h + 44)], radius=8, fill=(21, 128, 61, 255))
    draw.text((x_app + 16, header_h + 16), "APP RENDERIZADO", fill=(255, 255, 255, 255), font=font_badge)

    canvas.save(out_path, "PNG")
    print(f"Comparação salva em {out_path}")

if __name__ == "__main__":
    create_comparison()
