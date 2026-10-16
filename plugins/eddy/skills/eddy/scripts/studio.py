#!/usr/bin/env python3
"""Eddy — talking head vertical + motion graphics + subtítulos cinéticos.

Todo se configura en studio.json (proyecto) + brand.json (identidad visual). Comandos:

  python3 studio.py doctor                   # revisa ffmpeg/node/whisper/disco y recomienda motor
  python3 studio.py audio                    # limpia la voz -> audio/clean.wav
  python3 studio.py transcribe [--engine auto|elevenlabs|whisper|script] [--script guion.txt] [--model small]
                                             # -> transcripts/<video>.json + takes_packed.md
  python3 studio.py words                    # palabras en la línea de tiempo FINAL + frame local por overlay
  python3 studio.py captions                 # -> animations/src/captions.json (cues de subtítulos)
  python3 studio.py base [--reuse]           # cortes + reencuadre 9:16 + punch-in -> base.mov
  --- motor "remotion" (Claude Code, máxima calidad) ---
  python3 studio.py stills ID f1 f2 ...      # stills de la escena ID sobre el video -> verify/sheet_ID.jpg
  python3 studio.py anim [ID ...]            # escenas Remotion (ProRes 4444 con alfa) -> animations/out/ID.mov
  python3 studio.py capt                     # capa de subtítulos -> animations/out/captions.mov
  python3 studio.py final                    # base + escenas + subtítulos + loudnorm -> final.mp4
  --- motor "lite" (claude.ai o sin Node: Python + Pillow, sin navegador) ---
  python3 studio.py lite-stills t1 t2 ...    # frames de prueba en segundos -> verify/lite_sheet.jpg
  python3 studio.py lite                     # overlays declarativos + subtítulos + loudnorm -> final.mp4
  ---
  python3 studio.py all [--reuse]            # captions + base + (anim + capt + final | lite) según "engine"
  python3 studio.py qa                       # contact sheet de 10 frames de final.mp4 -> verify/qa.jpg
  python3 studio.py clean ["nombre"] [--all] # TRAS APROBACIÓN: copia final como <nombre>.mp4 y borra intermedios
"""
import glob
import json
import math
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CFG = json.loads((ROOT / "studio.json").read_text())
BRAND = json.loads((ROOT / "brand.json").read_text())
CLAUDE_AI = Path("/mnt/user-data").exists()  # sandbox de claude.ai
OUTPUTS = Path("/mnt/user-data/outputs")
FPS = 30  # escenas y subtítulos se diseñan a 30 fps
EXP = BRAND.get("export", {})
OUT_FPS = CFG.get("out_fps", EXP.get("out_fps", 30))
K = CFG.get("scale", 1 if CLAUDE_AI else EXP.get("scale", 2))  # 2 = 4K vertical, 1 = 1080x1920
W, H = 1080 * K, 1920 * K
SRC = (ROOT / CFG["source"]).resolve()
ANIM = ROOT / "animations"
CLEAN = ROOT / "audio" / "clean.wav"
FACE_Y = CFG.get("face_y", 780)  # centro de la cara en el frame de diseño 1080x1920
GRADE = CFG.get("grade", "")
STYLE = CFG.get("style", BRAND.get("style", "editorial"))  # "editorial" | "tech"
ENGINE = CFG.get("engine", "lite" if CLAUDE_AI else "remotion")
CHUNK = {"editorial": (3, 16), "tech": (5, 26)}.get(STYLE, (3, 16))  # subtítulos: (máx palabras, máx caracteres)
LANG = CFG.get("language", BRAND.get("language", "es"))
FONTS = ROOT / "fonts"
AUDIO_CHAIN = (
    "highpass=f=80,{rnn}afftdn=nr=16:nf=-48:tn=1,"
    "equalizer=f=200:t=q:w=1.2:g=-2,equalizer=f=3200:t=q:w=1.0:g=2.5,equalizer=f=9000:t=h:w=0.7:g=1.5,"
    "deesser=i=0.3,acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=4,"
    "agate=threshold=0.008:ratio=3:range=0.1:attack=5:release=250"
)


def ffmpeg_bin():
    hit = shutil.which("ffmpeg")
    if hit:
        return hit
    try:
        import imageio_ffmpeg  # pip install imageio-ffmpeg (trae un ffmpeg estático)
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("! falta ffmpeg: instala con `brew install ffmpeg` o `pip install imageio-ffmpeg`")


FF = None


def ff(*args):
    global FF
    FF = FF or ffmpeg_bin()
    return [FF, "-hide_banner", *args]


def run(cmd, cwd=None, quiet=True):
    print("  $", " ".join(str(c) for c in cmd)[:160])
    r = subprocess.run(cmd, cwd=cwd, stdout=subprocess.DEVNULL if quiet else None,
                       stderr=subprocess.PIPE if quiet else None, text=True)
    if r.returncode:
        sys.exit(f"! falló ({r.returncode}):\n{(r.stderr or '')[-2500:]}")


def ranges():
    rs = [tuple(r) for r in CFG.get("ranges", [])]
    if not rs:
        sys.exit("! studio.json no tiene `ranges` (cortes). Lee takes_packed.md y escríbelos.")
    return rs


def total():
    return sum(e - s for s, e, *_ in ranges())


def probe(path):
    r = subprocess.run(ff("-i", str(path)), capture_output=True, text=True)
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr)
    v = re.search(r"Video:.*?(\d{2,5})x(\d{2,5})", r.stderr)
    fps = re.search(r"([\d.]+) fps", r.stderr)
    rot = re.search(r"rotation of (-?\d+)", r.stderr) or re.search(r"rotate\s*:\s*(-?\d+)", r.stderr)
    w, h = (int(v.group(1)), int(v.group(2))) if v else (0, 0)
    if rot and abs(int(rot.group(1))) % 180 == 90:
        w, h = h, w
    return {"dur": int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3]) if m else 0.0,
            "w": w, "h": h, "fps": float(fps.group(1)) if fps else 0.0}


# ---------- doctor ----------

def cmd_doctor():
    ok = lambda b: "✓" if b else "✗"
    ffp = shutil.which("ffmpeg")
    try:
        import imageio_ffmpeg  # noqa: F401
        iio = True
    except ImportError:
        iio = False
    node = shutil.which("npx") is not None
    try:
        import PIL  # noqa: F401
        pil = True
    except ImportError:
        pil = False
    try:
        import faster_whisper  # noqa: F401
        fw = True
    except ImportError:
        fw = False
    el = bool(os.environ.get("ELEVENLABS_API_KEY"))
    free = shutil.disk_usage(ROOT).free / 1e9
    print(f"entorno: {'claude.ai (sandbox)' if CLAUDE_AI else 'local (Claude Code)'}")
    print(f"{ok(ffp or iio)} ffmpeg {'(sistema)' if ffp else '(imageio-ffmpeg)' if iio else '— brew install ffmpeg | pip install imageio-ffmpeg'}")
    print(f"{ok(node)} node/npx (motor remotion)")
    print(f"{ok(pil)} Pillow (motor lite){'' if pil else ' — pip install pillow'}")
    print(f"{ok(fw)} faster-whisper (transcripción local){'' if fw else ' — pip install faster-whisper'}")
    print(f"{ok(el)} ELEVENLABS_API_KEY (transcripción en la nube, opcional)")
    print(f"{ok(free > 15)} disco libre {free:.1f} GB (4K pide ≥15 GB)")
    if SRC.exists():
        p = probe(SRC)
        print(f"fuente: {SRC.name} {p['w']}x{p['h']} {p['fps']:.0f} fps {p['dur']:.1f}s")
    print(f"motor configurado: {ENGINE} · estilo: {STYLE} · export: {W}x{H} @ {OUT_FPS} fps")
    if ENGINE == "remotion" and not node:
        print("→ sin Node: usa \"engine\": \"lite\" en studio.json")


# ---------- audio / transcripción ----------

def cmd_audio():
    (ROOT / "audio").mkdir(exist_ok=True)
    raw = ROOT / "audio" / "raw.wav"
    run(ff("-y", "-i", str(SRC), "-vn", "-ac", "1", "-ar", "48000", str(raw)))
    rnn = ROOT / "audio" / "std.rnnn"
    chain = AUDIO_CHAIN.format(rnn="arnndn=m=std.rnnn:mix=1," if rnn.exists() else "")
    r = subprocess.run(ff("-y", "-i", str(raw), "-af", chain, str(CLEAN)), cwd=ROOT / "audio", capture_output=True, text=True)
    if r.returncode:  # algunos ffmpeg estáticos no traen arnndn/deesser
        print("  ! cadena completa no disponible en este ffmpeg; uso la versión básica")
        run(ff("-y", "-i", str(raw), "-af", "highpass=f=80,afftdn=nr=14,acompressor=threshold=-22dB:ratio=3:makeup=4",
               str(CLEAN)))
    print(f"→ {CLEAN}")


def _audio_for_asr():
    src = CLEAN if CLEAN.exists() else SRC
    out = ROOT / "audio" / "asr.mp3"
    (ROOT / "audio").mkdir(exist_ok=True)
    run(ff("-y", "-i", str(src), "-vn", "-ac", "1", "-ar", "16000", "-b:a", "64k", str(out)))
    return out


def asr_elevenlabs():
    key = os.environ.get("ELEVENLABS_API_KEY")
    a = _audio_for_asr()
    r = subprocess.run(["curl", "-sS", "-X", "POST", "https://api.elevenlabs.io/v1/speech-to-text",
                        "-H", f"xi-api-key: {key}", "-F", "model_id=scribe_v1", "-F", f"language_code={LANG}",
                        "-F", "timestamps_granularity=word", "-F", f"file=@{a}"], capture_output=True, text=True)
    j = json.loads(r.stdout or "{}")
    if "words" not in j:
        sys.exit(f"! ElevenLabs: {r.stdout[:500]} {r.stderr[:300]}")
    return [{"text": w["text"].strip(), "start": w["start"], "end": w["end"], "type": "word"}
            for w in j["words"] if w.get("type") == "word" and w["text"].strip()]


def asr_whisper(model):
    import numpy as np
    from faster_whisper import WhisperModel
    # decodifica con ffmpeg (evita depender de PyAV, que rompe entre versiones)
    pcm = subprocess.run(ff("-i", str(CLEAN if CLEAN.exists() else SRC), "-vn", "-ac", "1", "-ar", "16000",
                            "-f", "s16le", "-"), capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
    print(f"  faster-whisper {model} (la primera vez descarga el modelo)…")
    m = WhisperModel(model, device="auto", compute_type="int8")
    segs, _ = m.transcribe(audio, language=LANG, word_timestamps=True, vad_filter=True)
    return [{"text": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3), "type": "word"}
            for s in segs for w in (s.words or []) if w.word.strip()]


def speech_intervals(path, noise="-35dB", gap=0.25):
    r = subprocess.run(ff("-i", str(path), "-af", f"silencedetect=n={noise}:d={gap}", "-f", "null", "-"),
                       capture_output=True, text=True)
    dur = probe(path)["dur"]
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    out, t = [], 0.0
    for i, s in enumerate(starts):
        if s - t > 0.08:
            out.append((t, s))
        t = ends[i] if i < len(ends) else dur
    if dur - t > 0.08:
        out.append((t, dur))
    return out


def asr_script(script):
    """Sin modelo: reparte las palabras del guion sobre los tramos con voz (por longitud). Aproximado ±0.3 s."""
    text = Path(script).read_text()
    toks = text.split()
    if not toks:
        sys.exit("! guion vacío")
    iv = speech_intervals(CLEAN if CLEAN.exists() else SRC)
    if not iv:
        sys.exit("! no detecté voz")
    D = sum(e - s for s, e in iv)
    wts = [len(t.strip(",.;:!?¡¿")) + 2 for t in toks]
    tot = sum(wts)

    def real(v):  # tiempo virtual (solo voz) -> tiempo real
        for s, e in iv:
            if v <= e - s:
                return s + v
            v -= e - s
        return iv[-1][1]

    words, c = [], 0.0
    for t, w in zip(toks, wts):
        a, b = c / tot * D, (c + w) / tot * D
        c += w
        ra, rb = real(a + 1e-4), real(b - 1e-4)
        words.append({"text": t, "start": round(ra, 3), "end": round(max(rb, ra + 0.05), 3), "type": "word"})
    print("  ! timings aproximados (alineación por guion): revisa los cortes con más margen")
    return words


def pack(words):
    lines, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        if not nxt or nxt["start"] - w["end"] >= 0.4 or w["text"][-1] in ".!?":
            lines.append(f"[{cur[0]['start']:7.2f} – {cur[-1]['end']:7.2f}] " + " ".join(x["text"] for x in cur))
            cur = []
    return "\n".join(lines)


def cmd_transcribe(rest):
    opt = lambda k, d=None: rest[rest.index(k) + 1] if k in rest else d
    eng = opt("--engine", "auto")
    tj = ROOT / "transcripts" / f"{SRC.stem}.json"
    if tj.exists() and "--force" not in rest:
        print(f"  ya existe {tj.name} (usa --force para repetir)")
        words = json.loads(tj.read_text())["words"]
    else:
        if eng == "auto":
            if opt("--script"):
                eng = "script"
            elif os.environ.get("ELEVENLABS_API_KEY"):
                eng = "elevenlabs"
            else:
                try:
                    import faster_whisper  # noqa: F401
                    eng = "whisper"
                except ImportError:
                    sys.exit("! sin motor de transcripción: pip install faster-whisper, define ELEVENLABS_API_KEY,"
                             " o pasa --script guion.txt")
        words = (asr_elevenlabs() if eng == "elevenlabs" else asr_whisper(opt("--model", "small")) if eng == "whisper"
                 else asr_script(opt("--script")))
        tj.parent.mkdir(exist_ok=True)
        tj.write_text(json.dumps({"engine": eng, "words": words}, ensure_ascii=False, indent=1))
    md = pack(words)
    (ROOT / "takes_packed.md").write_text(md + "\n")
    print(md)


def output_words():
    tj = ROOT / "transcripts" / f"{SRC.stem}.json"
    words = [w for w in json.loads(tj.read_text())["words"] if w.get("type", "word") == "word"]
    fixes = CFG.get("replace", {})
    out, off = [], 0.0
    for s, e, *_ in ranges():
        for w in words:
            if w["start"] >= s - 0.01 and w["end"] <= e + 0.01:
                t = w["text"]
                for a, b in fixes.items():
                    t = t.replace(a, b)
                if out and re.fullmatch(r"[%.,;:!?»)\]]+.*", t) and not re.search(r"\w", t[:1]):
                    out[-1]["text"] += t  # "40" + "%," -> "40%," (puntuación suelta del ASR)
                    out[-1]["end"] = round(w["end"] - s + off, 3)
                    continue
                out.append({"text": t, "start": round(w["start"] - s + off, 3), "end": round(w["end"] - s + off, 3)})
        off += e - s
    return out


def cmd_words():
    ws = output_words()
    print(" ".join(f"{w['text']}@{w['start']:.2f}" for w in ws))
    for ov in CFG.get("overlays", []):
        t0, d = ov["start"], ov["dur"]
        inside = [w for w in ws if t0 <= w["start"] < t0 + d]
        print(f"\n[{ov['id']}] {t0:.2f}s +{d:.2f}s ({round(d * FPS)}f): "
              + " · ".join(f"{w['text']} {round((w['start'] - t0) * FPS)}" for w in inside))


# ---------- subtítulos ----------

def chunk(words):
    mw, mc = CHUNK
    chunks, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        chars = sum(len(x["text"]) + 1 for x in cur)
        if (not nxt or w["text"][-1] in ",.!?" or nxt["start"] - w["end"] >= 0.3 or len(cur) >= mw
                or chars + len(nxt["text"]) > mc):
            chunks.append(cur)
            cur = []
    merged = []
    for c in chunks:
        if merged and c[-1]["end"] - c[0]["start"] < 0.35 and len(merged[-1]) + len(c) <= mw \
                and merged[-1][-1]["text"][-1] not in ".!?":
            merged[-1] += c
        else:
            merged.append(c)
    return merged


def cmd_captions():
    keys = {k.lower() for k in CFG.get("keywords", BRAND.get("captions", {}).get("keywords", []))}
    upper = BRAND.get("captions", {}).get("uppercase", False)
    cs, tot, cues = chunk(output_words()), total(), []
    for i, c in enumerate(cs):
        st, en = c[0]["start"] - 0.04, c[-1]["end"] + 0.08
        if i + 1 < len(cs):
            nst = cs[i + 1][0]["start"] - 0.04
            en = nst if nst - en < 0.45 else en
        cues.append({"start": round(max(0, st), 3), "end": round(min(en, tot), 3),
                     "words": [{"text": w["text"].upper() if upper else w["text"], "start": w["start"],
                                "key": w["text"].strip(",.!?¡¿").lower() in keys} for w in c]})
    p = ANIM / "src" / "captions.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps({"total": round(tot, 3), "style": STYLE, "cues": cues}, ensure_ascii=False, indent=1))
    print(f"→ {p} ({len(cues)} cues)")


# ---------- video base ----------

def cmd_base(reuse=False):
    clips = ROOT / "clips"
    clips.mkdir(exist_ok=True)
    preset, crf = ("medium", "16") if CLAUDE_AI else ("slow", "12")
    segs = []
    for i, (s, e, z, *note) in enumerate(ranges()):
        out = clips / f"seg_{i:02d}.mov"
        segs.append(out)
        if reuse and out.exists():
            continue
        d = e - s
        w, h = round(W * z / 2) * 2, round(H * z / 2) * 2
        y = max(0, min(h - H, round((FACE_Y * z - FACE_Y + 40 * (z > 1)) * K)))
        # reencuadre a 9:16 sin deformar (sirve también para fuentes 16:9: recorta al centro)
        vf = (f"scale={w}:{h}:force_original_aspect_ratio=increase:flags=lanczos,"
              f"crop={W}:{H}:(iw-{W})/2:{y}" + (f",{GRADE}" if GRADE else "") + ",setsar=1")
        audio = CLEAN if CLEAN.exists() else SRC
        run(ff("-y", "-ss", f"{s:.3f}", "-i", str(SRC), "-ss", f"{s:.3f}", "-i", str(audio),
               "-t", f"{d:.3f}", "-map", "0:v:0", "-map", "1:a:0", "-vf", vf,
               "-af", f"afade=t=in:st=0:d=0.03,afade=t=out:st={d - 0.03:.3f}:d=0.03", "-r", str(OUT_FPS),
               "-c:v", "libx264", "-preset", preset, "-crf", crf,
               "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "1", str(out)))
    lst = ROOT / "_concat.txt"
    lst.write_text("".join(f"file '{p}'\n" for p in segs))
    run(ff("-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(ROOT / "base.mov")))
    print(f"→ base.mov {total():.2f}s")


# ---------- motor remotion ----------

def sync_brand():
    shutil.copy2(ROOT / "brand.json", ANIM / "src" / "brand.json")
    pub = ANIM / "public"
    pub.mkdir(exist_ok=True)
    for f in FONTS.glob("*"):
        if not (pub / f.name).exists():
            shutil.copy2(f, pub / f.name)


def remotion(args):
    sync_brand()
    br = os.environ.get("REMOTION_BROWSER")
    run(["npx", "remotion", *args, "--log=error", *(["--browser-executable", br] if br else [])], cwd=ANIM, quiet=False)


PRORES = [f"--scale={K}", "--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le",
          "--image-format=png", f"--concurrency={max(1, min(8, (os.cpu_count() or 4) - 2))}"]


def cmd_anim(ids):
    (ANIM / "out").mkdir(exist_ok=True)
    for ov in CFG["overlays"]:
        if ids and ov["id"] not in ids:
            continue
        remotion(["render", "src/index.ts", ov["id"], f"out/{ov['id']}.mov", *PRORES])


def cmd_capt():
    remotion(["render", "src/index.ts", "Captions", "out/captions.mov", *PRORES])


def cmd_stills(sid, frames):
    ov = next(o for o in CFG["overlays"] if o["id"] == sid)
    (ANIM / "stills").mkdir(exist_ok=True)
    (ROOT / "verify").mkdir(exist_ok=True)
    ins, fc = [], ""
    for i, fr in enumerate(frames):
        png = ANIM / "stills" / f"{sid}_{fr}.png"
        remotion(["still", "src/index.ts", sid, str(png), f"--frame={fr}"])
        bg = ANIM / "stills" / f"_bg_{i}.png"
        run(ff("-y", "-ss", f"{ov['start'] + int(fr) / FPS:.3f}", "-i", str(ROOT / "base.mov"), "-frames:v", "1", str(bg)))
        ins += ["-i", str(bg), "-i", str(png)]
        fc += f"[{2 * i}]scale=1080:1920[b{i}];[{2 * i + 1}]scale=1080:1920[o{i}];[b{i}][o{i}]overlay,scale=432:768[c{i}];"
    out = ROOT / "verify" / f"sheet_{sid}.jpg"
    lbl = "".join(f"[c{i}]" for i in range(len(frames)))
    run(ff("-y", *ins, "-filter_complex", f"{fc}{lbl}hstack={len(frames)}" if len(frames) > 1 else f"{fc}{lbl}null", str(out)))
    print(f"→ {out}")


def loudnorm(src):
    r = subprocess.run(ff("-i", str(src), "-af", "loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json", "-f", "null", "-"),
                       capture_output=True, text=True)
    j = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
    return (f"loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={j['input_i']}:measured_TP={j['input_tp']}"
            f":measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")


def encode_args():
    preset = "medium" if CLAUDE_AI else "slow"
    return ["-t", f"{total():.3f}", "-c:v", "libx264", "-preset", preset, "-crf", "15" if K > 1 else "17",
            "-pix_fmt", "yuv420p", "-profile:v", "high",
            *(["-level:v", "5.2", "-maxrate", "120M", "-bufsize", "240M"] if K > 1 else []),
            "-r", str(OUT_FPS), "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart"]


def cmd_final():
    base = ROOT / "base.mov"
    inputs, fg, last = ["-i", str(base)], [], "[0:v]"
    layers = [(ANIM / "out" / f"{o['id']}.mov", o["start"], o["dur"]) for o in CFG["overlays"]]
    layers.append((ANIM / "out" / "captions.mov", 0.0, total()))  # subtítulos AL FINAL, encima de todo
    for k, (p, t, d) in enumerate(layers, start=1):
        if not p.exists():
            print(f"  ! falta, se omite: {p.name}")
            continue
        inputs += ["-i", str(p)]
        idx = inputs.count("-i") - 1
        fg.append(f"[{idx}:v]format=yuva420p,scale={W}:{H},fps={OUT_FPS},setpts=PTS-STARTPTS+{t}/TB[ov{k}]")
        fg.append(f"{last}[ov{k}]overlay=0:0:eof_action=pass:enable='between(t,{t},{t + d - 0.001:.3f})'[v{k}]")
        last = f"[v{k}]"
    fg.append(f"{last}format=yuv420p[vout]")
    fg.append(f"[0:a]{loudnorm(base)},aresample=48000[aout]")
    run(ff("-y", *inputs, "-filter_complex", ";".join(fg), "-map", "[vout]", "-map", "[aout]",
           *encode_args(), str(ROOT / "final.mp4")))
    print(f"→ {ROOT / 'final.mp4'}")


# ---------- motor lite (Pillow) ----------

def lite_engine():
    sys.path.insert(0, str(ROOT))
    import lite
    lite.setup(ROOT, CFG, BRAND, STYLE, K, FPS, output_words(), json.loads((ANIM / "src" / "captions.json").read_text()))
    return lite


def cmd_lite():
    if not (ANIM / "src" / "captions.json").exists():
        cmd_captions()
    L = lite_engine()
    base = ROOT / "base.mov"
    n = math.ceil(total() * FPS)
    cmd = ff("-y", "-i", str(base), "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
             "-filter_complex", f"[1:v]fps={OUT_FPS}[o];[0:v][o]overlay=0:0:format=auto,format=yuv420p[vout];"
                                f"[0:a]{loudnorm(base)},aresample=48000[aout]",
             "-map", "[vout]", "-map", "[aout]", *encode_args(), str(ROOT / "final.mp4"))
    print(f"  render lite {n} frames {W}x{H}…")
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    for i in range(n):
        p.stdin.write(L.frame(i).tobytes())
        if i % (FPS * 5) == 0:
            print(f"    {i / FPS:5.1f}s / {total():.1f}s", flush=True)
    p.stdin.close()
    err = p.stderr.read().decode(errors="replace")
    if p.wait():
        sys.exit(f"! ffmpeg falló:\n{err[-2500:]}")
    print(f"→ {ROOT / 'final.mp4'}")


def cmd_lite_stills(times):
    from PIL import Image
    if not (ANIM / "src" / "captions.json").exists():
        cmd_captions()
    L = lite_engine()
    (ROOT / "verify").mkdir(exist_ok=True)
    tiles = []
    for i, t in enumerate(times):
        bg = ROOT / "verify" / f"_bg_{i}.png"
        run(ff("-y", "-ss", f"{float(t):.3f}", "-i", str(ROOT / "base.mov"), "-frames:v", "1", str(bg)))
        im = Image.open(bg).convert("RGBA").resize((W, H))
        im.alpha_composite(L.frame(round(float(t) * FPS)))
        tiles.append(im.convert("RGB").resize((432, 768)))
    sheet = Image.new("RGB", (432 * len(tiles), 768))
    for i, t in enumerate(tiles):
        sheet.paste(t, (432 * i, 0))
    out = ROOT / "verify" / "lite_sheet.jpg"
    sheet.save(out, quality=88)
    print(f"→ {out}")


# ---------- QA / limpieza ----------

def cmd_qa():
    fin = ROOT / "final.mp4"
    d = probe(fin)["dur"]
    (ROOT / "verify").mkdir(exist_ok=True)
    out = ROOT / "verify" / "qa.jpg"
    step = max(d / 10, 0.1)
    run(ff("-y", "-i", str(fin), "-vf", f"fps=1/{step:.3f},scale=270:480,tile=5x2", "-frames:v", "1", str(out)))
    p = probe(fin)
    print(f"→ {out}  ({p['w']}x{p['h']} {p['fps']:.0f} fps {p['dur']:.2f}s {fin.stat().st_size / 1e6:.0f} MB)")


def cmd_clean(name, everything):
    """Solo tras la aprobación del usuario. Nunca borra el video fuente."""
    fin = ROOT / "final.mp4"
    if not fin.exists() or fin.stat().st_size == 0:
        sys.exit("! final.mp4 no existe o está vacío — no borré nada")
    dest_dir = OUTPUTS if CLAUDE_AI and OUTPUTS.exists() else SRC.parent
    dest = dest_dir / f"{name or SRC.stem + '-reel'}.mp4"
    shutil.copy2(fin, dest)
    if dest.stat().st_size != fin.stat().st_size:
        sys.exit(f"! copia a {dest} incompleta — no borré nada")
    if everything:
        shutil.rmtree(ROOT)
        print(f"→ {dest}; carpeta del proyecto borrada")
        return
    for p in [ROOT / "clips", ANIM / "out", ANIM / "stills", ROOT / "audio" / "raw.wav", ROOT / "audio" / "asr.mp3"]:
        shutil.rmtree(p, ignore_errors=True) if p.is_dir() else p.unlink(missing_ok=True)
    print(f"→ {dest} ({dest.stat().st_size / 1e6:.0f} MB); intermedios borrados")


if __name__ == "__main__":
    a = sys.argv[1:] or ["-h"]
    c, rest = a[0], a[1:]
    reuse = "--reuse" in rest
    if c == "doctor": cmd_doctor()
    elif c == "audio": cmd_audio()
    elif c == "transcribe": cmd_transcribe(rest)
    elif c == "words": cmd_words()
    elif c == "captions": cmd_captions()
    elif c == "base": cmd_base(reuse)
    elif c == "stills": cmd_stills(rest[0], rest[1:])
    elif c == "anim": cmd_anim(rest)
    elif c == "capt": cmd_capt()
    elif c == "final": cmd_final()
    elif c == "lite": cmd_lite()
    elif c == "lite-stills": cmd_lite_stills(rest)
    elif c == "qa": cmd_qa()
    elif c == "clean": cmd_clean(next((x for x in rest if not x.startswith("--")), ""), "--all" in rest)
    elif c == "all":
        cmd_captions(); cmd_base(reuse)
        if ENGINE == "lite":
            cmd_lite()
        else:
            cmd_anim([]); cmd_capt(); cmd_final()
        cmd_qa()
    else:
        print(__doc__)
