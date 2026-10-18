# Eddy — agente de video para Claude

Convierte un video tuyo hablando a cámara en un **Reel / TikTok / Short 9:16** listo para publicar:
voz limpia, cortes automáticos de silencios y muletillas, motion graphics sincronizados a la voz,
subtítulos animados y tu marca (colores, estilo y CTA).

## Descargar

| Dónde lo usas | Descarga |
|---|---|
| **claude.ai** (navegador / app, 1080p) | [⬇️ eddy.zip](https://github.com/geyerm15-code/eddy/releases/latest/download/eddy.zip) |
| **Claude Code** (hasta 4K, escenas 3D) | No necesitas descargar nada, ver abajo |

## Opción A · Claude Code

```
/plugin marketplace add geyerm15-code/eddy
/plugin install eddy@eddy
```

Reinicia Claude Code y escribe: `Eddy, revisa e instala lo que necesitas` (instala ffmpeg, Python y Whisper).
Luego arrastra tu video: `Eddy, hazme un reel con animaciones de este video`.

## Opción B · claude.ai

1. Ajustes → Capacidades → activa **Ejecución de código y creación de archivos**.
2. En **Skills** → **Subir skill** → elige `eddy.zip` (descargado arriba).
3. Chat nuevo, adjunta tu video: `Eddy, edita este video como reel con subtítulos y animaciones`.

Requiere plan Pro, Max, Team o Enterprise. Recomendado: videos de 15 a 90 s.

## Efectos sobre la persona (Claude Code)

Zoom digital en palabras clave, iPhone flotante, checklist de vidrio, notas y titulares **detrás de ti**,
gráfico que crece, portada de revista y letras de vidrio. Pídelos por nombre:
`Eddy, hazme el reel con letras de vidrio detrás de mí que digan WEB`. Recortar a la persona usa
[HyperFrames](https://www.npmjs.com/package/hyperframes) con IA local (`npx`, sin instalar nada a mano).

## Analizar un video → prompt de Omni Flash

Sube un video de referencia (motion graphics, demo, explainer) y pide:
`Eddy, analiza este video y hazme el prompt de Omni Flash`. Eddy lo desglosa cuadro por cuadro
(cámara, tipografía, colores, iconos, transiciones, audio) y te entrega un prompt listo para pegar,
con tu marca, colores o textos si se los indicas.

## Más información

Guía completa (transcripción, personalizar marca, actualizar, solución de problemas): [INSTALACION.txt](INSTALACION.txt).

Para regenerar el zip después de modificar la skill: `./build_zip.sh`.

## Licencia

Código bajo [MIT](LICENSE). Fuentes incluidas bajo SIL Open Font License.
