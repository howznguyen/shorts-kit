// Render: bunx remotion render src/demo/typography/gsap-split-words/entry.tsx Demo out/demo/gsap-split-words.mp4
import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { loadFont } from '../../../shared/font';
import { GSAP_SPLIT_WORDS_DURATION, GsapSplitWords } from './GsapSplitWords';

loadFont();

const Root: React.FC = () => (
  <Composition id="Demo" component={GsapSplitWords} durationInFrames={GSAP_SPLIT_WORDS_DURATION} fps={30} width={1080} height={1920} />
);

registerRoot(Root);
