# Motor lite — overlays declarativos

Se activa con `"engine": "lite"` en `studio.json` (por defecto en claude.ai). No necesita Node ni navegador:
`lite.py` dibuja cada frame con Pillow y lo manda por tubería a ffmpeg sobre `base.mov`. ~50 s de render por
cada 15 s de video en 1080p. El estilo (`editorial` | `tech`) y los colores/fuentes salen de `brand.json`.

## Esquema de overlays (`studio.json` → `overlays`)

Campos comunes: `id`, `start` (s en la línea de tiempo FINAL), `dur` (s), `kind`.
Los tiempos internos (`at`) aceptan **segundos desde el inicio del overlay** o **una palabra** del transcript
(la primera coincidencia dentro de la ventana del overlay, sin importar mayúsculas ni puntuación). Preferir
palabras: así el beat cae exacto en la voz.

| kind | Zona | Campos |
|---|---|---|
| `hook` | flota sobre la cabeza (y 120–620), sombra superior | `kicker` (etiqueta corta), `title` (línea 1), `accent` (palabra/frase clave en color de acento) |
| `card` | pantalla completa (barrido de entrada/salida) | `step` ("PASO 01"), `title`, `accent`, `items: [{text, at}]` (hasta 4; cada item entra en su palabra) |
| `stat` | pantalla completa | `title`, `accent`, `value` (número final), `prefix`, `suffix`, `decimals`, `label`, `at` (cuándo empieza a contar) |
| `cta` | flota sobre la cabeza | `line` ("Comenta"), `word` (palabra a comentar; cae con impacto y late) |

Ejemplo probado (16.6 s):

```json
"overlays": [
  {"id": "A", "start": 0.0, "dur": 2.7, "kind": "hook", "kicker": "3 errores", "title": "Tu web", "accent": "no vende"},
  {"id": "B", "start": 2.9, "dur": 7.6, "kind": "card", "step": "Por qué", "title": "Lo que", "accent": "te frena",
   "items": [{"text": "Carga en +5 segundos", "at": "Primero"},
             {"text": "Sin botón claro", "at": "segundo"},
             {"text": "Nadie sabe qué ofreces", "at": "Tercero"}]},
  {"id": "C", "start": 10.7, "dur": 3.4, "kind": "stat", "title": "Arréglalo y", "accent": "vende más",
   "value": 40, "prefix": "+", "suffix": "%", "label": "en ventas", "at": "40%"},
  {"id": "D", "start": 14.2, "dur": 2.4, "kind": "cta", "line": "Comenta", "word": "WEB"}
]
```

## Reglas

- Textos cortos: `title` ≤ 14 caracteres por línea, `accent` ≤ 16, items ≤ 26. Si no cabe, reescribe más corto
  (no reduzcas la fuente). Revisa siempre con `lite-stills`.
- Overlays consecutivos pueden tocarse; no los solapes (el último dibujado tapa).
- `card`/`stat` tapan la cara: duración mínima 2.5 s, máxima ~9 s.
- Si el usuario quiere algo que el motor lite no tiene (3D, partículas, mockups de UI animados), y está en
  Claude Code con Node, cambia a `"engine": "remotion"`; en claude.ai explica el límite y ofrece la versión lite.
- Para añadir un tipo nuevo: función `ov_<kind>(canvas, ov, f, n)` en `lite.py` y regístrala en `KINDS`.
  Formas semitransparentes SIEMPRE con `paint()` (ImageDraw sobre RGBA reemplaza píxeles y abre agujeros).
