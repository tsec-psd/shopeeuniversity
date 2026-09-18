# -*- coding: utf-8 -*-
"""
build_dist.py — 把 tools/ms-editor.html 打包成單一 html（交付蝦大用）
把 <link rel="stylesheet" href="..."> 與本地 <script src="..."> 全部內嵌；
CDN script（ExcelJS）保留原樣（蝦大填單機器有網路）。
用法：在 04_蝦大 目錄下  python tools/build_dist.py
輸出：dist/MS工單生成器.html
"""
import re, os, io, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'ms-editor.html')
OUT_DIR = os.path.join(ROOT, 'dist')
OUT = os.path.join(OUT_DIR, 'MS工單生成器.html')

def read(p):
    with io.open(p, 'r', encoding='utf-8') as f:
        return f.read()

html = read(SRC)

def inline_css(m):
    href = m.group(1)
    p = os.path.normpath(os.path.join(ROOT, 'tools', href))
    return '<style>\n/* inlined: %s */\n%s\n</style>' % (href, read(p))

def inline_js(m):
    src = m.group(1)
    if src.startswith('http'):
        return m.group(0)
    p = os.path.normpath(os.path.join(ROOT, 'tools', src))
    return '<script>\n/* inlined: %s */\n%s\n</script>' % (src, read(p))

html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)
html = re.sub(r'<script src="([^"]+)"></script>', inline_js, html)

html = html.replace('<small>蝦大端｜', '<small>單檔版｜', 1)

os.makedirs(OUT_DIR, exist_ok=True)
with io.open(OUT, 'w', encoding='utf-8') as f:
    f.write(html)

leftover = re.findall(r'<script src="(?!http)[^"]+"></script>|<link rel="stylesheet"[^>]*>', html)
print('built:', OUT, '(%d KB)' % (os.path.getsize(OUT) // 1024))
if leftover:
    print('WARN 未內嵌的本地引用:', leftover); sys.exit(1)
