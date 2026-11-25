"""Cut the poster creatures into their original sculpture parts (one masked smart object each) as transparent web assets.

Each creature smart object is itself a PSB whose layers are masked photos of separate artifacts. A part is rendered
alone with the creature's adjustment layers still applied (the cream creature is black & white), then trimmed;
parts.json records where it sat in the creature so the original assembly can be rebuilt exactly in the browser.
"""
import glob
import json
import os

from PIL import Image
from psd_tools import PSDImage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SO = os.path.join(ROOT, 'audit', 'smartobjects')
OUT = os.path.join(ROOT, 'web_assets', 'creatures')
os.makedirs(OUT, exist_ok=True)
MAXW = 1400  # creature canvas width on the web
CREATURES = {'faf7cb8b': 'yellow', 'Black_&_White': 'cream', 'shutterstock': 'pink'}
ADJ = ('curves', 'blackandwhite', 'levels', 'huesaturation', 'brightnesscontrast')

meta = {}
for f in sorted(glob.glob(os.path.join(SO, '*.8bpb'))):
    key = next((v for k, v in CREATURES.items() if k in os.path.basename(f)), None)
    if not key:
        continue
    psd = PSDImage.open(f)
    scale = min(1.0, MAXW / psd.width)
    size = (round(psd.width * scale), round(psd.height * scale))
    full = psd.composite(force=True).convert('RGBA').resize(size, Image.LANCZOS)
    full.save(os.path.join(OUT, f'{key}_full.png'), optimize=True)
    full.save(os.path.join(OUT, f'{key}_full.webp'), quality=88)
    parts = [l for l in psd if l.kind == 'smartobject']
    meta[key] = {'w': size[0], 'h': size[1], 'parts': []}
    for i, part in enumerate(parts):
        im = psd.composite(force=True, layer_filter=lambda l, p=part: l is p or l.kind in ADJ)
        im = im.convert('RGBA').resize(size, Image.LANCZOS)
        box = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
        if not box:
            continue
        cut = im.crop(box)
        name = f'{key}_part{i}'
        cut.save(os.path.join(OUT, name + '.png'), optimize=True)
        cut.save(os.path.join(OUT, name + '.webp'), quality=88)
        meta[key]['parts'].append({'file': name, 'layer': part.name, 'x': box[0], 'y': box[1],
                                   'w': box[2] - box[0], 'h': box[3] - box[1], 'z': i})
        print(key, name, part.name, box)
with open(os.path.join(OUT, 'parts.json'), 'w', encoding='utf-8') as fh:
    json.dump(meta, fh, ensure_ascii=False, indent=1)
