"""Copy the extracted brand assets into the site's public folder: logo SVGs, creature parts, venue photos, partner logos."""
import glob
import os
import re
import shutil

from PIL import Image
from psd_tools import PSDImage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'site', 'public', 'assets')
for d in ('brand', 'creatures', 'venue', 'partners'):
    os.makedirs(os.path.join(PUB, d), exist_ok=True)

# logo: the .ai artwork as SVG, cropped to the artwork (full lockup) and to the mark alone
svg = open(os.path.join(ROOT, 'audit', 'logo_raw.svg'), encoding='utf-8').read()
body = re.sub(r'^.*?<svg[^>]*>', '', svg, count=1, flags=re.S)
body = re.sub(r'\s+inkscape:[\w-]+="[^"]*"', '', body)  # editor-only attributes; their namespace isn't declared
for name, (x0, y0, x1, y1) in {'logo': (72.14, 50.78, 436.47, 121.6), 'logo-mark': (315.16, 50.78, 436.47, 121.6)}.items():
    pad = 1.5
    vb = f'{x0 - pad:.2f} {y0 - pad:.2f} {x1 - x0 + 2 * pad:.2f} {y1 - y0 + 2 * pad:.2f}'
    with open(os.path.join(PUB, 'brand', name + '.svg'), 'w', encoding='utf-8') as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="{vb}">' + body)

for f in glob.glob(os.path.join(ROOT, 'web_assets', 'creatures', '*')):
    if f.endswith(('.webp', '.json')):
        shutil.copy(f, os.path.join(PUB, 'creatures'))
for f in glob.glob(os.path.join(ROOT, 'web_assets', 'venue', '*.webp')):
    shutil.copy(f, os.path.join(PUB, 'venue'))

# partner logos from the poster (shown in the poster footer): Kol HaNeshama, JCU, the ant ("bk")
so = os.path.join(ROOT, 'audit', 'smartobjects')
for key, name in [('kol_haneshama_logo', 'kol-haneshama'), ('jcu_logo', 'jcu'), ('bk_logo', 'bk')]:
    src = glob.glob(os.path.join(so, f'medorot_poster__*__{key}.*'))
    src = [s for s in src if '__placed' not in s][0]
    im = PSDImage.open(src).composite() if src.endswith('.8bpb') else Image.open(src)
    im = im.convert('RGBA')
    box = im.getchannel('A').getbbox()
    im = im.crop(box) if box else im
    im.thumbnail((600, 600), Image.LANCZOS)
    im.save(os.path.join(PUB, 'partners', name + '.png'), optimize=True)
    print(name, im.size)
print('ok')
