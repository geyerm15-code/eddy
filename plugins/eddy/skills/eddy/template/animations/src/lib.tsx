import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Easing,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';

// ---------- palette ----------
// Todo sale de brand.json (lo copia new_project.sh desde la marca configurada).
import brand from './brand.json';
const C = brand.colors;
export const PAPER = C.paper;
export const INK = C.ink;
export const DARK = C.dark;
export const CARD = C.card;
export const BORDER = C.border;
export const VERM = C.accent; // único acento (nombre histórico; úsalo como ACCENT)
export const ACCENT = C.accent;
export const GREEN = C.ok;
export const MUTED = C.muted;
export const CLAUDE_ORANGE = C.accent2 ?? C.accent; // color de <Spark>
export const WA_GREEN = '#25D366';
export const MONO = 'Menlo, monospace';
export const SERIF = 'Display'; // titular roman
export const ITAL = 'Accent'; // palabra clave en itálica
export const WIDE = 'Wide'; // números, sellos, labels

// ---------- easing ----------
export const E = {
  out: Easing.out(Easing.cubic),
  in: Easing.in(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  expo: Easing.bezier(0.16, 1, 0.3, 1),
  expoIn: Easing.bezier(0.7, 0, 0.84, 0),
  expoInOut: Easing.bezier(0.87, 0, 0.13, 1),
  back: Easing.out(Easing.back(1.7)),
  softBack: Easing.out(Easing.back(1.2)),
  linear: Easing.linear,
};

export const tw = (f: number, a: number, b: number, from: number, to: number, e = E.out) =>
  interpolate(f, [a, b], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: e,
  });

export const pop = (f: number, at: number, damping = 11, stiffness = 170) =>
  spring({frame: f - at, fps: 30, config: {damping, stiffness, mass: 0.9}});

export const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// decaying camera shake
export const shake = (f: number, at: number, dur = 10, amp = 14) => {
  const p = (f - at) / dur;
  if (p < 0 || p > 1) return {x: 0, y: 0, r: 0};
  const k = (1 - p) ** 2 * amp;
  return {
    x: Math.sin(f * 2.7 + at) * k,
    y: Math.cos(f * 3.3 + at * 1.7) * k * 0.8,
    r: Math.sin(f * 1.9) * k * 0.05,
  };
};

// ---------- fonts ----------
// FontFace API directo, rango de peso 100–900 en cada cara (el navegador nunca sintetiza negritas falsas).
// No usar document.fonts.check: con fuentes variables o itálicas da falsos fallos y cancela el render.
const F = brand.fonts;
let fontsP: Promise<void> | null = null;
const loadFonts = () =>
  (fontsP ??= Promise.all(
    ([
      ['Display', F.display, {weight: '100 900'}],
      ['Accent', F.accent, {weight: '100 900', style: 'italic'}],
      ['Wide', F.wide, {weight: '100 900'}],
    ] as [string, string, FontFaceDescriptors][]).map(async ([fam, file, desc]) => {
      const ff = new FontFace(fam, `url(${staticFile(file)})`, desc);
      await ff.load();
      document.fonts.add(ff);
    }),
  ).then(() => undefined));

export const Fonts: React.FC = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    loadFonts().then(() => continueRender(handle)).catch((e) => cancelRender(e));
  }, [handle]);
  return null;
};

// ---------- kinetic letters ----------
type LettersProps = {
  text: string;
  at: number;
  out?: number;
  stagger?: number;
  dur?: number;
  style?: React.CSSProperties;
  rot?: number;
  dir?: 1 | -1;
};
// each glyph rises out of a mask, with a slight rotation and vertical smear while moving
export const Letters: React.FC<LettersProps> = ({text, at, out, stagger = 1.4, dur = 16, style, rot = 8, dir = 1}) => {
  const f = useCurrentFrame();
  return (
    <span style={{display: 'inline-flex', whiteSpace: 'pre', ...style}}>
      {[...text].map((ch, i) => {
        const s = at + i * stagger;
        const p = tw(f, s, s + dur, 0, 1, E.expo);
        const q = out === undefined ? 0 : tw(f, out + i * stagger * 0.6, out + i * stagger * 0.6 + 12, 0, 1, E.expoIn);
        const y = (1 - p) * 115 * dir - q * 115;
        const v = Math.abs(tw(f, s, s + dur * 0.5, 1, 0, E.out)) + q;
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', padding: '0.12em 0.08em', margin: '-0.12em -0.08em'}}>
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${y}%) rotate(${(1 - p) * rot * dir}deg) scaleY(${1 + v * 0.25})`,
                transformOrigin: '50% 100%',
                filter: v > 0.05 ? `blur(${v * 3}px)` : undefined,
              }}
            >
              {ch}
            </span>
          </span>
        );
      })}
    </span>
  );
};

// hand-drawn underline that draws on
export const Scribble: React.FC<{width: number; at: number; dur?: number; color?: string; stroke?: number; seed?: number}> = ({
  width,
  at,
  dur = 14,
  color = VERM,
  stroke = 9,
  seed = 1,
}) => {
  const f = useCurrentFrame();
  const p = tw(f, at, at + dur, 0, 1, E.inOut);
  const pts: string[] = [];
  for (let i = 0; i <= 20; i++) {
    const x = (i / 20) * width;
    const y = 14 + Math.sin(i * 0.9 + seed) * 3 + (rnd(seed * 31 + i) - 0.5) * 3 - (i / 20) * 4;
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return (
    <svg width={width} height={30} style={{overflow: 'visible', display: 'block'}}>
      <path d={pts.join(' ')} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" />
    </svg>
  );
};

// ---------- particles ----------
type BurstProps = {at: number; x: number; y: number; count?: number; radius?: number; colors?: string[]; seed?: number; dur?: number; size?: number};
export const Burst: React.FC<BurstProps> = ({at, x, y, count = 18, radius = 260, colors = [VERM, INK, PAPER], seed = 3, dur = 26, size = 14}) => {
  const f = useCurrentFrame();
  const p = (f - at) / dur;
  if (p < 0 || p > 1) return null;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} width={1} height={1}>
      {Array.from({length: count}, (_, i) => {
        const a = (i / count) * Math.PI * 2 + (rnd(seed + i) - 0.5) * 0.5;
        const e = E.expo(Math.min(1, p * 1.15));
        const d = radius * (0.55 + rnd(seed * 7 + i) * 0.6) * e;
        const px = x + Math.cos(a) * d;
        const py = y + Math.sin(a) * d + p * p * 60;
        const c = colors[i % colors.length];
        const s = size * (0.6 + rnd(seed * 3 + i) * 0.8) * (1 - p);
        const kind = i % 3;
        if (kind === 0) {
          // streak aligned with travel direction
          const len = 10 + (1 - e) * 70;
          return (
            <line key={i} x1={px} y1={py} x2={px - Math.cos(a) * len} y2={py - Math.sin(a) * len} stroke={c} strokeWidth={Math.max(1, s * 0.45)} strokeLinecap="round" />
          );
        }
        if (kind === 1) return <circle key={i} cx={px} cy={py} r={s * 0.5} fill={c} />;
        return <rect key={i} x={px - s / 2} y={py - s / 2} width={s} height={s} fill={c} transform={`rotate(${p * 400 + i * 40} ${px} ${py})`} />;
      })}
    </svg>
  );
};

export const Shockwave: React.FC<{at: number; x: number; y: number; r?: number; color?: string; dur?: number; width?: number}> = ({
  at,
  x,
  y,
  r = 300,
  color = VERM,
  dur = 20,
  width = 16,
}) => {
  const f = useCurrentFrame();
  const p = (f - at) / dur;
  if (p < 0 || p > 1) return null;
  const e = E.expo(p);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} width={1} height={1}>
      <circle cx={x} cy={y} r={r * e} fill="none" stroke={color} strokeWidth={width * (1 - p)} opacity={1 - p * 0.6} />
      <circle cx={x} cy={y} r={r * 0.7 * E.expo(Math.max(0, p - 0.12))} fill="none" stroke={color} strokeWidth={width * 0.4 * (1 - p)} opacity={0.6 * (1 - p)} />
    </svg>
  );
};

// hand-drawn rays around a point
export const Rays: React.FC<{at: number; x: number; y: number; r0?: number; r1?: number; n?: number; color?: string; dur?: number; hold?: boolean}> = ({
  at,
  x,
  y,
  r0 = 120,
  r1 = 190,
  n = 10,
  color = VERM,
  dur = 14,
  hold = true,
}) => {
  const f = useCurrentFrame();
  const p = tw(f, at, at + dur, 0, 1, E.expo);
  if (f < at) return null;
  const wob = Math.sin(f * 0.5) * 4;
  const fade = hold ? 1 : tw(f, at + dur, at + dur + 10, 1, 0);
  if (fade <= 0) return null;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', opacity: fade}} width={1} height={1}>
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 + rnd(i) * 0.2;
        const a1 = r0 + p * 20;
        const a2 = a1 + (r1 - r0) * p * (0.7 + rnd(i * 5) * 0.5) + (hold ? wob * (i % 2 ? 1 : -1) : 0);
        return (
          <line
            key={i}
            x1={x + Math.cos(a) * a1}
            y1={y + Math.sin(a) * a1}
            x2={x + Math.cos(a) * a2}
            y2={y + Math.sin(a) * a2}
            stroke={color}
            strokeWidth={9}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

// ---------- glyphs ----------
export const Spark: React.FC<{size: number; color?: string; style?: React.CSSProperties}> = ({size, color = CLAUDE_ORANGE, style}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible', ...style}}>
    {Array.from({length: 8}, (_, i) => {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const len = i % 2 === 0 ? 47 : 40;
      return (
        <line key={i} x1={50 + Math.cos(a) * 9} y1={50 + Math.sin(a) * 9} x2={50 + Math.cos(a) * len} y2={50 + Math.sin(a) * len} stroke={color} strokeWidth={i % 2 === 0 ? 12 : 10} strokeLinecap="round" />
      );
    })}
    <circle cx={50} cy={50} r={9} fill={color} />
  </svg>
);

export const WaGlyph: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={style}>
    <path d="M32 6c14.4 0 26 10.6 26 23.8S46.4 53.6 32 53.6c-3.6 0-7-.6-10.1-1.8L9 57l3.6-11.4C8.5 41.5 6 35.9 6 29.8 6 16.6 17.6 6 32 6z" fill={WA_GREEN} />
    <circle cx={22} cy={30} r={3.6} fill="#fff" />
    <circle cx={32} cy={30} r={3.6} fill="#fff" />
    <circle cx={42} cy={30} r={3.6} fill="#fff" />
  </svg>
);

export const Check: React.FC<{size: number; color?: string; progress?: number; width?: number}> = ({size, color = GREEN, progress = 1, width = 3.4}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{overflow: 'visible'}}>
    <path d="M4.5 12.5 L10 17.5 L19.5 6.5" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />
  </svg>
);

export const WindowDots: React.FC = () => (
  <div style={{display: 'flex', gap: 8}}>
    {['#3a3633', '#3a3633', '#3a3633'].map((c, i) => (
      <div key={i} style={{width: 12, height: 12, borderRadius: 6, background: c}} />
    ))}
  </div>
);

export const cardStyle: React.CSSProperties = {
  background: CARD,
  border: `1.5px solid ${BORDER}`,
  borderRadius: 28,
  boxShadow: '0 2px 4px rgba(0,0,0,.18), 0 40px 80px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.05)',
  color: '#ece8e2',
  fontFamily: MONO,
};

export const Chip: React.FC<{children: React.ReactNode; color?: string; bg?: string; style?: React.CSSProperties}> = ({children, color = GREEN, bg, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 18px',
      borderRadius: 999,
      background: bg ?? `${color}22`,
      border: `1.5px solid ${color}66`,
      color,
      fontFamily: MONO,
      fontSize: 24,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------- film grain (seeded per 2 frames) ----------
export const Grain: React.FC<{opacity?: number; blend?: React.CSSProperties['mixBlendMode']}> = ({opacity = 0.09, blend = 'multiply'}) => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2);
  return (
    <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity, mixBlendMode: blend, pointerEvents: 'none'}}>
      <filter id={`g${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#g${seed})`} />
    </svg>
  );
};

// drifting dot grid for paper backgrounds
export const DotGrid: React.FC<{color?: string; gap?: number; speed?: number}> = ({color = 'rgba(20,18,16,.13)', gap = 40, speed = 0.6}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${color} 2.2px, transparent 2.6px)`,
        backgroundSize: `${gap}px ${gap}px`,
        backgroundPosition: `${(f * speed) % gap}px ${(-f * speed * 0.5) % gap}px`,
      }}
    />
  );
};

// ---------- split panels for full-screen inserts (alpha in/out over the talking head) ----------
// paper top (0..1100) + dark bottom (1100..1920). Layered wipe: vermilion layer leads, paper follows.
export const SPLIT = 1100;
export const usePanels = (dur: number) => {
  const f = useCurrentFrame();
  const vIn = tw(f, 0, 9, 0, 1, E.expo);
  const pIn = tw(f, 3, 14, 0, 1, E.expo);
  const pOut = tw(f, dur - 13, dur - 3, 0, 1, E.expoIn);
  const vOut = tw(f, dur - 10, dur, 0, 1, E.expoIn);
  return {vIn, pIn, pOut, vOut};
};

export const Panels: React.FC<{dur: number; step: string; label: string; children: React.ReactNode}> = ({dur, step, label, children}) => {
  const f = useCurrentFrame();
  const {vIn, pIn, pOut, vOut} = usePanels(dur);
  const topV = -SPLIT * (1 - vIn) - SPLIT * vOut;
  const topP = -SPLIT * (1 - pIn) - SPLIT * pOut;
  const H2 = 1920 - SPLIT;
  const botV = H2 * (1 - vIn) + H2 * vOut;
  const botP = H2 * (1 - pIn) + H2 * pOut;
  // HUD progress across the whole insert
  const prog = tw(f, 10, dur - 12, 0, 1, E.linear);
  const hudIn = tw(f, 10, 26, 0, 1, E.expo);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {/* vermilion lead layers */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: SPLIT, background: VERM, transform: `translateY(${topV}px)`}} />
      <div style={{position: 'absolute', left: 0, top: SPLIT, width: 1080, height: H2, background: VERM, transform: `translateY(${botV}px)`}} />
      {/* dark bottom */}
      <div style={{position: 'absolute', left: 0, top: SPLIT, width: 1080, height: H2, background: DARK, transform: `translateY(${botP}px)`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(244,60,6,.10), transparent 70%)'}} />
        {/* HUD — kept below the subtitle band (y 1150-1500) */}
        <div style={{position: 'absolute', left: 90, right: 90, top: 1650 - SPLIT, opacity: hudIn, transform: `translateY(${(1 - hudIn) * 30}px)`}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: WIDE, fontWeight: 500, fontSize: 20, letterSpacing: 3, color: MUTED}}>
            <span>
              <span style={{color: VERM, fontWeight: 900}}>{step}</span>&nbsp;&nbsp;{label}
            </span>
            <span>{String(Math.round(prog * 100)).padStart(3, '0')}%</span>
          </div>
          <div style={{marginTop: 16, height: 3, background: '#24211f', position: 'relative'}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${prog * 100}%`, background: VERM}} />
            {Array.from({length: 11}, (_, i) => (
              <div key={i} style={{position: 'absolute', left: `${i * 10}%`, top: -6, width: 2, height: 15, background: i / 10 <= prog ? VERM : '#3a3633'}} />
            ))}
          </div>
        </div>
        <Grain opacity={0.12} blend="screen" />
      </div>
      {/* paper top */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: SPLIT, background: PAPER, transform: `translateY(${topP}px)`, overflow: 'hidden'}}>
        <DotGrid />
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 70% at 50% 45%, transparent 55%, rgba(60,40,20,.14))'}} />
        <Grain opacity={0.1} />
      </div>
      {/* content rides with the paper panel */}
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${topP}px)`}}>{children}</div>
    </AbsoluteFill>
  );
};

// headline: roman line + italic vermilion key word, kinetic
export const Headline: React.FC<{a: string; b: string; at: number; out?: number; x?: number; y?: number; bIndent?: number; size?: number}> = ({
  a,
  b,
  at,
  out,
  x = 90,
  y = 120,
  bIndent = 70,
  size = 96,
}) => (
  <div style={{position: 'absolute', left: x, top: y}}>
    <div style={{fontFamily: SERIF, fontWeight: 800, fontSize: size, color: INK, lineHeight: 1.05, letterSpacing: -1}}>
      <Letters text={a} at={at} out={out} stagger={1.3} />
    </div>
    <div style={{fontFamily: ITAL, fontStyle: 'italic', fontWeight: 600, fontSize: size * 1.38, color: VERM, lineHeight: 1.0, marginLeft: bIndent, marginTop: -6}}>
      <Letters text={b} at={at + 8} out={out === undefined ? undefined : out + 3} stagger={1.6} rot={12} />
    </div>
  </div>
);

// 3D stage
export const Stage: React.FC<{children: React.ReactNode; persp?: number; style?: React.CSSProperties}> = ({children, persp = 1800, style}) => (
  <div style={{position: 'absolute', inset: 0, perspective: persp, perspectiveOrigin: '50% 45%', ...style}}>
    <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}>{children}</div>
  </div>
);

export {interpolate};
