// La guía: "Te creé una guía" → "7 nichos rentables" con la lista que se enciende + rayo "urgente".
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Box, Icon, Kicker, Tag, TypeHead, V, VScene, tv} from '../tech';

const ROWS = ['Clínicas dentales', 'Inmobiliarias', 'Tiendas online'];

const Row: React.FC<{i: number}> = ({i}) => {
  const f = useCurrentFrame();
  const at = 50 + i * 4, on = 89 + i * 5;
  const named = i < ROWS.length;
  return (
    <Box x={420} y={760 + i * 84} w={600} h={68} r={12} at={at} on={on} color={named ? V.lime : V.line} draw={10}>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, width: '100%', paddingLeft: 24}}>
        <span style={{fontFamily: '"JB Mono"', fontWeight: 500, fontSize: 26, letterSpacing: '0.1em'}}>0{i + 1}</span>
        {named
          ? <span style={{fontFamily: '"Inter"', fontWeight: 600, fontSize: 32, color: V.white}}>{ROWS[i]}</span>
          : <div style={{height: 6, borderRadius: 3, background: 'currentColor', opacity: 0.6,
              width: 300 * tv(f, on, on + 10, 0.3, [0.8, 0.62, 0.9, 0.7][i - 3])}} />}
      </div>
    </Box>
  );
};

export const SceneTechLista: React.FC = () => (
  <VScene>
    <Kicker text="Guía gratis" at={2} />
    <TypeHead text="Te creé una *guía*" at={2} beats={[2, 7, 16, 23]} out={44} />
    <TypeHead text={'*7* nichos\nrentables'} at={53} beats={[53, 68, 89]} />
    <Icon name="book" x={60} y={780} size={300} at={6} on={23} color={V.lime} />
    {Array.from({length: 7}).map((_, i) => <Row key={i} i={i} />)}
    <Icon name="bolt" x={140} y={1110} size={150} at={140} on={184} color={V.lime} />
    <Tag text="Urgente" x={130} y={1290} at={150} on={184} color={V.lime} />
  </VScene>
);
