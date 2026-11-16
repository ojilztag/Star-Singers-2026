#!/usr/bin/env python3
"""Extract inline JavaScript and ask Node.js to syntax-check project scripts."""
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
FILES = ["index.html", "admin.html"]
SCRIPT = re.compile(r"<script\b([^>]*)>(.*?)</script\s*>", re.I | re.S)
checked = 0
with tempfile.TemporaryDirectory() as tmp:
    tmp = Path(tmp)
    for name in ["Code.gs", "backend-client.js", "site-config.js"]:
        path = ROOT / name
        js = tmp / name.replace(".gs", ".js")
        js.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
        subprocess.run(["node", "--check", str(js)], check=True)
        checked += 1
    for name in FILES:
        source = (ROOT / name).read_text(encoding="utf-8")
        for index, match in enumerate(SCRIPT.finditer(source), 1):
            attrs, body = match.groups()
            if re.search(r"\bsrc\s*=", attrs, re.I):
                continue
            kind = re.search(r"""\btype\s*=\s*["']([^"']+)["']""", attrs, re.I)
            if kind and kind.group(1).lower() not in ("text/javascript", "application/javascript", "module"):
                continue
            if not body.strip():
                continue
            js = tmp / f"{name.replace('/', '_')}-{index}.js"
            js.write_text(body, encoding="utf-8")
            subprocess.run(["node", "--check", str(js)], check=True)
            checked += 1
print(f"JavaScript syntax check passed for {checked} scripts.")
