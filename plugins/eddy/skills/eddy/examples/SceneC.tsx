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
  ITAL,
  MUTED,
  Panels,
  Rays,
  Shockwave,
  Spark,
  Stage,
  VERM,
  WIDE,
  WindowDots,
  cardStyle,
  pop,
  shake,
  tw,
} from '../lib';

// Insert C — modelo + API key. 241 frames.
// local word frames: modelo 16 · Claude 37 · Sonnet 104 · Opus 133 · introduces 149 · clave 173 · API 184 · Anthropic 204 · listo 223
const DUR = 241;

const MODELS = [
  {name: 'Haiku', tag: 'ultra rápido', speed: 0.96, power: 0.42},
  {name: 'Sonnet', tag: 'rápido y eficiente', speed: 0.78, power: 0.76},
  {name: 'Opus', tag: 'máxima capacidad', speed: 0.55, power: 1},
];

const Meter: React.FC<{label: string; v: number; on: number}> = ({label, v, on}) => (
  <div style={{marginTop: 14}}>
    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 17, color: MUTED, letterSpacing: 2}}>
      <span>{label}</span>
      <span style={{color: on > 0.5 ? '#f4f0ea' : MUTED}}>{Math.round(v * on * 100)}</span>
    </div>
    <div style={{marginTop: 8, height: 8, borderRadius: 4, background: '#2a2724', overflow: 'hidden'}}>
      <div style={{width: `${v * on * 100}%`, height: '100%', background: VERM, borderRadius: 4}} />
    </div>
  </div>
);

const ModelCard: React.FC<{i: number; h: number; sel: number; spin: number}> = ({i, h, sel, spin}) => {
  const m = MODELS[i];
  return (
    <div
      style={{
        ...cardStyle,
        width: 440,
        height: 340,
        padding: '28px 34px',
        boxSizing: 'border-box',
        border: `2px solid ${sel > 0.01 ? VERM : BORDER}`,
        boxShadow: `${cardStyle.boxShadow}, 0 0 ${sel * 60}px rgba(244,60,6,${sel * 0.45})`,
        position: 'relative',
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <WindowDots />
        <span style={{fontSize: 16, color: MUTED, letterSpacing: 2}}>MODELO 0{i + 1}</span>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 26}}>
        <Spark size={48} style={{transform: `rotate(${spin}deg)`}} />
        <span style={{fontFamily: WIDE, fontWeight: 900, fontSize: 50, color: '#f4f0ea'}}>{m.name}</span>
      </div>
      <div style={{fontSize: 19, color: MUTED, marginTop: 8}}>{m.tag}</div>
      <Meter label="VELOCIDAD" v={m.speed} on={h} />
      <Meter label="CAPACIDAD" v={m.power} on={h} />
      {sel > 0.01 && (
        <div style={{position: 'absolute', right: -18, top: -22, transform: `scale(${sel}) rotate(8deg)`}}>
          <div style={{width: 58, height: 58, borderRadius: 29, background: VERM, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(0,0,0,.35)'}}>
            <Check size={34} color="#fff" width={4} />
          </div>
        </div>
      )}
    </div>
  );
};

const KeyGlyph: React.FC<{size: number; rot: number}> = ({size, rot}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{transform: `rotate(${rot}deg)`}}>
    <circle cx={22} cy={32} r={12} stroke={VERM} strokeWidth={6} />
    <path d="M34 32 H58 M50 32 V43 M58 32 V41" stroke={VERM} strokeWidth={6} strokeLinecap="round" />
  </svg>
);

const ApiCard: React.FC = () => {
  const f = useCurrentFrame();
  const prefix = 'sk-ant-api03-';
  const nPre = Math.max(0, Math.min(prefix.length, Math.floor(f - 163)));
  const nDots = Math.max(0, Math.min(18, Math.floor((f - 177) * 1.3)));
  const typing = f >= 163 && f < 194;
  const caret = typing || Math.floor(f / 8) % 2 === 0;
  const focus = tw(f, 160, 166, 0, 1);
  const keyTurn = tw(f, 196, 206, 0, 90, E.back);
  const ok = pop(f, 203, 10, 200);
  return (
    <div style={{...cardStyle, width: 800, height: 400, padding: '30px 44px', boxSizing: 'border-box'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <WindowDots />
        <span style={{fontSize: 18, color: MUTED, letterSpacing: 2}}>console · api keys</span>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 34}}>
        <KeyGlyph size={56} rot={keyTurn} />
        <span style={{fontFamily: WIDE, fontWeight: 900, fontSize: 40, color: '#f4f0ea'}}>Conectar Claude</span>
      </div>
      <div style={{fontSize: 18, color: MUTED, letterSpacing: 3, marginTop: 30}}>API KEY</div>
      <div
        style={{
          marginTop: 12,
          height: 82,
          borderRadius: 16,
          border: `2px solid ${focus > 0.5 ? VERM : BORDER}`,
          boxShadow: `0 0 ${focus * 30}px rgba(244,60,6,${focus * 0.35})`,
          background: '#131211',
          display: 'flex',
          alignItems: 'center',
          padding: '0 26px',
          fontSize: 30,
          color: '#f4f0ea',
          letterSpacing: 1,
        }}
      >
        <span>{prefix.slice(0, nPre)}</span>
        <span style={{color: VERM, letterSpacing: 3}}>{'•'.repeat(nDots)}</span>
        <span style={{width: 3, height: 38, background: caret ? '#f4f0ea' : 'transparent', marginLeft: 4}} />
      </div>
      <div style={{marginTop: 22, transform: `scale(${ok})`, transformOrigin: '0 50%'}}>
        <Chip>
          <Check size={24} /> Anthropic · conectado
        </Chip>
      </div>
    </div>
  );
};

export const SceneC: React.FC = () => {
  const f = useCurrentFrame();
  // carousel focus index (continuous)
  const k =
    tw(f, 6, 42, -3.2, 0, E.expo) + tw(f, 98, 112, 0, 1, E.expoInOut) + tw(f, 127, 141, 0, 1, E.expoInOut);
  const spinVel = Math.abs(tw(f, 6, 30, 1, 0, E.out));
  const sparkSpin = tw(f, 34, 56, 0, 360, E.expo);
  const dive = tw(f, 142, 158, 0, 1, E.expoIn);
  const api = tw(f, 152, 176, 0, 1, E.expo);
  const sh = shake(f, 225, 14, 18);
  const stamp = tw(f, 219, 225, 0, 1, E.expoIn);
  const R = 640;
  const STEP = 34;

  return (
    <AbsoluteFill>
      <Fonts />
      <Panels dur={DUR} step="PASO 02" label="MODELO + API KEY">
        <div style={{position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg)`}}>
          <Headline a="Elige tu" b="modelo" at={6} out={132} />
          <Headline a="Pega tu" b="clave API" at={152} bIndent={60} />

          {/* 3D carousel */}
          {dive < 1 && (
            <Stage persp={1600}>
              <div
                style={{
                  position: 'absolute',
                  left: 540,
                  top: 720,
                  transformStyle: 'preserve-3d',
                  transform: `translateZ(${-R + dive * 1400}px) rotateX(-6deg) scale(1.38)`,
                }}
              >
                {MODELS.map((_, i) => {
                  const a = (i - k) * STEP;
                  const h = Math.max(0, 1 - Math.abs(k - i));
                  const sel = i === 1 ? pop(f, 104, 10, 220) * tw(f, 126, 134, 1, 0) : i === 2 ? pop(f, 134, 10, 220) : 0;
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: -220,
                        top: -170,
                        transformStyle: 'preserve-3d',
                        transform: `rotateY(${a}deg) translateZ(${R}px)`,
                        opacity: (0.45 + h * 0.55) * (1 - dive),
                        filter: spinVel > 0.05 || dive > 0.05 ? `blur(${spinVel * 6 + dive * 14}px)` : undefined,
                      }}
                    >
                      <ModelCard i={i} h={h} sel={sel} spin={sparkSpin + (f > 56 ? (f - 56) * 0.6 : 0)} />
                    </div>
                  );
                })}
              </div>
            </Stage>
          )}
          <Burst at={37} x={420} y={640} count={14} radius={200} colors={[VERM, '#d97757', '#141210']} seed={5} dur={22} size={12} />
          <Shockwave at={105} x={540} y={730} r={420} width={10} />
          <Burst at={134} x={540} y={730} count={24} radius={460} seed={41} />
          <Shockwave at={134} x={540} y={730} r={520} />

          {/* API card */}
          {f >= 152 && (
            <Stage persp={1600}>
              <div
                style={{
                  position: 'absolute',
                  left: 140,
                  top: 500,
                  transform: `translateZ(${(1 - api) * -900}px) rotateX(${(1 - api) * 40 + 6}deg) rotateY(${-8 + Math.sin(f / 25) * 2}deg) rotateZ(-1.2deg)`,
                  opacity: api,
                }}
              >
                <ApiCard />
              </div>
            </Stage>
          )}

          {/* ¡Listo! stamp */}
          {f >= 219 && (
            <div
              style={{
                position: 'absolute',
                left: 630,
                top: 820,
                transform: `scale(${2.8 - stamp * 1.8}) rotate(${-8 - (1 - stamp) * 12}deg)`,
                opacity: stamp,
                background: VERM,
                color: '#fff',
                fontFamily: ITAL,
                fontStyle: 'italic',
                fontWeight: 600,
                fontSize: 92,
                padding: '6px 34px 16px',
                borderRadius: 14,
                boxShadow: '0 22px 46px rgba(0,0,0,.35)',
              }}
            >
              ¡Listo!
            </div>
          )}
          <Rays at={225} x={800} y={890} r0={170} r1={250} n={12} color={VERM} />
          <Burst at={225} x={800} y={890} count={36} radius={520} colors={[VERM, '#141210', '#fff', GREEN]} seed={77} dur={30} size={18} />
          <Shockwave at={225} x={800} y={890} r={480} color="#141210" width={10} />
        </div>
      </Panels>
    </AbsoluteFill>
  );
};
