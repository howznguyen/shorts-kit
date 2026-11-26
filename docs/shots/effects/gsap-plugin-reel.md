---
name: gsap-plugin-reel
summary: Ten seconds, five GSAP plugins on one paused timeline. A phone outline draws itself (DrawSVG), morphs into a 15-key deck while the keys pop in from the centre (MorphSVG, grid stagger), a tap dot curves from key to key and lights each one (MotionPath), a count and a caption type in (TextPlugin), then the keys are thrown off by gravity while the last line wiggles (Physics2D, CustomWiggle)
use: A menu of what GSAP adds to the kit; copy one chapter into a scene. Product films where an object turns into another (phone → deck), UI taps along a path, counters
length: 10.0s (300f@30fps)
energy: medium-high (five chapters of 2 s, each with one clear action)
---

## Intent
Shows each plugin doing one readable action with an outcome, all on Remotion's clock
(`useGsap`, §12e). Every chapter has a monospace label naming its plugin, so the reel works
as a reference card.

## Motion core
- DrawSVG: `fromTo(outline, {drawSVG: "0% 0%"}, {drawSVG: "0% 100%", duration: 40})`, screen line from its centre
- MorphSVG: `to(outline, {morphSVG: DECK, duration: 34})`; keys `from({scale: 0}, {stagger: {grid: [3, 5], from: "center", amount: 16}})`
- MotionPath: one tween per hop, `path: [a, mid lifted 110 px, b], curviness: 1.2`, 12f each; the key
  flashes (`yoyo, repeat: 1`) on the arrival frame, so the flash always matches the dot
- TextPlugin: `{textContent: 0 → 15, snap: {textContent: 1}}`, then `{text: "…", ease: "none"}`
- Physics2D: `velocity` 22–38 **px/frame**, `gravity: 2.2` px/frame², angle from the key's column
- CustomWiggle: `CustomWiggle.create("wiggle", {wiggles: 7})` as the ease of a 5° rotation

## Known traps
- **Units are frames.** Physics2D's velocity and gravity are per frame here: a GSAP example's
  `velocity: 600` throws the key 600 px per frame, gone in one frame.
- DrawSVG leaves a dash set for the old length; morphing the drawn path to a longer one shows
  a sliver of gap. Hide or redraw the stroke during the morph.
- DrawSVG and MorphSVG are not byte-identical between renders (Chrome measures the path); see §12e.
- No ScrambleTextPlugin and no `CustomWiggle` `type: "random"`: both use `Math.random`.
- Keys are SVG `rect`s: give them `transformOrigin: "50% 50%"` before scaling or rotating.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`gsap-plugin-reel/GsapPluginReel.tsx`](../../../src/demo/effects/gsap-plugin-reel/GsapPluginReel.tsx)
- render: `bunx remotion render src/demo/effects/gsap-plugin-reel/entry.tsx Demo out/demo/gsap-plugin-reel.mp4`
