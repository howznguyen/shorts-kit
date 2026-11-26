// gsap-plugin-reel: five GSAP plugins in 10 s, all on ONE paused timeline seeked by Remotion (§12e).
// Story: an old phone is drawn, becomes a 15-key deck, a finger taps keys, the count types in,
// then the keys burst off and the last word wiggles. Time unit: frames (30 fps, 300f).
//
//   0–55     DrawSVG        phone outline draws 0% → 100%, the screen line follows
//   55–120   MorphSVG       outline morphs phone → deck; 15 keys pop in, grid stagger from the centre
//   120–195  MotionPath     a tap dot curves key to key (5 hops × 14f), each key flashes on arrival
//   195–250  TextPlugin     "0" counts to "15" (snap), then a caption types itself
//   250–300  Physics2D      keys thrown up and off by gravity (px/frame units); CustomWiggle on the end word
import React from 'react';
import { LOOKS, Stage } from '../../../shared/fixtures/Look';
import { FONT } from '../../../shared/fixtures/Polish';
import { CustomWiggle, useGsap } from '../../../shared/motion/gsap';

export const GSAP_PLUGIN_REEL_DURATION = 300;

const L = LOOKS.midnight;
const PHONE = 'M430 560 H650 A40 40 0 0 1 690 600 V1200 A40 40 0 0 1 650 1240 H430 A40 40 0 0 1 390 1200 V600 A40 40 0 0 1 430 560 Z';
const DECK = 'M230 700 H850 A40 40 0 0 1 890 740 V1060 A40 40 0 0 1 850 1100 H230 A40 40 0 0 1 190 1060 V740 A40 40 0 0 1 230 700 Z';
const K = 110, G = 22, X0 = 221, Y0 = 713;
const KEYS = Array.from({ length: 15 }, (_, i) => ({ c: i % 5, r: Math.floor(i / 5) }));
const centre = (c: number, r: number) => ({ x: X0 + c * (K + G) + K / 2, y: Y0 + r * (K + G) + K / 2 });
const HOPS: [number, number][] = [[0, 0], [2, 1], [4, 0], [1, 2], [3, 2], [2, 0]];
const CHAPTERS = [
  { at: 0, name: 'DrawSVG' },
  { at: 55, name: 'MorphSVG · grid stagger' },
  { at: 120, name: 'MotionPath' },
  { at: 195, name: 'TextPlugin' },
  { at: 250, name: 'Physics2D · CustomWiggle' },
];

export const GsapPluginReel: React.FC = () => {
  const ref = useGsap((tl) => {
    // chapter labels: each in, then out when the next one comes
    CHAPTERS.forEach((ch, i) => {
      tl.fromTo(`.ch${i}`, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 10 }, ch.at + 2);
      const next = CHAPTERS[i + 1];
      if (next) tl.to(`.ch${i}`, { opacity: 0, y: -20, duration: 8, ease: 'power2.in' }, next.at - 6);
    });

    // 1. DrawSVG
    tl.fromTo('.outline', { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 40, ease: 'power2.inOut' }, 6);
    tl.fromTo('.screen', { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 20 }, 34);

    // 2. MorphSVG + grid stagger
    tl.to('.screen', { opacity: 0, duration: 8 }, 58);
    tl.to('.outline', { morphSVG: DECK, duration: 34, ease: 'power3.inOut' }, 60);
    tl.from('.key', { scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: 14, ease: 'back.out(2)', stagger: { grid: [3, 5], from: 'center', amount: 16 } }, 84);

    // 3. MotionPath: one curved hop per key, flash on arrival
    tl.fromTo('.dot', { opacity: 0, scale: 0.4, ...centre(...HOPS[0]) }, { opacity: 1, scale: 1, duration: 8 }, 122);
    HOPS.slice(1).forEach(([c, r], i) => {
      const a = centre(...HOPS[i]), b = centre(c, r);
      const at = 130 + i * 13;
      tl.to('.dot', { motionPath: { path: [a, { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 110 }, b], curviness: 1.2 }, duration: 12, ease: 'power1.inOut' }, at);
      tl.to(`.k${r * 5 + c}`, { fill: L.accent2, scale: 0.88, transformOrigin: '50% 50%', duration: 3, yoyo: true, repeat: 1, ease: 'power2.out' }, at + 12);
    });
    tl.to('.dot', { opacity: 0, duration: 6 }, 196);

    // 4. TextPlugin: a count and a typed caption
    tl.fromTo('.count', { textContent: 0, opacity: 0 }, { textContent: 15, opacity: 1, snap: { textContent: 1 }, duration: 26, ease: 'power2.out' }, 198);
    tl.to('.caption', { text: 'keys from an old phone', duration: 24, ease: 'none' }, 222);

    // 5. Physics2D: deterministic throws (angle and speed from the index), units px/frame
    KEYS.forEach((k, i) => {
      tl.to(`.k${i}`, { physics2D: { velocity: 22 + ((i * 7) % 5) * 4, angle: -120 + k.c * 15 + k.r * 4, gravity: 2.2 }, rotation: (k.c - 2) * 40, transformOrigin: '50% 50%', duration: 40, ease: 'none' }, 252 + (i % 5) * 2);
    });
    tl.to('.outline', { opacity: 0, duration: 16 }, 256);
    tl.to('.count, .caption', { opacity: 0, y: -40, duration: 12, ease: 'power2.in' }, 252);
    tl.fromTo('.end', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 12, ease: 'back.out(1.6)' }, 262);
    tl.to('.end', { rotation: 5, duration: 26, ease: CustomWiggle.create('wiggle', { wiggles: 7 }) }, 272);
  });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Stage look={L} grain={0.05} vignette={0.5} />
      <div ref={ref} style={{ position: 'absolute', inset: 0 }}>
        <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <path className="outline" d={PHONE} fill="none" stroke={L.accent} strokeWidth={10} strokeLinecap="round" />
          <path className="screen" d="M450 1170 H630" fill="none" stroke={L.ink3} strokeWidth={10} strokeLinecap="round" />
          {KEYS.map((k, i) => (
            <rect key={i} className={`key k${i}`} x={X0 + k.c * (K + G)} y={Y0 + k.r * (K + G)} width={K} height={K} rx={20} fill={L.surface2} stroke={L.line} strokeWidth={2} />
          ))}
          <circle className="dot" cx={0} cy={0} r={26} fill={L.ink} opacity={0} />
        </svg>
        {CHAPTERS.map((ch, i) => (
          <div key={ch.name} className={`ch${i}`} style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontFamily: FONT.mono, fontSize: 44, letterSpacing: 2, color: L.accent2, opacity: 0 }}>{ch.name}</div>
        ))}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1240, textAlign: 'center', fontFamily: FONT.sans, color: L.ink }}>
          <div className="count" style={{ fontSize: 220, fontWeight: 800, lineHeight: 1, opacity: 0 }}>0</div>
          <div className="caption" style={{ fontSize: 56, fontWeight: 600, color: L.ink2, minHeight: 70 }}></div>
        </div>
        <div className="end" style={{ position: 'absolute', left: 0, right: 0, top: 860, textAlign: 'center', fontFamily: FONT.sans, fontSize: 130, fontWeight: 800, color: L.ink, opacity: 0 }}>on the frame.</div>
      </div>
    </div>
  );
};
