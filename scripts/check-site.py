#!/usr/bin/env python3
"""Static website integrity checks for JKJ CREATIONS / Star Singers 2026."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = ("index.html", "admin.html")
CANONICAL_STYLE_ID = "jkj-canonical-photo-frame-standard"
PHOTO_SELECTORS = (
    ".coordinator-profile-photo",
    ".coordinator-photo-frame",
    ".digital-profile-photo",
    ".coordinator-photo",
    ".photo-placeholder.sponsor-photo",
    ".photo-placeholder.sponsor-gallery-photo",
)

class PageAudit(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.refs = []
        self.images_without_alt = []

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if data.get("id"):
            self.ids.append(data["id"])
        if tag == "img" and not data.get("alt", "").strip():
            self.images_without_alt.append(data.get("src", "(no src)"))
        for key in ("src", "href", "poster"):
            value = data.get(key, "").strip()
            if value:
                self.refs.append(value)
        srcset = data.get("srcset", "")
        if srcset:
            for item in srcset.split(","):
                value = item.strip().split()
                if value:
                    self.refs.append(value[0])

def local_path(value):
    value = value.strip()
    if not value or value.startswith(("#", "//")):
        return None
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc:
        return None
    path = unquote(parsed.path).lstrip("/")
    return path or None

def css_braces_balanced(css, label):
    css = re.sub(r"/\*[\s\S]*?\*/", "", css)
    css = re.sub(r"""'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*" """, "", css)
    depth = 0
    for char in css:
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth < 0:
                raise SystemExit(f"FAIL: extra closing CSS brace in {label}")
    if depth:
        raise SystemExit(f"FAIL: unclosed CSS brace in {label}")

def main():
    failures = []
    all_local = []
    css_sources = []

    for filename in HTML_FILES:
        path = ROOT / filename
        if not path.is_file():
            failures.append(f"Missing required page: {filename}")
            continue
        source = path.read_text(encoding="utf-8")
        parser = PageAudit()
        parser.feed(source)
        duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
        if duplicates:
            failures.append(f"{filename}: duplicate IDs: {', '.join(duplicates)}")
        if parser.images_without_alt:
            failures.append(f"{filename}: images missing alt text: {', '.join(parser.images_without_alt)}")
        if filename == "index.html" and not re.search(r'<meta\s+name=["\']viewport["\']', source, re.I):
            failures.append("index.html: responsive viewport meta tag is missing")
        for ref in parser.refs:
            path_ref = local_path(ref)
            if path_ref:
                all_local.append((filename, path_ref))
        css_sources.extend(re.findall(r'<style\b[^>]*>([\s\S]*?)</style\s*>', source, re.I))

    for filename, ref in all_local:
        if not (ROOT / ref).is_file():
            failures.append(f"{filename}: missing local file reference: {ref}")

    for css_file in (ROOT / "responsive-polish.css",):
        if css_file.is_file():
            css_sources.append(css_file.read_text(encoding="utf-8"))

    for index, css in enumerate(css_sources, 1):
        css_braces_balanced(css, f"stylesheet #{index}")
        for raw in re.findall(r"url\(\s*(['\"]?)(.*?)\1\s*\)", css, re.I):
            path_ref = local_path(raw[1])
            if path_ref and not (ROOT / path_ref).is_file():
                failures.append(f"CSS stylesheet #{index}: missing local URL: {path_ref}")

    index_source = (ROOT / "index.html").read_text(encoding="utf-8")
    styles = re.findall(r'<style\b([^>]*)>([\s\S]*?)</style\s*>', index_source, re.I)
    canonical = [(attrs, css) for attrs, css in styles if re.search(
        rf'\bid=["\']{re.escape(CANONICAL_STYLE_ID)}["\']', attrs, re.I)]
    if len(canonical) != 1:
        failures.append("index.html: canonical photo-frame stylesheet must appear exactly once")
    elif not styles or not re.search(
        rf'\bid=["\']{re.escape(CANONICAL_STYLE_ID)}["\']', styles[-1][0], re.I
    ):
        failures.append("index.html: canonical photo-frame stylesheet must be the final inline stylesheet")
    else:
        css = canonical[0][1]
        for selector in PHOTO_SELECTORS:
            if selector not in css:
                failures.append(f"Canonical photo stylesheet is missing selector: {selector}")
        if not re.search(r"aspect-ratio\s*:\s*1\s*/\s*1", css):
            failures.append("Canonical photo stylesheet must enforce a 1:1 aspect ratio")
        if not re.search(r"object-fit\s*:\s*cover", css):
            failures.append("Canonical photo stylesheet must use object-fit: cover")

    readme = ROOT / "README.md"
    backup = ROOT / "README.md.backup"
    if not readme.is_file() or not backup.is_file():
        failures.append("README.md and README.md.backup must both exist")
    elif readme.read_bytes() != backup.read_bytes():
        failures.append("README.md.backup must exactly match README.md")

    if failures:
        print("Website integrity checks failed:")
        for failure in failures:
            print(" - " + failure)
        sys.exit(1)
    print(
        f"Website integrity checks passed: {len(HTML_FILES)} pages, "
        f"{len(all_local)} local references, {len(css_sources)} stylesheets, "
        "unique IDs, image alt text, canonical square photo frames and README backup."
    )

if __name__ == "__main__":
    main()
