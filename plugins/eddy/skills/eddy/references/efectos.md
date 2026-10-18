# Efectos sobre la persona (motor remotion)

Siete efectos listos en `template/animations/src/effects.tsx` (+ dos que se hacen solo con `studio.json`).
Úsalos cuando el usuario los pida por nombre o describa algo parecido ("que el texto quede detrás de mí", "un
celular al lado de mi cara", "una lista que se va tildando", "zoom en las palabras clave", "letras de vidrio",
"portada de revista", "gráfico que sube"). Combínalos con el estilo de la marca: el acento sale de
`brand.colors.accent`. Solo motor `remotion` (en claude.ai / `lite` no están: dilo y ofrece la alternativa
declarativa más cercana).

## Infraestructura

| Pieza | Qué hace |
|---|---|
| `python3 studio.py matte` | Recorta a la persona de `base.mov` con IA local (`npx hyperframes remove-background`). Crea `matte/fg.webm` (máscara) y `animations/public/base.mp4` (video 1080p 30 fps para el vidrio). Corre una vez tras `base`; ~1–3 min por cada 10 s. Repite si cambian los cortes. |
| `"kind": "behind"` | Overlay que va **detrás de la persona**: en `final` (y en `stills`) se compone base → escena → persona recortada → resto → subtítulos. Exige `matte`. |
| `"opaque": true` | Overlay a pantalla completa sin transparencia: se renderiza en H.264 (≈50× menos disco que ProRes). |
| `ranges` con zoom `[desde, hasta]` | Zoom animado a lo largo del tramo (ease in-out). `[1.05, 1.0]` = acercamiento lento de portada; `[1.0, 1.25]` = push-in. |
| `"captions_mode": "karaoke"` | Subtítulos: lo ya dicho en una línea chica y la palabra actual grande debajo, blanca con sombra suave. |
| `<FxFonts/>` | Carga todas las fuentes de la marca; ponlo una vez por escena de efectos. |
| `<BaseVideo start>` / `<Frosted>` | El video real dentro de la escena (sincronizado con `start` = el `start` del overlay) / tarjeta de vidrio esmerilado. |

Escena de efectos típica:

```tsx
import {AbsoluteFill} from 'remotion';
import {FxFonts, GlassChecklist} from '../effects';
export const SceneB: React.FC = () => (
  <AbsoluteFill><FxFonts />
    <GlassChecklist start={4.2} at={0} label="Todo lo que tienes que hacer"
      items={[{text: 'Graba el video', on: 12}, {text: 'Súbelo a Eddy', on: 40}, {text: 'Publica', on: 66}]} />
  </AbsoluteFill>
);
```

Los frames (`at`, `on`) salen de `studio.py words`, como siempre: cada beat en la palabra que lo nombra.

## Recetas

### 1. Digital zoom: punch-ins secos en las palabras clave
Sin escena: se hace con los cortes. Elige 3–5 palabras que cargan la idea. Parte el `range` en el inicio exacto de
cada una: tramo con zoom `1.3` desde esa palabra; si la frase sigue, otro tramo `1.6` en la siguiente palabra fuerte;
al terminar la frase vuelve a `1.0`. Cortes secos, sin transición ni marcos. Combínalo con
`"captions_mode": "karaoke"`. Ajusta `face_y` para que el zoom quede centrado en la cara.

### 2. iPhone con app que se completa: `<PhoneMock>` (float)
`side` = lado libre de la cara (mira un frame). Ancho 290 px, inclinado ±10°, isla dinámica, app oscura con título
("Hoy") y 4 tareas que se tildan cada `checkEvery` frames (3 = 0.1 s) desde `checkFrom`. Entra deslizándose desde
el borde en 12 f con ease-out en la palabra que lo introduce y se queda quieto. `y` para que nunca tape la cara.

### 3. Checklist de vidrio: `<GlassChecklist>` (float)
Tarjeta al 85 % del ancho en el tercio superior, fondo = el video desenfocado (22 px) con tinte negro 60 %, borde
blanco 14 %, rótulo mono en mayúsculas con punto de acento encima. Ítems no dichos = barras grises; en `on` aparece
el círculo de acento con check que rebota y el texto en blanco. Entra subiendo 30 px en 9 f. 2–4 ítems.

### 4. Pared de titulares: `<NoteWall>` (**behind**)
Notas de papel crema `#F6F3EC` con titular en la serif de la marca, pin rojo e inclinación distinta (−6° a 6°),
repartidas en la pared alrededor de la cabeza; entran de a una cada `stagger` frames (2 ≈ 0.07 s) con rebote.
Hasta 5 notas, titulares de 2–5 palabras. Posiciones por defecto alrededor de una cabeza centrada; pasa `x`, `y`
si la cara está a un lado. Color natural del video, sin fondos.

### 5. Gráfico que crece: `<ChartGrow>` (float)
Oscurece el video al 60 %, días de la semana en mono arriba con guías finas, la línea se dibuja en 0.6 s casi plana
y luego sube fuerte, con glow del acento y punto blanco en la punta; al llegar aparece la pastilla (`label`,
"ESCALA ↗") con rebote. Para frases de crecimiento, resultados, escalar.

### 6. Portada de revista: `<CoverWord>` (**behind**) + `<CoverMeta>` (float)
Palabra gigante en la serif de la marca detrás de la cabeza (la cabeza tapa la parte baja, como en las revistas);
letras de a una cada 1.5 f subiendo. `baseline` ≈ `face_y − 60`. Encima de la persona, en otra escena float
con el mismo tiempo: `<CoverMeta issue="Oct 2026 · Nº 12" line1="…" line2="…">` (mono arriba a la izquierda,
serif itálica abajo, bajo la banda de subtítulos). En ese tramo usa zoom `[1.05, 1.0]`. Palabras de 4–7 letras.

### 7. Letras de vidrio: `<GlassType>` (**behind**)
Palabra en la sans ancha muy gruesa ocupando el ancho, detrás de la cabeza. Dentro de cada letra se ve el fondo
corrido 14 px, desenfocado y aclarado 20 %, con filo de luz arriba y sombra suave debajo; letras de a una subiendo
y un brillo diagonal que las cruza en 0.5 s. Pasa `start` (sincroniza el vidrio). Palabras de 3–6 letras;
`baseline` ≈ `face_y − 60`.

## Revisión

- `stills` de una escena `behind` ya muestra a la persona encima: revisa que la cabeza tape la parte correcta,
  que nada importante quede detrás del cuerpo y el borde del recorte (pelo, manos que se mueven rápido).
- Fondos muy parecidos a la ropa o al pelo dan recortes sucios: avisa al usuario y prefiere efectos float.
- Disco: `matte` agrega ~1 MB por segundo; las escenas `behind` son ProRes con alfa como las float.
