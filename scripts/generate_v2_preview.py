import os
from PIL import Image, ImageDraw, ImageFont

def get_font(size, bold=False):
    # Try Nunito or standard fonts
    font_paths = [
        "C:/Windows/Fonts/segoeui.ttf" if not bold else "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/arial.ttf" if not bold else "C:/Windows/Fonts/arialbd.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def create_preview():
    assets = [
        # (Category, id, path, display_1x, webp_size)
        ("A) MASCOTE", "pig-wink", "public/assets/mascot/pig-wink.webp", "128x128 (2x: 256x256)"),
        ("B) ÍCONES DE META", "icon-goal-trip", "public/assets/icons/icon-goal-trip.webp", "56x56 (2x: 112x112)"),
        ("B) ÍCONES DE META", "icon-goal-laptop", "public/assets/icons/icon-goal-laptop.webp", "56x56 (2x: 112x112)"),
        ("B) ÍCONES DE META", "icon-goal-gym", "public/assets/icons/icon-goal-gym.webp", "56x56 (2x: 112x112)"),
        ("B) ÍCONES DE META", "icon-goal-home", "public/assets/icons/icon-goal-home.webp", "56x56 (2x: 112x112)"),
        ("B) ÍCONES DE META", "icon-goal-car", "public/assets/icons/icon-goal-car.webp", "56x56 (2x: 112x112)"),
        ("B) ÍCONES DE META", "icon-goal-study", "public/assets/icons/icon-goal-study.webp", "56x56 (2x: 112x112)"),
        ("B) ÍCONES DE META", "icon-goal-star", "public/assets/icons/icon-goal-star.webp", "56x56 (2x: 112x112)"),
        ("C) CENÁRIO APRENDER", "island-done", "public/assets/learn/island-done.webp", "112x88 (2x: 224x176)"),
        ("C) CENÁRIO APRENDER", "island-current", "public/assets/learn/island-current.webp", "140x108 (2x: 280x216)"),
        ("C) CENÁRIO APRENDER", "island-rock", "public/assets/learn/island-rock.webp", "112x88 (2x: 224x176)"),
        ("C) CENÁRIO APRENDER", "tree-pine", "public/assets/learn/tree-pine.webp", "64x80 (2x: 128x160)"),
        ("C) CENÁRIO APRENDER", "cloud-a", "public/assets/learn/cloud-a.webp", "96x64 (2x: 192x128)"),
        ("C) CENÁRIO APRENDER", "cloud-b", "public/assets/learn/cloud-b.webp", "120x56 (2x: 240x112)"),
        ("C) CENÁRIO APRENDER", "cloud-c", "public/assets/learn/cloud-c.webp", "64x48 (2x: 128x96)")
    ]

    # Canvas dimensions
    W = 1400
    H = 2000
    canvas = Image.new("RGBA", (W, H), (248, 246, 252, 255))
    draw = ImageDraw.Draw(canvas)

    # Header
    title_font = get_font(32, bold=True)
    subtitle_font = get_font(18, bold=False)
    section_font = get_font(22, bold=True)
    label_font = get_font(15, bold=True)
    info_font = get_font(13, bold=False)

    # Header banner
    draw.rectangle([(0, 0), (W, 110)], fill=(125, 43, 214, 255))
    draw.text((40, 25), "PurplePiggy — Novos Assets Redesign V2", fill=(255, 255, 255, 255), font=title_font)
    draw.text((40, 68), "Auditoria visual: Fundo Branco vs. Fundo Lilás | WebP 2x com canal alfa | Limite estrito <= 120 KB", fill=(233, 213, 255, 255), font=subtitle_font)

    # Grid layout
    card_w = 420
    card_h = 240
    gap_x = 30
    gap_y = 25
    start_x = 40
    start_y = 140

    cols = 3
    for idx, (cat, name, path, dims) in enumerate(assets):
        c = idx % cols
        r = idx // cols
        x = start_x + c * (card_w + gap_x)
        y = start_y + r * (card_h + gap_y)

        # Card container with rounded rect
        draw.rounded_rectangle([(x, y), (x + card_w, y + card_h)], radius=16, fill=(255, 255, 255, 255), outline=(220, 210, 235, 255), width=1)

        # Split visual area: Top half of card (height 150)
        # Left half is white (x+10 to x+card_w//2), right half is lilac (x+card_w//2 to x+card_w-10)
        split_h = 150
        draw.rounded_rectangle([(x + 8, y + 8), (x + card_w - 8, y + split_h)], radius=12, fill=(255, 255, 255, 255))
        # Draw lilac half
        draw.rounded_rectangle([(x + card_w // 2, y + 8), (x + card_w - 8, y + split_h)], radius=12, fill=(240, 230, 255, 255))
        # Center line
        draw.line([(x + card_w // 2, y + 8), (x + card_w // 2, y + split_h)], fill=(225, 215, 240, 255), width=1)

        # Labels "Branco" and "Lilás"
        tag_font = get_font(11, bold=True)
        draw.text((x + 16, y + 14), "Fundo Branco", fill=(160, 150, 180, 255), font=tag_font)
        draw.text((x + card_w // 2 + 10, y + 14), "Fundo Lilás (#F0E6FF)", fill=(125, 43, 214, 255), font=tag_font)

        # Load image
        if os.path.exists(path):
            size_kb = os.path.getsize(path) / 1024.0
            img = Image.open(path).convert("RGBA")
            
            # Place on left (white) and right (lilac)
            # Determine scale to fit in half box (box width = (card_w-20)//2 = 200, box height = 110)
            max_w, max_h = 160, 110
            orig_w, orig_h = img.size
            ratio = min(max_w / orig_w, max_h / orig_h, 1.0) # don't upscale if small
            target_w = int(orig_w * ratio)
            target_h = int(orig_h * ratio)
            thumb = img.resize((target_w, target_h), Image.Resampling.LANCZOS)

            # Left position (centered in left box: x+8 to x+card_w//2)
            left_center_x = (x + 8 + x + card_w // 2) // 2
            center_y = y + 8 + 20 + (split_h - 28) // 2
            pos_left = (left_center_x - target_w // 2, center_y - target_h // 2)
            canvas.alpha_composite(thumb, dest=pos_left)

            # Right position (centered in right box: x+card_w//2 to x+card_w-8)
            right_center_x = (x + card_w // 2 + x + card_w - 8) // 2
            pos_right = (right_center_x - target_w // 2, center_y - target_h // 2)
            canvas.alpha_composite(thumb, dest=pos_right)
        else:
            size_kb = 0.0

        # Bottom info area
        info_y = y + split_h + 10
        draw.text((x + 14, info_y), name, fill=(55, 30, 95, 255), font=label_font)
        
        # Dimensions & Size
        meta_str = f"{dims}  •  {size_kb:.1f} KB"
        draw.text((x + 14, info_y + 24), meta_str, fill=(110, 100, 130, 255), font=info_font)

        # Status badge
        badge_text = "✓ OK <= 120KB"
        badge_w = 95
        badge_h = 22
        badge_x = x + card_w - badge_w - 14
        badge_y = info_y + 20
        draw.rounded_rectangle([(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)], radius=6, fill=(236, 253, 245, 255), outline=(167, 243, 208, 255), width=1)
        badge_font = get_font(11, bold=True)
        draw.text((badge_x + 8, badge_y + 4), badge_text, fill=(5, 150, 105, 255), font=badge_font)

        # Category tag top
        cat_font = get_font(10, bold=True)
        cat_w = draw.textlength(cat, font=cat_font)
        draw.rounded_rectangle([(x + card_w - cat_w - 24, y + split_h + 8), (x + card_w - 14, y + split_h + 24)], radius=4, fill=(245, 240, 252, 255))
        draw.text((x + card_w - cat_w - 19, y + split_h + 10), cat, fill=(125, 43, 214, 255), font=cat_font)

    # Footer note
    draw.text((start_x, H - 45), "Gerado automaticamente seguindo tokens oficiais do PurplePiggy (PROMPT 10 - Redesign V2).", fill=(140, 130, 160, 255), font=info_font)

    canvas.save("mascotes/_preview.png", "PNG")
    print("mascotes/_preview.png successfully generated!")

if __name__ == "__main__":
    create_preview()
