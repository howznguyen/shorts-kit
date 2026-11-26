// Render: bunx remotion render src/demo/effects/gsap-plugin-reel/entry.tsx Demo out/demo/gsap-plugin-reel.mp4
import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { loadFont } from '../../../shared/font';
import { GSAP_PLUGIN_REEL_DURATION, GsapPluginReel } from './GsapPluginReel';

loadFont();

const Root: React.FC = () => (
  <Composition id="Demo" component={GsapPluginReel} durationInFrames={GSAP_PLUGIN_REEL_DURATION} fps={30} width={1080} height={1920} />
);

registerRoot(Root);
