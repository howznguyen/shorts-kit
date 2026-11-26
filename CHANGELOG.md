# Changelog

## 2.2.0 (2026-11-27)

### Added
- `bun run export <id> [--comp=X] [--h264] [--lines=<comp>] [--reuse]`: a video as layers for an editor in
  `out/<id>/export/<comp>/`. Picture without captions (ProRes 422 HQ, or H.264 with `--h264`), the running
  captions on transparency (ProRes 4444), voice, music and sfx as WAV stems (sounds a scene plays itself go with
  sfx; a silent stem is left out), `captions.srt`, and an FCPXML 1.8 timeline with every layer in place and a
  marker per scene, for DaVinci Resolve and Final Cut Pro. The templates draw one layer per render
  (`src/shared/frame/layer.ts`, read from the input props), so no video code changes. Checked on the example:
  the layers composite back to the normal render and the stems sum to its mix.

## 2.1.0 (2026-11-27)

### Fixed
- `bun run satellite`: a mosaic that mixed open-ocean tiles with land tiles came out mostly black. Filler and
  converted ocean tiles are now stored in EOX's own pixel format (yuvj420p), so ffmpeg's tile filter is not rebuilt
  mid-stream. Delete `.cache/tiles/s2cloudless/` (or re-encode its yuvj444p tiles) to rebuild old caches.
- `bun run normalize`: loudnorm now aims 0.8 dB below `truePeakMaxDb`, because the AAC re-encode overshoots the
  true peak by 0.2–0.6 dB and `bun run encode` then failed its true-peak check.

### Added
- GSAP 3.15.1 on Remotion's clock (§12e): `useGsap` in `src/shared/motion/gsap.ts` builds one paused timeline
  (time unit: frames) and seeks it every frame; SplitText registered. `bun run check` runs
  `scripts/check-gsap.ts`, which rejects free tweens, `repeat: -1`, the ticker, ScrollTrigger, callbacks and any
  `gsap` import outside that file. DrawSVG, MorphSVG, MotionPath, TextPlugin, Physics2D, CustomEase and
  CustomWiggle registered. Shot cards `typography/gsap-split-words` and `effects/gsap-plugin-reel` (10 s, five
  plugins) with their demos.
- Captions mask the channel's strong words by default (§1b): `strongWords.maskAs` in `thresholds.json`,
  `STRONG_WORD_MASK` in `src/shared/soul.ts`, `mask` on `Captions`, `captionMask` on `ShortsTemplate`.
- `ShortsTemplate` `overlay`: drawn above the scenes and under the captions (a chapter HUD, a credit line).
- `ChapterHud` `brand`: the channel avatar (`public/img/avatar.jpg`, new `Avatar` component) left of the
  channel name.

## 2.0.0 (2026-11-09)

Product promos join narrated shorts: the same engine, a second pipeline, and the shot and component libraries
both now lean on.

### Promos
- `sk-promo` and `docs/promo/`: ads, TVCs and launch films, vertical (feed) or landscape (16:9), with or without
  a few spoken lines.
- The gates before a build: objective, CTA, mandatories and placement; the user's pain first; two or three
  concept routes; a confirmed treatment; a timed animatic; a shot-by-shot storyboard; a deliverables matrix.
  After it: a stranger comprehension test and an aesthetics review pass (`docs/promo/aesthetics.md`).
- `bun run beats` measures a track's beat grid; scenes are timed in beats on it.
- `bun run voice` makes a promo's few spoken lines with word times, so type lands on the spoken word; a line can
  belong to one cutdown only (`only`).
- Cutdowns and extra formats as their own compositions, each on its own clock.
- `bun run lint` checks a promo's clock and files; `bun run encode` checks the upload's true peak.

### Shots and sound
- `docs/shots/`: 161 motion cards in ten folders (camera, typography, UI entrances, rhythm, transitions,
  effects, outros, interaction, data, opening) and sound cards for the SFX pack (`docs/shots/sfx/`).
- Storyboard shots carry a `size`, an `angle` and a `card`; a voiceless promo pins shots to scene + beat.
- `src/demo/`: the reference code the cards link to (kept, not built).
- New cards: `isometric-pile`, `typed-prefix-states`.
- The demos carry the kit's own name and mark (`ShortKitMark`, `ShortKitWordmark`, `ShortKitIcon` in
  `src/shared/fixtures/Brand.tsx`), and every text in them, the page textures in `public/textures/live/` included,
  is in English.

### Real components
- Knowns UI is the default kit for interface pieces in any video (`docs/promo/real-ui.md`).
- "The product's own repo": copy a product's components into a video folder, shim the framework, build its own
  stylesheet with `bun run css <id> --dir <folder>`, keep live data and images locally.
- `bun run capture`: `--type "css=text"` types into the page (its own search runs) and `--hide "css"` removes
  overlays such as a consent banner without answering them.

### 3D
- `src/shared/three/`: shots, camera rigs, a model loader for `.glb`, callouts glued to a body point.
- `bun run model <name>`: procedural models built headless with Blender (`scripts/blender/`).
- `src/shared/motion/iso.tsx`: CSS-3D isometric planes, slabs with depth, piles and the turn to front-on.
- Status: the gallery's 3D shots render; awaiting the owner's review before release.

### Preview
- The local dashboard is rebuilt in Knowns UI: Brief and Timeline tabs, promos (landscape, every deliverable),
  storyboard cards with size, angle and card, playback, `--lan` for a phone on your Wi-Fi.

### Shared
- New shared pieces split by job: captions (`InfoStrip`, `DigitRoll`), frames (`ClipCard`), effects
  (`FlashCut`), motion (`PageCam`, `VerticalTicker`, velocity, handheld), fixtures.

## 0.1.0

The first release: narrated vertical shorts with a coding agent (skills, SOUL, flows, fact ledger, shared
Remotion library, maps and globe, TTS engines, recorded voice, preview dashboard).
