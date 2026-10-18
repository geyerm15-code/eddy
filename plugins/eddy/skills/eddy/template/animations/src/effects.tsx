// Efectos sobre la persona (motor remotion). Frame de diseño 1080x1920 a 30 fps.
// Algunos van DETRÁS de la persona: escena con `"kind": "behind"` en studio.json + `studio.py matte`
// (ver references/efectos.md). Los de vidrio leen el video real desde public/base.mp4 (también lo crea `matte`):
// pásales `start` = el start del overlay en studio.json para que el video quede sincronizado.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import brand from './brand.json';
import {E, Fonts, SERIF, ITAL, WIDE, pop, tw} from './lib';
import {BODY, HEAD, MONO_V, VFonts} from './tech';

export const FX_ACCENT = brand.colors.accent;
const F = 30;

// Todas las fuentes de la marca (editorial + tech) para escenas de efectos.
export const FxFonts: React.FC = () => (
  <>
    <Fonts />
    <VFonts />
  </>
);

// ---------- video de fondo (public/base.mp4, 1080x1920 30 fps) ----------
export const BaseVideo: React.FC<{start: number; style?: React.CSSProperties}> = ({start, style}) => (
  <OffthreadVideo src={staticFile('base.mp4')} startFrom={Math.round(start * F)} muted
    style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, ...style}} />
);

// ---------- tarjeta de vidrio esmerilado: muestra el video desenfocado detrás ----------
export const Frosted: React.FC<{x: number; y: number; w: number; h: number; start: number; r?: number; blur?: number;
  tint?: number; border?: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({
  x, y, w, h, start, r = 30, blur = 22, tint = 0.6, border = 0.14, style, children,
}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: r, overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,.35), 0 4px 14px rgba(0,0,0,.25)', ...style}}>
    <div style={{position: 'absolute', left: -x, top: -y, width: 1080, height: 1920, filter: `blur(${blur}px)`, transform: 'scale(1.04)'}}>
      <BaseVideo start={start} />
    </div>
    <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${tint})`}} />
    <div style={{position: 'absolute', inset: 0, borderRadius: r, border: `1.5px solid rgba(255,255,255,${border})`}} />
    {children}
  </div>
);

const CheckMark: React.FC<{size: number; p: number; color?: string}> = ({size, p, color = '#fff'}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M24 52 L43 70 L77 32" fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round"
      pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
  </svg>
);

// ---------- 1) Checklist de vidrio: se tilda cada ítem cuando se nombra ----------
// items[i].on = frame de la palabra que lo nombra. Antes de eso el renglón es una barra gris.
export const GlassChecklist: React.FC<{start: number; at: number; out?: number; label: string;
  items: {text: string; on: number}[]; y?: number; color?: string}> = ({start, at, out, label, items, y = 230, color = FX_ACCENT}) => {
  const f = useCurrentFrame();
  const w = Math.round(1080 * 0.85), x = Math.round((1080 - w) / 2);
  const rowH = 104, h = 56 + items.length * rowH;
  const inP = tw(f, at, at + 9, 0, 1, E.out);
  const o = inP * (out === undefined ? 1 : tw(f, out, out + 8, 1, 0, E.in));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, transform: `translateY(${(1 - inP) * 30}px)`}}>
      <div style={{position: 'absolute', left: x + 8, top: y - 52, display: 'flex', alignItems: 'center', gap: 14}}>
        <div style={{width: 11, height: 11, borderRadius: 6, background: color, boxShadow: `0 0 10px ${color}`}} />
        <div style={{fontFamily: MONO_V, fontWeight: 500, fontSize: 24, letterSpacing: '0.22em', color: 'rgba(235,235,235,.82)',
          textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,.6)'}}>{label}</div>
      </div>
      <Frosted x={x} y={y} w={w} h={h} start={start}>
        {items.map((it, i) => {
          const c = pop(f, it.on, 10, 190);
          const lit = f >= it.on;
          return (
            <div key={i} style={{position: 'absolute', left: 34, right: 34, top: 28 + i * rowH, height: rowH - 12,
              display: 'flex', alignItems: 'center', gap: 26, borderTop: i ? '1px solid rgba(255,255,255,.08)' : undefined}}>
              <div style={{width: 58, height: 58, borderRadius: 29, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: lit ? color : 'transparent', border: lit ? 'none' : '2.5px solid rgba(255,255,255,.28)',
                transform: `scale(${lit ? 0.4 + 0.6 * c : 1})`, boxShadow: lit ? `0 0 22px ${color}88` : undefined}}>
                {lit && <CheckMark size={44} p={tw(f, it.on + 2, it.on + 9, 0, 1)} />}
              </div>
              {lit ? (
                <div style={{fontFamily: BODY, fontWeight: 650, fontSize: 44, color: '#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap',
                  opacity: tw(f, it.on, it.on + 6, 0, 1), transform: `translateX(${(1 - tw(f, it.on, it.on + 8, 0, 1, E.expo)) * 18}px)`}}>{it.text}</div>
              ) : (
                <div style={{height: 22, borderRadius: 11, width: Math.min(560, 120 + it.text.length * 17), background: 'rgba(255,255,255,.16)'}} />
              )}
            </div>
          );
        })}
      </Frosted>
    </div>
  );
};

// ---------- 2) iPhone con una app de tareas que se completa ----------
// side = lado libre de la cara. Entra deslizándose desde el borde en 12 f (ease-out) y se queda quieto.
export const PhoneMock: React.FC<{at: number; out?: number; side?: 'left' | 'right'; y?: number; w?: number; title?: string;
  subtitle?: string; tasks: string[]; checkFrom?: number; checkEvery?: number; color?: string}> = ({
  at, out, side = 'right', y = 520, w = 290, title = 'Hoy', subtitle = '4 tareas', tasks, checkFrom, checkEvery = 3, color = FX_ACCENT,
}) => {
  const f = useCurrentFrame();
  const h = Math.round(w * 2.16), s = w / 230;
  const p = tw(f, at, at + 12, 0, 1, E.out);
  const o = out === undefined ? 1 : tw(f, out, out + 8, 1, 0, E.in);
  const restX = side === 'right' ? 1080 - w - 70 : 70;
  const fromX = side === 'right' ? 1080 + 40 : -w - 40;
  const x = fromX + (restX - fromX) * p;
  const rot = side === 'right' ? -10 : 10;
  const c0 = checkFrom ?? at + 14;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: o, transform: `rotate(${rot}deg)`,
      borderRadius: 40 * s, background: '#0b0b0c', padding: 9 * s, boxSizing: 'border-box',
      boxShadow: '0 30px 70px rgba(0,0,0,.45), 0 8px 20px rgba(0,0,0,.35), inset 0 0 0 2px #2a2a2c'}}>
      <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 32 * s, overflow: 'hidden', background: '#141416'}}>
        <div style={{position: 'absolute', left: '50%', top: 9 * s, width: 70 * s, height: 20 * s, marginLeft: -35 * s, borderRadius: 10 * s, background: '#000'}} />
        <div style={{position: 'absolute', left: 16 * s, top: 46 * s, fontFamily: HEAD, fontWeight: 800, fontSize: 30 * s, color: '#fff', letterSpacing: '-0.02em'}}>{title}</div>
        <div style={{position: 'absolute', left: 16 * s, top: 82 * s, fontFamily: BODY, fontWeight: 500, fontSize: 11 * s, color: '#8a8a90'}}>{subtitle}</div>
        {tasks.map((t, i) => {
          const on = c0 + i * checkEvery;
          const c = pop(f, on, 11, 220);
          const done = f >= on;
          return (
            <div key={i} style={{position: 'absolute', left: 12 * s, right: 12 * s, top: (110 + i * 54) * s, height: 46 * s, borderRadius: 12 * s,
              background: '#1e1e22', display: 'flex', alignItems: 'center', gap: 10 * s, paddingLeft: 10 * s}}>
              <div style={{width: 18 * s, height: 18 * s, borderRadius: 9 * s, border: `${1.6 * s}px solid ${done ? color : '#55555c'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
                <div style={{width: 10 * s, height: 10 * s, borderRadius: 5 * s, background: color, transform: `scale(${done ? c : 0})`}} />
              </div>
              <div style={{fontFamily: BODY, fontWeight: 550, fontSize: 12.5 * s, color: done ? '#8a8a90' : '#f2f2f4', whiteSpace: 'nowrap',
                textDecoration: done ? 'line-through' : 'none'}}>{t}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- 3) Pared de titulares (BEHIND): notas de papel con pin detrás de la persona ----------
const NOTE_SPOTS = [
  {x: 60, y: 300, rot: -5}, {x: 640, y: 250, rot: 4}, {x: 90, y: 700, rot: 3}, {x: 700, y: 640, rot: -6}, {x: 360, y: 150, rot: -2},
];
export const NoteWall: React.FC<{at: number; out?: number; notes: {text: string; x?: number; y?: number; rot?: number}[];
  stagger?: number; w?: number; paper?: string; pin?: string}> = ({at, out, notes, stagger = 2, w = 330, paper = '#F6F3EC', pin = '#d6322b'}) => {
  const f = useCurrentFrame();
  const o = out === undefined ? 1 : tw(f, out, out + 8, 1, 0, E.in);
  return (
    <AbsoluteFill style={{opacity: o}}>
      {notes.map((n, i) => {
        const spot = NOTE_SPOTS[i % NOTE_SPOTS.length];
        const t0 = at + i * stagger;
        const p = pop(f, t0, 9, 160);
        const sway = Math.sin((f + i * 17) / 24) * 0.6;
        return (
          <div key={i} style={{position: 'absolute', left: n.x ?? spot.x, top: n.y ?? spot.y, width: w, padding: '44px 30px 34px',
            background: paper, boxSizing: 'border-box', opacity: Math.min(1, p * 1.5),
            transform: `rotate(${(n.rot ?? spot.rot) + sway}deg) scale(${0.6 + 0.4 * p})`, transformOrigin: '50% 0%',
            boxShadow: '0 18px 30px rgba(0,0,0,.28), 0 3px 6px rgba(0,0,0,.2)'}}>
            <div style={{position: 'absolute', left: '50%', top: 12, width: 26, height: 26, marginLeft: -13, borderRadius: 13,
              background: `radial-gradient(circle at 35% 35%, #ff8a80, ${pin} 55%, #7a120e)`, boxShadow: '0 4px 6px rgba(0,0,0,.35)'}} />
            <div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 40, lineHeight: 1.08, color: '#1b1916', letterSpacing: '-0.01em'}}>{n.text}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- 4) Gráfico que crece, con pastilla al llegar arriba ----------
export const ChartGrow: React.FC<{at: number; out?: number; label?: string; days?: string[]; dim?: number; color?: string;
  top?: number; bottom?: number}> = ({at, out, label = 'ESCALA ↗', days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'], dim = 0.6,
  color = FX_ACCENT, top = 330, bottom = 1000}) => {
  const f = useCurrentFrame();
  const o = out === undefined ? 1 : tw(f, out, out + 8, 1, 0, E.in);
  const x0 = 110, x1 = 970, dur = 18; // 0.6 s
  const p = tw(f, at + 4, at + 4 + dur, 0, 1, E.inOut);
  const N = 60, k = 4.2;
  const pts = Array.from({length: N + 1}, (_, i) => {
    const u = i / N;
    const g = (Math.exp(k * u) - 1) / (Math.exp(k) - 1); // casi plano y luego sube fuerte
    return [x0 + (x1 - x0) * u, bottom - 40 - (bottom - top - 140) * g];
  });
  const d = 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L');
  const tip = pts[Math.min(N, Math.round(p * N))];
  const pill = pop(f, at + 4 + dur, 10, 200);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <AbsoluteFill style={{background: `rgba(0,0,0,${dim})`, opacity: tw(f, at, at + 6, 0, 1)}} />
      {days.map((dname, i) => {
        const x = x0 + ((x1 - x0) * i) / (days.length - 1);
        const a = tw(f, at + i, at + i + 6, 0, 1);
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: x - 30, width: 60, top: top - 70, textAlign: 'center', fontFamily: MONO_V, fontWeight: 500,
              fontSize: 26, color: 'rgba(255,255,255,.7)', opacity: a}}>{dname}</div>
            <div style={{position: 'absolute', left: x - 1, top, width: 2, height: (bottom - top) * a, background: 'rgba(255,255,255,.18)'}} />
          </React.Fragment>
        );
      })}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <path d={d} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1}
          strokeDasharray={1} strokeDashoffset={1 - p} style={{filter: `drop-shadow(0 0 14px ${color}) drop-shadow(0 0 4px ${color})`}} />
        {p > 0.01 && <circle cx={tip[0]} cy={tip[1]} r={13} fill="#fff" style={{filter: `drop-shadow(0 0 10px ${color})`}} />}
      </svg>
      <div style={{position: 'absolute', left: Math.min(tip[0] - 330, 640), top: tip[1] - 40, height: 80, padding: '0 30px', borderRadius: 40,
        background: color, display: 'flex', alignItems: 'center', fontFamily: WIDE, fontWeight: 900, fontSize: 32, letterSpacing: '0.06em',
        color: '#fff', transform: `scale(${pill})`, transformOrigin: '100% 50%', opacity: f >= at + 4 + dur ? 1 : 0,
        boxShadow: `0 10px 30px ${color}66`}}>{label}</div>
    </AbsoluteFill>
  );
};

// ---------- 5) Portada de revista (BEHIND): palabra gigante en serif detrás de la cabeza ----------
// La cabeza tapa la parte de abajo de las letras: `baseline` ≈ face_y − 60 (la línea de base cae a la altura
// de la frente/ojos). Complemento encima de la persona: <CoverMeta> en una escena float.
export const CoverWord: React.FC<{word: string; at: number; out?: number; baseline?: number; color?: string; size?: number; stagger?: number}> = ({
  word, at, out, baseline = 720, color = '#fff', size, stagger = 1.5,
}) => {
  const f = useCurrentFrame();
  const fs = size ?? Math.min(420, Math.round(1000 / (word.length * 0.66)));
  const top = baseline - fs * 0.74;
  const o = out === undefined ? 1 : tw(f, out, out + 8, 1, 0, E.in);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', opacity: o,
      fontFamily: SERIF, fontWeight: 800, fontSize: fs, lineHeight: 1, letterSpacing: '-0.03em', color,
      textShadow: '0 6px 30px rgba(0,0,0,.18)'}}>
      {[...word].map((ch, i) => {
        const p = tw(f, at + i * stagger, at + i * stagger + 9, 0, 1, E.expo);
        return <span key={i} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 40}px)`}}>{ch}</span>;
      })}
    </div>
  );
};

export const CoverMeta: React.FC<{at: number; out?: number; issue: string; line1: string; line2?: string; y?: number}> = ({
  at, out, issue, line1, line2, y = 1560,
}) => {
  const f = useCurrentFrame();
  const o = out === undefined ? 1 : tw(f, out, out + 8, 1, 0, E.in);
  const a = tw(f, at, at + 8, 0, 1), b = tw(f, at + 8, at + 18, 0, 1, E.expo);
  const sh = '0 2px 10px rgba(0,0,0,.5)';
  return (
    <AbsoluteFill style={{opacity: o}}>
      <div style={{position: 'absolute', left: 64, top: 80, fontFamily: MONO_V, fontWeight: 500, fontSize: 24, letterSpacing: '0.2em',
        color: '#fff', textTransform: 'uppercase', opacity: a, textShadow: sh}}>{issue}</div>
      <div style={{position: 'absolute', left: 64, top: y, fontFamily: ITAL, fontStyle: 'italic', fontWeight: 600, fontSize: 76, lineHeight: 1.02,
        color: '#fff', opacity: b, transform: `translateY(${(1 - b) * 24}px)`, textShadow: sh}}>
        {line1}{line2 && <><br />{line2}</>}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 6) Letras de vidrio (BEHIND): el fondo se ve refractado dentro de cada letra ----------
// Palabras cortas (≤ 7 letras). `baseline` ≈ face_y − 60 para que la cabeza tape la parte baja.
export const GlassType: React.FC<{word: string; start: number; at: number; out?: number; baseline?: number; size?: number;
  shift?: number; stagger?: number; sheenAt?: number}> = ({word, start, at, out, baseline = 720, size, shift = 14, stagger = 1.5, sheenAt}) => {
  const f = useCurrentFrame();
  const fs = size ?? Math.min(330, Math.round(980 / (word.length * 1.16)));
  const o = out === undefined ? 1 : tw(f, out, out + 8, 1, 0, E.in);
  const chars = [...word];
  const id = `gt-${word.replace(/\W/g, '')}`;
  const rise = chars.map((_, i) => tw(f, at + i * stagger, at + i * stagger + 9, 0, 1, E.expo));
  // letras como <tspan> con dy relativo (sube cada una por separado); visibilidad = ya apareció
  const spans = () => {
    let prev = 0;
    return chars.map((ch, i) => {
      const off = (1 - rise[i]) * 46;
      const dy = off - prev;
      prev = off;
      return <tspan key={i} dy={dy} visibility={rise[i] > 0.02 ? 'visible' : 'hidden'}>{ch}</tspan>;
    });
  };
  const textProps = {x: 540, y: baseline, textAnchor: 'middle' as const, fontFamily: WIDE, fontWeight: 900, fontSize: fs, letterSpacing: fs * -0.02};
  const sStart = sheenAt ?? at + chars.length * stagger + 6;
  const sx = tw(f, sStart, sStart + 15, -400, 1400, E.inOut); // brillo diagonal en 0.5 s
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id={id} clipPathUnits="userSpaceOnUse"><text {...textProps}>{spans()}</text></clipPath>
          <filter id={`${id}-sh`} x="-10%" y="-20%" width="120%" height="160%"><feGaussianBlur stdDeviation="14" /></filter>
        </defs>
        {/* sombra suave debajo */}
        <text {...textProps} fill="rgba(0,0,0,.4)" filter={`url(#${id}-sh)`} transform="translate(0 18)">{spans()}</text>
      </svg>
      {/* el vidrio: el fondo corrido, desenfocado y aclarado, recortado por las letras (clip-path CSS → SVG) */}
      <div style={{position: 'absolute', inset: 0, clipPath: `url(#${id})`}}>
        <div style={{position: 'absolute', inset: 0, filter: 'blur(7px) brightness(1.2) saturate(1.1)', transform: `translateX(${shift}px) scale(1.02)`}}>
          <BaseVideo start={start} />
        </div>
        <div style={{position: 'absolute', inset: 0, background: 'rgba(255,255,255,.1)'}} />
        <div style={{position: 'absolute', left: sx, top: baseline - fs - 80, width: 300, height: fs + 200, transform: 'rotate(18deg)',
          background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.7), rgba(255,255,255,0))'}} />
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id={`${id}-top`} gradientUnits="userSpaceOnUse" x1="0" y1={baseline - fs * 0.74} x2="0" y2={baseline - fs * 0.5}>
            <stop offset="0" stopColor="#fff" stopOpacity={0.6} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* filo de luz arriba (sin trazo: las fuentes variables tienen contornos superpuestos que se verían) */}
        <text {...textProps} fill={`url(#${id}-top)`}>{spans()}</text>
      </svg>
    </AbsoluteFill>
  );
};
