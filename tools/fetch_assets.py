"""Download the brand files and venue photos from the team's shared Drive folders."""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets_src')

BRAND = {
    'medorot_poster.psd': '1b87adKkikeA99A2uCSKvAY3bs1ekQKa5',  # מדורות קובץ סופי.psd
    'vayehi_erev.psd': '1vNwwGBaUdpQkYDkpymoq4-gK9h6EE_9v',  # ויהי ערב מדורות.psd
    'logo.ai': '1cj7T0UmlvO6aMiAmypug2X9vqx3bbK1x',  # לוגו סופי.ai
}
# venue photos: <space>_<n>.heic, named after the team's own titles
PHOTOS = {
    'gallery2_1': '18nbA7uTJejUr0CPPpsWaFM1x88-ZqANI',  # " גלריה 2"
    'gallery2_2': '122HgaJ52OkZPTkp-7jg1q0y1kDDcmUBl',  # גלריה 2 2
    'gallery2_3': '1BAnb4nE3x-dpmYHbTSRMlVTXgus3E3Q1',  # גלריה 2 3
    'gallery2_4': '19qYSegdbQ8dw8Rahbyoc9DA5s88g17vm',  # גלריה 2 4
    'hall_1': '1l0z1D3reKPFWH9nQgJ7A6qNKNG4jLu5c',  # חלל בית הכנסת המרכזי
    'hall_2': '1mlAjA1ztTfaYGzBACV2WoOKwme-wm-if',  # ... 2
    'hall_4': '1JcXOBiuqo2C9AB0fsKYVyCbY3uKKv4nF',  # ... 4
    'hall_5': '10aBrdDpMn7rq8pciQykkgUS5uVcx73l3',  # ... 5
    'hall_gallery1_below': '1Y_z8TnASP90YfU5NrwS2n9bl3OCVIF0m',  # ... רואים צילום של גלריה 1 מלמטה
    'hall_gallery2_below_1': '1Yf0tvuSxGNI24mhVijr8_BMn3VIFX0wF',
    'hall_gallery2_below_2': '1k3zeeU0Cav5ijOhAEFyvlwdWZcJAi_s1',
    'hall_gallery2_below_3': '1bf6njowNBIxZiQibiJdr1IZmA0isMmZg',
    'hall_gallery2_below_6': '15BDKTa-dYFAoUl-ZEu-D7AuPztKdfAlO',
    'patio_1': '12y2rDgjD0gf1V-yNujJMWEX88Qp8gxcI',
    'patio_2': '1zQXYgNenX73lnd5k7-5LvdpiE5t-_JmV',
}


def fetch(name, fid):
    out = os.path.join(SRC, name)
    if os.path.exists(out) and os.path.getsize(out) > 0:
        return
    url = f'https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t'
    subprocess.run(['curl.exe', '-sSL', '--retry', '3', '-o', out, url], check=True)
    print(name, os.path.getsize(out), flush=True)


os.makedirs(os.path.join(SRC, 'photos'), exist_ok=True)
for n, f in PHOTOS.items():
    fetch(os.path.join('photos', n + '.heic'), f)
for n, f in BRAND.items():
    fetch(n, f)
print('done', file=sys.stderr)
