/**
 * `bun run export <id> [--comp=Video] [--h264] [--lines=<comp>] [--reuse]`: a video as layers for an editor.
 *
 * Writes out/<id>/export/<comp>/:
 *   picture.mov     everything visual except the running captions (ProRes 422 HQ, no audio;
 *                   --h264 for a small picture.mp4 instead)
 *   captions.mov    the running captions on transparency (ProRes 4444 with alpha; narrated shorts only)
 *   voice.wav, music.wav, sfx.wav   one stem each (a stem with no sound is left out);
 *                   sounds a scene plays itself are in sfx.wav
 *   captions.srt    the words as subtitles (voice.json, or a promo's voice lines)
 *   <id>.fcpxml     a timeline with every layer in place and a marker per scene:
 *                   DaVinci Resolve (File → Import → Timeline) and Final Cut Pro (File → Import → XML)
 *
 * The layers come from the templates (src/shared/frame/layer.ts), so no video code changes.
 * `--lines` picks whose voice lines a promo's subtitles use, for a cut that plays another
 * composition's lines (ReadmeVi plays VideoVi's: --lines=VideoVi). `--reuse` keeps layers already
 * rendered and rewrites the timeline and subtitles only (after moving the folder, say).
 */
import {existsSync, readFileSync, rmSync, statSync, writeFileSync} from "node:fs";
import {join, relative} from "node:path";
import {pathToFileURL} from "node:url";
import {chunkWords, maskWord} from "../src/shared/caption/Captions";
import {linePlaysIn, MASTER, promoFrames, promoTimings, voiceLineFrame, type Promo, type VoiceRecord} from "../src/shared/promo";
import {STRONG_WORD_MASK} from "../src/shared/soul";
import {sceneTimings, totalFrames, type SceneTiming, type Voice} from "../src/shared/timings";
import {loadNarration} from "./lib/narration";
import {die, ensureDir, flag, isVoiceless, outDir, p, videoDir} from "./lib/paths";
import {must, run} from "./lib/proc";

const MIN = 60_000;
const id = process.argv.slice(2).find((a) => !a.startsWith("-"));
if (!id) die("usage: bun run export <id> [--comp=Video] [--h264] [--lines=<comp>] [--reuse]");
const entry = `src/videos/${id}/entry.tsx`;
if (!existsSync(p(entry))) die(`no video "${id}": ${entry} does not exist`);
const compFlag = flag("comp");
const comp = typeof compFlag === "string" ? compFlag : MASTER;
const h264 = flag("h264") !== undefined;
const linesFlag = flag("lines");
const reuse = flag("reuse") !== undefined;
const bin = p("node_modules/.bin/remotion");

// ---- the composition: size, fps, length, as Remotion registers it
const list = await must(bin, ["compositions", entry], {timeoutMs: 5 * MIN});
const row = list.stdout
  .toString("utf8")
  .split("\n")
  .map((l) => l.trim().split(/\s+/))
  .find((c) => c[0] === comp && /^\d+x\d+$/.test(c[2] ?? ""));
if (!row) die(`no composition "${comp}" in ${entry} (bun run export ${id} --comp=<id>)`);
const fps = Number(row![1]);
const [width, height] = row![2].split("x").map(Number);
const frames = Number(row![3]);
if (!Number.isInteger(fps) || !frames) die(`could not read fps and length of "${comp}" from: ${row!.join(" ")}`);

// ---- the clock: scene markers and subtitles
const voiceless = isVoiceless(id!);
const promo = existsSync(join(videoDir(id!), "promo.json")) ? (JSON.parse(readFileSync(join(videoDir(id!), "promo.json"), "utf8")) as Promo) : undefined;
const voicePath = join(videoDir(id!), "voice.json");
const voice = !voiceless && existsSync(voicePath) ? (JSON.parse(readFileSync(voicePath, "utf8")) as Voice) : undefined;
const narrated = !!voice && existsSync(join(videoDir(id!), "narration.json"));

let scenes: SceneTiming[] = [];
let masterFrames = 0;
if (narrated) {
  const hold = loadNarration(id!).outroHold;
  scenes = sceneTimings(voice!, fps, hold);
  masterFrames = totalFrames(voice!, fps, hold);
} else if (promo) {
  scenes = promoTimings(promo, fps);
  masterFrames = promoFrames(promo, fps);
}
// a cutdown has its own scenes: the master's markers would sit in the wrong places
if (masterFrames !== frames) {
  if (scenes.length) console.warn(`! "${comp}" is ${frames} frames, the master clock ${masterFrames}: no scene markers`);
  scenes = [];
}

type Cue = {start: number; end: number; text: string};
const cues: Cue[] = [];
if (narrated && voice!.audio) {
  const chunks = chunkWords(voice!.words);
  chunks.forEach((c, i) => {
    const next = chunks[i + 1]?.start ?? Infinity;
    cues.push({start: c.start, end: Math.min(next, c.end + 0.35), text: c.words.map((w) => maskWord(w.text, STRONG_WORD_MASK)).join(" ")});
  });
} else if (promo?.voice && existsSync(join(videoDir(id!), "voice-lines.json"))) {
  const records = JSON.parse(readFileSync(join(videoDir(id!), "voice-lines.json"), "utf8")) as VoiceRecord[];
  const own = promo.voice.lines.filter((l) => l.only?.includes(comp));
  const from = typeof linesFlag === "string" ? linesFlag : own.length ? comp : MASTER;
  const lines = promo.voice.lines.filter((l) => linePlaysIn(l, from));
  for (const l of lines) {
    const r = records.find((x) => x.id === l.id);
    if (!r?.words.length) continue;
    const at = voiceLineFrame(promo, fps, l) / fps;
    // one cue per sentence of the line
    let part: typeof r.words = [];
    r.words.forEach((w, i) => {
      part.push(w);
      if (/[.?!…]$/.test(w.text) || i === r.words.length - 1) {
        cues.push({start: at + part[0].start, end: at + part[part.length - 1].end + 0.3, text: part.map((x) => x.text).join(" ")});
        part = [];
      }
    });
  }
  cues.sort((a, b) => a.start - b.start);
  cues.forEach((c, i) => {
    if (cues[i + 1]) c.end = Math.min(c.end, cues[i + 1].start);
  });
}

// ---- renders, one layer each
const dir = ensureDir(join(outDir(id!), "export", comp));
const started = Date.now() - 1000;
const render = async (layer: string, file: string, extra: string[]) => {
  if (reuse && existsSync(file) && statSync(file).size > 0) return console.log(`▸ ${layer}: kept ${relative(p(), file)} (--reuse)`);
  console.log(`\n▸ ${layer} → ${relative(p(), file)}`);
  const args = ["render", entry, comp, file, `--props=${JSON.stringify({safe: false, layer})}`, ...extra];
  const r = await run(bin, args, {inherit: true, timeoutMs: 120 * MIN});
  if (r.code !== 0) die(`remotion render (${layer}) exited ${r.code}`);
  if (!existsSync(file) || statSync(file).mtimeMs < started || statSync(file).size === 0) die(`${file} was not written`);
};

type Track = {name: string; file: string; kind: "video" | "audio"; lane: number};
const tracks: Track[] = [];

const picture = join(dir, h264 ? "picture.mp4" : "picture.mov");
await render("picture", picture, h264 ? ["--codec=h264", "--muted"] : ["--codec=prores", "--prores-profile=hq", "--muted"]);
tracks.push({name: "picture", file: picture, kind: "video", lane: 0});

if (narrated) {
  const caps = join(dir, "captions.mov");
  await render("captions", caps, ["--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png", "--muted"]);
  tracks.push({name: "captions", file: caps, kind: "video", lane: 1});
}

const silent = async (file: string) => {
  const r = await must("ffmpeg", ["-v", "info", "-i", file, "-af", "volumedetect", "-f", "null", "-"], {timeoutMs: 5 * MIN});
  const m = r.stderr.match(/max_volume:\s*(-?[\d.]+|-inf) dB/);
  return !m || m[1] === "-inf" || Number(m[1]) < -80;
};
let lane = -1;
for (const stem of ["voice", "music", "sfx"]) {
  const file = join(dir, `${stem}.wav`);
  if (reuse && !existsSync(file)) continue; // left out as silent on the first run
  await render(stem, file, ["--codec=wav"]);
  if (await silent(file)) {
    rmSync(file);
    console.log(`  (no ${stem} in this video: left out)`);
    continue;
  }
  tracks.push({name: stem, file, kind: "audio", lane: lane--});
}

// ---- subtitles
const srtTime = (s: number) => {
  const ms = Math.max(0, Math.round(s * 1000));
  const z = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${z(Math.floor(ms / 3_600_000))}:${z(Math.floor(ms / 60_000) % 60)}:${z(Math.floor(ms / 1000) % 60)},${z(ms % 1000, 3)}`;
};
if (cues.length) {
  writeFileSync(join(dir, "captions.srt"), cues.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join("\n"));
}

// ---- the timeline: FCPXML 1.8, the newest version every reader takes (Resolve, Final Cut Pro,
// OpenTimelineIO); 1.9+ moves the file path into <media-rep>, which older readers drop
const t = (f: number) => (f === 0 ? "0s" : `${f}/${fps}s`);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const name = `${id} ${comp}`;
const assets = tracks.map((tr, i) => {
  const media = tr.kind === "video" ? `hasVideo="1" format="r1"` : `hasAudio="1" audioSources="1" audioChannels="2" audioRate="48000"`;
  // an empty <metadata/> child: OpenTimelineIO's reader tests `if asset`, and a childless XML element is falsy
  // in Python, so a self-closing audio asset was read as video
  return `    <asset id="a${i + 1}" name="${tr.name}" src="${esc(pathToFileURL(tr.file).href)}" start="0s" duration="${t(frames)}" ${media}>
      <metadata/>
    </asset>`;
});
const [main, ...rest] = tracks;
const connected = rest.map((tr) => `          <asset-clip ref="a${tracks.indexOf(tr) + 1}" lane="${tr.lane}" offset="0s" name="${tr.name}" start="0s" duration="${t(frames)}"${tr.kind === "audio" ? ` audioRole="${tr.name === "voice" ? "dialogue" : tr.name === "music" ? "music" : "effects"}"` : ""}/>`);
const markers = scenes.map((s) => `          <marker start="${t(s.from)}" duration="${t(1)}" value="${esc(s.id)}"/>`);
const fcpxml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.8">
  <resources>
    <format id="r1" frameDuration="1/${fps}s" width="${width}" height="${height}" colorSpace="1-1-1 (Rec. 709)"/>
${assets.join("\n")}
  </resources>
  <library>
    <event name="shorts-kit">
      <project name="${esc(name)}">
        <sequence format="r1" duration="${t(frames)}" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">
          <spine>
            <asset-clip ref="a1" offset="0s" name="${main.name}" start="0s" duration="${t(frames)}">
${[...connected, ...markers].map((l) => `    ${l}`).join("\n")}
            </asset-clip>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
`;
const xmlFile = join(dir, `${id}.fcpxml`);
writeFileSync(xmlFile, fcpxml);

console.log(`\n+ ${relative(p(), dir)}/  ${width}x${height} ${fps} fps, ${frames} frames (${(frames / fps).toFixed(2)} s)`);
for (const tr of tracks) console.log(`  ${tr.kind === "video" ? "video" : "audio"} lane ${String(tr.lane).padStart(2)}  ${relative(dir, tr.file)}`);
if (cues.length) console.log(`  captions.srt  ${cues.length} cues`);
console.log(`  ${id}.fcpxml  ${scenes.length} scene markers`);
console.log(`  Resolve: File → Import → Timeline → ${id}.fcpxml. Final Cut Pro: File → Import → XML.`);
console.log(`  The fcpxml points at these files by absolute path: move the folder and the editor asks to relink.`);
