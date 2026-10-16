// Estilo "tech" — terminal minimal. Paleta en brand.json → "tech".
// Fondo oscuro con luz central + rejilla de puntos, titular Inter Tight que se TIPEA con caret,
// palabra clave en lima con glow, etiqueta mono espaciada encima, iconos de línea que aparecen
// atenuados y se "encienden" cuando se nombran. Sin 3D, sin partículas, sin barridos.
// Todas las medidas están en el frame de diseño 1080x1920 y salen de medir la referencia.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Easing, cancelRender, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';

// ---------- palette (muestreada de la referencia) ----------
import brand from './brand.json';
const T = brand.tech;
export const V = {
  bg0: T.bg0, // esquinas
  bg1: T.bg1,
  bg2: T.bg2,
  bg3: T.bg3, // centro de la luz
  white: T.text, // titular
  lime: T.accent, // palabra clave, caret, estado activo
  line: T.line, // iconos / cajas encendidas
  dim: T.dim, // iconos / cajas atenuadas (anticipo)
  kicker: T.kicker, // etiqueta mono
  salmon: T.bad, // lo malo / "sin"
  capt: T.caption, // subtítulos
};
const hexA = (h: string, a: number) => {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// ---------- layout (px en 1080x1920) ----------
export const LAY = {
  mx: 64, // margen izquierdo de etiqueta y titular
  kickerTop: 393, // top de la línea de la etiqueta (cap 395–411)
  headTop: 444, // top del bloque de titular → baseline 1ª línea ≈ 563
  headSize: 136, // Inter Tight 700, cap ≈ 99 px
  headLH: 139, // interlineado (baseline 563 → 702)
  zoneTop: 640, // zona de ilustración
  zoneBottom: 1360,
  captBaseline: 1502, // subtítulos centrados, Inter 650 63 px
  grid: 40, // paso de la rejilla de puntos
};

export const HEAD = '"Inter Tight"';
export const BODY = '"Inter"';
export const MONO_V = '"JB Mono"';

export const EV = {
  out: Easing.out(Easing.cubic),
  in: Easing.in(Easing.cubic),
  expo: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
};
export const tv = (f: number, a: number, b: number, from: number, to: number, e = EV.out) =>
  interpolate(f, [a, b], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

const GLOW_LIME = `0 0 26px ${hexA(T.accent, 0.42)}, 0 0 6px ${hexA(T.accent, 0.3)}`;
const GLOW_WHITE = '0 0 22px rgba(238,244,234,.16)';
const lineGlow = (c: string, k = 1) => `drop-shadow(0 0 ${6 * k}px ${c}88) drop-shadow(0 0 ${16 * k}px ${c}44)`;

// ---------- fonts ----------
// FontFace API directo (document.fonts.check con fuentes variables es poco fiable → falsos fallos)
let fontsP: Promise<void> | null = null;
const loadFonts = () =>
  (fontsP ??= Promise.all(
    [
      ['Inter Tight', brand.fonts.head, '100 900'],
      ['Inter', brand.fonts.body, '100 900'],
      ['JB Mono', brand.fonts.mono, '100 800'],
    ].map(async ([fam, file, weight]) => {
      const ff = new FontFace(fam, `url(${staticFile(file)})`, {weight});
      await ff.load();
      document.fonts.add(ff);
    }),
  ).then(() => undefined));
export const VFonts: React.FC = () => {
  const [handle] = useState(() => delayRender('tech-fonts'));
  useEffect(() => {
    loadFonts().then(() => continueRender(handle)).catch((e) => cancelRender(e));
  }, [handle]);
  return null;
};

// ---------- fondos ----------
// Fondo opaco de los inserts: luz central + rejilla de puntos que deriva muy lento.
export const Bg: React.FC<{cx?: number; cy?: number}> = ({cx = 540, cy = 880}) => {
  const f = useCurrentFrame();
  const dx = (f * 0.12) % LAY.grid;
  return (
    <AbsoluteFill style={{background: V.bg0}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 760px 980px at ${cx}px ${cy}px, ${V.bg3} 0%, ${V.bg2} 38%, ${V.bg1} 68%, ${V.bg0} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(200,225,200,.16) 1.6px, transparent 2.2px)',
          backgroundSize: `${LAY.grid}px ${LAY.grid}px`,
          backgroundPosition: `${dx}px ${20}px`,
          WebkitMaskImage: `radial-gradient(ellipse 560px 760px at ${cx}px ${cy}px, #000 0%, rgba(0,0,0,.55) 55%, transparent 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Para overlays `float` sobre el talking head: oscurece la parte alta para que lea el titular.
export const TopShade: React.FC<{at?: number; out?: number; h?: number; k?: number}> = ({at = 0, out, h = 820, k = 0.62}) => {
  const f = useCurrentFrame();
  const o = tv(f, at, at + 8, 0, 1) * (out === undefined ? 1 : tv(f, out, out + 8, 1, 0));
  return (
    <div
      style={{
        position: 'absolute', left: 0, top: 0, width: 1080, height: h, opacity: o,
        background: `linear-gradient(180deg, rgba(2,10,4,${k}) 0%, rgba(2,10,4,${k * 0.75}) 45%, rgba(2,10,4,0) 100%)`,
      }}
    />
  );
};

// fade de salida común (8 frames, sube 10 px)
const exitStyle = (f: number, out?: number): React.CSSProperties => {
  if (out === undefined) return {};
  const q = tv(f, out, out + 8, 0, 1, EV.in);
  return {opacity: 1 - q, transform: `translateY(${-10 * q}px)`};
};

// ---------- etiqueta mono "● CLAUDE O CODEX · SKILL" ----------
export const Kicker: React.FC<{text: string; at: number; out?: number; x?: number; y?: number; color?: string; dot?: string; size?: number}> = ({
  text, at, out, x = LAY.mx, y = LAY.kickerTop, color = V.kicker, dot = V.lime, size = 25,
}) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor(f - at - 3)));
  const d = tv(f, at, at + 6, 0, 1);
  return (
    <div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 18, ...exitStyle(f, out)}}>
      <div style={{width: 10, height: 10, borderRadius: 5, background: dot, opacity: d, boxShadow: `0 0 10px ${dot}`, transform: `scale(${d})`}} />
      <div style={{fontFamily: MONO_V, fontWeight: 500, fontSize: size, letterSpacing: '0.28em', color, whiteSpace: 'pre', textTransform: 'uppercase'}}>
        {text.slice(0, n)}
      </div>
    </div>
  );
};

// ---------- titular tipeado con caret ----------
// text: "La *prueba*"  ·  "\n" = salto de línea  ·  *palabra* = clave en lima con glow.
// beats (opcional): frame en que empieza a tipearse cada palabra (sale de `reel.py words`);
// sin beats se tipea seguido a `cpf` frames por carácter desde `at`.
type Tok = {ch: string; key: boolean; t: number; br?: boolean};
export const TypeHead: React.FC<{
  text: string; at: number; beats?: number[]; cpf?: number; out?: number; caret?: boolean; caretOff?: number;
  x?: number; y?: number; size?: number; lh?: number; width?: number; color?: string; keyColor?: string;
}> = ({text, at, beats, cpf = 2, out, caret = true, caretOff, x = LAY.mx, y = LAY.headTop, size = LAY.headSize, lh = LAY.headLH, width = 960, color = V.white, keyColor = V.lime}) => {
  const f = useCurrentFrame();
  const toks: Tok[] = [];
  let key = false, wi = -1, inWord = false, t = at, wordChar = 0;
  for (const ch of text) {
    if (ch === '*') { key = !key; continue; }
    if (ch === '\n') { toks.push({ch: '', key, t, br: true}); inWord = false; continue; }
    if (ch === ' ') { toks.push({ch, key: false, t}); inWord = false; continue; }
    if (!inWord) {
      inWord = true; wi++; wordChar = 0;
      if (beats && beats[wi] !== undefined) t = beats[wi];
    }
    toks.push({ch, key, t: t + wordChar * cpf});
    wordChar++;
    if (!beats) t += 0; // continuous mode handled below
  }
  if (!beats) {
    let k = 0;
    for (const tk of toks) { tk.t = at + k * cpf; if (!tk.br) k++; }
  }
  // spaces / breaks inherit time of the next visible char
  for (let i = toks.length - 2; i >= 0; i--) if (toks[i].ch === ' ' || toks[i].br) toks[i].t = toks[i + 1].t;
  const last = toks.length ? toks[toks.length - 1].t : at;
  const shown = toks.filter((tk) => f >= tk.t);
  const typing = f <= last + cpf;
  const blinkOn = typing || Math.floor((f - last) / 15) % 2 === 0;
  const showCaret = caret && f >= at && (caretOff === undefined || f < caretOff);

  const lines: Tok[][] = [[]];
  for (const tk of shown) tk.br ? lines.push([]) : lines[lines.length - 1].push(tk);
  return (
    <div style={{position: 'absolute', left: x, top: y, width, ...exitStyle(f, out)}}>
      {lines.map((ln, li) => (
        <div key={li} style={{height: lh, display: 'flex', alignItems: 'center', whiteSpace: 'pre',
          fontFamily: HEAD, fontWeight: 700, fontSize: size, lineHeight: `${lh}px`, letterSpacing: '-0.035em'}}>
          {ln.map((tk, i) => (
            <span key={i} style={{color: tk.key ? keyColor : color, textShadow: tk.key ? GLOW_LIME : GLOW_WHITE}}>{tk.ch}</span>
          ))}
          {showCaret && li === lines.length - 1 && (
            <span style={{display: 'inline-block', width: 5, height: size * 0.86, marginLeft: size * 0.04, background: keyColor,
              opacity: blinkOn ? 1 : 0, boxShadow: `0 0 12px ${keyColor}`, transform: `translateY(${size * 0.02}px)`}} />
          )}
        </div>
      ))}
    </div>
  );
};

// ---------- estado atenuado → encendido ----------
// at: aparece atenuado (anticipo, ~10 f) · on: se enciende cuando se nombra · out: se va
export const litState = (f: number, at: number, on?: number, out?: number) => {
  const a = tv(f, at, at + 10, 0, 1);
  const l = on === undefined ? 0 : tv(f, on, on + 8, 0, 1);
  const o = out === undefined ? 1 : tv(f, out, out + 8, 1, 0, EV.in);
  return {a: a * o, l, o};
};
export const mix = (c1: string, c2: string, t: number) => {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [a, b] = [p(c1), p(c2)];
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

// ---------- iconos de línea (viewBox 100) ----------
export const ICONS: Record<string, string[]> = {
  star: ['M50 10 L61.8 36.6 L90.5 39.6 L69 58.9 L75 87.1 L50 72.6 L25 87.1 L31 58.9 L9.5 39.6 L38.2 36.6 Z'],
  heart: ['M50 86 C20 64 8 48 8 32 C8 18 19 9 31 9 C40 9 46 14 50 21 C54 14 60 9 69 9 C81 9 92 18 92 32 C92 48 80 64 50 86 Z'],
  calendar: ['M12 20 H88 V88 H12 Z', 'M12 36 H88', 'M30 10 V28', 'M70 10 V28'],
  mail: ['M8 22 H92 V80 H8 Z', 'M8 22 L50 54 L92 22'],
  user: ['M50 12 A16 16 0 1 1 49.9 12 Z', 'M18 90 C18 66 32 56 50 56 C68 56 82 66 82 90'],
  cart: ['M6 14 H20 L32 66 H80 L90 30 H25', 'M38 84 A6 6 0 1 1 37.9 84 Z', 'M74 84 A6 6 0 1 1 73.9 84 Z'],
  store: ['M10 40 L18 14 H82 L90 40 Z', 'M16 40 V88 H84 V40', 'M40 88 V62 H60 V88'],
  book: ['M50 22 C40 14 22 12 8 14 V84 C22 82 40 84 50 92 C60 84 78 82 92 84 V14 C78 12 60 14 50 22 Z', 'M50 22 V92'],
  doc: ['M18 8 H66 L84 26 V92 H18 Z', 'M66 8 V26 H84', 'M30 44 H72', 'M30 58 H72', 'M30 72 H58'],
  link: ['M42 58 L58 42', 'M36 46 L26 56 A14 14 0 0 0 46 76 L56 66', 'M64 54 L74 44 A14 14 0 0 0 54 24 L44 34'],
  clock: ['M50 10 A40 40 0 1 1 49.9 10 Z', 'M50 26 V50 L66 60'],
  check: ['M18 52 L40 74 L84 28'],
  chat: ['M10 16 H90 V66 H44 L24 84 V66 H10 Z'],
  toolbox: ['M8 38 H92 V86 H8 Z', 'M34 38 V24 H66 V38', 'M8 58 H92', 'M44 52 V64 H56 V52'],
  arrowDown: ['M50 8 V80', 'M28 58 L50 80 L72 58'],
  send: ['M30 50 H70', 'M54 34 L70 50 L54 66'],
  bolt: ['M56 6 L20 56 H48 L42 94 L80 40 H52 Z'],
  funnel: ['M10 14 H90 L60 52 V84 L40 92 V52 Z'],
};

// Cada trazo se dibuja (stroke draw-on) en `at`, atenuado; en `on` pasa a color y glow.
export const Icon: React.FC<{name: string; x: number; y: number; size?: number; at: number; on?: number; out?: number;
  color?: string; dimColor?: string; stroke?: number; draw?: number; fill?: boolean}> = ({
  name, x, y, size = 120, at, on, out, color = V.line, dimColor = V.dim, stroke = 4.2, draw = 14, fill = false,
}) => {
  const f = useCurrentFrame();
  const {a, l} = litState(f, at, on, out);
  const p = tv(f, at, at + draw, 0, 1, EV.inOut);
  const c = mix(dimColor, color, l);
  const sw = (stroke * 100) / size;
  return (
    <svg width={size} height={size} viewBox="-4 -4 108 108"
      style={{position: 'absolute', left: x, top: y, overflow: 'visible', opacity: a, filter: l > 0.05 ? lineGlow(color, l) : undefined,
        transform: `scale(${0.94 + 0.06 * a + 0.04 * Math.sin(Math.PI * l)})`}}>
      {ICONS[name].map((d, i) => (
        <path key={i} d={d} pathLength={1} fill={fill && l > 0 ? `${color}22` : 'none'} stroke={c} strokeWidth={sw}
          strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - p} />
      ))}
    </svg>
  );
};

// Caja redondeada que se dibuja (EN / ES, tarjetas, cajas de letras). children va dentro.
export const Box: React.FC<{x: number; y: number; w: number; h: number; at: number; on?: number; out?: number; r?: number;
  color?: string; dimColor?: string; stroke?: number; fillOn?: boolean; children?: React.ReactNode; draw?: number}> = ({
  x, y, w, h, at, on, out, r = 18, color = V.line, dimColor = V.dim, stroke = 3.5, fillOn = false, children, draw = 14,
}) => {
  const f = useCurrentFrame();
  const {a, l} = litState(f, at, on, out);
  const p = tv(f, at, at + draw, 0, 1, EV.inOut);
  const c = mix(dimColor, color, l);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: a}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: l > 0.05 ? lineGlow(color, l * 0.8) : undefined}}>
        <rect x={stroke / 2} y={stroke / 2} width={w - stroke} height={h - stroke} rx={r} pathLength={1}
          fill={fillOn ? `rgba(207,220,159,${0.07 * l})` : 'rgba(10,20,14,.25)'} stroke={c} strokeWidth={stroke}
          strokeDasharray={1} strokeDashoffset={1 - p} />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c,
        opacity: tv(f, at + draw * 0.6, at + draw, 0, 1)}}>
        {children}
      </div>
    </div>
  );
};

// Flecha que se dibuja de (x1,y1) a (x2,y2)
export const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; at: number; dur?: number; out?: number; color?: string; stroke?: number; head?: number}> = ({
  x1, y1, x2, y2, at, dur = 14, out, color = V.line, stroke = 3, head = 18,
}) => {
  const f = useCurrentFrame();
  const p = tv(f, at, at + dur, 0, 1, EV.inOut);
  const o = out === undefined ? 1 : tv(f, out, out + 8, 1, 0);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hx = x1 + (x2 - x1) * p, hy = y1 + (y2 - y1) * p;
  const hp = (s: number) => `${hx - head * Math.cos(ang + s)},${hy - head * Math.sin(ang + s)}`;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: o * tv(f, at, at + 3, 0, 1), overflow: 'visible'}}>
      <line x1={x1} y1={y1} x2={hx} y2={hy} stroke={color} strokeWidth={stroke} strokeLinecap="round" opacity={0.75} />
      {p > 0.2 && <polyline points={`${hp(0.55)} ${hx},${hy} ${hp(-0.55)}`} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
};

// Etiqueta pequeña "● SIN SKILL" (color = estado)
export const Tag: React.FC<{text: string; x: number; y: number; at: number; on?: number; out?: number; color?: string; size?: number; align?: 'left' | 'center'}> = ({
  text, x, y, at, on, out, color = V.kicker, size = 22, align = 'left',
}) => {
  const f = useCurrentFrame();
  const {a, l} = litState(f, at, on ?? at, out);
  const c = mix(V.dim, color, l);
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: a, display: 'flex', alignItems: 'center', gap: 12,
      transform: align === 'center' ? 'translateX(-50%)' : undefined}}>
      <div style={{width: 9, height: 9, borderRadius: 5, background: c}} />
      <div style={{fontFamily: MONO_V, fontWeight: 500, fontSize: size, letterSpacing: '0.24em', color: c, whiteSpace: 'pre', textTransform: 'uppercase'}}>{text}</div>
    </div>
  );
};

// Número que cuenta (465 → con separador de miles "27 000")
export const Counter: React.FC<{from?: number; to: number; at: number; dur?: number; out?: number; x: number; y: number; size?: number; color?: string; prefix?: string; suffix?: string; glow?: boolean}> = ({
  from = 0, to, at, dur = 20, out, x, y, size = 84, color = V.salmon, prefix = '', suffix = '', glow = true,
}) => {
  const f = useCurrentFrame();
  const v = Math.round(tv(f, at, at + dur, from, to, EV.out));
  const s = v.toLocaleString('en-US').replace(/,/g, ' ');
  return (
    <div style={{position: 'absolute', left: x, top: y, fontFamily: HEAD, fontWeight: 700, fontSize: size, letterSpacing: '-0.03em', color,
      lineHeight: 1, opacity: tv(f, at, at + 4, 0, 1), textShadow: glow ? `0 0 22px ${color}55` : undefined, ...exitStyle(f, out)}}>
      {prefix}{s}{suffix}
    </div>
  );
};

// Documento con renglones que se llenan (para comparar respuestas largas vs cortas)
export const DocLines: React.FC<{x: number; y: number; w: number; h: number; lines: number; at: number; on?: number; out?: number; color?: string; fillDur?: number}> = ({
  x, y, w, h, lines, at, on, out, color = V.salmon, fillDur = 24,
}) => {
  const f = useCurrentFrame();
  const {l} = litState(f, at, on, out);
  const c = mix(V.dim, color, l);
  const gap = (h - 48) / Math.max(lines, 1);
  return (
    <Box x={x} y={y} w={w} h={h} at={at} on={on} out={out} color={color} r={10}>
      <div style={{position: 'absolute', inset: 0}}>
        {Array.from({length: lines}).map((_, i) => {
          const s = (on ?? at) + (i * fillDur) / lines;
          const p = tv(f, s, s + 6, 0, 1);
          const ww = i === lines - 1 ? 0.45 : [0.92, 0.78, 0.88, 0.7, 0.95, 0.83][i % 6];
          return <div key={i} style={{position: 'absolute', left: 22, top: 26 + i * gap, height: 4, borderRadius: 2,
            width: (w - 44) * ww * p, background: c, opacity: 0.85}} />;
        })}
      </div>
    </Box>
  );
};

// Tile de app (sin logos oficiales: asterisco naranja = Claude, prompt > = Codex)
export const AppTile: React.FC<{kind: 'claude' | 'codex'; x: number; y: number; size?: number; at: number; out?: number; label?: boolean}> = ({
  kind, x, y, size = 130, at, out, label = true,
}) => {
  const f = useCurrentFrame();
  const p = tv(f, at, at + 10, 0, 1, EV.expo);
  const o = out === undefined ? 1 : tv(f, out, out + 8, 1, 0);
  const claude = kind === 'claude';
  return (
    <div style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size * 0.22, opacity: p * o,
      transform: `scale(${0.85 + 0.15 * p})`, background: claude ? '#fbf8f3' : 'linear-gradient(160deg,#eef0ff,#c9cdf7)',
      boxShadow: '0 10px 30px rgba(0,0,0,.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: size * 0.04}}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 100 100">
        {claude
          ? Array.from({length: 12}).map((_, i) => {
              const r = (i * Math.PI) / 6;
              return <line key={i} x1={50} y1={50} x2={50 + Math.cos(r) * (i % 2 ? 38 : 46)} y2={50 + Math.sin(r) * (i % 2 ? 38 : 46)} stroke="#d97757" strokeWidth={9} strokeLinecap="round" />;
            })
          : <>
              <circle cx={50} cy={50} r={44} fill="#4b55e0" />
              <polyline points="32,36 48,50 32,64" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
              <line x1={54} y1={66} x2={70} y2={66} stroke="#fff" strokeWidth={9} strokeLinecap="round" />
            </>}
      </svg>
      {label && <div style={{fontFamily: BODY, fontWeight: 600, fontSize: size * 0.12, color: '#2a2a2a'}}>{claude ? 'Claude Code' : 'Codex'}</div>}
    </div>
  );
};

// Chip numerado "1 QUÉ HACER" (lista que se arma al hablar)
export const StepChip: React.FC<{n: number | string; label: string; x: number; y: number; at: number; out?: number; w?: number}> = ({n, label, x, y, at, out, w = 250}) => (
  <Box x={x} y={y} w={w} h={118} at={at} on={at + 4} out={out} color={V.lime} r={14} fillOn draw={10}>
    <div style={{display: 'flex', alignItems: 'baseline', gap: 14, width: '100%', paddingLeft: 20}}>
      <span style={{fontFamily: HEAD, fontWeight: 600, fontSize: 66, color: V.lime, lineHeight: 1}}>{n}</span>
      <span style={{fontFamily: MONO_V, fontWeight: 500, fontSize: 24, letterSpacing: '0.14em', color: V.line, textTransform: 'uppercase'}}>{label}</span>
    </div>
  </Box>
);

// Texto mono que se tipea (terminal, input)
export const TypeMono: React.FC<{text: string; at: number; cpf?: number; size?: number; color?: string; caret?: boolean}> = ({text, at, cpf = 1.5, size = 30, color = V.line, caret = true}) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor((f - at) / cpf)));
  const done = n >= text.length;
  const blink = !done || Math.floor(f / 15) % 2 === 0;
  return (
    <span style={{fontFamily: MONO_V, fontWeight: 500, fontSize: size, color, whiteSpace: 'pre'}}>
      {text.slice(0, n)}
      {caret && f >= at && <span style={{display: 'inline-block', width: size * 0.55, height: size * 0.95, verticalAlign: '-0.15em', background: color, opacity: blink ? 0.7 : 0}} />}
    </span>
  );
};

// Terminal minimal: líneas "❯ instala esta skill: github.com/…" tipeadas una tras otra
export const Terminal: React.FC<{lines: {text: string; at: number; color?: string; prefix?: string}[]; x?: number; y?: number; size?: number; out?: number}> = ({
  lines, x = LAY.mx, y = 680, size = 30, out,
}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: x, top: y, display: 'flex', flexDirection: 'column', gap: size * 0.7, ...exitStyle(f, out)}}>
      {lines.map((ln, i) => f >= ln.at && (
        <div key={i} style={{display: 'flex', gap: size * 0.5}}>
          <span style={{fontFamily: MONO_V, fontSize: size, color: ln.color ?? V.lime}}>{ln.prefix ?? '❯'}</span>
          <TypeMono text={ln.text} at={ln.at} size={size} color={ln.color ?? V.line} caret={i === lines.filter((l) => f >= l.at).length - 1} />
        </div>
      ))}
    </div>
  );
};

// CTA "Comenta DIRECTO": campo de comentario estilo IG que tipea la palabra + botón enviar
export const CommentField: React.FC<{word: string; at: number; typeAt: number; sendAt?: number; x?: number; y?: number; w?: number; out?: number}> = ({
  word, at, typeAt, sendAt, x = 34, y = 880, w = 1012, out,
}) => {
  const f = useCurrentFrame();
  const sp = sendAt === undefined ? 0 : tv(f, sendAt, sendAt + 8, 0, 1);
  return (
    <>
      <Tag text="Añade un comentario" x={x + 26} y={y - 46} at={at} out={out} size={21} />
      <Box x={x} y={y} w={w} h={154} at={at} on={typeAt} out={out} r={77} color={V.line} draw={16}>
        <div style={{position: 'absolute', left: 74, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
          <TypeMono text={word} at={typeAt} cpf={3} size={58} color={V.white} />
        </div>
        <div style={{position: 'absolute', right: 24, top: 25, width: 104, height: 104, borderRadius: 52, border: `3px solid ${V.lime}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', background: `rgba(207,220,159,${0.08 + 0.5 * sp})`,
          boxShadow: `0 0 ${10 + 30 * sp}px rgba(207,220,159,.5)`, transform: `scale(${1 + 0.12 * Math.sin(Math.PI * sp)})`}}>
          <svg width={52} height={52} viewBox="0 0 100 100"><path d="M18 50 H80 M56 26 L80 50 L56 74" fill="none" stroke={V.lime} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </Box>
    </>
  );
};

// Contenedor de escena: kind="insert" → fondo opaco; kind="float" → sombra superior sobre el video.
export const VScene: React.FC<{kind?: 'insert' | 'float'; children: React.ReactNode; shadeOut?: number}> = ({kind = 'insert', children, shadeOut}) => (
  <AbsoluteFill style={{background: 'transparent'}}>
    <VFonts />
    {kind === 'insert' ? <Bg /> : <TopShade out={shadeOut} />}
    {children}
  </AbsoluteFill>
);
