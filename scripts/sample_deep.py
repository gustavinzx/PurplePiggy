"""
Script aprofundado para amostragem pixel-a-pixel de cada elemento requerido pelo Prompt 08.
"""
from PIL import Image
import numpy as np

def rgb_to_hex(rgb):
    return f"#{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"

def get_dominant_colors(image, box=None, n=10, min_diff=15):
    """Retorna as cores dominantes agrupadas por proximidade perceptual."""
    if box:
        crop = image.crop(box)
    else:
        crop = image
    
    # Reduzir ou converter para array
    arr = np.array(crop.convert('RGB'))
    pixels = arr.reshape(-1, 3)
    
    # Contar ocorrências
    unique, counts = np.unique(pixels, axis=0, return_counts=True)
    sorted_indices = np.argsort(-counts)
    
    dominant = []
    for idx in sorted_indices:
        color = unique[idx]
        count = counts[idx]
        
        # Verificar se está muito próxima de alguma cor já selecionada
        too_close = False
        for d, _ in dominant:
            if np.max(np.abs(color.astype(int) - d.astype(int))) < min_diff:
                too_close = True
                break
        if not too_close:
            dominant.append((color, count))
            if len(dominant) >= n:
                break
                
    return [(rgb_to_hex(c), cnt) for c, cnt in dominant]

# 1. WORDMARK em 00-marca.png
marca = Image.open('design/telas/00-marca.png').convert('RGB')
mw, mh = marca.size
print("=== 1. WORDMARK (00-marca.png) ===")
# O logo e texto ficam nos primeiros 350px de largura
print("Wordmark cores dominantes (x: 50 a 350, y: 10 a 70):")
wm_colors = get_dominant_colors(marca, (50, 10, 350, 70), n=12, min_diff=20)
for hex_c, cnt in wm_colors:
    print(f"  {hex_c} (cnt: {cnt})")

# 2. SPLASH (01-splash.png) - Botão primário "Começar", botão ghost/secundário "Entrar"
splash = Image.open('design/telas/01-splash.png').convert('RGB')
sw, sh = splash.size
print("\n=== 2. SPLASH (01-splash.png) ===")
print(f"Dimensões splash: {sw}x{sh}")
# Botão "Começar" (geralmente nos últimos 25% da tela)
# Encontrar linha do botão primário
print("Botão Primário 'Começar' (y: 220 a 250):")
btn_prim = get_dominant_colors(splash, (20, 220, sw - 20, 252), n=8, min_diff=15)
for hex_c, cnt in btn_prim:
    print(f"  {hex_c} (cnt: {cnt})")

print("Botão Secundário / Link 'Entrar' (y: 255 a 285):")
btn_sec = get_dominant_colors(splash, (20, 255, sw - 20, 285), n=8, min_diff=15)
for hex_c, cnt in btn_sec:
    print(f"  {hex_c} (cnt: {cnt})")

# 3. LOGIN (04-login.png) - Inputs, Botão Primário "Entrar", Botão Outline "Criar uma conta"
login = Image.open('design/telas/04-login.png').convert('RGB')
lw, lh = login.size
print("\n=== 3. LOGIN (04-login.png) ===")
# Input email / senha (y: 110 a 180)
print("Área de Inputs (y: 110 a 170):")
input_colors = get_dominant_colors(login, (20, 110, lw - 20, 170), n=8, min_diff=15)
for hex_c, cnt in input_colors:
    print(f"  {hex_c} (cnt: {cnt})")

print("Botão Primário 'Entrar' (y: 195 a 225):")
login_btn_prim = get_dominant_colors(login, (20, 195, lw - 20, 225), n=8, min_diff=15)
for hex_c, cnt in login_btn_prim:
    print(f"  {hex_c} (cnt: {cnt})")

print("Botão Secundário Outline 'Criar uma conta' (y: 230 a 260):")
login_btn_out = get_dominant_colors(login, (20, 230, lw - 20, 260), n=8, min_diff=15)
for hex_c, cnt in login_btn_out:
    print(f"  {hex_c} (cnt: {cnt})")

# 4. HOME / DASHBOARD (06-home.png)
home = Image.open('design/telas/06-home.png').convert('RGB')
hw, hh = home.size
print("\n=== 4. HOME (06-home.png) ===")
# Título "Olá, Ana!"
print("Título 'Olá, Ana!' (y: 20 a 50, x: 15 a 120):")
title_colors = get_dominant_colors(home, (15, 20, 120, 50), n=6, min_diff=20)
for hex_c, cnt in title_colors:
    print(f"  {hex_c} (cnt: {cnt})")

# Card de saldo (y: 60 a 125)
print("Card de Saldo Degradê (y: 60 a 125, x: 15 a hw-15):")
# Amostrar esquerda, centro e direita do card de saldo
saldo_left = get_dominant_colors(home, (25, 70, 70, 115), n=5, min_diff=15)
saldo_right = get_dominant_colors(home, (hw - 70, 70, hw - 25, 115), n=5, min_diff=15)
print("  Saldo Esquerda:", [c for c, _ in saldo_left])
print("  Saldo Direita:", [c for c, _ in saldo_right])

# Badge "+12%" (dentro do card de saldo, geralmente perto de y: 105, x: 25 a 70)
print("Badge +12% / Positivo (y: 100 a 120, x: 20 a 80):")
badge_colors = get_dominant_colors(home, (20, 100, 80, 120), n=6, min_diff=15)
for hex_c, cnt in badge_colors:
    print(f"  {hex_c} (cnt: {cnt})")

# Card branco de Transações Recentes (y: 200 a 270)
print("Card de Transações Recentes (y: 200 a 270, x: 15 a hw-15):")
card_colors = get_dominant_colors(home, (15, 200, hw - 15, 270), n=8, min_diff=15)
for hex_c, cnt in card_colors:
    print(f"  {hex_c} (cnt: {cnt})")

# 5. METAS (10-metas.png) - Anel de meta
metas = Image.open('design/telas/10-metas.png').convert('RGB')
mw, mh = metas.size
print("\n=== 5. METAS (10-metas.png) ===")
# Procurar anéis de meta (lado direito de cada card)
print("Anéis de progresso (x: 140 a 195, y: 70 a 220):")
ring_colors = get_dominant_colors(metas, (140, 70, 195, 220), n=10, min_diff=15)
for hex_c, cnt in ring_colors:
    print(f"  {hex_c} (cnt: {cnt})")

# 6. DETALHE (08-detalhe.png) - Botão Excluir, Badge Despesa
detalhe = Image.open('design/telas/08-detalhe.png').convert('RGB')
dw, dh = detalhe.size
print("\n=== 6. DETALHE (08-detalhe.png) ===")
# Botão Excluir (geralmente na parte inferior)
print("Botão Excluir Lançamento (y: 250 a 285):")
excluir_colors = get_dominant_colors(detalhe, (20, 250, dw - 20, 285), n=6, min_diff=15)
for hex_c, cnt in excluir_colors:
    print(f"  {hex_c} (cnt: {cnt})")

# Valor negativo / despesa (y: 70 a 110)
print("Valor de Despesa (y: 70 a 110):")
val_colors = get_dominant_colors(detalhe, (30, 70, dw - 30, 110), n=6, min_diff=15)
for hex_c, cnt in val_colors:
    print(f"  {hex_c} (cnt: {cnt})")

# 7. GASTOS (07-gastos.png) - Gráfico de barras, Botão "+ Adicionar gasto"
gastos = Image.open('design/telas/07-gastos.png').convert('RGB')
gw, gh = gastos.size
print("\n=== 7. GASTOS (07-gastos.png) ===")
print("Botão '+ Adicionar gasto' (y: 260 a 295):")
add_btn_colors = get_dominant_colors(gastos, (20, 260, gw - 20, 295), n=6, min_diff=15)
for hex_c, cnt in add_btn_colors:
    print(f"  {hex_c} (cnt: {cnt})")
