import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  BORDER,
  Burst,
  Check,
  Chip,
  E,
  Fonts,
  GREEN,
  Headline,
  INK,
  MONO,
  MUTED,
  PAPER,
  Panels,
  Shockwave,
  Spark,
  Stage,
  VERM,
  WIDE,
  cardStyle,
  pop,
  tw,
} from '../lib';

// Insert D — el asistente trabajando. 177 frames.
// local word frames: reportes 20 · recordatorios 55 · responder 91 · clientes 110 · automatizar 134 · tareas 163
const DUR = 177;
const GAP = 16;
const VIEW_H = 470;

type Msg = {at: number; h: number; side: 'u' | 'b'; render: (f: number) => React.ReactNode};

const Bubble: React.FC<{side: 'u' | 'b'; children: React.ReactNode; w?: number}> = ({side, children, w}) => (
  <div
    style={{
      alignSelf: side === 'u' ? 'flex-end' : 'flex-start',
      maxWidth: 600,
      width: w,
      background: side === 'u' ? PAPER : '#24211e',
      color: side === 'u' ? INK : '#ece8e2',
      borderRadius: side === 'u' ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
      padding: '16px 22px',
      fontSize: 25,
      fontFamily: MONO,
      boxShadow: '0 8px 20px rgba(0,0,0,.25)',
      border: side === 'b' ? `1.5px solid ${BORDER}` : 'none',
    }}
  >
    {children}
  </div>
);

const Ticks: React.FC<{f: number; at: number}> = ({f, at}) => (
  <span style={{marginLeft: 12, fontSize: 18, color: f > at + 8 ? VERM : '#9a948c'}}>✓✓</span>
);

const Bell: React.FC<{rot: number}> = ({rot}) => (
  <svg width={46} height={46} viewBox="0 0 24 24" style={{transform: `rotate(${rot}deg)`, transformOrigin: '50% 10%'}}>
    <path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6z" fill={VERM} />
    <circle cx={12} cy={19.5} r={2.2} fill={VERM} />
  </svg>
);

const Gear: React.FC<{rot: number}> = ({rot}) => (
  <svg width={46} height={46} viewBox="0 0 24 24" style={{transform: `rotate(${rot}deg)`}}>
    {Array.from({length: 8}, (_, i) => (
      <rect key={i} x={10.5} y={1.5} width={3} height={5} rx={1} fill={VERM} transform={`rotate(${i * 45} 12 12)`} />
    ))}
    <circle cx={12} cy={12} r={6.5} fill={VERM} />
    <circle cx={12} cy={12} r={2.6} fill="#24211e" />
  </svg>
);

const MSGS: Msg[] = [
  {at: 10, h: 66, side: 'u', render: (f) => <Bubble side="u">Reporte de ventas de hoy<Ticks f={f} at={10} /></Bubble>},
  {
    at: 20,
    h: 196,
    side: 'b',
    render: (f) => {
      const pct = Math.round(tw(f, 22, 44, 0, 18, E.out));
      const bars = [0.42, 0.58, 0.5, 0.74, 0.66, 0.96];
      return (
        <Bubble side="b" w={560}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
            <span style={{color: MUTED, fontSize: 20}}>ventas · hoy</span>
            <span style={{fontFamily: WIDE, fontWeight: 900, fontSize: 34, color: GREEN}}>+{pct}%</span>
          </div>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 14, height: 110, marginTop: 10}}>
            {bars.map((b, i) => (
              <div key={i} style={{flex: 1, height: `${b * 100 * tw(f, 22 + i * 2.5, 36 + i * 2.5, 0, 1, E.expo)}%`, background: i === bars.length - 1 ? VERM : '#4a4540', borderRadius: 6}} />
            ))}
          </div>
        </Bubble>
      );
    },
  },
  {at: 46, h: 66, side: 'u', render: (f) => <Bubble side="u">Recuérdale a Laura la reunión<Ticks f={f} at={46} /></Bubble>},
  {
    at: 55,
    h: 104,
    side: 'b',
    render: (f) => (
      <Bubble side="b" w={560}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <Bell rot={f < 85 ? Math.sin(f * 1.6) * 22 * Math.max(0, 1 - (f - 57) / 28) : 0} />
          <div>
            <div>Recordatorio · 10:00</div>
            <div style={{marginTop: 6, transform: `scale(${pop(f, 66, 10, 220)})`, transformOrigin: '0 50%'}}>
              <Chip style={{fontSize: 18, padding: '4px 12px'}}>
                <Check size={18} /> programado
              </Chip>
            </div>
          </div>
        </div>
      </Bubble>
    ),
  },
  {
    at: 92,
    h: 118,
    side: 'b',
    render: (f) => (
      <Bubble side="b" w={560}>
        <div style={{color: MUTED, fontSize: 20}}>clientes respondidos</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 10}}>
          {['AM', 'JR', 'LC'].map((ini, i) => {
            const p = pop(f, 102 + i * 5, 9, 220);
            return (
              <div key={ini} style={{position: 'relative', transform: `scale(${p})`}}>
                <div style={{width: 54, height: 54, borderRadius: 27, background: ['#5b4b8a', '#2f6f8f', '#8a5b3c'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: WIDE, fontWeight: 900, fontSize: 18, color: '#fff'}}>
                  {ini}
                </div>
                <div style={{position: 'absolute', right: -6, bottom: -4, width: 24, height: 24, borderRadius: 12, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <Check size={16} color="#fff" width={4} />
                </div>
              </div>
            );
          })}
          <span style={{fontFamily: WIDE, fontWeight: 900, fontSize: 36, marginLeft: 12}}>× {Math.min(3, Math.max(0, Math.floor((f - 100) / 5)))}</span>
        </div>
      </Bubble>
    ),
  },
  {
    at: 128,
    h: 118,
    side: 'b',
    render: (f) => {
      const p = tw(f, 134, 160, 0, 1, E.inOut);
      return (
        <Bubble side="b" w={560}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <Gear rot={f * 9} />
            <div style={{flex: 1}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Facturas automáticas</span>
                <span style={{color: p >= 1 ? GREEN : MUTED}}>{p >= 1 ? '✓' : `${Math.round(p * 100)}%`}</span>
              </div>
              <div style={{marginTop: 12, height: 10, borderRadius: 5, background: '#3a3633', overflow: 'hidden'}}>
                <div style={{width: `${p * 100}%`, height: '100%', background: p >= 1 ? GREEN : VERM}} />
              </div>
            </div>
          </div>
        </Bubble>
      );
    },
  },
];

const COUNT_AT = [40, 72, 120, 162];

export const SceneD: React.FC = () => {
  const f = useCurrentFrame();
  const enter = pop(f, 8, 13, 130);
  const content = MSGS.reduce((acc, m) => acc + tw(f, m.at, m.at + 12, 0, m.h + GAP, E.expo), 0);
  const scroll = Math.max(0, content - VIEW_H);
  const count = COUNT_AT.filter((t) => f >= t).length;
  const lastBump = COUNT_AT.filter((t) => f >= t).pop() ?? -100;
  const bump = 1 + Math.max(0, 1 - (f - lastBump) / 10) * 0.35;

  let y = 0;
  return (
    <AbsoluteFill>
      <Fonts />
      <Panels dur={DUR} step="PASO 03" label="PONLO A TRABAJAR">
        <Headline a="Tu asistente" b="trabaja." at={4} bIndent={140} />

        {/* task counter */}
        <div style={{position: 'absolute', right: 80, top: 118, textAlign: 'right', opacity: tw(f, 14, 24, 0, 1)}}>
          <div style={{fontFamily: WIDE, fontWeight: 900, fontSize: 120, color: VERM, lineHeight: 1, transform: `scale(${bump})`, transformOrigin: '100% 100%'}}>{count}</div>
          <div style={{fontFamily: WIDE, fontWeight: 500, fontSize: 18, letterSpacing: 3, color: INK, marginTop: 6}}>TAREAS HECHAS</div>
        </div>
        {COUNT_AT.map((t, i) => (
          <Burst key={t} at={t} x={950} y={180} count={10} radius={130} seed={60 + i} dur={18} size={10} colors={[VERM, INK]} />
        ))}

        <Stage persp={1800}>
          <div
            style={{
              ...cardStyle,
              position: 'absolute',
              left: 110,
              top: 420,
              width: 860,
              height: 640,
              overflow: 'hidden',
              transform: `translateY(${(1 - enter) * 900}px) rotateX(${7 + (1 - enter) * 40}deg) rotateY(${-5 + Math.sin(f / 30) * 1.5}deg) rotateZ(-1deg)`,
            }}
          >
            {/* header */}
            <div style={{height: 92, display: 'flex', alignItems: 'center', gap: 16, padding: '0 30px', borderBottom: `1.5px solid ${BORDER}`, background: '#1f1c1a'}}>
              <div style={{width: 54, height: 54, borderRadius: 27, background: '#2a2622', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Spark size={32} style={{transform: `rotate(${f * 2}deg)`}} />
              </div>
              <div style={{flex: 1}}>
                <div style={{fontSize: 26, color: '#f4f0ea'}}>Claude</div>
                <div style={{fontSize: 18, color: GREEN}}>{(f > 12 && f < 22) || (f > 50 && f < 56) || (f > 84 && f < 92) || (f > 120 && f < 128) ? 'escribiendo…' : 'en línea'}</div>
              </div>
              <div style={{fontSize: 22, color: MUTED}}>09:{String(29 + Math.floor(f / 40)).padStart(2, '0')}</div>
            </div>
            {/* thread */}
            <div style={{position: 'absolute', left: 0, right: 0, top: 92, bottom: 0, overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: 30, right: 30, top: 24 - scroll}}>
                {MSGS.map((m, i) => {
                  const p = pop(f, m.at, 12, 200);
                  const top = y;
                  y += m.h + GAP;
                  if (f < m.at) return null;
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        top,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        transform: `translateY(${(1 - p) * 60}px) scale(${0.8 + p * 0.2})`,
                        transformOrigin: m.side === 'u' ? '100% 100%' : '0 100%',
                        opacity: Math.min(1, p * 1.5),
                      }}
                    >
                      {m.render(f)}
                    </div>
                  );
                })}
              </div>
              <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 60, background: 'linear-gradient(#1a1817, transparent)'}} />
            </div>
          </div>
        </Stage>
        <Shockwave at={162} x={950} y={170} r={220} width={10} />
      </Panels>
    </AbsoluteFill>
  );
};
