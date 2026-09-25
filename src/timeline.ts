// Every cut, shake and hit is snapped to a beat from beats.json.
// Times are written as planned edit times in seconds (on the 120 BPM plan);
// `cut()` shifts them so the Moon landing lands on the track's drop, then
// snaps to the nearest beat.
import beatsData from "../beats.json";
import { FPS } from "./constants";

export const PLANNED_DROP = 75;
const BEATS: number[] = beatsData.beats;
export const MUSIC: string | null = beatsData.music;
// Seconds of the track that play before edit time 0
export const TRACK_OFFSET = beatsData.drop - PLANNED_DROP;

const period = BEATS.length > 1 ? (BEATS[BEATS.length - 1] - BEATS[0]) / (BEATS.length - 1) : 0.5;

// Nearest beat (track time) to a track time, extrapolating past the ends
const nearestBeat = (t: number) => {
  if (t <= BEATS[0]) return BEATS[0] - Math.round((BEATS[0] - t) / period) * period;
  const last = BEATS[BEATS.length - 1];
  if (t >= last) return last + Math.round((t - last) / period) * period;
  let lo = 0;
  let hi = BEATS.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (BEATS[mid] <= t) lo = mid;
    else hi = mid;
  }
  return t - BEATS[lo] < BEATS[hi] - t ? BEATS[lo] : BEATS[hi];
};

// Planned edit time (s) -> frame of the nearest beat, in edit frames
export const cut = (t: number) => Math.round((nearestBeat(t + TRACK_OFFSET) - TRACK_OFFSET) * FPS);

export type SceneId =
  | "coldOpen"
  | "founding"
  | "manifest"
  | "tested"
  | "ingenuity"
  | "greatest"
  | "pause"
  | "drop"
  | "hype"
  | "ending";

// Planned scene start times in seconds
const PLAN: [SceneId, number][] = [
  ["coldOpen", 0],
  ["founding", 3],
  ["manifest", 18],
  ["tested", 35],
  ["ingenuity", 45],
  ["greatest", 60],
  ["pause", 70],
  ["drop", 75],
  ["hype", 81],
  ["ending", 97],
];
export const EDIT_END = 105;

export const SCENES = PLAN.map(([id, t], i) => {
  const next = i + 1 < PLAN.length ? PLAN[i + 1][1] : EDIT_END;
  const from = cut(t);
  return { id, plannedStart: t, from, durationInFrames: cut(next) - from };
});

export const TOTAL_FRAMES = cut(EDIT_END);

export const sceneInfo = (id: SceneId) => SCENES.find((s) => s.id === id)!;

// Scene-local beat snapping: local planned seconds -> local frame
export const sceneClock = (id: SceneId) => {
  const s = sceneInfo(id);
  return (localSeconds: number) => cut(s.plannedStart + localSeconds) - s.from;
};
