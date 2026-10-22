#!/usr/bin/env python3
"""
Builds the PREVIEW photographs from a manifest, so the set is reproducible and consistent.

    python3 scripts/images/build-preview-photos.py [--only key,key] [--cache DIR]

For every entry in scripts/images/preview-photos.manifest.json it
  1. downloads the source once (cached outside the repository), or reads a supplied file from the repository,
  2. applies ONE shared grade plus any per-photo adjustment,
  3. crops to the slot's aspect ratio around a focus point, so compositions are decided here, not by CSS,
  4. writes AVIF and WebP at each width, and a small WebP thumbnail,
and finally rewrites src/content/preview-photos.ts with the credit that travels with each photo.

Most are openly licensed stock photographs shown as clearly labelled previews. An entry marked "supplied" is an
image handed over for review: until it has an "approval" record (who confirmed what, and the rights wording) it
carries no credit and is labelled "awaiting approval"; with one, it is treated as the owner's approved photograph.
Everything else must be replaced or approved before launch.
"""
import argparse, io, json, os, re, sys, time, urllib.request
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "images" / "preview"
TS = ROOT / "src" / "content" / "preview-photos.ts"
MANIFEST = Path(__file__).with_name("preview-photos.manifest.json")
UA = "AlderEmberPreview/0.1 (https://github.com/umejrr/alder-ember; contact via repo issues)"

QUALITY = {"webp": 74, "avif": 50, "thumb": 70}
THUMB_W = 320


def fetch(url, cache: Path, key: str, seed: str | None = None) -> bytes:
    cache.mkdir(parents=True, exist_ok=True)
    f = cache / f"{key}.src"
    if f.exists():
        return f.read_bytes()
    if seed and (ROOT / seed).exists():  # an image already in the repo is a valid source when the network is not
        f.write_bytes((ROOT / seed).read_bytes())
        return f.read_bytes()
    for i in range(8):
        try:
            data = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=120).read()
            f.write_bytes(data)
            return data
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):
                time.sleep(8 * (i + 1))
                continue
            raise
    raise RuntimeError(f"rate limited: {url}")


def crop_to(im: Image.Image, aspect: str, focus, zoom: float = 1.0) -> Image.Image:
    """Largest crop of `aspect` around `focus` (0..1), scaled down by `zoom` (<1 moves in on the subject)."""
    if aspect == "auto" and zoom == 1.0:
        return im
    aw, ah = (im.width, im.height) if aspect == "auto" else (int(x) for x in aspect.split(":"))
    target = aw / ah
    w, h = im.size
    if w / h > target:  # too wide: trim the sides
        nw, nh = round(h * target), h
    else:  # too tall: trim top and bottom
        nw, nh = w, round(w / target)
    nw, nh = round(nw * zoom), round(nh * zoom)
    fx, fy = focus
    left = min(max(round(fx * w - nw / 2), 0), w - nw)
    top = min(max(round(fy * h - nh / 2), 0), h - nh)
    return im.crop((left, top, left + nw, top + nh))


def grade(im: Image.Image, g: dict) -> Image.Image:
    if g.get("mirror"):
        im = ImageOps.mirror(im)
    if g.get("saturation", 1.0) != 1.0:
        im = ImageEnhance.Color(im).enhance(g["saturation"])
    if g.get("brightness", 1.0) != 1.0:
        im = ImageEnhance.Brightness(im).enhance(g["brightness"])
    if g.get("contrast", 1.0) != 1.0:
        im = ImageEnhance.Contrast(im).enhance(g["contrast"])
    warm = g.get("warmth", 0.0)  # +: warmer, -: cooler (a gentle channel shift, so mixed sources sit together)
    if warm:
        r, gr, b = im.split()
        r = r.point(lambda v: min(255, round(v * (1 + warm))))
        b = b.point(lambda v: max(0, round(v * (1 - warm))))
        im = Image.merge("RGB", (r, gr, b))
    return im


def adapted_text(g: dict, aspect: str, zoom: float = 1.0) -> str:
    bits = ["Resized"]
    if aspect != "auto":
        bits.append(f"cropped to {aspect}")
    elif zoom != 1.0:
        bits.append("cropped")
    bits.append("converted to AVIF and WebP")
    if g.get("mirror"):
        bits.append("mirrored")
    if g.get("saturation", 1.0) != 1.0:
        bits.append(f"colour saturation {'reduced' if g['saturation'] < 1 else 'increased'}")
    if g.get("brightness", 1.0) != 1.0:
        bits.append("brightness adjusted")
    if g.get("contrast", 1.0) != 1.0:
        bits.append("contrast adjusted")
    if g.get("warmth"):
        bits.append("colour balance adjusted")
    return ", ".join(bits)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--cache", default=str(Path(os.environ.get("TMPDIR", "/tmp")) / "ae-preview-photo-cache"))
    args = ap.parse_args()
    manifest = json.loads(MANIFEST.read_text())
    shared = manifest.get("grade", {})
    only = {k for k in args.only.split(",") if k}
    OUT.mkdir(parents=True, exist_ok=True)
    entries = {}
    for p in manifest["photos"]:
        key = p["key"]
        g = {**shared, **p.get("grade", {})}
        q = {**QUALITY, **p.get("quality", {})}  # an entry can ask for higher quality (owner photographs are encoded generously)
        aspect = p["aspect"]
        widths = p["widths"]
        if only and key not in only:
            # keep the entry's data without reprocessing: reconstruct from files on disk
            pass
        process = not only or key in only
        if process:
            raw = (ROOT / p["source"]).read_bytes() if p.get("source") else fetch(p["download"], Path(args.cache), key, p.get("seed"))
            im = Image.open(io.BytesIO(raw))
            im = ImageOps.exif_transpose(im).convert("RGB")
            im = grade(crop_to(im, aspect, p.get("focus", [0.5, 0.5]), p.get("zoom", 1.0)), g)
            emitted = []
            ws = sorted({w for w in widths if w < im.width} | ({im.width} if max(widths) >= im.width else set()))
            for w in ws:
                if w > im.width:
                    continue
                r = im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
                r.save(OUT / f"{key}-{w}.webp", "WEBP", quality=q["webp"], method=6)
                r.save(OUT / f"{key}-{w}.avif", "AVIF", quality=q["avif"], speed=6)
                emitted.append(w)
            if not emitted:
                emitted = [im.width]
                im.save(OUT / f"{key}-{im.width}.webp", "WEBP", quality=q["webp"], method=6)
                im.save(OUT / f"{key}-{im.width}.avif", "AVIF", quality=q["avif"], speed=6)
            t = im.resize((THUMB_W, round(im.height * THUMB_W / im.width)), Image.LANCZOS)
            t.save(OUT / f"{key}-{THUMB_W}.webp", "WEBP", quality=q["thumb"], method=6)
            # drop outputs from an earlier treatment of this photo (other widths), so nothing stale is shipped
            keep = {f"{key}-{w}.{ext}" for w in emitted for ext in ("webp", "avif")} | {f"{key}-{THUMB_W}.webp"}
            for old in OUT.glob(f"{key}-*"):
                if re.fullmatch(rf"{re.escape(key)}-\d+\.(webp|avif)", old.name) and old.name not in keep:
                    old.unlink()
            biggest = max(emitted)
            full = im if biggest == im.width else im.resize((biggest, round(im.height * biggest / im.width)), Image.LANCZOS)
            w_, h_ = full.size
            size = sum((OUT / f"{key}-{w}.{ext}").stat().st_size for w in emitted for ext in ("webp", "avif"))
            print(f"{key:24} {w_}x{h_}  widths {emitted}  {size // 1024:5d} KB total  {p.get('license', 'supplied, approved by owner' if p.get('approval') else 'supplied, rights unconfirmed')}", flush=True)
        else:
            existing = sorted(int(m.group(1)) for f in OUT.glob(f"{key}-*.webp") if (m := re.match(rf"{re.escape(key)}-(\d+)\.webp$", f.name)) and int(m.group(1)) != THUMB_W)
            emitted = existing
            h = Image.open(OUT / f"{key}-{max(emitted)}.webp")
            w_, h_ = h.size
        entries[key] = {
            "file": f"/images/preview/{key}", "width": w_, "height": h_, "widths": emitted,
            # a supplied image has no licence to credit; it is labelled "awaiting approval" instead
            "approval": p.get("approval"),
            "credit": None if p.get("supplied") else {
                "title": p["title"], "author": p["author"], "license": p["license"], "licenseUrl": p["licenseUrl"],
                "sourceUrl": p["page"], "adapted": p.get("adapted") or adapted_text(g, aspect, p.get("zoom", 1.0)),
            },
        }
    write_ts(entries)
    print(f"wrote {TS.relative_to(ROOT)} ({len(entries)} photos)")


def write_ts(entries):
    head = '''/**
 * Photographs used as PREVIEW imagery only: openly licensed stock (Wikimedia Commons and similar open sources),
 * plus any image supplied for review whose origin and rights are not yet confirmed (credit: null).
 * Generated by scripts/images/build-preview-photos.py from scripts/images/preview-photos.manifest.json; see
 * docs/image-credits.md. None is an approved Alder & Ember product or project photograph, and each must be replaced
 * or approved before launch.
 * Credits are kept with the data so the licence terms (attribution, and share-alike where it applies) are met.
 */
export interface PreviewPhoto {
  /** path prefix; variants are `${file}-${w}.webp` (and `.avif` when `avif` is true) */
  file: string;
  width: number;
  height: number;
  /** widths actually emitted */
  widths: number[];
  /** true when an AVIF twin exists for every width (`${file}-${w}.avif`), served ahead of the WebP */
  avif?: boolean;
  /** width of the small variant used for gallery thumbnails (WebP only) */
  thumbWidth?: number;
  /** present once the owner has approved the image for use as their own photograph; its rights wording travels with it */
  approval?: { status: 'approved'; date: string; rights: string };
  /** null for a supplied image whose origin and rights are not yet confirmed */
  credit: { title: string; author: string; license: string; licenseUrl: string | null; sourceUrl: string; adapted: string } | null;
}

export const previewPhotos: Record<string, PreviewPhoto> = {
'''
    body = ""
    for k, v in entries.items():
        appr = f"    approval: {json.dumps(v['approval'], ensure_ascii=False)},\n" if v.get("approval") else ""
        body += f"  '{k}': {{\n    file: '{v['file']}',\n    width: {v['width']},\n    height: {v['height']},\n    widths: {json.dumps(v['widths'])},\n    avif: true,\n    thumbWidth: {THUMB_W},\n{appr}    credit: {json.dumps(v['credit'], ensure_ascii=False)},\n  }},\n"
    TS.write_text(head + body + "};\n")


if __name__ == "__main__":
    sys.exit(main())
