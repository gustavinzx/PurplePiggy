"""
Script para inspecionar os crops e medir raios, dimensões e cores exatas.
"""
from PIL import Image
import numpy as np

def rgb_to_hex(rgb):
    return f"#{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"

# Vamos abrir crop_c4_login.png e encontrar a localização exata do botão "Entrar"
c4 = Image.open('test-results/crop_c4_login.png').convert('RGB')
arr_c4 = np.array(c4)

print("--- ANALISANDO C4 LOGIN ---")
# Vamos procurar por linhas com saturação alta de roxo (o botão Entrar)
for y in range(150, arr_c4.shape[0]):
    row = arr_c4[y, :]
    # procurar pixels com r e b altos e g baixo
    purples = [x for x in range(len(row)) if row[x, 0] > 70 and row[x, 1] < 60 and row[x, 2] > 120]
    if len(purples) > 50:
        x_min, x_max = min(purples), max(purples)
        left_color = rgb_to_hex(row[x_min + 10])
        mid_color = rgb_to_hex(row[(x_min + x_max)//2])
        right_color = rgb_to_hex(row[x_max - 10])
        print(f"Linha y={y}: Botão de x={x_min} a x={x_max} (largura={x_max - x_min}px)")
        print(f"  Esquerda: {left_color}, Centro: {mid_color}, Direita: {right_color}")
        break

# Vamos encontrar o topo e a base do botão primário para medir a altura
btn_y_coords = []
for y in range(150, arr_c4.shape[0]):
    row = arr_c4[y, :]
    purples = [x for x in range(len(row)) if row[x, 0] > 70 and row[x, 1] < 60 and row[x, 2] > 120]
    if len(purples) > 50:
        btn_y_coords.append(y)

if btn_y_coords:
    y_top = min(btn_y_coords)
    y_bottom = max(btn_y_coords)
    height_px = y_bottom - y_top + 1
    print(f"Botão Primário em C4: y={y_top} a y={y_bottom} -> Altura = {height_px}px (na imagem de ~220px de largura)")
    # Se a tela inteira tem 220px de largura e equivale a 390px no viewport mobile:
    # Fator de escala = 390 / 220 = 1.77
    scale = 390.0 / 220.0
    print(f"  Altura convertida para viewport 390px: {height_px * scale:.1f}px (~{round(height_px * scale)}px)")

# Vamos encontrar os inputs de email e senha
input_y_coords = []
for y in range(100, 180):
    row = arr_c4[y, :]
    # input costuma ter fundo quase branco ou borda lilás
    # vamos checar os pixels internos
    borders = [x for x in range(len(row)) if 180 < row[x, 0] < 230 and 160 < row[x, 1] < 210 and 220 < row[x, 2] < 255]
    if len(borders) > 20:
        input_y_coords.append(y)

if input_y_coords:
    print(f"Inputs detectados entre y={min(input_y_coords)} e y={max(input_y_coords)}")

# Vamos inspecionar C6 (Home)
c6 = Image.open('test-results/crop_c6_home.png').convert('RGB')
arr_c6 = np.array(c6)
print("\n--- ANALISANDO C6 HOME ---")
# Encontrar Card de Saldo
saldo_y = []
for y in range(50, 180):
    row = arr_c6[y, :]
    saldos = [x for x in range(len(row)) if row[x, 0] > 70 and row[x, 1] < 60 and row[x, 2] > 110]
    if len(saldos) > 80:
        saldo_y.append(y)

if saldo_y:
    y_top_s = min(saldo_y)
    y_bot_s = max(saldo_y)
    h_s = y_bot_s - y_top_s + 1
    print(f"Card de Saldo em C6: y={y_top_s} a y={y_bot_s} -> Altura = {h_s}px")
    scale = 390.0 / 220.0
    print(f"  Altura convertida para viewport 390px: {h_s * scale:.1f}px (~{round(h_s * scale)}px)")

    # Margem lateral do card de saldo
    row_mid = arr_c6[(y_top_s + y_bot_s)//2, :]
    saldos_x = [x for x in range(len(row_mid)) if row_mid[x, 0] > 70 and row_mid[x, 1] < 60 and row_mid[x, 2] > 110]
    if saldos_x:
        margin_left = min(saldos_x)
        margin_right = len(row_mid) - max(saldos_x)
        print(f"  Margem lateral na imagem: esq={margin_left}px, dir={margin_right}px")
        print(f"  Margem lateral convertida para 390px: {margin_left * scale:.1f}px (~{round(margin_left * scale)}px)")

# Encontrar Bottom Navigation em C6
# Últimos 40px da tela
nav_y = []
for y in range(arr_c6.shape[0] - 50, arr_c6.shape[0]):
    row = arr_c6[y, :]
    # bottom nav é uma barra branca/quase branca no fundo
    whites = [x for x in range(len(row)) if row[x, 0] > 240 and row[x, 1] > 240 and row[x, 2] > 240]
    if len(whites) > 150:
        nav_y.append(y)

if nav_y:
    nav_h = max(nav_y) - min(nav_y) + 1
    print(f"Bottom Navigation em C6: Altura = {nav_h}px")
    print(f"  Altura convertida para 390px: {nav_h * scale:.1f}px (~{round(nav_h * scale)}px)")
