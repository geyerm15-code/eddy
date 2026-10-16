// Insert "tech": la prueba (Kai → Claude) → cambia capítulo → carrito a medias.
// Patrón: etiqueta + titular tipeado arriba; ilustración de línea en la zona 640–1360;
// los iconos aparecen ATENUADOS ~10 f antes de nombrarse y se ENCIENDEN en la palabra.
import React from 'react';
import {Arrow, AppTile, Box, Icon, Kicker, Tag, TypeHead, V, VScene} from '../tech';

export const SceneTechInsert: React.FC = () => (
  <VScene>
    {/* beat 1: la prueba (0–95) */}
    <Kicker text="Kai, mi agente" at={0} out={95} />
    <TypeHead text="La *prueba*" at={2} beats={[2, 18]} out={95} />
    <Icon name="star" x={120} y={760} size={130} at={4} on={20} out={95} color={V.lime} />
    <Box x={85} y={725} w={200} h={200} r={100} at={4} on={20} out={95} color={V.lime} />
    <Tag text="Kai" x={140} y={955} at={20} out={95} />
    <Arrow x1={300} y1={825} x2={700} y2={825} at={34} out={95} />
    <Box x={460} y={740} w={74} h={50} r={10} at={44} on={50} out={95} color={V.lime} draw={8}>
      <span style={{fontFamily: '"JB Mono"', fontSize: 26}}>?</span>
    </Box>
    <AppTile kind="claude" x={740} y={735} size={170} at={40} out={95} />
    <Box x={300} y={1010} w={210} h={64} r={12} at={62} on={66} out={95} draw={10}>
      <span style={{fontFamily: '"JB Mono"', fontSize: 20, letterSpacing: '0.18em'}}>SIN SKILL</span>
    </Box>
    <Box x={560} y={1010} w={210} h={64} r={12} at={62} on={80} out={95} color={V.lime} draw={10}>
      <span style={{fontFamily: '"JB Mono"', fontSize: 20, letterSpacing: '0.18em'}}>CON SKILL</span>
    </Box>

    {/* beat 2: carrito a medias (104–200) */}
    <Kicker text="La misma pregunta" at={104} />
    <TypeHead text="Carrito *a medias*" at={106} beats={[106, 140, 146]} />
    {/* la ilustración LLENA la zona 640–1360: iconos grandes (200–300 px), no miniaturas */}
    <Icon name="mail" x={64} y={690} size={210} at={108} on={118} />
    <Tag text="Correos" x={80} y={905} at={118} />
    <Arrow x1={300} y1={790} x2={420} y2={790} at={124} dur={8} />
    {[0, 1, 2].map((i) => <Icon key={i} name="user" x={450 + i * 190} y={700} size={160} at={110 + i * 2} on={128 + i * 3} />)}
    <Tag text="Clientes" x={760} y={905} at={134} />
    <Icon name="cart" x={64} y={1000} size={300} at={112} on={146} />
    <Box x={185} y={1040} w={110} h={86} r={12} at={150} on={150} color={V.salmon} draw={8} />
    <Tag text="A medias" x={100} y={1320} at={152} color={V.salmon} />
    <Icon name="store" x={690} y={1030} size={270} at={114} on={176} />
  </VScene>
);
