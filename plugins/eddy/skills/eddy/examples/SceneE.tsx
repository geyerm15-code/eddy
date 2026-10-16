import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Burst, Check, E, Fonts, GREEN, INK, Letters, MONO, MUTED, PAPER, Rays, SERIF, Shockwave, VERM, WIDE, pop, shake, tw} from '../lib';

// CTA overlay (alpha). Content only in y 60-520.
// word frames: comenta 4 · palabra 19 · PDF 32 · envío 61 · tutorial 73 · completo 100
const shadow = 'drop-shadow(0 6px 22px rgba(0,0,0,.55)) drop-shadow(0 2px 4px rgba(0,0,0,.4))';

const extrude = (n: number, color: string) =>
  Array.from({length: n}, (_, i) => `${i + 1}px ${i + 1}px 0 ${color}`).join(', ') + ', 18px 26px 30px rgba(0,0,0,.45)';

const Doc: React.FC<{f: number}> = ({f}) => {
  const fan = tw(f, 80, 96, 0, 1, E.expo);
  return (
    <div style={{position: 'relative', width: 170, height: 220}}>
      {[2, 1].map((k) => (
        <div
          key={k}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#d9d4cc',
            borderRadius: 12,
            transform: `rotate(${fan * k * 7}deg) translate(${fan * k * 10}px, ${fan * k * 4}px)`,
            boxShadow: '0 10px 24px rgba(0,0,0,.3)',
          }}
        />
      ))}
      <div style={{position: 'absolute', inset: 0, background: PAPER, borderRadius: 12, boxShadow: '0 16px 36px rgba(0,0,0,.4)', overflow: 'hidden', padding: 20, boxSizing: 'border-box'}}>
        <div style={{position: 'absolute', right: 0, top: 0, width: 40, height: 40, background: 'linear-gradient(225deg, #c9c3ba 50%, transparent 50%)'}} />
        <div style={{display: 'inline-block', background: VERM, color: '#fff', fontFamily: WIDE, fontWeight: 900, fontSize: 22, padding: '4px 10px', borderRadius: 6}}>PDF</div>
        <div style={{fontFamily: WIDE, fontWeight: 900, fontSize: 15, color: INK, marginTop: 14, letterSpacing: 1}}>TUTORIAL</div>
        {[0.9, 0.75, 0.85, 0.6, 0.8].map((w, i) => (
          <div key={i} style={{height: 7, width: `${w * 100}%`, background: '#cfc9c0', borderRadius: 4, marginTop: 10}} />
        ))}
      </div>
    </div>
  );
};

export const SceneE: React.FC = () => {
  const f = useCurrentFrame();
  const sh = shake(f, 34, 12, 16);
  const slam = tw(f, 27, 34, 0, 1, E.expoIn);
  const pill = pop(f, 38, 13, 170);
  const typed = 'PDF'.slice(0, Math.max(0, Math.floor((f - 44) / 2.5)));
  const send = f >= 61 ? 1 + Math.max(0, 1 - (f - 61) / 8) * 0.3 : 1;
  const plane = tw(f, 61, 82, 0, 1, E.in);
  const doc = pop(f, 70, 12, 140);
  const ok = pop(f, 100, 9, 220);

  // plane path from send button to top-right
  const sx = 690;
  const sy = 482;
  const px = sx + plane * 360;
  const py = sy - plane * 380 + Math.sin(plane * Math.PI) * -60;

  return (
    <AbsoluteFill>
      <Fonts />
      <div style={{position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg)`}}>
        {/* Comenta */}
        <div style={{position: 'absolute', left: 90, top: 70, fontFamily: SERIF, fontWeight: 800, fontSize: 104, color: '#fff', filter: shadow, letterSpacing: -1}}>
          <Letters text="Comenta" at={2} stagger={1.4} rot={10} />
        </div>

        {/* PDF slam */}
        {f >= 27 && (
          <div
            style={{
              position: 'absolute',
              left: 80,
              top: 204,
              fontFamily: WIDE,
              fontWeight: 900,
              fontSize: 230,
              lineHeight: 1,
              color: VERM,
              textShadow: extrude(14, '#9e2603'),
              transform: `scale(${3.2 - slam * 2.2}) rotate(${-4 - (1 - slam) * 18}deg)`,
              transformOrigin: '40% 55%',
              opacity: slam,
            }}
          >
            PDF
          </div>
        )}
        <Shockwave at={34} x={330} y={300} r={420} color="#fff" width={14} />
        <Rays at={34} x={330} y={320} r0={240} r1={300} n={14} color={VERM} hold={false} />
        <Burst at={34} x={330} y={300} count={26} radius={480} colors={[VERM, '#fff', INK]} seed={99} dur={26} size={16} />

        {/* comment field */}
        <div
          style={{
            position: 'absolute',
            left: 90,
            top: 444,
            width: 640,
            height: 76,
            borderRadius: 38,
            background: PAPER,
            boxShadow: '0 16px 36px rgba(0,0,0,.4)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px 0 32px',
            boxSizing: 'border-box',
            transform: `scaleX(${pill}) translateY(${(1 - pill) * 30}px)`,
            transformOrigin: '0 50%',
            opacity: Math.min(1, pill * 2),
            fontFamily: MONO,
            fontSize: 28,
          }}
        >
          <span style={{flex: 1, color: typed ? INK : MUTED}}>
            {typed || 'Añade un comentario…'}
            {typed && Math.floor(f / 7) % 2 === 0 && f < 61 ? '|' : ''}
          </span>
          <div style={{width: 56, height: 56, borderRadius: 28, background: VERM, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${send})`}}>
            <svg width={28} height={28} viewBox="0 0 24 24">
              <path d="M3 11.5 L21 3 L13.5 21 L11 13 Z" fill="#fff" />
            </svg>
          </div>
        </div>

        {/* paper plane flight + trail */}
        {plane > 0 && plane < 1 && (
          <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
            <path
              d={`M${sx} ${sy} Q ${sx + 160} ${sy - 120}, ${px} ${py}`}
              stroke="#fff"
              strokeWidth={4}
              strokeDasharray="10 10"
              fill="none"
              opacity={0.85}
            />
            <path d="M-22 6 L22 -8 L-6 22 L-4 6 Z" fill="#fff" transform={`translate(${px} ${py}) rotate(-38)`} />
          </svg>
        )}

        {/* tutorial doc */}
        {f >= 70 && (
          <div
            style={{
              position: 'absolute',
              left: 800,
              top: 150,
              transform: `translate(${(1 - doc) * 400}px, ${(1 - doc) * -200}px) rotate(${8 + (1 - doc) * 50 + Math.sin(f / 14) * 1.5}deg)`,
            }}
          >
            <Doc f={f} />
            <div style={{position: 'absolute', right: -22, bottom: -22, transform: `scale(${ok})`}}>
              <div style={{width: 70, height: 70, borderRadius: 35, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(0,0,0,.35)'}}>
                <Check size={40} color="#fff" width={4} />
              </div>
            </div>
          </div>
        )}
        <Burst at={100} x={990} y={400} count={14} radius={160} colors={[GREEN, '#fff', VERM]} seed={31} dur={20} size={11} />
        <div style={{position: 'absolute', left: 715, top: 412, width: 330, textAlign: 'center', fontFamily: WIDE, fontWeight: 500, fontSize: 16, letterSpacing: 3, color: '#fff', filter: shadow, opacity: tw(f, 76, 86, 0, 1)}}>
          <Letters text="TUTORIAL COMPLETO" at={76} stagger={0.6} dur={10} rot={0} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
