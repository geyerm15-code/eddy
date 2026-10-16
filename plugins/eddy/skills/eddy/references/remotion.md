# Motor remotion — escenas a medida (Claude Code)

`"engine": "remotion"`. Remotion 4.0.534; deps compartidas en `~/.cache/eddy/node_modules` (se instalan
una vez con `new_project.sh` y se enlazan por symlink; nunca `npm install` por proyecto). La primera vez
Remotion descarga su Chrome headless; si se cuelga, exporta `REMOTION_BROWSER=/ruta/a/chrome-headless-shell`.

Escenas: un archivo por overlay en `animations/src/scenes/Scene<ID>.tsx`, registrado en `scenes/index.ts`
(`frames = round(dur * 30)`, `id` = el de `studio.json`). Diseño en 1080×1920 a 30 fps; se renderiza con
`--scale` (2 = 4K nítido, vectorial). `brand.json` se copia a `animations/src/` y las fuentes a `public/`
automáticamente en cada render.

Ejemplos para copiar y adaptar (textos, tarjetas, frames): `SKILL_DIR/examples/` (estilo editorial) y
`SKILL_DIR/examples/tech/`. Son recetas de un video de muestra sobre un asistente de IA por chat: cambia el
contenido, conserva la coreografía.

## Tipos de overlay (todos con alfa, ProRes 4444)

| kind | Uso | Zona |
|---|---|---|
| `float` | Hook (primeros 4–5 s) y CTA final, sobre el talking head | contenido solo en y 60–520; resto transparente |
| `insert` | Explicaciones / pasos a pantalla completa | `<Panels>`: papel arriba y 0–1100, oscuro abajo 1100–1920. **y 1150–1500 vacío** (subtítulos). HUD "PASO 0X" en y≈1650 |

Timing: un insert dura lo que la idea hablada (5–9 s) y empieza ~0.1 s antes de su palabra. Los paneles entran
en 14 frames y salen en los últimos 13. El hook puede extenderse hasta el primer insert (el insert lo tapa).

## Estilo editorial (`lib.tsx`)

Colores de `brand.colors`: `PAPER` `INK` `DARK` `CARD` `BORDER`, **`ACCENT`/`VERM` = único acento**, `GREEN` (= ok,
solo para checks), `MUTED`. Fuentes: `SERIF` (= display) para titulares roman, `ITAL` (= accent) para la palabra
clave en itálica 1.38× más grande con sangría → `<Headline a="Elige tu" b="modelo" at={..} out={..} />`;
`WIDE` para números, labels y sellos; `MONO` para UI. Cargar con `<Fonts/>` (el render falla si no cargan).

| Primitiva | Para qué |
|---|---|
| `tw(f,a,b,from,to,E.expo)` | tween con easing. `E.expo` reveals, `E.expoInOut` cámara, `E.expoIn` salidas/impactos, `E.back` pops |
| `pop(f, at, damping, stiffness)` | spring para entradas con rebote |
| `<Letters text at out stagger rot>` | tipografía cinética letra a letra desde una máscara |
| `<Burst>` `<Shockwave>` `<Rays>` + `shake()` | triada de impacto en el beat (1 por escena + el sello final) |
| `<Scribble>` | subrayado a mano que se dibuja |
| `<Stage persp>` | escenario 3D (perspective + preserve-3d) |
| `<Panels dur step label>` | barrido en capas acento → papel/oscuro, HUD con progreso |
| `<Chip>` `<Check>` `<WindowDots>` `cardStyle` `<Spark>` `<Grain>` `<DotGrid>` | UI y textura |

Recetas (en `examples/`): **SceneA** hook (línea de luz → píldora que crece con spark girando + onda → palabra
clave gigante con subrayado → chip con flip 3D → barra de acento con temblor → salida whip). **SceneB** paso
con dato (dígitos tragamonedas → flip 3D de tarjeta → QR que se ensambla → escaneo → conexión a teléfono).
**SceneC** elegir opción (carrusel cilíndrico 3D que gira a cada opción nombrada → cámara atraviesa → input
tipeado → sello "¡Listo!" con confeti). **SceneD** lista de beneficios (chat en vivo + mini-UIs + contador).
**SceneE** CTA (palabra con extrusión 3D que cae → campo de comentario que la tipea → avión de papel).

## Estilo tech (`tech.tsx`)

Colores de `brand.tech`. **Sin 3D, sin partículas, sin barridos**: línea fina + glow suave + cosas que se arman.
Estructura: ~40 % cara (hook, un puente y el cierre), ~60 % inserts largos (7–20 s) con varios "capítulos",
cortes duros entre cara e insert. Medidas en `LAY` (margen x 64, etiqueta top 393, titular top 444 Inter Tight 700
136 px máx. 2 líneas, zona de ilustración y 640–1360 — **llénala**, subtítulos baseline 1502).

- `<TypeHead>` se tipea con caret (2 f/carácter); pasa `beats` = frame de cada palabra para tipear al ritmo de la voz.
- Capítulo nuevo: `out` de titular/etiqueta anteriores, y los nuevos se tipean ~8 f después. `<Kicker>` lo nombra.
- **Anticipo**: `Icon`, `Box`, `Tag`, `DocLines` aparecen atenuados (`at`) 10–30 f antes y se encienden (`on`) en la palabra.
- `<Arrow>` causa → efecto; `<Counter>`; `bad` (salmón) = "sin / lo malo", `accent` = "con / lo bueno".
- `<StepChip>` numerados a los lados de la cabeza; `<Terminal>`; `<CommentField>` para el CTA; `<AppTile>` genérico.
- Escena = `<VScene kind="insert">` (fondo opaco) o `<VScene kind="float">` (sombra superior sobre el video).

## Gotchas

- CSS 3D: `filter` u `opacity<1` en un contenedor `preserve-3d` lo **aplana**. Aplica blur/opacidad a cada hijo.
- Partículas/rayos en overlays `float` pueden invadir la cara: limita radios o usa `hold={false}`.
- Cambio de titular: `out` del anterior ≈ `at` del siguiente − 18 frames.
- Estilo tech: fuentes variables vía FontFace API (`VFonts`); no uses `document.fonts.check` con ellas.
- Tiempos (40 s de Reel, 4K): `all` ≈ 20 min. Para iterar usa `stills` y `--reuse`.
