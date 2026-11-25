"""Turn site/dist/index.html into the page body the claude.ai Artifact host expects (it adds its own <html>/<head>/<body>),
and list the files to publish next to it."""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'site', 'dist')

html = open(os.path.join(DIST, 'index.html'), encoding='utf-8').read()
head = re.search(r'<head>(.*)</head>', html, re.S).group(1)
head = re.sub(r'<title>.*?</title>', '<title>כיווני העיצוב של מדורות</title>', head, flags=re.S)
head = re.sub(r'<meta charset[^>]*>|<meta name="viewport"[^>]*>|<!--.*?-->', '', head, flags=re.S)
head = head.replace(' crossorigin src=', ' src=').replace(' crossorigin href=', ' href=')
title = re.search(r'<title>.*?</title>', head).group(0)
head = head.replace(title, '')
page = f'{title}\n{head.strip()}\n<div id="root"></div>\n'
with open(os.path.join(DIST, 'medorot-directions.html'), 'w', encoding='utf-8') as f:
    f.write(page)

files = {}
for d, _, fs in os.walk(os.path.join(DIST, 'assets')):
    for name in fs:
        p = os.path.join(d, name)
        files[os.path.relpath(p, DIST).replace('\\', '/')] = p.replace('\\', '/')
with open(os.path.join(DIST, 'publish_files.json'), 'w', encoding='utf-8') as f:
    json.dump(files, f, ensure_ascii=False, indent=0)
print(len(files), 'files', round(sum(os.path.getsize(p) for p in files.values()) / 2 ** 20, 1), 'MB')
print(page)
