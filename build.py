#!/usr/bin/env python3
"""Build dist/life-os.html from src/ (template + style.css + app-1.js + app-2.js)."""
import os
root = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(root, "src", p), encoding="utf8").read()
html = rd("template.html").replace("/*STYLE*/", rd("style.css")).replace("/*SCRIPT*/", rd("app-1.js") + rd("app-2.js"))
os.makedirs(os.path.join(root, "dist"), exist_ok=True)
open(os.path.join(root, "dist", "life-os.html"), "w", encoding="utf8").write(html)
print("built dist/life-os.html", len(html), "chars")
