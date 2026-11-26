/**
 * `bun run check`: GSAP stays on Remotion's clock (§12e, src/shared/motion/gsap.ts).
 *
 * - only src/shared/motion/gsap.ts imports the `gsap` package; everything else
 *   imports `useGsap` / `gsap` / `SplitText` from there;
 * - no free tweens (`gsap.to/from/fromTo/delayedCall`): they run on GSAP's ticker,
 *   not on the seeked timeline;
 * - no `repeat: -1`, ticker, ScrollTrigger or callbacks (`onUpdate`, `onComplete`, …);
 * - no GSAP randomness (ScrambleText, CustomWiggle `type: "random"`, gsap.utils.random).
 *
 * Scans src/ including src/demo/ (demos are copied into videos).
 */
import {readdirSync, readFileSync, statSync} from "node:fs";
import {join, relative} from "node:path";
import {p} from "./lib/paths";

const SRC = p("src");
const HOME = join("shared", "motion", "gsap.ts");
const files: string[] = [];
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name)) files.push(path);
  }
};
walk(SRC);

const RULES: [RegExp, string][] = [
  [/\bgsap\.(to|from|fromTo|delayedCall)\s*\(/, "a free tween runs on GSAP's ticker; put it on the timeline useGsap gives you"],
  [/\brepeat\s*:\s*-1\b/, "repeat: -1 never ends; give the loop a count that fits the shot"],
  [/\bgsap\.ticker\b|\bScrollTrigger\b|\bScrollSmoother\b/, "the ticker and scroll plugins are real-time; a render seeks"],
  [/\bon(Update|Complete|Start|Repeat|ReverseComplete)\s*:/, "callbacks do not replay on a seek; derive the state from the frame"],
  [/\.(play|resume|restart|reverse)\s*\(\s*\)/, "a timeline is moved by seek only"],
  [/\bScrambleText|\btype\s*:\s*["']random["']|\bgsap\.utils\.random\b/, "GSAP randomness uses Math.random; use Remotion's random(seed) or mulberry32 in src/shared/motion/rand.ts"],
];

const errors: string[] = [];
let users = 0;
for (const file of files) {
  const rel = relative(SRC, file);
  if (rel === HOME) continue;
  const text = readFileSync(file, "utf8");
  if (/from\s*["']gsap(\/[^"']*)?["']|require\(\s*["']gsap/.test(text)) {
    errors.push(`${rel}: imports the gsap package; import from src/shared/motion/gsap instead`);
  }
  if (!/shared\/motion\/gsap["']/.test(text)) continue;
  users++;
  text.split("\n").forEach((line, i) => {
    for (const [re, why] of RULES) if (re.test(line)) errors.push(`${rel}:${i + 1}: ${why}`);
  });
}

if (errors.length) {
  console.error(errors.map((e) => `✖ ${e}`).join("\n"));
  console.error(`\n${errors.length} GSAP error(s). See docs/soul/09-motion.md §12e.`);
  process.exit(1);
}
console.log(`gsap ok: ${users} file(s) use useGsap`);
