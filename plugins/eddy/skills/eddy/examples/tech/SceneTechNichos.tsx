// Capítulos "NICHO 01/02/03": kicker numerado + titular por nicho + mini-flujo de línea (entrada → acción → resultado ✓).
// Del Reel "nichos $500/mes" (oct 2026). Cada capítulo sale (out) 6–8 f antes de que entre el siguiente.
import React from 'react';
import {Arrow, Box, Icon, Kicker, Tag, TypeHead, V, VScene} from '../tech';

const mono = {fontFamily: '"JB Mono"', fontWeight: 500} as const;

export const SceneTechNichos: React.FC = () => (
  <VScene>
    {/* NICHO 01 · clínicas dentales → agenda la cita (0–110) */}
    <Kicker text="Nicho 01 · Agente con IA" at={2} out={110} />
    <TypeHead text={'Clínicas\n*dentales*'} at={36} beats={[36, 51]} out={110} />
    <Icon name="chat" x={70} y={760} size={230} at={10} on={36} out={110} />
    <Tag text="Paciente" x={100} y={1010} at={36} out={110} />
    <Arrow x1={330} y1={870} x2={560} y2={870} at={70} out={110} />
    <Icon name="calendar" x={600} y={730} size={290} at={20} on={81} out={110} color={V.lime} />
    <Box x={590} y={1060} w={320} h={100} r={16} at={96} on={104} out={110} color={V.lime} fillOn draw={10}>
      <span style={{...mono, fontSize: 34, letterSpacing: '0.16em'}}>CITA ✓</span>
    </Box>

    {/* NICHO 02 · inmobiliarias → filtra clientes (117–200) */}
    <Kicker text="Nicho 02 · Agente con IA" at={115} out={200} />
    <TypeHead text="*Inmobiliarias*" at={117} beats={[117]} cpf={1.5} size={118} out={200} />
    {[0, 1, 2, 3, 4].map((i) => (
      <Icon key={i} name="user" x={45 + i * 200} y={690} size={150} at={122 + i * 3} on={140 + i * 3} out={200} />
    ))}
    <Icon name="funnel" x={400} y={880} size={260} at={130} on={159} out={200} color={V.lime} />
    <Arrow x1={530} y1={1150} x2={530} y2={1200} at={168} dur={8} out={200} color={V.lime} />
    <Box x={330} y={1210} w={400} h={96} r={16} at={168} on={172} out={200} color={V.lime} fillOn draw={10}>
      <span style={{...mono, fontSize: 30, letterSpacing: '0.14em'}}>2 CLIENTES REALES</span>
    </Box>

    {/* NICHO 03 · tienda online → vende (206–285) */}
    <Kicker text="Nicho 03 · Agente con IA" at={204} />
    <TypeHead text={'Tienda\n*online*'} at={213} beats={[213, 223]} />
    <Icon name="store" x={70} y={760} size={260} at={210} on={213} />
    <Arrow x1={360} y1={890} x2={580} y2={890} at={236} />
    <Icon name="cart" x={620} y={760} size={260} at={218} on={252} color={V.lime} />
    <Box x={610} y={1070} w={320} h={100} r={16} at={256} on={262} color={V.lime} fillOn draw={10}>
      <span style={{...mono, fontSize: 34, letterSpacing: '0.16em'}}>VENTA ✓</span>
    </Box>
  </VScene>
);
