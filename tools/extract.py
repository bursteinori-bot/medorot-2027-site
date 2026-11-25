"""Extract web assets from the brand files: artboards, smart objects (creatures, partner logos), type info, logo SVG."""
import json
import os

import pymupdf
from psd_tools import PSDImage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets_src')
OUT = os.path.join(ROOT, 'audit')
SO = os.path.join(OUT, 'smartobjects')
os.makedirs(SO, exist_ok=True)

# official logo: vector paths only (no live text), so the SVG is the artwork itself
page = pymupdf.open(os.path.join(SRC, 'logo.ai'))[0]
with open(os.path.join(OUT, 'logo_raw.svg'), 'w', encoding='utf-8') as f:
    f.write(page.get_svg_image(text_as_path=True))

info = {}
for name in ['medorot_poster.psd', 'vayehi_erev.psd']:
    psd = PSDImage.open(os.path.join(SRC, name))
    base = os.path.splitext(name)[0]
    for ab in psd:
        if ab.kind != 'artboard':
            continue
        im = ab.composite()
        im.save(os.path.join(OUT, f'{base}_artboard_{ab.name}.png'))
        small = im.copy()
        small.thumbnail((900, 1600))
        small.convert('RGB').save(os.path.join(OUT, f'{base}_artboard_{ab.name}_small.jpg'), quality=85)
        for l in ab.descendants():
            key = f'{base}/{ab.name}/{l.name}'
            if l.kind == 'type':
                ed = l.engine_dict
                runs = ed['StyleRun']['RunArray']
                fonts = [f['Name'] for f in l.resource_dict['FontSet']]
                styles = []
                for r in runs:
                    sd = r['StyleSheet']['StyleSheetData']
                    fill = sd.get('FillColor', {}).get('Values')
                    styles.append({'font': fonts[sd['Font']] if 'Font' in sd else None, 'size': sd.get('FontSize'),
                                   'tracking': sd.get('Tracking'), 'fill': [round(float(v), 4) for v in fill] if fill else None})
                info[key] = {'text': l.text, 'bbox': l.bbox, 'styles': styles}
            elif l.kind == 'smartobject':
                so = l.smart_object
                fn = f"{base}__{ab.name}__{l.name}".replace('/', '_').replace(' ', '_')
                raw = os.path.join(SO, f'{fn}.{so.filetype}')
                with open(raw, 'wb') as f:
                    f.write(so.data)
                l.composite().save(os.path.join(SO, f'{fn}__placed.png'))
                info[key] = {'smartobject': so.filetype, 'linked': so.kind, 'bbox': l.bbox, 'bytes': len(so.data)}
            elif l.kind in ('pixel', 'solidcolorfill'):
                info[key] = {'kind': l.kind, 'bbox': l.bbox}
with open(os.path.join(OUT, 'layers.json'), 'w', encoding='utf-8') as f:
    json.dump(info, f, ensure_ascii=False, indent=1, default=str)
print('ok')
