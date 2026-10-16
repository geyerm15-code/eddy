import React from 'react';
import {Composition} from 'remotion';
import {Captions} from './Captions';
import data from './captions.json';
import {SCENES} from './scenes';

export const RemotionRoot: React.FC = () => (
  <>
    {SCENES.map((s) => (
      <Composition key={s.id} id={s.id} component={s.component} durationInFrames={s.frames} fps={30} width={1080} height={1920} />
    ))}
    <Composition id="Captions" component={Captions} durationInFrames={Math.max(1, Math.round(data.total * 30))} fps={30} width={1080} height={1920} />
  </>
);
