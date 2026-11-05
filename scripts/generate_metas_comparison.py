from PIL import Image, ImageDraw, ImageFont
import os

def create_side_by_side():
    ref_path = "design/v2/03-metas.png"
    app_path = "docs/v2-metas/metas-390x844.png"
    out_path = "docs/v2-metas/comparacao-lado-a-lado.png"
    art_path = r"C:\Users\gsds0\.gemini\antigravity\brain\d45f2e7d-6bdb-42f1-9b1b-02a79f24bfca\comparacao_v2_metas.png"

    if not os.path.exists(ref_path) or not os.path.exists(app_path):
        print("Missing images for comparison")
        return

    ref_img = Image.open(ref_path).convert("RGB")
    app_img = Image.open(app_path).convert("RGB")

    # Target height
    target_h = 844
    scale_ref = target_h / ref_img.height
    ref_w = int(ref_img.width * scale_ref)
    ref_resized = ref_img.resize((ref_w, target_h), Image.Resampling.LANCZOS)

    # Scale app image if needed
    scale_app = target_h / app_img.height
    app_w = int(app_img.width * scale_app)
    app_resized = app_img.resize((app_w, target_h), Image.Resampling.LANCZOS)

    header_h = 50
    total_w = ref_w + app_w + 30
    total_h = target_h + header_h + 20

    canvas = Image.new("RGB", (total_w, total_h), (248, 245, 252))
    draw = ImageDraw.Draw(canvas)

    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()

    # Draw titles
    draw.text((20, 15), "REFERENCIA V2 (03-metas.png)", fill=(67, 33, 113), font=font)
    draw.text((ref_w + 30, 15), "APP PURPLEPIGGY (/metas 390x844)", fill=(125, 43, 214), font=font)

    # Paste images
    canvas.paste(ref_resized, (10, header_h))
    canvas.paste(app_resized, (ref_w + 20, header_h))

    # Divider line
    draw.line([(ref_w + 15, 0), (ref_w + 15, total_h)], fill=(216, 194, 255), width=2)

    canvas.save(out_path)
    canvas.save(art_path)
    print("Saved comparison to", out_path, "and", art_path)

if __name__ == "__main__":
    create_side_by_side()
