// gsap-split-words: a voice line built with GSAP on Remotion's clock (useGsap, §12e).
//
// Line 1 "Your old phone is now a" enters word by word, each word on the frame it is
// spoken (WORDS[].at, standing in for voice.json). The lead word "deck." is split into
// characters with SplitText; they rise in a 1.6f stagger with a small overshoot, then an
// underline draws under it on the next beat. Everything sits on ONE paused timeline that
// is seeked to the frame; the time unit is frames.
//
// Timeline (30fps, 120f)
//   6–40   line 1, one word per spoken onset, 14f each, y 0.4em → 0, opacity 0 → 1
//   44–70  "deck." characters, 1.6f stagger, 18f each, y 0.6em → 0, scale 0.6 → 1 (back.out)
//   72–90  underline scaleX 0 → 1 from the left (power4.out)
//   0–119  whole block drifts in 1 → 1.04 (linear: no landing at zero, §12)
import React from 'react';
import { LOOKS, SERIF, Stage } from '../../../shared/fixtures/Look';
import { FONT } from '../../../shared/fixtures/Polish';
import { SplitText, useGsap } from '../../../shared/motion/gsap';

export const GSAP_SPLIT_WORDS_DURATION = 120;

const L = LOOKS.midnight;
// spoken onsets in frames (from voice.json in a real video)
const WORDS = [
  { text: 'Your', at: 6 },
  { text: 'old', at: 11 },
  { text: 'phone', at: 16 },
  { text: 'is', at: 24 },
  { text: 'now', at: 28 },
  { text: 'a', at: 33 },
];
const LEAD_AT = 44;
const UNDERLINE_AT = 72;

export const GsapSplitWords: React.FC = () => {
  const ref = useGsap((tl, root) => {
    tl.fromTo('.block', { scale: 1 }, { scale: 1.04, duration: GSAP_SPLIT_WORDS_DURATION, ease: 'none' }, 0);
    WORDS.forEach((w, i) => {
      tl.from(`.w${i}`, { yPercent: 40, opacity: 0, duration: 14 }, w.at);
    });
    const lead = root.querySelector('.lead');
    if (lead) {
      const split = SplitText.create(lead, { type: 'chars' });
      tl.from(split.chars, { yPercent: 60, scale: 0.6, opacity: 0, duration: 18, ease: 'back.out(2)', stagger: 1.6 }, LEAD_AT);
    }
    tl.from('.rule', { scaleX: 0, duration: 18, ease: 'power4.out' }, UNDERLINE_AT);
  });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Stage look={L} grain={0.05} vignette={0.5} />
      <div ref={ref} style={{ position: 'absolute', inset: 0 }}>
        <div className="block" style={{ position: 'absolute', left: 120, right: 120, top: 640, transformOrigin: '0% 50%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '0.28em', fontFamily: FONT.sans, fontWeight: 700, fontSize: 96, lineHeight: 1.1, color: L.ink2 }}>
            {WORDS.map((w, i) => (
              <span key={w.text} className={`w${i}`} style={{ display: 'inline-block' }}>{w.text}</span>
            ))}
          </div>
          <div style={{ position: 'relative', display: 'inline-block', marginTop: 24 }}>
            {/* static text only: SplitText replaces these DOM children, so React must never re-render them */}
            <span className="lead" style={{ display: 'inline-block', fontFamily: SERIF, fontStyle: 'italic', fontSize: 260, lineHeight: 1, color: L.accent }}>deck.</span>
            <div className="rule" style={{ position: 'absolute', left: 6, right: 0, bottom: -18, height: 10, borderRadius: 5, background: L.accent2, transformOrigin: '0% 50%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
