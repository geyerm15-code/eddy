import React, {useEffect, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import data from './captions.json';
import {VFonts, V, LAY, BODY} from './tech';
import brand from './brand.json';

const VERMILION = brand.colors.accent;
const SHADOW = '0 2px 3px rgba(0,0,0,.55), 0 6px 22px rgba(0,0,0,.55), 0 0 40px rgba(0,0,0,.25)';


const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (x: number) => Math.min(1, Math.max(0, x));

const BrandCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    (async () => {
      const faces = [
        new FontFace('CapDisplay', `url(${staticFile(brand.fonts.display)})`, {weight: '100 900'}),
        new FontFace('CapAccent', `url(${staticFile(brand.fonts.accent)})`, {weight: '100 900', style: 'italic'}),
      ];
      for (const f of faces) { await f.load(); document.fonts.add(f); }
      continueRender(handle);
    })().catch((e) => cancelRender(e));
  }, [handle]);

  const cue = data.cues.find((c) => t >= c.start && t < c.end);
  return (
    <AbsoluteFill style={{background: 'transparent'}}>
      {cue && (
        <div style={{position: 'absolute', left: 60, right: 60, top: 1170, height: 300,
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center',
          alignItems: 'baseline', columnGap: 22, rowGap: 0}}>
          {cue.words.map((w, i) => {
            const appear = Math.max(cue.start, w.start - 0.05);
            const p = clamp((t - appear) / 0.18);
            const pe = easeOutBack(p), po = easeOutCubic(p);
            const key = w.key;
            return (
              <span key={i} style={{
                fontFamily: key ? 'CapAccent' : 'CapDisplay',
                fontStyle: key ? 'italic' : 'normal',
                fontWeight: key ? 600 : 800,
                fontSize: key ? 112 : 90,
                lineHeight: 1.08,
                letterSpacing: key ? 0 : -1.5,
                color: key ? VERMILION : '#ffffff',
                textShadow: SHADOW,
                opacity: po,
                filter: `blur(${(1 - po) * 6}px)`,
                transform: `translateY(${(1 - pe) * 26}px) scale(${0.82 + 0.18 * pe}) rotate(${key ? -2 : 0}deg)`,
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}>{w.text}</span>
            );
          })}
        </div>
      )}
    </AbsoluteFill>
  );
};

// Estilo "tech": cue completo en blanco, Inter 650, centrado, baseline y≈1502; sin palabra clave
// (el acento lo ponen los gráficos). Entra en 4 frames con un leve ascenso.
const TechCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cue = data.cues.find((c) => t >= c.start && t < c.end);
  const p = cue ? clamp((t - cue.start) / 0.13) : 0;
  return (
    <AbsoluteFill style={{background: 'transparent'}}>
      <VFonts />
      {cue && (
        <div style={{position: 'absolute', left: 60, right: 60, top: LAY.captBaseline - 62, height: 80, display: 'flex',
          justifyContent: 'center', alignItems: 'baseline', fontFamily: BODY, fontWeight: 650, fontSize: 63,
          letterSpacing: '-0.012em', color: V.capt, whiteSpace: 'nowrap', opacity: easeOutCubic(p),
          transform: `translateY(${(1 - easeOutCubic(p)) * 8}px)`,
          textShadow: '0 2px 4px rgba(0,0,0,.55), 0 4px 18px rgba(0,0,0,.45)'}}>
          {cue.words.map((w) => w.text).join(' ')}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const Captions: React.FC = () => ((data as {style?: string}).style === 'tech' ? <TechCaptions /> : <BrandCaptions />);
