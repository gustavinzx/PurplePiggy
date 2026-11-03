"""
Script de amostragem de pixels e análise de cores/dimensões do LayoutDoApp e recortes.
"""
import os
from PIL import Image
import numpy as np

def rgb_to_hex(r, g, b):
    return f"#{r:02X}{g:02X}{b:02X}"

def inspect_image(path):
    img = Image.open(path).convert('RGB')
    return img

print("--- ANALISANDO 00-marca.png ---")
marca = inspect_image('design/telas/00-marca.png')
w, h = marca.size
print(f"Dimensões 00-marca: {w}x{h}")

# Amostrar logo / wordmark
# Vamos encontrar os pixels mais escuros e mais saturados na área do texto "Purple" e "Piggy"
# No cabeçalho, à esquerda costuma ter o logo e wordmark
# Vamos fazer uma varredura nas cores predominantes
arr_marca = np.array(marca)

# Amostrar diferentes regiões
print("Pixels centrais / texto em 00-marca.png:")
# Procurar tons roxos escuros (Purple) e magenta/violeta (Piggy)
colors = {}
for y in range(0, h, 2):
    for x in range(0, min(w, 500), 2):
        r, g, b = arr_marca[y, x]
        # ignorar brancos e cinzas claros de fundo
        if r > 240 and g > 240 and b > 240:
            continue
        # agrupar
        h_val = rgb_to_hex(r, g, b)
        colors[h_val] = colors.get(h_val, 0) + 1

# Top cores do wordmark / logo
sorted_colors = sorted(colors.items(), key=lambda x: x[1], reverse=True)[:25]
for hex_code, count in sorted_colors:
    print(f"  {hex_code}: {count}")

print("\n--- ANALISANDO 04-login.png (Botão Primário, Secundário, Inputs) ---")
login = inspect_image('design/telas/04-login.png')
lw, lh = login.size
print(f"Dimensões 04-login: {lw}x{lh}")
arr_login = np.array(login)

# Cores de botões (procurar na metade inferior de 04-login)
btn_colors = {}
for y in range(int(lh * 0.45), lh):
    for x in range(int(lw * 0.1), int(lw * 0.9)):
        r, g, b = arr_login[y, x]
        if r > 235 and g > 235 and b > 235:
            continue
        h_val = rgb_to_hex(r, g, b)
        btn_colors[h_val] = btn_colors.get(h_val, 0) + 1

sorted_btn = sorted(btn_colors.items(), key=lambda x: x[1], reverse=True)[:25]
for hex_code, count in sorted_btn:
    print(f"  Botão/Input cor {hex_code}: {count}")

print("\n--- ANALISANDO 06-home.png (Card de Saldo, Fundo, Blobs, Texto) ---")
home = inspect_image('design/telas/06-home.png')
hw, hh = home.size
print(f"Dimensões 06-home: {hw}x{hh}")
arr_home = np.array(home)

# Fundo do app (cantos ou áreas livres)
bg_samples = [
    arr_home[5, 5],
    arr_home[15, 15],
    arr_home[hh - 50, 10],
    arr_home[hh - 100, hw - 10],
    arr_home[int(hh * 0.5), 10]
]
print("Amostras de Fundo do App (06-home):")
for s in bg_samples:
    print(" ", rgb_to_hex(s[0], s[1], s[2]))

# Card de saldo (geralmente entre 15% e 35% da altura)
saldo_top_left = arr_home[int(hh * 0.22), int(hw * 0.25)]
saldo_center = arr_home[int(hh * 0.26), int(hw * 0.5)]
saldo_bottom_right = arr_home[int(hh * 0.32), int(hw * 0.75)]
print("Card de Saldo (06-home):")
print(f"  Top-left: {rgb_to_hex(*saldo_top_left)}")
print(f"  Center: {rgb_to_hex(*saldo_center)}")
print(f"  Bottom-right: {rgb_to_hex(*saldo_bottom_right)}")

print("\n--- ANALISANDO 10-metas.png (Anel de Metas, Moeda, Positivo) ---")
metas = inspect_image('design/telas/10-metas.png')
mw, mh = metas.size
print(f"Dimensões 10-metas: {mw}x{mh}")
arr_metas = np.array(metas)

# Procurar tons dourados/amarelos/laranjas do anel de meta e moedas
gold_colors = {}
for y in range(0, mh):
    for x in range(0, mw):
        r, g, b = arr_metas[y, x]
        # cor quente (r alto, b mais baixo que g)
        if r > 200 and g > 130 and b < 120:
            h_val = rgb_to_hex(r, g, b)
            gold_colors[h_val] = gold_colors.get(h_val, 0) + 1

sorted_gold = sorted(gold_colors.items(), key=lambda x: x[1], reverse=True)[:15]
print("Tons quentes/dourados em 10-metas:")
for hex_code, count in sorted_gold:
    print(f"  {hex_code}: {count}")

print("\n--- ANALISANDO 08-detalhe.png (Negativo/Excluir, Positivo) ---")
detalhe = inspect_image('design/telas/08-detalhe.png')
dw, dh = detalhe.size
arr_detalhe = np.array(detalhe)

# Procurar tons vermelhos/rosas (negativo/excluir)
red_colors = {}
green_colors = {}
for y in range(0, dh):
    for x in range(0, dw):
        r, g, b = arr_detalhe[y, x]
        if r > 180 and g < 100 and b < 140:
            h_val = rgb_to_hex(r, g, b)
            red_colors[h_val] = red_colors.get(h_val, 0) + 1
        if g > 160 and r < 80 and b < 150:
            h_val = rgb_to_hex(r, g, b)
            green_colors[h_val] = green_colors.get(h_val, 0) + 1

print("Tons vermelhos/rosas (excluir/despesa) em 08-detalhe:")
for hex_code, count in sorted(red_colors.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f"  {hex_code}: {count}")

print("Tons verdes em 08-detalhe:")
for hex_code, count in sorted(green_colors.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f"  {hex_code}: {count}")
