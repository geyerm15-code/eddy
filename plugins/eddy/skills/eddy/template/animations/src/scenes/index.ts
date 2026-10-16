import React from 'react';
// Register one entry per overlay in reel.json. id MUST match reel.json overlays[].id,
// frames MUST equal round(dur * 30).
// import {SceneA} from './SceneA';

export const SCENES: {id: string; component: React.FC; frames: number}[] = [
  // {id: 'A', component: SceneA, frames: 158},
];
