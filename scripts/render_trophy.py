from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import math

def create_trophy_icon(output_path="mascotes/_raw/icon_trofeu_raw.png", size=2048):
    # We will draw at 2048x2048 for supersampling and then resize to 1024x1024
    w, h = size, size
    canvas = Image.new("RGBA", (w, h), (0, 255, 0, 255))
    
    # Layers
    layer_handles = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    layer_base = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    layer_cup = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    layer_emblem = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    layer_highlights = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    layer_sparkles = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    cx, cy = w // 2, int(h * 0.48)
    
    # 1. Handles (Left and Right)
    draw_h = ImageDraw.Draw(layer_handles)
    
    # Handle outer and inner ellipses
    handle_w = int(w * 0.22)
    handle_h = int(h * 0.30)
    top_y = cy - int(handle_h * 0.55)
    
    # Left handle
    draw_h.ellipse([cx - int(w * 0.38), top_y, cx - int(w * 0.12), top_y + handle_h], fill=(218, 138, 32, 255))
    draw_h.ellipse([cx - int(w * 0.38) + 6, top_y + 6, cx - int(w * 0.12) - 6, top_y + handle_h - 6], fill=(245, 184, 61, 255))
    draw_h.ellipse([cx - int(w * 0.33), top_y + 36, cx - int(w * 0.17), top_y + handle_h - 36], fill=(0, 0, 0, 0))
    
    # Right handle
    draw_h.ellipse([cx + int(w * 0.12), top_y, cx + int(w * 0.38), top_y + handle_h], fill=(218, 138, 32, 255))
    draw_h.ellipse([cx + int(w * 0.12) + 6, top_y + 6, cx + int(w * 0.38) - 6, top_y + handle_h - 6], fill=(245, 184, 61, 255))
    draw_h.ellipse([cx + int(w * 0.17), top_y + 36, cx + int(w * 0.33), top_y + handle_h - 36], fill=(0, 0, 0, 0))

    # 2. Base / Pedestal (Tiered Violet Base)
    draw_b = ImageDraw.Draw(layer_base)
    base_y = int(h * 0.72)
    
    # Bottom tier (Deep violet)
    draw_b.rounded_rectangle([cx - int(w * 0.26), base_y + 110, cx + int(w * 0.26), base_y + 200], radius=40, fill=(74, 29, 130, 255))
    draw_b.rounded_rectangle([cx - int(w * 0.26), base_y + 100, cx + int(w * 0.26), base_y + 180], radius=40, fill=(109, 40, 201, 255))
    draw_b.rounded_rectangle([cx - int(w * 0.25), base_y + 104, cx + int(w * 0.25), base_y + 172], radius=36, fill=(125, 43, 214, 255))
    
    # Gold rim on pedestal
    draw_b.rounded_rectangle([cx - int(w * 0.23), base_y + 70, cx + int(w * 0.23), base_y + 114], radius=24, fill=(218, 138, 32, 255))
    draw_b.rounded_rectangle([cx - int(w * 0.23), base_y + 65, cx + int(w * 0.23), base_y + 105], radius=24, fill=(245, 184, 61, 255))
    draw_b.rounded_rectangle([cx - int(w * 0.22), base_y + 68, cx + int(w * 0.22), base_y + 98], radius=20, fill=(254, 218, 112, 255))
    
    # Stem connecting to cup
    draw_b.polygon([
        (cx - 50, base_y + 70), (cx + 50, base_y + 70),
        (cx + 40, cy + int(h * 0.20)), (cx - 40, cy + int(h * 0.20))
    ], fill=(218, 138, 32, 255))
    draw_b.polygon([
        (cx - 42, base_y + 65), (cx + 42, base_y + 65),
        (cx + 34, cy + int(h * 0.20)), (cx - 34, cy + int(h * 0.20))
    ], fill=(245, 184, 61, 255))
    
    # Small golden ball/knob on stem
    draw_b.ellipse([cx - 55, base_y + 10, cx + 55, base_y + 70], fill=(218, 138, 32, 255))
    draw_b.ellipse([cx - 50, base_y + 12, cx + 50, base_y + 64], fill=(254, 218, 112, 255))

    # 3. Cup Body (Golden U-Shape Goblet)
    draw_c = ImageDraw.Draw(layer_cup)
    cup_top = cy - int(h * 0.24)
    cup_bot = cy + int(h * 0.20)
    cup_w = int(w * 0.27)

    # Shading base
    draw_c.pieslice([cx - cup_w, cup_top, cx + cup_w, cup_bot + int(h*0.12)], 0, 180, fill=(218, 138, 32, 255))
    draw_c.rectangle([cx - cup_w, cup_top + int(h*0.06), cx + cup_w, cup_top + int(h*0.22)], fill=(218, 138, 32, 255))
    
    # Gradient/Lighter inner cup
    inner_w = cup_w - 14
    draw_c.pieslice([cx - inner_w, cup_top + 8, cx + inner_w, cup_bot + int(h*0.11)], 0, 180, fill=(245, 184, 61, 255))
    draw_c.rectangle([cx - inner_w, cup_top + int(h*0.06), cx + inner_w, cup_top + int(h*0.22)], fill=(245, 184, 61, 255))
    
    # Highlight band on left side of cup
    hl_w = cup_w - 40
    draw_c.pieslice([cx - hl_w - 15, cup_top + 16, cx + hl_w - 15, cup_bot + int(h*0.08)], 40, 180, fill=(254, 225, 130, 255))
    
    # Top rim of the cup (Ellipse)
    rim_h = int(h * 0.09)
    draw_c.ellipse([cx - cup_w - 10, cup_top, cx + cup_w + 10, cup_top + rim_h + 12], fill=(200, 120, 20, 255))
    draw_c.ellipse([cx - cup_w - 8, cup_top + 3, cx + cup_w + 8, cup_top + rim_h + 8], fill=(245, 184, 61, 255))
    draw_c.ellipse([cx - cup_w - 2, cup_top + 6, cx + cup_w + 2, cup_top + rim_h + 2], fill=(254, 228, 138, 255))
    # Cup opening depth
    draw_c.ellipse([cx - cup_w + 16, cup_top + 14, cx + cup_w - 16, cup_top + rim_h - 6], fill=(180, 100, 15, 255))
    draw_c.ellipse([cx - cup_w + 20, cup_top + 16, cx + cup_w - 20, cup_top + rim_h - 10], fill=(218, 138, 32, 255))

    # 4. Front Emblem: Golden Embossed Star
    draw_e = ImageDraw.Draw(layer_emblem)
    star_cx = cx
    star_cy = cy + 10
    star_r = int(w * 0.09)
    
    # Subtle dark backing
    draw_e.ellipse([star_cx - star_r - 12, star_cy - star_r - 12, star_cx + star_r + 12, star_cy + star_r + 12], fill=(200, 120, 20, 180))
    # Violet medallion
    draw_e.ellipse([star_cx - star_r - 6, star_cy - star_r - 6, star_cx + star_r + 6, star_cy + star_r + 6], fill=(125, 43, 214, 255))
    draw_e.ellipse([star_cx - star_r - 2, star_cy - star_r - 2, star_cx + star_r + 2, star_cy + star_r + 2], fill=(176, 55, 248, 255))
    
    # Star points
    points = []
    for i in range(10):
        angle = i * (math.pi / 5) - math.pi / 2
        r_dist = star_r * 0.85 if i % 2 == 0 else star_r * 0.42
        points.append((star_cx + r_dist * math.cos(angle), star_cy + r_dist * math.sin(angle)))
    draw_e.polygon(points, fill=(255, 248, 220, 255))

    # 5. Glossy 3D Specular Streaks (Clay / Toy finish)
    draw_hl = ImageDraw.Draw(layer_highlights)
    # Left cup glossy highlight arc
    draw_hl.rounded_rectangle([cx - int(cup_w * 0.75), cup_top + 70, cx - int(cup_w * 0.55), cy + 80], radius=18, fill=(255, 255, 255, 140))
    draw_hl.rounded_rectangle([cx - int(cup_w * 0.70), cup_top + 80, cx - int(cup_w * 0.60), cy + 40], radius=10, fill=(255, 255, 255, 220))
    # Pedestal highlight
    draw_hl.rounded_rectangle([cx - int(w * 0.20), base_y + 112, cx - int(w * 0.05), base_y + 130], radius=8, fill=(255, 255, 255, 120))

    # 6. Sparkles (4-pointed stars)
    draw_sp = ImageDraw.Draw(layer_sparkles)
    def draw_sparkle(scx, scy, srad):
        sp_pts = [
            (scx, scy - srad), (scx + srad*0.25, scy - srad*0.25),
            (scx + srad, scy), (scx + srad*0.25, scy + srad*0.25),
            (scx, scy + srad), (scx - srad*0.25, scy + srad*0.25),
            (scx - srad, scy), (scx - srad*0.25, scy - srad*0.25)
        ]
        draw_sp.polygon(sp_pts, fill=(255, 240, 150, 255))
        draw_sp.ellipse([scx - srad*0.15, scy - srad*0.15, scx + srad*0.15, scy + srad*0.15], fill=(255, 255, 255, 255))

    draw_sparkle(cx + int(w * 0.30), cy - int(h * 0.26), int(w * 0.055))
    draw_sparkle(cx - int(w * 0.28), cy - int(h * 0.22), int(w * 0.040))
    draw_sparkle(cx + int(w * 0.24), cy + int(h * 0.16), int(w * 0.032))

    # Composite layers over pure green canvas
    canvas.alpha_composite(layer_handles)
    canvas.alpha_composite(layer_base)
    canvas.alpha_composite(layer_cup)
    canvas.alpha_composite(layer_emblem)
    canvas.alpha_composite(layer_highlights)
    canvas.alpha_composite(layer_sparkles)

    # Convert to RGB on #00FF00
    final_rgb = Image.new("RGB", (w, h), (0, 255, 0))
    final_rgb.paste(canvas, (0, 0), canvas)
    
    # Downsample to 1024x1024 with LANCZOS for smooth antialiasing
    final_1024 = final_rgb.resize((1024, 1024), Image.Resampling.LANCZOS)
    final_1024.save(output_path, "JPEG", quality=98)
    print(f"Icon trophy generated on green screen: {output_path}")

create_trophy_icon()
