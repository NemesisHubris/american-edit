#!/usr/bin/env node
// Writes beats.json.
// - If an audio file exists in assets/music, decode it with Remotion's bundled
//   ffmpeg, detect tempo + beat phase from an onset envelope, find the drop
//   (the biggest jump in bass energy), and save beat timestamps.
// - Otherwise write a 120 BPM grid with the drop planned at 1:15.
// Usage: node scripts/beats.mjs [path/to/track]

import { spawnSync } from "node:child_process";
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const MUSIC_DIR = join(ROOT, "assets/music");
const OUT = join(ROOT, "beats.json");
const PLANNED_DROP = 75;
const EDIT_SECONDS = 105;
const SR = 22050;
const HOP = 256;

const round3 = (v) => Math.round(v * 1000) / 1000;

const writeGrid = () => {
  const bpm = 120;
  const beats = [];
  for (let t = 0; t <= EDIT_SECONDS + 1e-9; t += 60 / bpm) beats.push(round3(t));
  const data = { source: "grid", music: null, bpm, drop: PLANNED_DROP, duration: EDIT_SECONDS, beats };
  writeFileSync(OUT, JSON.stringify(data, null, 0) + "\n");
  console.log(`No track found: wrote ${beats.length}-beat ${bpm} BPM grid, drop at ${PLANNED_DROP}s`);
};

const findTrack = () => {
  if (process.argv[2]) return process.argv[2];
  if (!existsSync(MUSIC_DIR)) return null;
  const f = readdirSync(MUSIC_DIR).find((n) => /\.(mp3|wav|m4a|aac|flac|ogg|opus)$/i.test(n));
  return f ? join(MUSIC_DIR, f) : null;
};

const decode = (file) => {
  const r = spawnSync("npx", ["remotion", "ffmpeg", "-v", "error", "-i", file, "-ac", "1", "-ar", String(SR), "-f", "wav", "-c:a", "pcm_s16le", "-"], {
    cwd: ROOT,
    maxBuffer: 1 << 30,
  });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr}`);
  // Skip the WAV header: find the "data" chunk
  const buf = r.stdout;
  let pos = 12;
  while (pos + 8 <= buf.length && buf.toString("ascii", pos, pos + 4) !== "data") pos += 8 + buf.readUInt32LE(pos + 4);
  const start = pos + 8;
  const out = new Float32Array(Math.floor((buf.length - start) / 2));
  for (let i = 0; i < out.length; i++) out[i] = buf.readInt16LE(start + i * 2) / 32768;
  return out;
};

const analyze = (file) => {
  const x = decode(file);
  const duration = x.length / SR;
  // One-pole low-pass for a bass band, full band for onsets
  const lp = new Float32Array(x.length);
  const a = Math.exp((-2 * Math.PI * 150) / SR);
  let y = 0;
  for (let i = 0; i < x.length; i++) lp[i] = y = (1 - a) * x[i] + a * y;
  const frames = Math.floor(x.length / HOP);
  const eFull = new Float32Array(frames);
  const eBass = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let s = 0;
    let sb = 0;
    for (let i = f * HOP; i < (f + 1) * HOP; i++) {
      s += x[i] * x[i];
      sb += lp[i] * lp[i];
    }
    eFull[f] = Math.log(1e-6 + s / HOP);
    eBass[f] = Math.log(1e-6 + sb / HOP);
  }
  // Onset strength: half-wave rectified energy flux, mean-removed
  const onset = new Float32Array(frames);
  for (let f = 1; f < frames; f++) onset[f] = Math.max(0, eFull[f] - eFull[f - 1]) + 0.5 * Math.max(0, eBass[f] - eBass[f - 1]);
  const fps = SR / HOP;
  // Tempo via autocorrelation, weighted toward ~120 BPM
  let best = { bpm: 120, score: -Infinity };
  for (let bpm = 70; bpm <= 180; bpm += 0.25) {
    const lag = (60 / bpm) * fps;
    let s = 0;
    for (let f = 0; f + lag * 4 < frames; f += 2) {
      const l = Math.round(f + lag);
      const l2 = Math.round(f + 2 * lag);
      s += onset[f] * (onset[l] + 0.5 * onset[l2]);
    }
    const w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 120) / 0.6, 2));
    if (s * w > best.score) best = { bpm, score: s * w };
  }
  // Refine tempo and phase together: maximise onset energy on the beat grid
  let bpm = best.bpm;
  let phase = 0;
  let gridScore = -Infinity;
  for (let b = best.bpm - 1; b <= best.bpm + 1; b += 0.01) {
    const per = (60 / b) * fps;
    for (let p = 0; p < per; p += 0.5) {
      let s = 0;
      for (let t = p; t < frames; t += per) s += onset[Math.round(t)] || 0;
      if (s > gridScore) {
        gridScore = s;
        bpm = b;
        phase = p;
      }
    }
  }
  best.bpm = Math.round(bpm * 100) / 100;
  const period = (60 / bpm) * fps;
  // Beats, each nudged to the strongest onset within +-35 ms
  const win = Math.round(0.035 * fps);
  const beats = [];
  for (let t = phase; t < frames; t += period) {
    const c = Math.round(t);
    let bi = c;
    for (let k = c - win; k <= c + win; k++) if ((onset[k] || 0) > (onset[bi] || 0)) bi = k;
    beats.push(round3(bi / fps));
  }
  // Drop: largest rise in bass energy between the 4 s before and after,
  // searched between 25% and 90% of the track, then snapped to a beat
  const sec = Math.round(fps);
  const meanRange = (arr, a0, a1) => {
    let s = 0;
    let n = 0;
    for (let i = Math.max(0, a0); i < Math.min(arr.length, a1); i++, n++) s += arr[i];
    return n ? s / n : 0;
  };
  let drop = PLANNED_DROP;
  let dropScore = -Infinity;
  for (let f = Math.floor(frames * 0.25); f < frames * 0.9; f += 4) {
    const s = meanRange(eBass, f, f + 4 * sec) - meanRange(eBass, f - 4 * sec, f);
    if (s > dropScore) {
      dropScore = s;
      drop = f / fps;
    }
  }
  drop = beats.reduce((b, t) => (Math.abs(t - drop) < Math.abs(b - drop) ? t : b), beats[0]);
  return { bpm: best.bpm, beats, drop: round3(drop), duration: round3(duration) };
};

const track = findTrack();
if (!track) {
  writeGrid();
} else {
  const r = analyze(track);
  const rel = relative(join(ROOT, "assets"), track);
  const data = { source: "analysis", music: rel, ...r };
  writeFileSync(OUT, JSON.stringify(data, null, 0) + "\n");
  console.log(`Analyzed ${rel}: ${r.bpm} BPM, ${r.beats.length} beats, drop at ${r.drop}s, duration ${r.duration}s`);
}
