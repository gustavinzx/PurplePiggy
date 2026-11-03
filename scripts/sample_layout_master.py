"""
Amostragem direta na imagem mãe de alta resolução: design/LayoutDoApp.png
Dimensões da mãe: 1312 x 1199.
"""
from PIL import Image
import numpy as np

def rgb_to_hex(r, g, b):
    return f"#{r:02X}{g:02X}{b:02X}"

img = Image.open('design/LayoutDoApp.png').convert('RGB')
w, h = img.size
print(f"LayoutDoApp.png: {w}x{h}")

# 1. Header (y: 20 a 110)
# Wordmark "Purple" e "Piggy"
# Vamos recortar o logo do topo de LayoutDoApp (x: 40 a 300, y: 30 a 90)
crop_logo = img.crop((40, 30, 320, 95))
crop_logo.save('test-results/crop_logo_highres.png')

arr_logo = np.array(crop_logo)
# Procurar tons roxos do "Purple" e degradê do "Piggy"
purple_text = []
piggy_text = []
for y in range(arr_logo.shape[0]):
    for x in range(arr_logo.shape[1]):
        r, g, b = arr_logo[y, x]
        # descartar fundos muito claros
        if r > 230 and g > 210 and b > 230:
            continue
        # Se for tom roxo escuro
        if r < 80 and g < 40 and b < 130 and b > r:
            purple_text.append((r, g, b))
        # Se for magenta/rosa/violeta vibrante (Piggy)
        if r > 100 and b > 140 and g < 80:
            piggy_text.append((r, g, b))

if purple_text:
    avg_p = np.mean(purple_text, axis=0).astype(int)
    print("Wordmark 'Purple' médio:", rgb_to_hex(*avg_p))
    # pegar amostras individuais
    sample_p = [rgb_to_hex(*p) for p in purple_text[:5]]
    print("  Exemplos 'Purple':", sample_p)

if piggy_text:
    # agrupar início e fim do degradê (x menor vs x maior)
    print(f"Encontrados {len(piggy_text)} pixels de 'Piggy'")
    # Pegar os 5 mais à esquerda e 5 mais à direita no crop
    # Vamos achar as coordenadas exatas
    pts_left = []
    pts_right = []
    mid_x = arr_logo.shape[1] // 2
    for y in range(arr_logo.shape[0]):
        for x in range(arr_logo.shape[1]):
            r, g, b = arr_logo[y, x]
            if r > 100 and b > 140 and g < 80:
                if x < 180:
                    pts_left.append((r, g, b))
                else:
                    pts_right.append((r, g, b))
    if pts_left:
        print("  Piggy início (roxo-magenta):", rgb_to_hex(*np.mean(pts_left, axis=0).astype(int)))
    if pts_right:
        print("  Piggy fim (magenta vivo):", rgb_to_hex(*np.mean(pts_right, axis=0).astype(int)))

# 2. Amostrar Celular 06 (Home / Dashboard):
# Coluna 1 (x: 52, y: 473, w: 220, h: 340)
c6_x = 52
c6_y = 473
c6_w = 220
c6_h = 340
crop_c6 = img.crop((c6_x, c6_y, c6_x + c6_w, c6_y + c6_h))
crop_c6.save('test-results/crop_c6_home.png')

# Fundo do app (topo e base)
bg_top = crop_c6.crop((20, 20, 50, 40))
bg_bottom = crop_c6.crop((20, c6_h - 40, 50, c6_h - 20))
print("\nFundo do App (Celular 06):")
print("  Topo:", rgb_to_hex(*np.mean(np.array(bg_top), axis=(0,1)).astype(int)))
print("  Base:", rgb_to_hex(*np.mean(np.array(bg_bottom), axis=(0,1)).astype(int)))

# Card de saldo (em c6, y: ~65 a ~135, x: ~15 a ~205)
crop_saldo = crop_c6.crop((18, 68, c6_w - 18, 138))
crop_saldo.save('test-results/crop_c6_saldo.png')
# Canto superior esquerdo vs canto inferior direito do card de saldo
saldo_arr = np.array(crop_saldo)
saldo_tl = np.mean(saldo_arr[5:20, 5:30], axis=(0,1)).astype(int)
saldo_br = np.mean(saldo_arr[-20:-5, -30:-5], axis=(0,1)).astype(int)
print("\nCard de Saldo Degradê (Celular 06):")
print("  Top-Left (início):", rgb_to_hex(*saldo_tl))
print("  Bottom-Right (fim):", rgb_to_hex(*saldo_br))

# Badge +12% dentro do card de saldo (em crop_saldo, x: ~10 a ~45, y: ~48 a ~65)
crop_badge = crop_saldo.crop((8, 45, 55, 66))
crop_badge.save('test-results/crop_c6_badge.png')
# Separar fundo do badge (verde claro) do texto (verde escuro)
badge_arr = np.array(crop_badge)
green_bg = []
green_text = []
for y in range(badge_arr.shape[0]):
    for x in range(badge_arr.shape[1]):
        r, g, b = badge_arr[y, x]
        if g > 200 and r > 160: # fundo verde pastel
            green_bg.append((r, g, b))
        elif g > 80 and r < 60 and b < 90: # texto verde escuro
            green_text.append((r, g, b))

if green_bg:
    print("  Badge fundo verde claro:", rgb_to_hex(*np.mean(green_bg, axis=0).astype(int)))
if green_text:
    print("  Badge texto verde escuro:", rgb_to_hex(*np.mean(green_text, axis=0).astype(int)))

# 3. Botão Primário e Secundário no Celular 04 (Login) ou Celular 01 (Splash)
# Celular 04: Coluna 4 (x: 797, y: 125, w: 220, h: 340)
c4_x = 797
c4_y = 125
c4_w = 220
c4_h = 340
crop_c4 = img.crop((c4_x, c4_y, c4_x + c4_w, c4_y + c4_h))
crop_c4.save('test-results/crop_c4_login.png')

# Botão Primário "Entrar" (em c4, y: ~220 a ~250)
crop_btn_entrar = crop_c4.crop((20, 218, c4_w - 20, 248))
crop_btn_entrar.save('test-results/crop_c4_btn_entrar.png')
arr_btn = np.array(crop_btn_entrar)
# Esquerda do botão vs Direita do botão
btn_l = np.mean(arr_btn[5:25, 5:30], axis=(0,1)).astype(int)
btn_r = np.mean(arr_btn[5:25, -30:-5], axis=(0,1)).astype(int)
print("\nBotão Primário (Celular 04):")
print("  Início (esquerda):", rgb_to_hex(*btn_l))
print("  Fim (direita):", rgb_to_hex(*btn_r))

# Botão Secundário / Outline "Criar uma conta" (em c4, y: ~255 a ~285)
crop_btn_outline = crop_c4.crop((20, 255, c4_w - 20, 285))
crop_btn_outline.save('test-results/crop_c4_btn_outline.png')
arr_out = np.array(crop_btn_outline)
# Borda e texto
border_colors = []
for y in range(arr_out.shape[0]):
    for x in range(arr_out.shape[1]):
        r, g, b = arr_out[y, x]
        # Se for a cor da borda/texto (roxo vivo intermediário)
        if 80 < r < 140 and 20 < g < 60 and 150 < b < 220:
            border_colors.append((r, g, b))
if border_colors:
    print("Botão Secundário Outline (Celular 04):")
    print("  Borda/Texto roxo:", rgb_to_hex(*np.mean(border_colors, axis=0).astype(int)))

# 4. Celular 10 (Metas): Coluna 5, Linha 2 (x: 1046, y: 473, w: 220, h: 340)
c10_x = 1046
c10_y = 473
c10_w = 220
c10_h = 340
crop_c10 = img.crop((c10_x, c10_y, c10_x + c10_w, c10_y + c10_h))
crop_c10.save('test-results/crop_c10_metas.png')

# Anel de progresso (lado direito do primeiro card de meta)
# y: ~70 a ~130, x: ~155 a ~205
crop_ring = crop_c10.crop((155, 75, 205, 125))
crop_ring.save('test-results/crop_c10_ring.png')
arr_ring = np.array(crop_ring)
ring_pixels = []
track_pixels = []
for y in range(arr_ring.shape[0]):
    for x in range(arr_ring.shape[1]):
        r, g, b = arr_ring[y, x]
        # cor roxa do anel
        if r > 90 and g < 60 and b > 160:
            ring_pixels.append((r, g, b))
        # cor do trilho (lilás claro/cinza)
        if 220 < r < 245 and 215 < g < 240 and 235 < b < 255:
            track_pixels.append((r, g, b))

print("\nAnel de Meta (Celular 10):")
if ring_pixels:
    print("  Traço preenchido:", rgb_to_hex(*np.mean(ring_pixels, axis=0).astype(int)))
if track_pixels:
    print("  Trilho não preenchido:", rgb_to_hex(*np.mean(track_pixels, axis=0).astype(int)))

# Moeda dourada (topo do mascote ou ícone)
crop_c6_mascot = crop_c6.crop((c6_w - 55, 15, c6_w - 10, 55))
crop_c6_mascot.save('test-results/crop_c6_mascot.png')
arr_mascot = np.array(crop_c6_mascot)
gold_pixels = []
for y in range(arr_mascot.shape[0]):
    for x in range(arr_mascot.shape[1]):
        r, g, b = arr_mascot[y, x]
        if r > 230 and 170 < g < 225 and b < 100:
            gold_pixels.append((r, g, b))
if gold_pixels:
    print("\nMoeda dourada do mascote:")
    print("  Hex:", rgb_to_hex(*np.mean(gold_pixels, axis=0).astype(int)))

# 5. Celular 08 (Detalhe de Gasto): Coluna 3, Linha 2 (x: 548, y: 473, w: 220, h: 340)
c8_x = 548
c8_y = 473
c8_w = 220
c8_h = 340
crop_c8 = img.crop((c8_x, c8_y, c8_x + c8_w, c8_y + c8_h))
crop_c8.save('test-results/crop_c8_detalhe.png')

# Botão "Excluir lançamento" (y: ~295 a ~325)
crop_excluir = crop_c8.crop((20, 290, c8_w - 20, 325))
crop_excluir.save('test-results/crop_c8_excluir.png')
arr_exc = np.array(crop_excluir)
exc_pixels = []
for y in range(arr_exc.shape[0]):
    for x in range(arr_exc.shape[1]):
        r, g, b = arr_exc[y, x]
        # cor rosa/vermelha
        if r > 200 and g < 90 and b < 140:
            exc_pixels.append((r, g, b))
if exc_pixels:
    print("\nBotão Excluir Lançamento (Celular 08):")
    print("  Texto/Borda rosa-avermelhada:", rgb_to_hex(*np.mean(exc_pixels, axis=0).astype(int)))
