import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  BORDER,
  Burst,
  CARD,
  Check,
  Chip,
  E,
  Fonts,
  GREEN,
  Headline,
  MONO,
  MUTED,
  Panels,
  Shockwave,
  Spark,
  Stage,
  VERM,
  WIDE,
  WaGlyph,
  WindowDots,
  cardStyle,
  pop,
  rnd,
  tw,
} from '../lib';

// Insert B — número + QR + vinculación. 264 frames.
// local word frames: número 21 · tengas 80 · vinculas 102 · escaneando 118 · QR 158 · dispositivos 189 · conectados 212 · WhatsApp 247
const DUR = 264;
const CW = 760;
const CH = 440;

// deterministic QR-looking matrix with 3 finder patterns
const N = 25;
const QR: boolean[][] = Array.from({length: N}, (_, y) =>
  Array.from({length: N}, (_, x) => {
    const finder = (fx: number, fy: number) => {
      const dx = x - fx;
      const dy = y - fy;
      if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null;
      const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
      return ring !== 2;
    };
    const fs = [finder(0, 0), finder(N - 7, 0), finder(0, N - 7)].find((v) => v !== null);
    if (fs !== undefined) return fs;
    if ((x === 7 || y === 7 || x === N - 8 || y === N - 8) && (x < 8 || y < 8) && (x < 8 || x > N - 9) && (y < 8 || x < 8)) return false;
    if (y === 6) return x % 2 === 0;
    if (x === 6) return y % 2 === 0;
    return rnd(x * 31 + y * 17 + 5) > 0.52;
  }),
);

const Digit: React.FC<{d: string; stopAt: number; startAt: number}> = ({d, stopAt, startAt}) => {
  const f = useCurrentFrame();
  const n = parseInt(d, 10);
  if (Number.isNaN(n)) return <span>{d}</span>;
  // spin through ~2 full cycles, decelerating onto the target digit
  const total = 20 + n;
  const p = tw(f, startAt, stopAt, 0, 1, E.expo);
  const pos = p * total;
  const speed = tw(f, startAt, stopAt, 1, 0, E.expo);
  const H = 70;
  return (
    <span style={{display: 'inline-block', height: H, overflow: 'hidden', verticalAlign: 'top'}}>
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          transform: `translateY(${-pos * H}px)`,
          filter: speed > 0.05 ? `blur(${speed * 6}px)` : undefined,
        }}
      >
        {Array.from({length: total + 1}, (_, i) => (
          <span key={i} style={{height: H, lineHeight: `${H}px`}}>
            {i % 10}
          </span>
        ))}
      </span>
    </span>
  );
};

const NumberCard: React.FC = () => {
  const f = useCurrentFrame();
  const num = '+57 300 482';
  let di = 0;
  const btn = tw(f, 58, 92, 0, 1, E.inOut);
  return (
    <div style={{...cardStyle, width: CW, height: CH, padding: '30px 44px', boxSizing: 'border-box', position: 'absolute', backfaceVisibility: 'hidden'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
        <WindowDots />
        <div style={{display: 'flex', alignItems: 'center', gap: 10, marginLeft: 120, color: MUTED, fontSize: 22}}>
          <WaGlyph size={26} /> WhatsApp Business
        </div>
      </div>
      <div style={{marginTop: 40, color: MUTED, fontSize: 20, letterSpacing: 3}}>TU NÚMERO</div>
      <div style={{marginTop: 10, fontFamily: WIDE, fontWeight: 900, fontSize: 56, height: 70, display: 'flex', alignItems: 'center', color: '#f4f0ea', letterSpacing: 1}}>
        {[...num].map((ch, i) => {
          const isD = /\d/.test(ch);
          const k = isD ? di++ : di;
          return isD ? (
            <Digit key={i} d={ch} startAt={16} stopAt={30 + k * 2.4} />
          ) : (
            <span key={i} style={{whiteSpace: 'pre'}}>
              {ch}
            </span>
          );
        })}
        <span style={{marginLeft: 18, color: VERM, letterSpacing: 6, opacity: tw(f, 52, 58, 0, 1)}}>••••</span>
      </div>
      <div style={{marginTop: 26, display: 'flex', alignItems: 'center', gap: 14, fontSize: 22, color: '#bdb6ad', borderBottom: `1.5px solid ${BORDER}`, paddingBottom: 18}}>
        <div style={{width: 34, height: 22, borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
          <div style={{flex: 2, background: '#f6c513'}} />
          <div style={{flex: 1, background: '#2a4fa8'}} />
          <div style={{flex: 1, background: '#d6232f'}} />
        </div>
        Colombia (+57)
      </div>
      <div style={{marginTop: 26, height: 64, borderRadius: 16, background: '#26231f', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, width: `${btn * 100}%`, background: VERM}} />
        <div style={{position: 'relative', lineHeight: '64px', textAlign: 'center', fontSize: 22, letterSpacing: 3, color: btn > 0.5 ? '#fff' : MUTED}}>
          {btn >= 1 ? 'NÚMERO VERIFICADO ✓' : 'VERIFICAR NÚMERO →'}
        </div>
      </div>
    </div>
  );
};

const QRCard: React.FC = () => {
  const f = useCurrentFrame();
  const M = 13;
  const S = M * N;
  const ox = (CW - S) / 2;
  const oy = 92;
  const laserP = f < 140 ? -1 : ((f - 140) / 22) % 2;
  const laserY = laserP < 0 ? -1 : laserP < 1 ? E.inOut(laserP) : E.inOut(2 - laserP);
  const laserOn = f >= 140 && f < 184;
  const br = pop(f, 146, 9, 220);
  const pulse = f >= 158 ? 1 + Math.max(0, 1 - (f - 158) / 8) * 0.12 : 1;
  const flash = f >= 158 ? Math.max(0, 1 - (f - 158) / 10) : 0;
  return (
    <div style={{...cardStyle, width: CW, height: CH, position: 'absolute', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 30, top: 26, display: 'flex', alignItems: 'center', gap: 16, fontSize: 22, color: MUTED}}>
        <WindowDots />
        <span style={{marginLeft: 10}}>Dispositivos vinculados</span>
      </div>
      <svg width={CW} height={CH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {QR.flatMap((row, y) =>
          row.map((on, x) => {
            if (!on) return null;
            const cx = x - N / 2;
            const cy = y - N / 2;
            const dist = Math.hypot(cx, cy);
            const st = 116 + dist * 1.3 + rnd(x * 7 + y) * 6;
            const p = tw(f, st, st + 14, 0, 1, E.expo);
            if (p <= 0) return null;
            const a = rnd(x * 13 + y * 3) * Math.PI * 2;
            const fly = (1 - p) * (260 + rnd(x + y * 29) * 260);
            const px = ox + x * M + Math.cos(a) * fly;
            const py = oy + y * M + Math.sin(a) * fly;
            const c = p < 0.8 ? VERM : '#f4f0ea';
            return <rect key={`${x}-${y}`} x={px} y={py} width={M - 1} height={M - 1} rx={2} fill={c} transform={`rotate(${(1 - p) * 180} ${px + M / 2} ${py + M / 2})`} />;
          }),
        )}
        {/* corner brackets */}
        {[
          [0, 0, 1, 1],
          [1, 0, -1, 1],
          [0, 1, 1, -1],
          [1, 1, -1, -1],
        ].map(([ax, ay, sx, sy], i) => {
          const pad = 26 + (1 - br) * 60;
          const x = ox + ax * S - sx * pad;
          const y = oy + ay * S - sy * pad;
          const L = 46 * pulse;
          return (
            <path key={i} d={`M${x} ${y + sy * L} L${x} ${y} L${x + sx * L} ${y}`} stroke={VERM} strokeWidth={7} fill="none" strokeLinecap="round" opacity={br > 0.02 ? 1 : 0} />
          );
        })}
        {laserOn && (
          <g>
            <rect x={ox - 30} y={oy + laserY * S - 2} width={S + 60} height={4} fill={VERM} />
            <rect x={ox - 30} y={oy + laserY * S - 30} width={S + 60} height={60} fill="url(#laserGlow)" />
          </g>
        )}
        <defs>
          <linearGradient id="laserGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={VERM} stopOpacity={0} />
            <stop offset="0.5" stopColor={VERM} stopOpacity={0.35} />
            <stop offset="1" stopColor={VERM} stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
      <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.7}} />
    </div>
  );
};

const Phone: React.FC<{lit: number; wa: number}> = ({lit, wa}) => (
  <div
    style={{
      width: 200,
      height: 390,
      borderRadius: 38,
      background: '#121110',
      border: '3px solid #2f2b28',
      boxShadow: '0 2px 4px rgba(0,0,0,.2), 0 40px 70px rgba(0,0,0,.35)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div style={{position: 'absolute', top: 12, left: 70, width: 60, height: 14, borderRadius: 7, background: '#000'}} />
    <div style={{position: 'absolute', inset: 8, top: 34, borderRadius: 28, background: `rgba(63,174,106,${0.12 + lit * 0.18})`, border: `1.5px solid rgba(63,174,106,${lit * 0.6})`}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'center', transform: `scale(${wa})`}}>
      <WaGlyph size={92} />
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', fontFamily: MONO, fontSize: 17, color: '#d9d3cb', opacity: lit}}>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8}}>
        <Spark size={18} /> Claude
      </div>
      <div style={{color: GREEN, marginTop: 8}}>● en línea</div>
    </div>
  </div>
);

export const SceneB: React.FC = () => {
  const f = useCurrentFrame();
  const enter = pop(f, 12, 12, 140);
  const flip = tw(f, 100, 124, 0, 180, E.expoInOut);
  const flipBump = Math.sin((flip / 180) * Math.PI);
  const drift = f < 100 ? -18 + f * 0.1 : -8;
  const shrink = tw(f, 184, 204, 0, 1, E.expoInOut);
  const idle = Math.sin(f / 22) * 1.5;

  const cardX = 160 - shrink * 250;
  const cardY = 500 + (1 - enter) * 900 - shrink * 10;
  const cardScale = (1 + flipBump * 0.08) * (1 - shrink * 0.42);

  // phone + link
  const ph = pop(f, 194, 12, 160);
  const lineP = tw(f, 200, 216, 0, 1, E.inOut);
  const lit = tw(f, 212, 220, 0, 1);
  const wa = pop(f, 236, 9, 220);
  const x1 = 160 + (CW * 0.58) / 2 + 80; // right edge of shrunk card (approx)
  const x2 = 730;
  const ly = 700;

  return (
    <AbsoluteFill>
      <Fonts />
      <Panels dur={DUR} step="PASO 01" label="CONECTA TU NÚMERO">
        <Headline a="Elige un" b="número" at={10} out={90} />
        <Headline a="Escanea el" b="QR" at={108} out={178} bIndent={260} />
        <Headline a="Vincula tu" b="WhatsApp" at={192} bIndent={40} />

        <Stage>
          <div
            style={{
              position: 'absolute',
              left: cardX,
              top: cardY,
              width: CW,
              height: CH,
              transformStyle: 'preserve-3d',
              opacity: f < 12 ? 0 : 1,
              transform: `scale(${cardScale}) rotateX(${(1 - enter) * 55 + 8 + idle * 0.5}deg) rotateY(${drift + flip + idle}deg) rotateZ(${-1.5 + (1 - enter) * 10}deg)`,
            }}
          >
            <NumberCard />
            <QRCard />
          </div>
        </Stage>

        {/* "el que ya tienes" badge */}
        {f < 104 && (
          <div
            style={{
              position: 'absolute',
              left: 690,
              top: 450,
              transform: `scale(${pop(f, 40, 9, 220) * tw(f, 96, 104, 1, 0, E.in)}) rotate(${6 - pop(f, 40) * 2}deg)`,
            }}
          >
            <Chip bg="#f4f0ea" color={GREEN} style={{fontSize: 26, padding: '12px 22px', boxShadow: '0 14px 30px rgba(0,0,0,.25)', border: 'none'}}>
              <Check size={26} /> <span style={{color: '#141210'}}>el que ya tienes</span>
            </Chip>
          </div>
        )}
        <Burst at={41} x={830} y={478} count={12} radius={150} seed={11} dur={20} size={11} />

        {/* vinculado chip */}
        {f >= 160 && f < 190 && (
          <div style={{position: 'absolute', left: 380, top: 905, transform: `scale(${pop(f, 160, 9, 220) * tw(f, 182, 190, 1, 0, E.in)})`}}>
            <Chip bg="#f4f0ea" style={{fontSize: 28, border: 'none', boxShadow: '0 14px 30px rgba(0,0,0,.25)'}}>
              <Check size={28} /> <span style={{color: '#141210'}}>vinculado</span>
            </Chip>
          </div>
        )}
        <Shockwave at={158} x={540} y={720} r={520} color={VERM} width={12} />

        {/* link + phone */}
        {f >= 196 && (
          <>
            <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
              <path d={`M${x1} ${ly} C ${x1 + 80} ${ly - 90}, ${x2 - 80} ${ly - 90}, ${x2} ${ly}`} stroke={VERM} strokeWidth={5} fill="none" strokeDasharray="14 12" strokeDashoffset={-f * 2} opacity={lineP > 0 ? 1 : 0} pathLength={undefined} style={{clipPath: `inset(0 ${(1 - lineP) * 100}% 0 0)`}} />
              {lineP >= 1 &&
                [0, 0.33, 0.66].map((o, i) => {
                  const t = ((f - 216) / 24 + o) % 1;
                  const u = 1 - t;
                  const bx = u * u * u * x1 + 3 * u * u * t * (x1 + 80) + 3 * u * t * t * (x2 - 80) + t * t * t * x2;
                  const by = u * u * u * ly + 3 * u * u * t * (ly - 90) + 3 * u * t * t * (ly - 90) + t * t * t * ly;
                  return <circle key={i} cx={bx} cy={by} r={9} fill={VERM} stroke="#fff" strokeWidth={3} />;
                })}
            </svg>
            <div style={{position: 'absolute', left: 740, top: 520, transform: `translateY(${(1 - ph) * 500}px) rotate(${4 - ph * 1 + Math.sin(f / 18) * 1}deg)`}}>
              <Phone lit={lit} wa={wa} />
            </div>
            <Burst at={237} x={840} y={686} count={16} radius={220} colors={[VERM, '#25D366', '#141210']} seed={17} />
            <Shockwave at={212} x={840} y={715} r={260} color={'#3fae6a'} width={10} />
          </>
        )}
      </Panels>
    </AbsoluteFill>
  );
};
