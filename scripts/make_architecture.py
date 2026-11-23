"""Render docs/architecture.svg and docs/architecture.png (requires cairosvg)."""
from pathlib import Path

W, H = 1700, 840
SANS = "Inter, 'DejaVu Sans', sans-serif"
MONO = "'JetBrainsMonoNL Nerd Font Mono', 'DejaVu Sans Mono', monospace"
o = []
add = o.append


def group(x, y, w, h, label, lx=24):
    tw = len(label) * 7.4 + 16
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="none" stroke="#a1a1aa" stroke-width="1.5" stroke-dasharray="6 5"/>')
    add(f'<rect x="{x+lx-8}" y="{y-10}" width="{tw}" height="20" fill="#fff"/>')
    add(f'<text x="{x+lx}" y="{y+5}" font-family="{SANS}" font-size="14" font-weight="600" fill="#27272a">{label}</text>')


def icon(cx, cy, kind):
    if kind == "next":
        add(f'<circle cx="{cx}" cy="{cy}" r="16" fill="#18181b"/><text x="{cx}" y="{cy+6}" text-anchor="middle" font-family="{SANS}" font-size="17" font-weight="700" fill="#fff">N</text>')
    elif kind == "fastapi":
        add(f'<circle cx="{cx}" cy="{cy}" r="16" fill="#059488"/><path d="M{cx+2} {cy-9} L{cx-6} {cy+2} H{cx} L{cx-2} {cy+9} L{cx+6} {cy-2} H{cx}Z" fill="#fff"/>')
    elif kind == "pg":
        add(f'<circle cx="{cx}" cy="{cy}" r="16" fill="#336791"/><text x="{cx}" y="{cy+6}" text-anchor="middle" font-family="{SANS}" font-size="15" font-weight="700" fill="#fff">Pg</text>')
    elif kind == "sk":
        add(f'<circle cx="{cx}" cy="{cy}" r="16" fill="#f7931e"/><text x="{cx}" y="{cy+6}" text-anchor="middle" font-family="{SANS}" font-size="15" font-weight="700" fill="#fff">RF</text>')
    elif kind == "json":
        add(f'<rect x="{cx-14}" y="{cy-16}" width="28" height="32" rx="4" fill="#e4e4e7" stroke="#71717a"/><text x="{cx}" y="{cy+5}" text-anchor="middle" font-family="{MONO}" font-size="12" fill="#3f3f46">{{ }}</text>')
    elif kind == "user":
        add(f'<circle cx="{cx}" cy="{cy-5}" r="6" fill="#71717a"/><path d="M{cx-12} {cy+14} a12 12 0 0 1 24 0Z" fill="#71717a"/>')
    elif kind == "csv":
        add(f'<rect x="{cx-14}" y="{cy-16}" width="28" height="32" rx="4" fill="#e4e4e7" stroke="#71717a"/><text x="{cx}" y="{cy+5}" text-anchor="middle" font-family="{MONO}" font-size="10" fill="#3f3f46">CSV</text>')
    elif kind == "nb":
        add(f'<rect x="{cx-14}" y="{cy-16}" width="28" height="32" rx="4" fill="#fff7ed" stroke="#f97316"/><text x="{cx}" y="{cy+5}" text-anchor="middle" font-family="{MONO}" font-size="11" fill="#c2410c">py</text>')
    elif kind == "cube":
        add(f'<path d="M{cx} {cy-16} L{cx+14} {cy-8} V{cy+8} L{cx} {cy+16} L{cx-14} {cy+8} V{cy-8}Z" fill="#e0e7ff" stroke="#6366f1" stroke-width="1.5"/>')
    elif kind == "rocket":
        add(f'<path d="M{cx-14} {cy+14} L{cx} {cy-16} L{cx+14} {cy+14}Z" fill="#18181b"/>')


def card(x, y, w, h, title, sub, kind, accent=None):
    stroke = accent or "#d4d4d8"
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="#fff" stroke="{stroke}" stroke-width="1.5" filter="url(#sh)"/>')
    icon(x + 34, y + h / 2, kind)
    add(f'<text x="{x+66}" y="{y+h/2-3}" font-family="{SANS}" font-size="17" font-weight="600" fill="#18181b">{title}</text>')
    add(f'<text x="{x+66}" y="{y+h/2+17}" font-family="{MONO}" font-size="12" fill="#71717a">{sub}</text>')


def chip(x, y, t):
    w = len(t) * 7.6 + 20
    add(f'<rect x="{x}" y="{y}" width="{w}" height="26" rx="13" fill="#e0ecff" stroke="#93b4f5"/>')
    add(f'<text x="{x+w/2}" y="{y+17}" text-anchor="middle" font-family="{MONO}" font-size="12" fill="#1e3a8a">{t}</text>')
    return x + w + 8


def arrow(d, dashed=False):
    da = ' stroke-dasharray="7 5"' if dashed else ""
    add(f'<path d="{d}" fill="none" stroke="#52525b" stroke-width="2"{da} marker-end="url(#ar)"/>')


def num(cx, cy, n):
    add(f'<circle cx="{cx}" cy="{cy}" r="13" fill="#fff" stroke="#52525b" stroke-width="1.5"/><text x="{cx}" y="{cy+5}" text-anchor="middle" font-family="{SANS}" font-size="14" font-weight="600" fill="#27272a">{n}</text>')


add(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">')
add('<defs><filter id="sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.12"/></filter>'
    '<marker id="ar" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="#52525b"/></marker></defs>')
add(f'<rect width="{W}" height="{H}" fill="#fff"/>')

# Client
group(20, 90, 270, 300, "Client")
card(40, 140, 230, 90, "Browser", "analyst / sales team", "user")
card(40, 270, 230, 90, "CSV upload", "batch scoring", "csv")

# Vercel container
add('<rect x="330" y="40" width="1020" height="470" rx="26" fill="none" stroke="#52525b" stroke-width="2"/>')
add('<rect x="350" y="26" width="170" height="30" rx="8" fill="#fff" stroke="#d4d4d8"/>')
add('<path d="M368 33 L378 49 L358 49Z" fill="#18181b"/>')
add(f'<text x="390" y="46" font-family="{SANS}" font-size="16" font-weight="600" fill="#18181b">Vercel</text>')
add(f'<text x="446" y="46" font-family="{MONO}" font-size="12" fill="#71717a">production</text>')

group(350, 90, 300, 390, "Web app")
card(370, 140, 260, 100, "Next.js 16", "App Router, Tailwind", "next")
card(370, 290, 260, 100, "metadata.json", "metrics, ROC, EDA", "json")

group(700, 90, 630, 390, "API (Python function)")
add('<rect x="720" y="140" width="590" height="190" rx="12" fill="#fff" stroke="#6366f1" stroke-width="1.8" filter="url(#sh)"/>')
icon(754, 176, "fastapi")
add(f'<text x="786" y="173" font-family="{SANS}" font-size="18" font-weight="600" fill="#18181b">FastAPI</text>')
add(f'<text x="786" y="193" font-family="{MONO}" font-size="12" fill="#71717a">Pydantic validation, CORS</text>')
x = 740
for t in ["POST /predict", "POST /predict/batch", "GET /metadata"]:
    x = chip(x, 222, t)
x = 740
for t in ["GET /history", "GET /stats", "GET /health"]:
    x = chip(x, 258, t)
add(f'<text x="740" y="312" font-family="{MONO}" font-size="12" fill="#71717a">occlusion factors vs reference customer, top-k% decision</text>')
card(720, 360, 590, 100, "Random Forest, Platt calibrated", "scikit-learn 1.8, joblib model.joblib", "sk", "#f7931e")

# Data
group(1380, 90, 300, 390, "Data")
card(1400, 140, 260, 100, "Supabase Postgres", "predictions, batch_jobs", "pg")
card(1400, 290, 260, 100, "Pooler + RLS", "psycopg3, SSL, no policies", "pg")

# Offline
group(20, 560, 1660, 130, "Model development (offline)")
card(40, 600, 340, 70, "Bank Marketing data", "UCI, 41,188 rows", "csv")
card(440, 600, 440, 70, "Notebook + ml/src", "rolling-window CV, tuning", "nb")
card(940, 600, 340, 70, "Artifacts", "model.joblib, metadata.json", "cube")
card(1340, 600, 320, 70, "Deploy", "vercel deploy, supabase db push", "rocket")

# Engineering
group(20, 730, 1660, 85, "Engineering")
items = [("GitHub", "source, semantic commits"), ("pytest", "API tests"), ("Supabase CLI", "SQL migrations"),
         ("Vercel CLI", "web + API deploys"), ("conda / pip", "pinned versions"), ("Node 20", "Next.js build")]
for i, (t, s) in enumerate(items):
    px = 60 + i * 270
    add(f'<text x="{px}" y="767" font-family="{SANS}" font-size="16" font-weight="600" fill="#18181b">{t}</text>')
    add(f'<text x="{px}" y="788" font-family="{MONO}" font-size="12" fill="#71717a">{s}</text>')

# Arrows
arrow("M270 185 H370"); num(320, 185, 1)
arrow("M630 190 H720"); num(675, 190, 2)
arrow("M1310 190 H1400"); num(1355, 190, 3)
arrow("M1005 330 V360"); num(1005, 345, 4)
arrow("M500 240 V290"); num(500, 265, 5)
arrow("M1110 600 V460"); num(1110, 530, 6)
arrow("M1010 600 V545 H500 V390", dashed=True); num(760, 545, 7)
arrow("M380 635 H440"); arrow("M880 635 H940"); arrow("M1280 635 H1340")
add('</svg>')

out = Path(__file__).resolve().parent.parent / "docs"
out.mkdir(exist_ok=True)
(out / "architecture.svg").write_text("\n".join(o))
import cairosvg
cairosvg.svg2png(bytestring="\n".join(o).encode(), write_to=str(out / "architecture.png"), output_width=2400)
print("ok")
