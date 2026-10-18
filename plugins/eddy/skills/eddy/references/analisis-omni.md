# Modo análisis → prompt de Omni Flash

Úsalo cuando el usuario suba un video de **referencia** (motion graphics, animación, demo de producto, explainer
SaaS, un Reel que le gustó) y pida "analiza este video", "desglósalo escena por escena", "hazme el prompt para
Omni Flash / Veo / generar un video así", "quiero recrear este estilo". No es el flujo de edición: aquí no se
crea proyecto ni se renderiza nada; el entregable es el análisis + el prompt.

## 0. Antes de empezar

- La **Fase 3** (cambios personalizados) define el prompt final. Si el usuario no la llenó, pregúntala en **un solo
  mensaje** con los seis campos de abajo y la opción "déjalo igual para recrearlo fiel". Si dijo "automático" o
  "tú decide", sigue con todo en "sin cambios".
- Responde el análisis (Fase 1) en el idioma del usuario. El prompt de la Fase 2 va **en inglés** (los modelos de
  video lo siguen mejor), salvo que el usuario pida otro idioma. Los textos que aparecen en pantalla se dejan en
  su idioma original entre comillas.

## 1. Extracción (cubre TODO el video, no solo el inicio)

Trabaja en una carpeta temporal nueva (`/tmp/analisis-<nombre>` o el scratchpad), nunca dentro de uploads.

```bash
V="ruta/al/video.mp4"; D=/tmp/analisis; mkdir -p $D/f
# specs: duración, resolución, fps, códecs, audio
ffprobe -v error -show_entries format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,channels -of compact "$V"
# cortes de escena con su tiempo (pts_time); si no sale nada es un plano continuo (scroll, cámara): baja a 0.12
ffmpeg -hide_banner -i "$V" -vf "select='gt(scene,0.25)',showinfo" -an -f null - 2>&1 | grep -o 'pts_time:[0-9.]*'
# frames cada 0.5 s (videos > 40 s: cada 1 s) → hojas de 4×3, el índice i = segundo i*0.5
ffmpeg -v error -i "$V" -vf "fps=2,scale=480:-2" $D/f/%04d.jpg
ffmpeg -v error -i "$V" -vf "fps=2,scale=360:-2,tile=4x3" $D/sheet_%02d.jpg
# energía del audio (picos = SFX/golpes de música) y silencios
ffmpeg -hide_banner -i "$V" -af "aresample=48000,asetnsamples=n=12000,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level" -f null - 2>&1 | grep -E "pts_time|RMS_level" | paste - - | sed -E "s/.*pts_time:([0-9.]+).*RMS_level=(.*)/\1s \2dB/"
ffmpeg -hide_banner -i "$V" -af silencedetect=n=-40dB:d=0.3 -f null - 2>&1 | grep silence_
```

- Mira **todas** las hojas `sheet_*.jpg` con la herramienta de lectura de imágenes. Hoja n, celda k (0–11) =
  segundo `(n-1)*6 + k*0.5`. Para cada corte de escena y cada transición, abre los frames sueltos de alrededor
  (`f/NNNN.jpg`, NNNN = t*2+1) para ver la transición cuadro a cuadro. Si un detalle es pequeño (tipografía, iconos,
  UI), extrae ese frame a resolución completa: `ffmpeg -ss T -i "$V" -frames:v 1 $D/full_T.png`.
- Colores: muestrea los hex reales en vez de adivinarlos:
  `ffmpeg -v error -ss T -i "$V" -frames:v 1 -vf "crop=W:H:X:Y,scale=1:1" -f rawvideo -pix_fmt rgb24 - | xxd -p`
  (fondo, acento, texto de cada escena).
- Si hay voz en off, transcríbela con el motor disponible (`studio.py transcribe` dentro de un proyecto, o
  faster-whisper directo) para citar el guion con tiempos. Música: deduce ánimo y tempo por los picos de RMS
  (intervalo entre picos regulares → BPM ≈ 60 / intervalo).
- Si algo no se puede determinar (fps variable, audio ausente), dilo; no lo inventes.

## 2. El prompt (síguelo literal)

Este es el encargo que cumples, tal como lo definió el usuario. No te saltes pasos ni resumas a la ligera.

```text
You are a motion graphics director and prompt engineer. I've uploaded a video
(motion graphics / animation / product demo / SaaS explainer). Do this in two
phases. Do not skip steps or summarize loosely — treat this as a professional
shot-by-shot breakdown that another creator could rebuild the video from
without ever seeing the original.

PHASE 1 — FULL FRAME-BY-FRAME ANALYSIS

Extract and inspect frames across the entire duration (don't just sample the
first few seconds). For each distinct scene/beat, report:

1. Timestamp range (e.g. 0.0–2.5s)
2. Composition & camera — framing, aspect ratio, camera movement (push,
   pan, orbit, static), depth of field, focal point
3. Subject/content — every object, icon, illustration, photo, or 3D
   element on screen; its exact shape, style (flat/3D/line/glass/etc.),
   position, and size relative to frame
4. Text & typography — exact wording, font style/weight (serif, sans,
   rounded, condensed), size hierarchy, color, letter-spacing, any kinetic
   animation (fade, slide, mask-reveal, letter-by-letter, blur-in)
5. Color palette — background color(s), foreground/accent colors, note
   any hex-approximate values, gradients, or monochrome treatment
6. Lighting, shadow & texture — light direction, shadow softness/hardness,
   surface textures (paper, metal, glass, matte, glossy), grain/noise,
   vignetting
7. Icons/graphics/UI elements — describe each precisely: shape,
   line-weight, fill vs. outline, any brand marks, buttons, cursors, progress
   indicators, chart/data visuals
8. Motion & transitions — how this beat animates in and how it transitions
   to the next (cut, morph, wipe, dissolve, liquid transition, particle
   dissolve, match-cut)
9. Audio (if audible/inferable) — music mood/tempo, sound effects (whoosh,
   click, chime), voiceover presence and tone

Also summarize once at the top:
- Total duration, resolution/aspect ratio, frame rate (if determinable)
- Overall visual style in one line (e.g. "cinematic B&W kinetic typography
  with metaphor visuals" or "flat glossy SaaS dashboard UI motion")
- Pacing (cuts per second, energy level)
- Any recurring visual motif or through-line connecting the beats

PHASE 2 — CONVERT THE ANALYSIS INTO AN OMNI FLASH GENERATION PROMPT

Using everything found in Phase 1, write a single, ready-to-paste Google
Omni Flash video generation prompt that would recreate this video's look,
pacing, and structure as closely as possible (not a copy of copyrighted
specifics — recreate the style and technique, not any protected content).
The prompt must include:
- Style line — one dense sentence covering mood, lighting, color grading,
  camera behavior, and finish quality (premium/cinematic/glossy/etc.)
- Technical specs — resolution, aspect ratio, fps, duration (match Omni
  Flash's native output — currently 10 seconds; if the source is longer,
  compress the same number of beats proportionally into 10 seconds)
- Beat-by-beat timeline — same structure as Phase 1, rewritten as
  generation instructions (what appears, how it moves, how it transitions),
  with exact color values, exact typography description, and exact icon/shape
  geometry so nothing is left ambiguous
- Typography spec — one line locking the font style so it stays consistent
  across every text beat
- Sound design line — score mood + key SFX moments, timed to the visual
  beats
- Final frame spec — describe exactly what the last held frame should look
  like (this is what viewers remember most)
Format the final prompt as a single copy-paste block, written as direct
generation instructions (not questions, not commentary).

PHASE 3 — CUSTOM CHANGE REQUEST (fill this in before sending, or leave as-is
to recreate faithfully)

Apply these swaps/changes to the Phase 2 prompt before finalizing it:
- Brand name / logo: [e.g. "flevo" — attach brand kit image if available]
- Color palette override: [e.g. keep original palette / use these hex
  codes instead: ___]
- Text/copy override: [replace the on-screen lines with: ___]
- Duration override: [default 10s / specify other]
- Tone/style shift: [e.g. "make it full color instead of B&W" / "make it
  more playful, less corporate" / no change]
- Anything to remove or add: [e.g. "remove the falling-man metaphor, add a
  data-chart metaphor instead"]
```

## 3. Cómo aplicarlo

- **Fase 3 por defecto**: si el usuario no da marca/colores pero existe su `brand.json` (`~/.eddy/brand.json` o el
  subido), ofrece aplicarla (nombre, acento, estilo); si no, recrea fiel. Los campos sin respuesta = "no change".
- Los cambios de la Fase 3 se aplican **dentro** del prompt de la Fase 2 (no como notas aparte): el bloque final ya
  debe traer la marca, colores, textos y duración nuevos.
- Compresión a 10 s: conserva el **número de beats** y su orden; reparte el tiempo en proporción a la duración
  original de cada beat (mínimo ~0.6 s por beat; si no cabe, fusiona beats contiguos del mismo tipo y dilo).
- Nada protegido: sin logos ni personajes de terceros, sin nombres de marcas ajenas en pantalla; describe la
  técnica ("generic orange asterisk app icon"), no la marca.

## 4. Entrega

1. **Resumen** (duración, resolución/aspecto, fps, estilo en una línea, ritmo, motivo recurrente).
2. **Fase 1**: una sección por beat con los 9 puntos (tabla o lista numerada, sin saltarse ninguno; "N/A" si no
   aplica).
3. **Cambios aplicados (Fase 3)**: lista corta de lo que se cambió respecto al original.
4. **Fase 2**: el prompt final en **un único bloque de código** listo para copiar.

Guarda también todo en un `.md` (`analisis-<nombre>.md` junto al video en Claude Code, o en
`/mnt/user-data/outputs/` en claude.ai) y borra la carpeta temporal de frames al terminar.

Si el usuario después quiere **producir** ese estilo con su propio video, lo hace el flujo normal de Eddy: usa
el análisis para elegir estilo (`editorial`/`tech`), paleta y recetas de escena.
