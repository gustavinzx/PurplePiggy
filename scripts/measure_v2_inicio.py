from PIL import Image

im = Image.open('design/v2/01-inicio.png')
w, h = im.size
print(f"Image dimensions: {w}x{h}")

# The reference crop is 250x440.
# The standard mobile viewport is 390x844 (scale ~ 1.56x horizontally, 1.91x vertically or aspect ratio).
# Let's inspect the vertical regions in 01-inicio.png:
# 1. Header (Olá, Ana! + Bell): y ~ 0 to 45
# 2. Balance card: y ~ 45 to 140
#    Mascot: anchored on top-right of balance card
# 3. Income / Expenses row: y ~ 145 to 200
# 4. Emergency reserve: y ~ 205 to 260
# 5. Suas metas: y ~ 265 to 350
# 6. Transações recentes: y ~ 355 to end

print("Done basic inspect")
