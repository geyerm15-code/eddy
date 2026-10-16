import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Burst, E, Fonts, INK, ITAL, Letters, PAPER, Rays, SERIF, Scribble, Shockwave, Spark, VERM, WIDE, pop, shake, tw} from '../lib';

// Hook overlay (alpha). Content only in y 60-520, above the speaker's head.
// word frames: convertir 20 · Claude 41 · asistente 62 · IA 92 · negocio 118
export const SceneA: React.FC = () => {
  const f = useCurrentFrame();
  const DUR = 158;
  const sh = shake(f, 118, 12, 12);
  const exit = tw(f, DUR - 12, DUR, 0, 1, E.expoIn);
  const exitY = -exit * 420;
  const exitBlur = exit * 18;

  // Claude pill
  const pill = pop(f, 36, 13, 190);
  const pillW = 120 + 300 * tw(f, 36, 50, 0, 1, E.expo);
  const sparkRot = tw(f, 36, 58, -540, 0, E.expo);
  const pillDrop = tw(f, 60, 74, 0, 1, E.expoInOut); // pill nudges up when "asistente" arrives

  // intro streak
  const streak = tw(f, 0, 12, 0, 1, E.expo);
  const streakOut = tw(f, 10, 22, 0, 1, E.expoIn);

  // "de IA" chip flip
  const chip = pop(f, 90, 10, 200);
  // "tu negocio" bar wipe
  const bar = tw(f, 114, 124, 0, 1, E.expo);

  const textShadow = 'drop-shadow(0 6px 22px rgba(0,0,0,.55)) drop-shadow(0 2px 4px rgba(0,0,0,.4))';

  return (
    <AbsoluteFill>
      <Fonts />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${sh.x}px, ${sh.y + exitY}px) rotate(${sh.r}deg)`,
          filter: exitBlur > 0.2 ? `blur(${exitBlur}px)` : undefined,
          opacity: 1 - exit * 0.9,
        }}
      >
        {/* intro light streak */}
        <div
          style={{
            position: 'absolute',
            top: 128,
            left: 1080 * streakOut,
            width: 1080 * (streak - streakOut),
            height: 6,
            background: `linear-gradient(90deg, transparent, ${VERM} 30%, #fff)`,
            borderRadius: 3,
            boxShadow: `0 0 24px ${VERM}`,
          }}
        />

        {/* kicker */}
        <div
          style={{
            position: 'absolute',
            top: 96,
            width: 1080,
            textAlign: 'center',
            fontFamily: WIDE,
            fontWeight: 500,
            fontSize: 26,
            letterSpacing: 8,
            color: '#fff',
            filter: textShadow,
            opacity: tw(f, 60, 72, 1, 0),
          }}
        >
          <Letters text="CONVIERTE A" at={8} stagger={1} dur={12} rot={0} />
        </div>

        {/* Claude pill */}
        <Shockwave at={40} x={540} y={215} r={380} color={VERM} />
        <Burst at={40} x={540} y={215} count={22} radius={420} colors={[VERM, '#fff', '#d97757']} seed={9} />
        <div
          style={{
            position: 'absolute',
            left: 540 - pillW / 2,
            top: 160 - pillDrop * 60,
            width: pillW,
            height: 112,
            borderRadius: 999,
            background: PAPER,
            transform: `scale(${pill * (1 - pillDrop * 0.16)}) rotate(${(1 - pill) * -10 - 2}deg)`,
            boxShadow: '0 4px 8px rgba(0,0,0,.25), 0 24px 50px rgba(0,0,0,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            overflow: 'hidden',
          }}
        >
          <Spark size={62} style={{transform: `rotate(${sparkRot}deg)`}} />
          <div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 76, color: INK, letterSpacing: -1}}>
            <Letters text="Claude" at={42} stagger={1.5} rot={14} />
          </div>
          {/* gloss sweep */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 120,
              left: tw(f, 50, 70, -200, pillW + 100, E.inOut),
              background: 'linear-gradient(100deg, transparent, rgba(255,255,255,.75), transparent)',
              transform: 'skewX(-20deg)',
            }}
          />
        </div>

        {/* asistente */}
        <div
          style={{
            position: 'absolute',
            top: 236,
            left: 0,
            width: 1080,
            display: 'flex',
            justifyContent: 'center',
            filter: textShadow,
          }}
        >
          <div style={{position: 'relative', transform: `translateX(${-70 * chip}px)`}}>
            <div style={{fontFamily: ITAL, fontStyle: 'italic', fontWeight: 600, fontSize: 168, color: VERM, lineHeight: 1}}>
              <Letters text="asistente" at={60} stagger={1.6} rot={16} dur={18} />
            </div>
            <div style={{position: 'absolute', left: 10, top: 168}}>
              <Scribble width={560} at={72} dur={14} color="#fff" stroke={8} seed={4} />
            </div>
          </div>
        </div>

        {/* de IA chip (3D flip in) */}
        <div style={{position: 'absolute', left: 820, top: 228, perspective: 800}}>
          <div
            style={{
              transform: `rotateY(${(1 - chip) * 100}deg) rotate(${6 - chip * 2}deg) scale(${0.6 + chip * 0.4})`,
              opacity: f >= 90 ? 1 : 0,
              background: INK,
              color: PAPER,
              fontFamily: WIDE,
              fontWeight: 900,
              fontSize: 40,
              padding: '14px 22px',
              borderRadius: 16,
              boxShadow: '0 20px 40px rgba(0,0,0,.45)',
              whiteSpace: 'nowrap',
            }}
          >
            de <span style={{color: VERM}}>IA</span>
          </div>
        </div>
        <Burst at={92} x={900} y={260} count={12} radius={190} colors={[VERM, '#fff']} seed={21} dur={20} size={12} />

        {/* tu negocio bar */}
        <div style={{position: 'absolute', top: 436, left: 0, width: 1080, display: 'flex', justifyContent: 'center'}}>
          <div style={{position: 'relative', height: 84, overflow: 'hidden', transform: `rotate(-2deg)`}}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: VERM,
                transform: `scaleX(${bar})`,
                transformOrigin: '0 50%',
                boxShadow: '0 16px 36px rgba(0,0,0,.4)',
              }}
            />
            <div style={{position: 'relative', padding: '14px 30px', fontFamily: WIDE, fontWeight: 900, fontSize: 48, letterSpacing: 2, color: '#fff', whiteSpace: 'nowrap'}}>
              <Letters text="DE TU NEGOCIO" at={115} stagger={0.5} dur={10} rot={0} />
            </div>
          </div>
        </div>
        <Rays at={120} x={196} y={470} r0={34} r1={78} n={7} color="#fff" dur={12} hold />
        <Rays at={121} x={884} y={470} r0={34} r1={78} n={7} color="#fff" dur={12} hold />
      </div>
    </AbsoluteFill>
  );
};
