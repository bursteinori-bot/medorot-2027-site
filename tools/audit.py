"""Brand audit: dump the PSD layer trees, render composites and the logo for inspection."""
import os
import sys

import pymupdf
from psd_tools import PSDImage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets_src')
OUT = os.path.join(ROOT, 'audit')
os.makedirs(OUT, exist_ok=True)

# the logo .ai is PDF-compatible: render it and count its pages / vector content
doc = pymupdf.open(os.path.join(SRC, 'logo.ai'))
for i, p in enumerate(doc):
    print('logo page', i, p.rect, 'drawings', len(p.get_drawings()), 'images', len(p.get_images()), 'text', repr(p.get_text()[:80]))
    p.get_pixmap(dpi=150, alpha=True).save(os.path.join(OUT, f'logo_p{i}.png'))


def walk(layer, depth, f):
    b = layer.bbox
    f.write(f"{'  ' * depth}[{layer.kind}] {layer.name!r} vis={layer.visible} op={layer.opacity} "
            f"blend={layer.blend_mode.name if hasattr(layer.blend_mode, 'name') else layer.blend_mode} bbox={b}\n")
    if layer.is_group():
        for c in layer:
            walk(c, depth + 1, f)


for name in sys.argv[1:] or ['vayehi_erev.psd', 'medorot_poster.psd']:
    psd = PSDImage.open(os.path.join(SRC, name))
    base = os.path.splitext(name)[0]
    with open(os.path.join(OUT, base + '_layers.txt'), 'w', encoding='utf-8') as f:
        f.write(f'{psd.width}x{psd.height} mode={psd.color_mode} depth={psd.depth}\n')
        for l in psd:
            walk(l, 0, f)
    im = psd.composite()
    im.thumbnail((1600, 1600))
    im.convert('RGB').save(os.path.join(OUT, base + '_composite.jpg'), quality=88)
    print(name, psd.width, psd.height, psd.color_mode, 'top layers', len(list(psd)))
