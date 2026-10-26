#!/usr/bin/env python3
"""
check_site.py - the project's safety net. Run it after EVERY change:

    python3 tools/check_site.py

It cannot open a browser, so it cannot prove the site LOOKS right. What it does catch
are the classes of bug that actually bit this project (each check says which):

  * unbalanced HTML tags / broken local links / wrong-case file names (Netlify is
    case-sensitive: "IMAGES/x.png" works on a laptop and 404s when live)
  * JavaScript syntax errors
  * SQL files that are NOT safe to run twice (Postgres has no CREATE POLICY IF NOT EXISTS,
    so every policy needs a matching DROP POLICY IF EXISTS first)
  * CSS variables used but never defined (a real bug: --bg-alt was silently ignored)
  * overflow-x:hidden on html/body (silently breaks position:sticky; use overflow-x:clip)
  * a header that drifted from the rules (menu button must live in the nav bar, never in
    the brand row; exactly one theme toggle; mantra with no diacritics)
  * settings hooks in the HTML (data-show-if / data-setting-link / data-setting-text) that
    point at a setting key which the database never creates
Exit code 1 if any ERROR is found. Warnings are advice, not failures.
"""
import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
SQLDIR = ROOT / "supabase"
errors, warnings = [], []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


pages = sorted(SITE.glob("*.html"))
css = (SITE / "styles.css").read_text(encoding="utf-8")

# ---------------------------------------------------------------- 1. HTML
for p in pages:
    s = p.read_text(encoding="utf-8")
    for tag in ("div", "section", "form", "nav", "table", "header", "footer", "main"):
        o = len(re.findall(r"<" + tag + r"(\s|>)", s))
        c = len(re.findall(r"</" + tag + r">", s))
        if o != c:
            err(f"{p.name}: <{tag}> opened {o}x but closed {c}x")
    for m in re.finditer(r'(?:href|src)="([^"#][^"]*)"', s):
        u = m.group(1).split("#")[0].split("?")[0]
        if not u or re.match(r"(https?:|mailto:|tel:|data:|\{|'|\+)", u) or "'" in u:
            continue
        if not (SITE / u).exists():
            err(f"{p.name}: broken local link/file -> {u}")

# ---------------------------------------------------------------- 2. file-name rules
for folder in ("images", "assets"):
    for f in (SITE / folder).rglob("*"):
        if f.is_file() and (f.name != f.name.lower() or " " in f.name):
            err(f"{folder}/{f.name}: file names must be lowercase with no spaces")
for p in list(pages) + [SITE / "styles.css"]:
    t = p.read_text(encoding="utf-8")
    if re.search(r'(?<![\w/])(IMAGES|ASSETS)/', t):
        err(f"{p.name}: uses upper-case IMAGES/ or ASSETS/ path (must be lower-case)")
for m in re.finditer(r'url\("([^"]+)"\)', css):
    u = m.group(1)
    if not u.startswith(("http", "data:")) and not (SITE / u).exists():
        err(f"styles.css: missing file -> {u}")

# ---------------------------------------------------------------- 3. JavaScript
node = shutil.which("node")
if node:
    for js in sorted(SITE.glob("*.js")):
        r = subprocess.run([node, "--check", str(js)], capture_output=True, text=True)
        if r.returncode != 0:
            err(f"{js.name}: JavaScript syntax error: {r.stderr.strip().splitlines()[0] if r.stderr else '?'}")
else:
    warn("node not found - JavaScript syntax was NOT checked")

# ---------------------------------------------------------------- 4. SQL
for sql in sorted(SQLDIR.glob("*.sql")):
    t = sql.read_text(encoding="utf-8")
    creates = re.findall(r'create policy "([^"]+)" on ([\w.]+)', t)
    drops = set(re.findall(r'drop policy if exists "([^"]+)" on ([\w.]+)', t))
    for c in creates:
        if c not in drops:
            err(f"{sql.name}: policy {c[0]!r} on {c[1]} has no matching 'drop policy if exists' (script would fail when re-run)")
    if t.count("(") != t.count(")"):
        err(f"{sql.name}: unbalanced parentheses")
    for m in re.finditer(r"create table (?!if not exists)", t):
        err(f"{sql.name}: 'create table' without 'if not exists'")

# ---------------------------------------------------------------- 5. CSS
for sel in ("html", "body"):
    for m in re.finditer(r"(?m)^" + sel + r"\s*\{([^}]*)\}", css):
        if re.search(r"overflow-x\s*:\s*hidden", m.group(1)):
            err(f"styles.css: '{sel}' uses overflow-x:hidden, which silently breaks position:sticky. Use overflow-x:clip")
if css.count("{") != css.count("}"):
    err("styles.css: unbalanced braces")

inline_css = "".join(re.findall(r"<style[^>]*>(.*?)</style>", "".join(p.read_text(encoding="utf-8") for p in pages), re.S))
defined = set(re.findall(r"(--[\w-]+)\s*:", css + inline_css))
used_no_fallback = set()
for src in [css, inline_css] + [p.read_text(encoding="utf-8") for p in pages]:
    for m in re.finditer(r"var\((--[\w-]+)\s*([,)])", src):
        if m.group(2) == ")":
            used_no_fallback.add(m.group(1))
for v in sorted(used_no_fallback - defined):
    err(f"CSS variable {v} is used but never defined anywhere")

if re.search(r"fonts\.googleapis\.com", css):
    warn("styles.css still loads Google Fonts from Google's servers (privacy to-do: self-host the font files)")

# ---------------------------------------------------------------- 6. shared header / footer rules
for p in pages:
    s = p.read_text(encoding="utf-8")
    hm = re.search(r'<header class="site-header">.*?</header>', s, re.S)
    if not hm:
        continue
    h = hm.group(0)
    top = re.search(r'<div class="header-top__inner">(.*?)<div class="nav-container">', h, re.S)
    nav = re.search(r'<div class="nav-container">(.*?)<input class="menu-toggle"', h, re.S)
    if not top or not nav:
        err(f"{p.name}: header structure not recognised (run tools/build_common.py)")
        continue
    if "menu-button" in top.group(1):
        err(f"{p.name}: menu button is inside the brand row - it must live in the nav bar (owner rule: brand row is never mixed with anything)")
    if "menu-button" not in nav.group(1):
        err(f"{p.name}: menu button missing from the nav bar")
    for needed in ("brand-logo", "header-mantra", "prabhupada-portrait"):
        if needed not in top.group(1):
            err(f"{p.name}: brand row is missing '{needed}'")
    if h.count("data-theme-toggle") != 1:
        err(f"{p.name}: must have exactly ONE theme toggle (found {h.count('data-theme-toggle')})")
    if "&#7771;" in h or "ṛ" in h or "ṣ" in h:
        err(f"{p.name}: mantra must be plain 'Krishna'/'Rama' - no diacritics (owner rule)")
    if "privacy.html" not in s:
        err(f"{p.name}: footer/privacy link missing")

# ---------------------------------------------------------------- 6b. scripts: once each, right order
# (real bug: an old build script added another copy of data.js on every rebuild; live pages loaded it
#  15+ times and every click handler ran 15+ times - e.g. the floating menu opened and shut itself)
ORDER = ["supabase-config.js", "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", "data.js", "site.js"]
for p in pages:
    srcs = re.findall(r'<script src="([^"]+)"', p.read_text(encoding="utf-8"))
    for s_ in sorted(set(x for x in srcs if srcs.count(x) > 1)):
        err(f"{p.name}: script '{s_}' is included {srcs.count(s_)} times (must be once). Run tools/build_common.py")
    present = [x for x in ORDER if x in srcs]
    if present != sorted(present, key=ORDER.index) or [srcs.index(x) for x in present] != sorted(srcs.index(x) for x in present):
        err(f"{p.name}: shared scripts are out of order (need: supabase-config.js, supabase library, data.js, site.js)")
    if "data.js" in srcs and "supabase-config.js" not in srcs:
        err(f"{p.name}: data.js without supabase-config.js")
    for page_script in [x for x in srcs if x in ("admin.js", "auth-guard.js")]:
        if "site.js" in srcs and srcs.index(page_script) < srcs.index("site.js"):
            err(f"{p.name}: {page_script} must load AFTER site.js (it reads window.ISKCON)")

# ---------------------------------------------------------------- 7. settings hooks <-> database seeds
seed_keys = set()
for sql in SQLDIR.glob("*.sql"):
    for stmt in re.findall(r"insert into public\.site_settings[^;]*;", sql.read_text(encoding="utf-8"), re.S):
        seed_keys |= set(re.findall(r"\('([a-z_0-9]+)'\s*,", stmt))
used_keys = set()
for p in pages:
    s = p.read_text(encoding="utf-8")
    used_keys |= set(re.findall(r'data-(?:show-if|setting-link|setting-text)="([a-z_0-9]+)"', s))
for k in sorted(used_keys - seed_keys):
    err(f"HTML uses setting '{k}' but supabase/schema.sql never creates it (admin could not set it)")

# ---------------------------------------------------------------- 8. owner's plain-language rule
JARGON = r"\b(kirtan|prasad(?:am|a)?|aarti|mridanga|kartala|seva|japa|ekadasi|ekādaśī)\b"
for p in pages:
    s = p.read_text(encoding="utf-8")
    s = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", s, flags=re.S)
    text = re.sub(r"<[^>]+>", " ", s)
    for m in re.finditer(JARGON, text, re.I):
        warn(f"{p.name}: untranslated jargon '{m.group(0)}' (owner rule: plain English - kirtan=music, prasadam=feast/breakfast/lunch)")

# ---------------------------------------------------------------- report
print(f"Checked {len(pages)} pages, {len(list(SITE.glob('*.js')))} scripts, {len(list(SQLDIR.glob('*.sql')))} SQL files.")
for w in warnings:
    print("  WARN ", w)
for e in errors:
    print("  ERROR", e)
if errors:
    print(f"\nFAILED: {len(errors)} error(s).")
    sys.exit(1)
print("\nOK: no errors" + (f" ({len(warnings)} warning(s) - see above)." if warnings else "."))
