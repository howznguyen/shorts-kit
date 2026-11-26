/**
 * GSAP on Remotion's clock (§12e).
 *
 * GSAP normally animates on its own ticker (requestAnimationFrame). A render
 * never plays in real time: Remotion opens frames out of order, in several
 * tabs at once, so a ticker-driven tween gives a different picture each run.
 * Here GSAP only *describes* the motion: the timeline is built paused and
 * seeked to the current frame on every render.
 *
 * **Time unit is frames, not seconds.** `duration: 20` is 20 frames, the same
 * unit as `useCurrentFrame()`, word timings and `sceneFrom()`. The timeline's
 * default duration is 15 frames so a tween with no duration is not half a frame.
 * Anything "per second" is per frame here: Physics2D `velocity` is px/frame and
 * `gravity` px/frame² (a 900 px/s throw at 30 fps is `velocity: 30`).
 *
 * Every GSAP import in src/ goes through this file (`bun run check` enforces it),
 * so plugins are registered once and the rules below hold everywhere:
 * - tweens live on the timeline `build` gets; no `gsap.to/from/fromTo` on the side;
 * - no `repeat: -1`, no ticker, no ScrollTrigger, no callbacks (`onUpdate`, …):
 *   a seek is not playback and their side effects do not replay.
 *
 * GSAP is not MIT: it ships under Webflow's "Standard No Charge" licence
 * (free, also for commercial work; https://gsap.com/community/standard-license/).
 */
import {gsap} from "gsap";
import {CustomEase} from "gsap/CustomEase";
import {CustomWiggle} from "gsap/CustomWiggle";
import {DrawSVGPlugin} from "gsap/DrawSVGPlugin";
import {MorphSVGPlugin} from "gsap/MorphSVGPlugin";
import {MotionPathPlugin} from "gsap/MotionPathPlugin";
import {Physics2DPlugin} from "gsap/Physics2DPlugin";
import {SplitText} from "gsap/SplitText";
import {TextPlugin} from "gsap/TextPlugin";
import {useLayoutEffect, useRef} from "react";
import {useCurrentFrame} from "remotion";

// GSAP's ticker still runs, but it only advances unpaused animations; every
// timeline here is paused and moved by `seek` alone
gsap.registerPlugin(SplitText, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, TextPlugin, CustomEase, CustomWiggle, Physics2DPlugin);

export {CustomEase, CustomWiggle, gsap, SplitText};
export type Timeline = gsap.core.Timeline;

/**
 * Build a paused GSAP timeline scoped to the returned ref and seek it to the
 * current frame (relative to the enclosing `<Sequence>`).
 *
 * **The timeline is rebuilt from a clean DOM on every frame**, then seeked once
 * from 0. GSAP leaves inline styles that depend on which frames ran before
 * (a tab that renders 240→241 and one that jumps straight to 241 end with a
 * different DOM), and Chrome rasterises those differently by a pixel or two.
 * Rebuilding makes each frame a function of the frame number alone; a build is
 * a few tweens, so it costs well under a millisecond in a normal shot.
 *
 * Everything `build` creates (tweens, SplitText) is reverted through
 * `gsap.context` before the next frame and on unmount. Select targets with
 * selector text (`".word"`), scoped to the ref.
 *
 * Do not also set a property from React `style` that the timeline animates:
 * the next React render overwrites GSAP's inline value for one frame.
 */
export function useGsap<T extends HTMLElement = HTMLDivElement>(build: (tl: Timeline, root: T) => void) {
  const ref = useRef<T>(null);
  const frame = useCurrentFrame();

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({paused: true, defaults: {duration: 15, ease: "power3.out", lazy: false}});
      build(tl, root);
      tl.seek(frame, true);
    }, root);
    return () => ctx.revert();
  });

  return ref;
}
