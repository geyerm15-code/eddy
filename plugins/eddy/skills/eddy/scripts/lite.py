"""Motor lite: overlays declarativos + subtítulos dibujados con Pillow (sin navegador ni Node).

Lo usa studio.py (`lite`, `lite-stills`). Diseño en el frame 1080x1920; todo se multiplica por K al dibujar.
Tipos de overlay en studio.json (campo "kind"):

  hook  — flota sobre la cabeza (y 120–620): kicker + title + accent
  card  — pantalla completa: step + title + accent + items [{text, at}]   (at = segundos o "palabra")
  stat  — pantalla completa: title + accent + value (cuenta) + prefix/suffix + label
  cta   — flota sobre la cabeza: line + word (palabra a comentar) que cae con impacto
"""
import math
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

R = {}  # estado: root, cfg, brand, style, K, fps, words, captions, W, H


def setup(root, cfg, brand, style, k, fps, words, captions):
    R.update(root=Path(root), cfg=cfg, brand=brand, style=style, K=k, fps=fps, words=words,
             cues=captions["cues"], W=1080 * k, H=1920 * k)
    _empty.cache_clear()


# ---------- utilidades ----------

def clamp(x):
    return max(0.0, min(1.0, x))


def out_cubic(x):
    return 1 - (1 - clamp(x)) ** 3


def out_expo(x):
    x = clamp(x)
    return 1 if x >= 1 else 1 - 2 ** (-10 * x)


def out_back(x, s=1.7):
    x = clamp(x) - 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2


def hexc(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def S(v):
    return int(round(v * R["K"]))


FONT_ROLE = {  # rol -> (clave en brand.fonts, peso para fuentes variables)
    "display": ("display", 800), "accent": ("accent", 400), "wide": ("wide", 900), "wide_m": ("wide", 500),
    "head": ("head", 700), "body": ("body", 650), "mono": ("mono", 500),
}


@lru_cache(maxsize=256)
def font(role, size):
    key, wght = FONT_ROLE[role]
    path = R["root"] / "fonts" / R["brand"]["fonts"][key]
    f = ImageFont.truetype(str(path), S(size))
    try:  # fuentes variables: fija el peso, deja los demás ejes en su valor por defecto
        axes = f.get_variation_axes()
        f.set_variation_by_axes([max(a["minimum"], min(a["maximum"], wght)) if a.get("name") in (b"Weight", "Weight")
                                 else a["default"] for a in axes])
    except Exception:
        pass
    return f


@lru_cache(maxsize=2048)
def text_img(text, role, size, color, shadow=True):
    """Texto como imagen RGBA recortada (con sombra suave opcional). Cacheada."""
    f = font(role, size)
    l, t, r, b = f.getbbox(text)
    pad = S(24) if shadow else S(4)
    w, h = r - l + pad * 2, b - t + pad * 2
    im = Image.new("RGBA", (max(1, w), max(1, h)))
    if shadow:
        sh = Image.new("RGBA", im.size)
        ImageDraw.Draw(sh).text((pad - l, pad - t + S(4)), text, font=f, fill=(0, 0, 0, 170))
        im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(S(9))))
    ImageDraw.Draw(im).text((pad - l, pad - t), text, font=f, fill=color)
    im.info["pad"] = pad
    im.info["asc"] = -t  # distancia del top del bbox al origen
    return im


def fade(im, a):
    if a >= 0.999:
        return im
    im = im.copy()
    im.putalpha(im.getchannel("A").point(lambda v: int(v * max(0.0, a))))
    return im


def blit(canvas, im, x, y, scale=1.0, alpha=1.0, anchor="lt"):
    """Pega im en (x, y) del frame de diseño. anchor: lt | ct (centro-arriba) | cc (centro)."""
    if alpha <= 0.002 or scale <= 0.01:
        return
    if abs(scale - 1) > 0.005:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.BILINEAR)
    im = fade(im, alpha)
    pad = int(im.info.get("pad", 0) * scale) if "pad" in im.info else 0
    px, py = S(x), S(y)
    if anchor == "ct":
        px -= im.width // 2
    elif anchor == "cc":
        px, py = px - im.width // 2, py - im.height // 2
    else:
        px -= pad
    if anchor != "cc":
        py -= pad
    _paste_clip(canvas, im, px, py)


def _paste_clip(canvas, im, px, py):
    l, t = max(0, -px), max(0, -py)
    r, b = min(im.width, canvas.width - px), min(im.height, canvas.height - py)
    if l >= r or t >= b:
        return
    canvas.alpha_composite(im.crop((l, t, r, b)) if (l, t, r, b) != (0, 0, im.width, im.height) else im,
                           (max(0, px), max(0, py)))


def paint(canvas, box, fn):
    """Dibuja formas semitransparentes MEZCLANDO (ImageDraw sobre RGBA reemplaza píxeles y abre agujeros).
    box = (x0, y0, x1, y1) en píxeles; fn(d, ox, oy) dibuja desplazando sus coordenadas por (ox, oy)."""
    x0, y0, x1, y1 = (int(v) for v in box)
    if x1 <= x0 or y1 <= y0:
        return
    layer = Image.new("RGBA", (x1 - x0, y1 - y0))
    fn(ImageDraw.Draw(layer), -x0, -y0)
    _paste_clip(canvas, layer, x0, y0)


def word_at(ov, at):
    """'at' de un item: número = segundos desde el inicio del overlay; texto = primera palabra que coincide."""
    if isinstance(at, (int, float)):
        return float(at)
    key = str(at).lower().strip(",.!?¡¿")
    for w in R["words"]:
        if ov["start"] - 0.05 <= w["start"] < ov["start"] + ov["dur"] and w["text"].lower().strip(",.!?¡¿") == key:
            return w["start"] - ov["start"]
    return 0.0


# ---------- fondos cacheados ----------

@lru_cache(maxsize=1)
def _empty():
    return Image.new("RGBA", (R["W"], R["H"]))


@lru_cache(maxsize=4)
def top_shade(h=760, k=0.62):
    g = Image.linear_gradient("L").resize((1, S(h))).point(lambda v: int((255 - v) * k))
    sh = Image.new("RGBA", (R["W"], S(h)), (0, 0, 0, 0))
    sh.putalpha(g.resize((R["W"], S(h))))
    return sh


@lru_cache(maxsize=2)
def panel_bg():
    W, H = R["W"], R["H"]
    if R["style"] == "tech":
        T = R["brand"]["tech"]
        small = Image.new("RGB", (108, 192))
        c0, c3 = hexc(T["bg0"]), hexc(T["bg3"])
        px = small.load()
        for y in range(192):
            for x in range(108):
                d = clamp(math.hypot((x - 54) / 70, (y - 88) / 95))
                e = d ** 0.9
                px[x, y] = tuple(int(c3[i] * (1 - e) + c0[i] * e) for i in range(3))
        im = small.resize((W, H), Image.BICUBIC).convert("RGBA")
        dots = Image.new("RGBA", (W, H))
        d = ImageDraw.Draw(dots)
        dot = hexc(T["dim"], 70)
        for y in range(0, 1920, 40):
            for x in range(20, 1080, 40):
                d.ellipse((S(x) - S(1.6), S(y) - S(1.6), S(x) + S(1.6), S(y) + S(1.6)), fill=dot)
        return Image.alpha_composite(im, dots)
    C = R["brand"]["colors"]
    im = Image.new("RGBA", (W, H), hexc(C["dark"]))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, S(1100)), fill=hexc(C["paper"]))
    dots = Image.new("RGBA", (W, H))
    dd = ImageDraw.Draw(dots)
    dot = hexc(C["ink"], 30)
    for y in range(20, 1100, 40):
        for x in range(20, 1080, 40):
            dd.ellipse((S(x) - S(2), S(y) - S(2), S(x) + S(2), S(y) + S(2)), fill=dot)
    return Image.alpha_composite(im, dots)


def panel(canvas, f, n):
    """Fondo de pantalla completa que entra barriendo desde abajo y sale hacia abajo."""
    pin = out_expo(f / 12)
    pout = clamp((f - (n - 10)) / 10) ** 2
    y = S(1920 * (1 - pin) + 1920 * pout)
    if R["style"] != "tech":  # banda de acento que precede al panel
        band = Image.new("RGBA", (R["W"], S(1920)), hexc(R["brand"]["colors"]["accent"]))
        yb = S(1920 * (1 - out_expo(f / 9)) + 1920 * clamp((f - (n - 13)) / 10) ** 2)
        if yb < R["H"]:
            canvas.alpha_composite(band.crop((0, 0, R["W"], R["H"] - yb)), (0, yb))
    if y < R["H"]:
        canvas.alpha_composite(panel_bg().crop((0, 0, R["W"], R["H"] - y)), (0, y))
    return S(1920 * pout) / R["K"]  # desplazamiento de salida para el contenido


# ---------- piezas de texto ----------

def rise_words(canvas, text, role, size, color, x, y, f0, f, out_f=None, stagger=3, center=False):
    """Palabras que suben desde abajo con desfase; salen hacia arriba en out_f."""
    words = text.split()
    imgs = [text_img(w, role, size, color) for w in words]
    gap = size * 0.28
    widths = [(im.width - 2 * im.info["pad"]) / R["K"] for im in imgs]
    total_w = sum(widths) + gap * (len(words) - 1)
    cx = x - total_w / 2 if center else x
    for i, (im, w) in enumerate(zip(imgs, widths)):
        p = out_expo((f - f0 - i * stagger) / 14)
        a = p
        dy = (1 - p) * size * 0.55
        if out_f is not None and f > out_f:
            q = out_cubic((f - out_f) / 8)
            a *= 1 - q
            dy -= q * size * 0.4
        blit(canvas, im, cx, y + dy, alpha=a)
        cx += w + gap


def typed(canvas, text, role, size, color, x, y, f0, f, cpf=2.0, caret=True, out_f=None):
    """Texto que se tipea con caret (estilo tech)."""
    n = int(clamp((f - f0) / max(1, len(text) * cpf)) * len(text)) if f >= f0 else 0
    a = 1.0 if out_f is None or f <= out_f else 1 - out_cubic((f - out_f) / 8)
    if n:
        blit(canvas, text_img(text[:n], role, size, color, shadow=False), x, y, alpha=a)
    done = n >= len(text)
    if caret and f >= f0 and (not done or (f // 15) % 2 == 0) and a > 0.01:
        cw = (font(role, size).getlength(text[:n]) / R["K"]) if n else 0
        acc = hexc(R["brand"]["tech"]["accent"], int(255 * a))
        bx = (S(x + cw + 6), S(y + size * 0.12), S(x + cw + 6 + size * 0.07) + 1, S(y + size * 0.95) + 1)
        paint(canvas, bx, lambda d, ox, oy: d.rectangle((bx[0] + ox, bx[1] + oy, bx[2] + ox - 1, bx[3] + oy - 1), fill=acc))


# ---------- overlays ----------

def ov_hook(c, ov, f, n):
    out_f = n - 10
    tech = R["style"] == "tech"
    c.alpha_composite(fade(top_shade(), out_cubic(f / 8) * (1 - clamp((f - out_f) / 10))))
    if tech:
        T = R["brand"]["tech"]
        if ov.get("kicker"):
            typed(c, ov["kicker"].upper(), "mono", 30, hexc(T["kicker"]), 64, 150, 0, f, cpf=1, caret=False, out_f=out_f)
        typed(c, ov.get("title", ""), "head", 118, hexc(T["text"]), 64, 200, 4, f, out_f=out_f, caret=not ov.get("accent"))
        if ov.get("accent"):
            typed(c, ov["accent"], "head", 118, hexc(T["accent"]), 64, 330, 4 + len(ov.get("title", "")) * 2, f, out_f=out_f)
        return
    C = R["brand"]["colors"]
    if ov.get("kicker"):
        rise_words(c, ov["kicker"].upper(), "wide", 42, hexc(C["accent"]), 540, 140, 0, f, out_f, center=True)
    rise_words(c, ov.get("title", ""), "display", 104, hexc("#ffffff"), 540, 210, 4, f, out_f, center=True)
    if ov.get("accent"):
        rise_words(c, ov["accent"], "accent", 150, hexc(C["accent"]), 540, 330, 12, f, out_f, center=True)


def card_head(c, ov, f, n, dy):
    tech = R["style"] == "tech"
    out_f = n - 12
    if tech:
        T = R["brand"]["tech"]
        if ov.get("step"):
            a = clamp((f - 8) / 4) * (1 - clamp((f - out_f) / 8))
            bx = (S(64), S(dy + 162), S(74) + 1, S(dy + 172) + 1)
            paint(c, bx, lambda d, ox, oy: d.ellipse((bx[0] + ox, bx[1] + oy, bx[2] + ox - 1, bx[3] + oy - 1),
                                                     fill=hexc(T["accent"], int(255 * a))))
            typed(c, ov["step"].upper(), "mono", 30, hexc(T["kicker"]), 88, dy + 150, 8, f, cpf=1, caret=False, out_f=out_f)
        typed(c, ov.get("title", ""), "head", 120, hexc(T["text"]), 64, dy + 200, 12, f, out_f=out_f,
              caret=not ov.get("accent"))
        if ov.get("accent"):
            typed(c, ov["accent"], "head", 120, hexc(T["accent"]), 64, dy + 330, 12 + len(ov.get("title", "")) * 2, f,
                  out_f=out_f)
        return
    C = R["brand"]["colors"]
    if ov.get("step"):
        rise_words(c, ov["step"].upper(), "wide", 40, hexc(C["accent"]), 80, dy + 130, 8, f, out_f)
    rise_words(c, ov.get("title", ""), "display", 112, hexc(C["ink"]), 80, dy + 200, 10, f, out_f)
    if ov.get("accent"):
        rise_words(c, ov["accent"], "accent", 160, hexc(C["accent"]), 120, dy + 320, 16, f, out_f)


def ov_card(c, ov, f, n):
    dy = panel(c, f, n)
    card_head(c, ov, f, n, dy)
    tech = R["style"] == "tech"
    items = ov.get("items", [])
    y0, gap = 560, min(200, 520 / max(1, len(items)))
    for i, it in enumerate(items):
        at = round(word_at(ov, it.get("at", 0.6 + i * 0.8)) * R["fps"]) - 2
        p = out_back((f - at) / 12, 1.2) if f >= at else 0
        if p <= 0:
            if tech:
                p = -1  # anticipo atenuado
            else:
                continue
        y = dy + y0 + i * gap
        h = gap - 26
        if tech:
            T = R["brand"]["tech"]
            lit = p > 0
            col = hexc(T["line"] if lit else T["dim"], 255 if lit else 160)
            a0 = clamp((f - at + 24) / 8)
            if a0 <= 0:
                continue
            col = col[:3] + (int(col[3] * a0),)
            bx = (S(64), S(y), S(1016) + 1, S(y + h) + 1)
            paint(c, bx, lambda d, ox, oy: d.rounded_rectangle((bx[0] + ox, bx[1] + oy, bx[2] + ox - 1, bx[3] + oy - 1),
                                                               radius=S(18), outline=col, width=S(3)))
            blit(c, text_img(it["text"], "body", 50, hexc(T["text"] if lit else T["dim"]), shadow=False),
                 104, y + h / 2 - 30, alpha=a0)
            if lit:
                blit(c, text_img(f"{i + 1:02d}", "mono", 34, hexc(T["accent"]), shadow=False), 930, y + h / 2 - 20)
        else:
            C = R["brand"]["colors"]
            x = 80 + (1 - clamp(p)) * 420
            card = Image.new("RGBA", (S(920), S(h)))
            ImageDraw.Draw(card).rounded_rectangle((0, 0, S(920) - 1, S(h) - 1), radius=S(26), fill=hexc(C["card"]),
                                                   outline=hexc(C["border"]), width=S(2))
            blit(c, card, x, y, alpha=clamp(p * 1.4))
            cx, cy, r = S(x + 52), S(y + h / 2), S(24)
            q = clamp(p)

            def chk(d, ox, oy, cx=cx, cy=cy, r=r, q=q):
                d.ellipse((cx - r + ox, cy - r + oy, cx + r + ox, cy + r + oy), fill=hexc(C["accent"], int(255 * q)))
                d.line([(cx - S(10) + ox, cy + oy), (cx - S(2) + ox, cy + S(9) + oy), (cx + S(12) + ox, cy - S(9) + oy)],
                       fill=(255, 255, 255, int(255 * q)), width=S(5))
            paint(c, (cx - r, cy - r, cx + r + 1, cy + r + 1), chk)
            blit(c, text_img(it["text"], "display", 62, hexc("#f4f1ec"), shadow=False), x + 104, y + h / 2 - 40,
                 alpha=clamp(p * 1.4))


def ov_stat(c, ov, f, n):
    dy = panel(c, f, n)
    card_head(c, ov, f, n, dy)
    at = round(word_at(ov, ov.get("at", 0.5)) * R["fps"])
    p = out_expo((f - at) / 30)
    v = ov.get("value", 100)
    num = f"{ov.get('prefix', '')}{(v * p):.{ov.get('decimals', 0)}f}{ov.get('suffix', '')}"
    tech = R["style"] == "tech"
    col = hexc(R["brand"]["tech"]["accent"] if tech else R["brand"]["colors"]["accent"])
    if f >= at:
        s = 1 + 0.12 * (1 - out_back((f - at) / 10))
        blit(c, text_img(num, "head" if tech else "wide", 230, col, shadow=False), 540, dy + 560, scale=s, anchor="ct")
    if ov.get("label"):
        lab = hexc(R["brand"]["tech"]["kicker"] if tech else R["brand"]["colors"]["ink"])
        rise_words(c, ov["label"], "body" if tech else "display", 56, lab, 540, dy + 880, at + 8, f, n - 12, center=True)


def ov_cta(c, ov, f, n):
    out_f = n - 10
    c.alpha_composite(fade(top_shade(820, 0.7), out_cubic(f / 8) * (1 - clamp((f - out_f) / 10))))
    tech = R["style"] == "tech"
    acc = R["brand"]["tech"]["accent"] if tech else R["brand"]["colors"]["accent"]
    line = ov.get("line", R["brand"].get("cta", {}).get("line", "Comenta"))
    word = ov.get("word", R["brand"].get("cta", {}).get("word", "INFO")).upper()
    rise_words(c, line, "body" if tech else "display", 70, hexc("#ffffff"), 540, 150, 0, f, out_f, center=True)
    at = 10
    if f < at:
        return
    p = out_back((f - at) / 12, 2.2)
    s = 2.4 - 1.4 * clamp(p) if f - at < 12 else 1 + 0.04 * math.sin((f - at) / 5)
    a = clamp((f - at) / 4) * (1 - clamp((f - out_f) / 8))
    im = text_img(word, "head" if tech else "wide", 150, hexc("#ffffff" if not tech else acc), shadow=False)
    bw, bh = im.width / R["K"] + 40, im.height / R["K"]
    box = Image.new("RGBA", (S(bw), S(bh)))
    bd = ImageDraw.Draw(box)
    if tech:
        bd.rounded_rectangle((0, 0, S(bw) - 1, S(bh) - 1), radius=S(bh / 2), outline=hexc(acc), width=S(4))
    else:
        bd.rounded_rectangle((0, 0, S(bw) - 1, S(bh) - 1), radius=S(30), fill=hexc(acc))
    box.alpha_composite(im, ((box.width - im.width) // 2, 0))
    box.info["pad"] = 0
    blit(c, box, 540, 300 + bh / 2, scale=s, alpha=a, anchor="cc")
    if 0 <= f - at < 14 and not tech:  # onda de impacto
        q = out_cubic((f - at) / 14)
        r = S(120 + 380 * q)
        cy = S(300 + bh / 2)
        bx = (S(540) - r, cy - r, S(540) + r + 1, cy + r + 1)
        paint(c, bx, lambda d, ox, oy: d.ellipse((bx[0] + ox, bx[1] + oy, bx[2] + ox - 1, bx[3] + oy - 1),
                                                 outline=hexc(acc, int(220 * (1 - q))), width=S(6)))


KINDS = {"hook": ov_hook, "float": ov_hook, "card": ov_card, "insert": ov_card, "stat": ov_stat, "cta": ov_cta}


# ---------- subtítulos ----------

def captions(c, t):
    cue = next((q for q in R["cues"] if q["start"] <= t < q["end"]), None)
    if not cue:
        return
    if R["style"] == "tech":
        T = R["brand"]["tech"]
        p = out_cubic((t - cue["start"]) / 0.13)
        im = text_img(" ".join(w["text"] for w in cue["words"]), "body", 63, hexc(T["caption"]))
        blit(c, im, 540, 1440 + (1 - p) * 8, alpha=p, anchor="ct")
        return
    C = R["brand"]["colors"]
    imgs = [text_img(w["text"], "accent" if w["key"] else "display", 112 if w["key"] else 90,
                     hexc(C["accent"] if w["key"] else "#ffffff")) for w in cue["words"]]
    widths = [(im.width - 2 * im.info["pad"]) / R["K"] for im in imgs]
    gap, maxw = 22, 960
    lines, cur, cw = [], [], 0
    for i, w in enumerate(widths):
        if cur and cw + gap + w > maxw:
            lines.append(cur)
            cur, cw = [], 0
        cur.append(i)
        cw += (gap if len(cur) > 1 else 0) + w
    lines.append(cur)
    lh = 112
    y = 1320 - lh * len(lines) / 2
    for ln in lines:
        lw = sum(widths[i] for i in ln) + gap * (len(ln) - 1)
        x = 540 - lw / 2
        for i in ln:
            w = cue["words"][i]
            p = clamp((t - max(cue["start"], w["start"] - 0.05)) / 0.18)
            pe = out_back(p)
            hh = (imgs[i].height - 2 * imgs[i].info["pad"]) / R["K"]
            blit(c, imgs[i], x, y + (lh - hh) / 2 + (1 - pe) * 26, scale=0.82 + 0.18 * pe, alpha=out_cubic(p))
            x += widths[i] + gap
        y += lh


# ---------- frame ----------

def frame(i):
    fps = R["fps"]
    t = i / fps
    active = [o for o in R["cfg"].get("overlays", []) if o["start"] <= t < o["start"] + o["dur"]]
    cue = any(q["start"] <= t < q["end"] for q in R["cues"])
    if not active and not cue:
        return _empty()
    c = Image.new("RGBA", (R["W"], R["H"]))
    for o in active:
        KINDS.get(o.get("kind", "card"), ov_card)(c, o, i - round(o["start"] * fps), round(o["dur"] * fps))
    captions(c, t)
    return c
