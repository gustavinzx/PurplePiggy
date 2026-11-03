import os
import sys
import argparse
from pathlib import Path
from PIL import Image
import numpy as np

def remove_green_screen(image: Image.Image, t_low=-5.0, t_high=25.0) -> Image.Image:
    """
    Remove green background using hue/green-dominance (delta = G - max(R, B)),
    applies smooth alpha ramp, and performs despill on edges to eliminate green fringing.
    """
    im_rgb = image.convert("RGB")
    arr = np.array(im_rgb, dtype=np.float32)
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    
    rb = np.maximum(r, b)
    delta = g - rb

    # Alpha ramp: delta <= t_low -> 1.0 (foreground), delta >= t_high -> 0.0 (background)
    t = np.clip((delta - t_low) / (t_high - t_low), 0.0, 1.0)
    # Smoothstep interpolation
    alpha = 1.0 - (3.0 * t**2 - 2.0 * t**3)

    # Despill: wherever green is dominant, clamp green to rb (or average)
    despill_mask = g > rb
    g_clean = g.copy()
    g_clean[despill_mask] = rb[despill_mask]

    out_arr = np.dstack([r, g_clean, b, alpha * 255.0]).astype(np.uint8)
    return Image.fromarray(out_arr, mode="RGBA")

def remove_white_background(image: Image.Image, t_low=230.0, t_high=250.0) -> Image.Image:
    """
    Remove solid white / near-white background with smooth alpha transition.
    """
    im_rgb = image.convert("RGB")
    arr = np.array(im_rgb, dtype=np.float32)
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    
    # Whiteness metric: minimum channel value and low color saturation
    min_rgb = np.minimum(np.minimum(r, g), b)
    max_rgb = np.maximum(np.maximum(r, g), b)
    color_diff = max_rgb - min_rgb
    
    # Only pixels with very low saturation can be considered white background
    is_neutral = color_diff < 20.0
    
    t = np.clip((min_rgb - t_low) / (t_high - t_low), 0.0, 1.0)
    alpha = np.where(is_neutral, 1.0 - (3.0 * t**2 - 2.0 * t**3), 1.0)
    
    out_arr = np.dstack([r, g, b, alpha * 255.0]).astype(np.uint8)
    return Image.fromarray(out_arr, mode="RGBA")

def validate_border_ring(rgba_image: Image.Image, check_type="green") -> tuple[bool, str]:
    """
    Verifies that the semi-transparent transition boundary (10 <= alpha <= 245)
    has no green dominance or white halo.
    """
    arr = np.array(rgba_image)
    alpha = arr[:, :, 3]
    edge_mask = (alpha >= 10) & (alpha <= 245)
    
    if np.sum(edge_mask) == 0:
        return True, "No transition edge pixels found."

    r = arr[:, :, 0][edge_mask].astype(float)
    g = arr[:, :, 1][edge_mask].astype(float)
    b = arr[:, :, 2][edge_mask].astype(float)

    if check_type == "green":
        # Any edge pixel with green dominance (G > max(R, B) + 2) fails
        greenish = g > (np.maximum(r, b) + 2.0)
        count = np.sum(greenish)
        if count > 0:
            return False, f"Sobraram {count} pixels esverdeados no anel de borda."
        return True, "Bordas 100% limpas de verde."
        
    elif check_type == "white":
        # Any edge pixel with excessive brightness and near zero saturation
        whiteish = (r > 240) & (g > 240) & (b > 240)
        count = np.sum(whiteish)
        if count > 0:
            return False, f"Sobraram {count} pixels esbranquiçados no anel de borda."
        return True, "Bordas 100% limpas de branco."

    return True, "OK"

def process_image(input_path: str, output_base: str, bg_type="green", save_2x=True, target_size=1024):
    in_path = Path(input_path)
    im = Image.open(in_path)
    
    if bg_type == "green":
        rgba = remove_green_screen(im)
        valid, msg = validate_border_ring(rgba, "green")
    elif bg_type == "white":
        rgba = remove_white_background(im)
        valid, msg = validate_border_ring(rgba, "white")
    else:
        rgba = im.convert("RGBA")
        valid, msg = True, "RGBA direto"

    if not valid:
        print(f"[ALERTA DE VALIDAÇÃO] {in_path.name}: {msg}")

    # Output paths
    out_dir = Path(output_base).parent
    out_dir.mkdir(parents=True, exist_ok=True)
    
    stem = Path(output_base).stem
    out_1024 = out_dir / f"{stem}.png"
    out_2048 = out_dir / f"{stem}@2x.png"

    # Save 1024px version
    im_1024 = rgba.resize((target_size, target_size), Image.Resampling.LANCZOS)
    im_1024.save(out_1024, "PNG")
    print(f"Salvo: {out_1024} ({target_size}x{target_size}) - {msg}")

    # Save 2048px version if original was >= 2048 or save_2x is True
    if save_2x and (im.size[0] >= 2048 or im.size[1] >= 2048):
        im_2048 = rgba.resize((2048, 2048), Image.Resampling.LANCZOS)
        im_2048.save(out_2048, "PNG")
        print(f"Salvo: {out_2048} (2048x2048)")
    elif save_2x and im.size[0] < 2048:
        print(f"[AVISO] {in_path.name} tem tamanho original {im.size[0]}x{im.size[1]} (<2048px). Gerada apenas versão 1024px ({out_1024.name}).")

    return rgba

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Chroma keying e processamento de mascotes e ícones do PurplePiggy")
    parser.add_argument("--input", required=True, help="Arquivo de entrada")
    parser.add_argument("--output", required=True, help="Caminho base de saída (sem sufixo @2x)")
    parser.add_argument("--bg", default="green", choices=["green", "white", "direct"], help="Tipo de fundo a remover")
    parser.add_argument("--no-2x", action="store_true", help="Não gerar versão @2x")
    parser.add_argument("--size", type=int, default=1024, help="Tamanho da versão padrão")
    
    args = parser.parse_args()
    process_image(args.input, args.output, bg_type=args.bg, save_2x=not args.no_2x, target_size=args.size)
