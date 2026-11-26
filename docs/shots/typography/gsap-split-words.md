---
name: gsap-split-words
summary: A spoken line built with GSAP on Remotion's clock. Each word rises on its own spoken onset, the lead word splits into characters (SplitText) that rise in a 1.6f stagger with a small overshoot, then an underline draws under it on the next beat. One paused timeline, seeked to the frame
use: A key line where the lead word deserves character-level motion; the template for any GSAP-built shot (useGsap, §12e)
length: about 4.0s (120f@30fps)
energy: medium (word-by-word build, one character burst, one draw)
---

## Intent
The reference for using GSAP in the kit. GSAP earns its place where `interpolate` gets
tedious: per-character staggers, nested sequences, `back.out` overshoot. The motion is still
anchored to words: every position on the timeline is a spoken onset in frames.

## Motion core
- `useGsap((tl, root) => …)` from `src/shared/motion/gsap`: one paused timeline, seeked to
  `useCurrentFrame()`. **Durations and positions are frames.**
- Line 1: `tl.from(".wN", {yPercent: 40, opacity: 0, duration: 14}, word.at)` per word
- Lead word: `SplitText.create(lead, {type: "chars"})`, then
  `tl.from(chars, {yPercent: 60, scale: 0.6, opacity: 0, duration: 18, ease: "back.out(2)", stagger: 1.6}, 44)`
- Underline: `scaleX 0 → 1`, `power4.out`, 18f, from the left, at 72f
- The block coasts `scale 1 → 1.04` over the whole shot with `ease: "none"` (no landing at zero, §12)

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Character stagger | 1.6f | 1–2f reads as one word assembling; >3f the viewer reads letters |
| Character overshoot | `back.out(2)` | 1.2 barely shows; >3 the letters wobble |
| Word entrance | 14f, yPercent 40 | under 8f is a pop; over 20f the line lags the voice |
| Underline delay | one beat after the lead word | together with the characters it competes with them |

## Known traps
- Selectors are scoped to the hook's ref; use class names, not ids.
- SplitText replaces the element's children: keep that text static, or React re-renders it
  over the split and the characters vanish.
- `type: "chars"` and `"words"` need no layout; `"lines"` measures the text, so wait for the
  font (`delayRender` on `document.fonts.ready`) before splitting by line.
- Do not animate a property that React `style` also sets on the same element.
- No CSS `filter` blur in promos; the demo uses transforms and opacity only.

## Reference implementation

The demo code, kept as reference (not built; `src/demo/`):

- [`gsap-split-words/GsapSplitWords.tsx`](../../../src/demo/typography/gsap-split-words/GsapSplitWords.tsx)
- render: `bunx remotion render src/demo/typography/gsap-split-words/entry.tsx Demo out/demo/gsap-split-words.mp4`
