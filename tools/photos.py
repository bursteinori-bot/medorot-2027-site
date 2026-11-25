"""Convert the venue HEIC photos to web images (upright, sRGB, two widths) and make a contact sheet."""
import glob
import os

import pillow_heif
from PIL import Image, ImageOps

pillow_heif.register_heif_opener()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'web_assets', 'venue')
os.makedirs(OUT, exist_ok=True)
WIDTHS = (2000, 960)

thumbs = []
for f in sorted(glob.glob(os.path.join(ROOT, 'assets_src', 'photos', '*.heic'))):
    name = os.path.splitext(os.path.basename(f))[0]
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    for w in WIDTHS:
        r = im.copy()
        r.thumbnail((w, w * 2), Image.LANCZOS)
        r.save(os.path.join(OUT, f'{name}_{w}.webp'), quality=82, method=6)
        r.save(os.path.join(OUT, f'{name}_{w}.jpg'), quality=84, optimize=True, progressive=True)
    t = im.copy()
    t.thumbnail((420, 420))
    thumbs.append((name, t))
    print(name, im.size)

cols = 5
cw, ch = 430, 440
sheet = Image.new('RGB', (cols * cw, -(-len(thumbs) // cols) * ch), 'white')
from PIL import ImageDraw
d = ImageDraw.Draw(sheet)
for i, (n, t) in enumerate(thumbs):
    x, y = i % cols * cw, i // cols * ch
    sheet.paste(t, (x + 5, y + 5))
    d.text((x + 8, y + 425), n, fill='black')
sheet.save(os.path.join(ROOT, 'audit', 'venue_sheet.jpg'), quality=85)
