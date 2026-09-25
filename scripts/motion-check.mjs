#!/usr/bin/env node
// Motion check: compares every frame with the frame `gap` later (downscaled
// grayscale) and flags stretches where the picture barely changes.
// Usage: node scripts/motion-check.mjs out/scenes/x.mp4 [--gap=5] [--threshold=1.2]
import { spawnSync } from "node:child_process";

const file = process.argv[2];
const arg = (k, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${k}=`));
  return a ? Number(a.split("=")[1]) : d;
};
const GAP = arg("gap", 5);
const THR = arg("threshold", 1.2);
const W = 160;
const H = 90;
const r = spawnSync("npx", ["remotion", "ffmpeg", "-v", "error", "-i", file, "-vf", `scale=${W}:${H}`, "-pix_fmt", "gray", "-f", "image2pipe", "-c:v", "rawvideo", "-"], {
  maxBuffer: 1 << 30,
});
if (r.status !== 0) {
  console.error(String(r.stderr));
  process.exit(1);
}
const buf = r.stdout;
const N = Math.floor(buf.length / (W * H));
const diff = [];
for (let i = 0; i + GAP < N; i++) {
  let s = 0;
  const a = i * W * H;
  const b = (i + GAP) * W * H;
  for (let k = 0; k < W * H; k++) s += Math.abs(buf[a + k] - buf[b + k]);
  diff.push(s / (W * H));
}
const fps = 30;
console.log(`${file}: ${N} frames, gap ${GAP}, threshold ${THR}`);
const secs = Math.ceil(diff.length / fps);
const line = [];
for (let sIdx = 0; sIdx < secs; sIdx++) {
  const seg = diff.slice(sIdx * fps, (sIdx + 1) * fps);
  line.push(`${sIdx}s:${Math.min(...seg).toFixed(1)}/${(seg.reduce((a, b) => a + b, 0) / seg.length).toFixed(1)}`);
}
console.log("per-second min/mean diff:", line.join("  "));
let run = 0;
let worst = { len: 0, at: 0 };
const flagged = [];
diff.forEach((d, i) => {
  if (d < THR) {
    run++;
    if (run > worst.len) worst = { len: run, at: i - run + 1 };
  } else {
    if (run >= 3) flagged.push([i - run, i - 1]);
    run = 0;
  }
});
if (run >= 3) flagged.push([diff.length - run, diff.length - 1]);
console.log(flagged.length ? `STILL STRETCHES (frames): ${flagged.map(([a, b]) => `${a}-${b}`).join(", ")}` : "PASS: no stretch of near-identical frames");
console.log(`lowest diff ${Math.min(...diff).toFixed(2)} at frame ${diff.indexOf(Math.min(...diff))}`);
