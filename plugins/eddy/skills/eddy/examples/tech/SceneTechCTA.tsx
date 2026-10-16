// CTA: "Comenta DIRECTO" (2 líneas, clave en mayúsculas y lima) + campo de comentario que la tipea.
import React from 'react';
import {CommentField, Icon, Kicker, Tag, TypeHead, V, VScene} from '../tech';

export const SceneTechCTA: React.FC = () => (
  <VScene>
    <Kicker text="Y te mando el enlace" at={0} />
    <TypeHead text={'Comenta\n*DIRECTO*'} at={2} beats={[2, 22]} cpf={2} />
    <CommentField word="directo" at={6} typeAt={26} sendAt={52} y={880} />
    <Icon name="link" x={470} y={1110} size={140} at={56} on={62} color={V.lime} />
    <Tag text="El enlace" x={540} y={1268} at={62} align="center" />
  </VScene>
);
