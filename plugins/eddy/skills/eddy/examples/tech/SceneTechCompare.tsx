// Comparación con datos: "sin skill" (salmón) vs "con skill" (verde). El número grande del titular
// se tipea como texto; los números chicos CUENTAN. Documentos con renglones que se llenan.
import React from 'react';
import {Counter, DocLines, Kicker, Tag, TypeHead, V, VScene} from '../tech';

export const SceneTechCompare: React.FC = () => (
  <VScene>
    <Kicker text="Palabras de la respuesta" at={0} />
    <TypeHead text="465" at={14} cpf={3} out={64} />
    <TypeHead text="465 → *219*" at={72} beats={[72, 72, 80]} cpf={2} />
    <Tag text="Sin skill" x={96} y={712} at={4} on={14} color={V.salmon} />
    <Counter to={465} at={14} dur={26} x={96} y={752} size={84} color={V.salmon} />
    <DocLines x={96} y={860} w={360} h={430} lines={14} at={6} on={14} color={V.salmon} fillDur={26} />
    <Tag text="Con skill" x={600} y={712} at={6} on={72} color={V.lime} />
    {/* frame 72+: the green count */}
    <Counter to={219} at={80} dur={20} x={600} y={752} size={84} color={V.lime} />
    <DocLines x={600} y={1000} w={380} h={200} lines={5} at={8} on={72} color={V.lime} fillDur={14} />
  </VScene>
);
