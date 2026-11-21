"""Render the Maltese Gear Cube solver stage images for the "how the solver works" exhibit.

For each of the solver's five stages there is a "before" and an "after" image of one real solve (the
poses come from export-maltese-stages.gen.mjs): the pieces this stage solves are lit and outlined, the
pieces earlier stages solved keep their colours, and pieces the solver ignores for now are grey.
In the two gear-angle stages the gears are painted one colour, because only their angle matters there.
Plus the whole cube scrambled and solved, in full colour.

    python -I -X utf8 scripts/3d/render-maltese-stages.py        (from the site root)

Writes public/mgc-stages/*.webp. Needs Python Playwright (chromium) and Pillow.
"""
from __future__ import annotations

import base64
import functools
import http.server
import io
import json
import sys
import threading
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "mgc-stages"
DATA = ROOT / "scripts" / "3d" / "render" / "maltese-stages.json"

RENDER = 1800  # rendered square, downsampled 2x
FINAL = 900
ACCENT = "#2dd4bf"  # the "solving now" outline, and the gear colour while only gear angles matter
VIEW = {"azimuth": 34, "elevation": 23, "distance": 7.2, "lookY": -0.03}
LOOK = {
    "accent": ACCENT,
    "grey": "#4d535c",
    "greyBody": "#202329",
    "doneDesat": 0.4,
    "doneDark": 0.5,
    "nowGlow": 0.12,
    "bodyGlow": 0.0,
}

# Which piece kinds each stage solves, whether colours matter in it, and whether its pieces get the
# accent outline (not the corners: they cover most of the cube, so an outline would trace everything else).
STAGES = [
    {"slug": "corners", "kinds": {"corner"}, "accent": False, "outline": False},
    {"slug": "gear-angles-1", "kinds": {"gear"}, "accent": True, "outline": False},
    {"slug": "gear-angles-2", "kinds": {"gear"}, "accent": True, "outline": False},
    {"slug": "gear-positions", "kinds": {"gear"}, "accent": False, "outline": True},
    {"slug": "ring", "kinds": {"centre", "edge"}, "accent": False, "outline": True},
]


def looks_for(stage: int, kinds: list[str]) -> list[str]:
    s = STAGES[stage]
    earlier = set().union(*[STAGES[k]["kinds"] for k in range(stage)]) - s["kinds"]
    out = []
    for kind in kinds:
        if kind in s["kinds"]:
            out.append("accent" if s["accent"] else "now")
        elif kind in earlier:
            out.append("done")
        else:
            out.append("off")
    return out


def decode(url: str) -> Image.Image:
    return Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1])))


def hex_rgb(h: str) -> tuple[int, int, int]:
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def add_glow(color: Image.Image, mask: Image.Image) -> Image.Image:
    """An accent outline around the visible parts of the pieces being solved, drawn only over the cube
    (not over the background, so the silhouette stays clean)."""
    m = mask.convert("L").point(lambda v: 255 if v > 127 else 0)
    grown = m.filter(ImageFilter.MaxFilter(11))  # 5 px at the rendered size, ~2.5 px after downsampling
    ring = ImageChops.subtract(grown, m).filter(ImageFilter.GaussianBlur(1.2))
    on_cube = color.getchannel("A").point(lambda v: 255 if v > 200 else 0).filter(ImageFilter.MinFilter(5))
    alpha = ImageChops.multiply(ring, on_cube)
    glow = Image.new("RGBA", color.size, hex_rgb(ACCENT) + (0,))
    glow.putalpha(alpha)
    return Image.alpha_composite(color, glow)


def save(img: Image.Image, name: str) -> None:
    img = img.resize((FINAL, FINAL), Image.LANCZOS)
    path = OUT / f"{name}.webp"
    img.save(path, "WEBP", quality=86, method=6, alpha_quality=90)
    print(f"  {path.relative_to(ROOT)}  {path.stat().st_size // 1024} KB")


def main() -> None:
    if not DATA.exists():
        sys.exit(f"missing {DATA}: run export-maltese-stages.gen.mjs first")
    data = json.loads(DATA.read_text())
    kinds = [p["kind"] for p in data["pieces"]]
    OUT.mkdir(parents=True, exist_ok=True)

    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args) -> None:
            pass

    handler = functools.partial(Quiet, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_address[1]}/scripts/3d/render-maltese-stages.html"

    jobs = [("scrambled", 0, ["full"] * len(kinds), False), ("solved", 5, ["full"] * len(kinds), False)]
    for i, s in enumerate(STAGES):
        looks = looks_for(i, kinds)
        jobs.append((f"{i + 1}-{s['slug']}-before", i, looks, s["outline"]))
        jobs.append((f"{i + 1}-{s['slug']}-after", i + 1, looks, s["outline"]))
    only = set(sys.argv[1:])

    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        page = browser.new_page(viewport={"width": 400, "height": 400})
        page.on("console", lambda m: print("  [page]", m.text) if m.type in ("error", "warning") else None)
        page.goto(url)
        page.wait_for_function("window.ready === true", timeout=120_000)
        # The first renders after load come back empty (shaders still compiling): warm up first.
        for _ in range(2):
            page.evaluate("spec => window.renderImage(spec)", {**VIEW, **LOOK, "size": 256, "pose": 0, "looks": looks_for(4, kinds)})
        for name, pose, looks, glow in jobs:
            if only and name not in only:
                continue
            spec = {**VIEW, **LOOK, "size": RENDER, "pose": pose, "looks": looks}
            res = page.evaluate("spec => window.renderImage(spec)", spec)
            img = decode(res["color"]).convert("RGBA")
            if glow:
                img = add_glow(img, decode(res["mask"]))
            save(img, name)
        browser.close()
    server.shutdown()


if __name__ == "__main__":
    main()
