"""Social share image (1200x630): brand yellow, the official logo (rendered from the .ai) and the yellow-poster creature."""
import os

import pymupdf
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1200, 630
YELLOW = (0xFE, 0xE8, 0x01)

canvas = Image.new('RGB', (W, H), YELLOW)

# logo: the vector artwork rendered large, cropped to its bounds
page = pymupdf.open(os.path.join(ROOT, 'assets_src', 'logo.ai'))[0]
clip = pymupdf.Rect(72.14, 50.78, 436.47, 121.6)
pix = page.get_pixmap(dpi=600, clip=clip, alpha=True)
logo = Image.frombytes('RGBA', (pix.width, pix.height), pix.samples)
lw = 600
logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
canvas.paste(logo, (W - lw - 70, (H - logo.height) // 2 - 10), logo)

# the creature, standing on the left edge
creature = Image.open(os.path.join(ROOT, 'web_assets', 'creatures', 'yellow_full.png')).convert('RGBA')
ch = H - 60
creature = creature.resize((round(creature.width * ch / creature.height), ch), Image.LANCZOS)
canvas.paste(creature, (60, 30), creature)

out = os.path.join(ROOT, 'site', 'public', 'og.png')
canvas.save(out, optimize=True)
print(out, os.path.getsize(out))
