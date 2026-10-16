// Float sobre el talking head: sombra superior + etiqueta + titular, chips numerados a la izquierda
// que se van sumando con cada palabra ("primero… después… cuánto vas a tardar…").
import React from 'react';
import {Kicker, StepChip, TypeHead, VScene} from '../tech';

export const SceneTechFloat: React.FC = () => (
  <VScene kind="float">
    <Kicker text="Claude o Codex · Skill" at={0} />
    <TypeHead text="Contesta *al grano*" at={2} beats={[2, 20, 26]} size={118} lh={124} />
    <StepChip n={1} label="Qué hacer" x={40} y={650} at={40} w={250} />
    <StepChip n={2} label="Pasos" x={40} y={800} at={70} w={250} />
    <StepChip n={3} label="Tiempo" x={790} y={650} at={100} w={250} />
    <StepChip n={4} label="Siguiente" x={790} y={800} at={130} w={250} />
  </VScene>
);
