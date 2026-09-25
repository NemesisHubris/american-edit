// Engraved parchment map of the United States (us-atlas geometry): ornate
// border, spinning compass rose, engraved sea with coastal water-lines,
// original states in ink, a spreading Louisiana wash, states filling
// westward on cue, rivers, period labels, ships, and travelling icons.
import { useCurrentFrame } from "remotion";
import { clamp, easeInOut, easeOut, memo, ramp, TAU } from "../lib/math";
import { usePalette } from "../lib/palette";
import { hash } from "../lib/random";
import { hatch, polyD, Pt, rectP, smoothD } from "../lib/engrave";
import { getUSMap, PLACES } from "../lib/usmap";
import { useUid } from "../lib/uid";
import { ITALIC_FAMILY, DISPLAY_FAMILY } from "../fonts";
import { InkDraw, InkItem } from "./InkDraw";
import { blobD } from "./Shots";

export type MapCues = {
  border?: number; // ornate border + cartouche start drawing
  sea?: number;
  land?: number; // coast + state outlines draw
  original?: number; // original states inked
  louisiana?: number; // Louisiana wash spreads
  westStart?: number; // remaining states fill east -> west
  westDur?: number;
  rivers?: number;
  labels?: number;
  compass?: number;
  // every state already filled (for later shots)
  allFilled?: boolean;
};

const X0 = 40;
const Y0 = 40;
const W = 1840;
const H = 1000;

const borderItems = (): InkItem[] => {
  const items: InkItem[] = [];
  items.push({ d: polyD(rectP(X0, Y0, W, H)), w: 4.5 });
  items.push({ d: polyD(rectP(X0 + 12, Y0 + 12, W - 24, H - 24)), w: 1.6 });
  items.push({ d: polyD(rectP(X0 + 34, Y0 + 34, W - 68, H - 68)), w: 2.2 });
  // graduated band (alternating blocks)
  const seg = 46;
  const blocks: string[] = [];
  const bx0 = X0 + 12;
  const by0 = Y0 + 12;
  const bw = W - 24;
  const bh = H - 24;
  const t = 10;
  for (let x = bx0 + 34; x + seg < bx0 + bw - 34; x += seg * 2) {
    blocks.push(polyD(rectP(x, by0 + 6, seg, t)));
    blocks.push(polyD(rectP(x, by0 + bh - 6 - t, seg, t)));
  }
  for (let y = by0 + 34; y + seg < by0 + bh - 34; y += seg * 2) {
    blocks.push(polyD(rectP(bx0 + 6, y, t, seg)));
    blocks.push(polyD(rectP(bx0 + bw - 6 - t, y, t, seg)));
  }
  items.push({ d: blocks.join(""), kind: "fill", fill: "ink", op: 0.85 });
  items.push({ d: polyD(rectP(bx0 + 6, by0 + 6, bw - 12, bh - 12)), w: 1 });
  items.push({ d: polyD(rectP(bx0 + 6 + t, by0 + 6 + t, bw - 12 - 2 * t, bh - 12 - 2 * t)), w: 1 });
  // corner rosettes
  for (const [cx, cy] of [
    [X0 + 23, Y0 + 23],
    [X0 + W - 23, Y0 + 23],
    [X0 + 23, Y0 + H - 23],
    [X0 + W - 23, Y0 + H - 23],
  ]) {
    items.push({ d: polyD(rectP(cx - 20, cy - 20, 40, 40)), w: 2 });
    const petals: Pt[] = [];
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU;
      const r = k % 2 === 0 ? 16 : 6;
      petals.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    items.push({ d: polyD(petals), w: 1.4 });
    items.push({ d: polyD(petals), kind: "fill", fill: "inkSoft", op: 0.5 });
  }
  return items;
};

// Cartouche: scrolled title panel
const cartoucheItems = (cx: number, cy: number): InkItem[] => {
  const w = 440;
  const h = 150;
  const items: InkItem[] = [];
  const shape: Pt[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    shape.push([cx - w / 2 + t * w, cy - h / 2 + Math.sin(t * Math.PI) * -10]);
  }
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    shape.push([cx + w / 2 - t * w, cy + h / 2 + Math.sin(t * Math.PI) * 10]);
  }
  items.push({ d: polyD(shape), kind: "fill", fill: "paper", op: 1 });
  items.push({ d: polyD(shape), w: 3 });
  const inner = shape.map(([x, y]) => [cx + (x - cx) * 0.93, cy + (y - cy) * 0.84] as Pt);
  items.push({ d: polyD(inner), w: 1.2 });
  // scroll ends
  for (const s of [-1, 1]) {
    const ex = cx + (s * w) / 2;
    items.push({
      d: smoothD([
        [ex, cy - h / 2],
        [ex + s * 30, cy - h / 2 - 10],
        [ex + s * 42, cy - h / 2 + 18],
        [ex + s * 22, cy - h / 2 + 30],
        [ex + s * 10, cy - h / 2 + 14],
      ]),
      w: 2.2,
    });
    items.push({
      d: smoothD([
        [ex, cy + h / 2],
        [ex + s * 30, cy + h / 2 + 10],
        [ex + s * 42, cy + h / 2 - 18],
        [ex + s * 22, cy + h / 2 - 30],
        [ex + s * 10, cy + h / 2 - 14],
      ]),
      w: 2.2,
    });
  }
  // flourishes under title
  items.push({ d: smoothD([[cx - 140, cy + 38], [cx - 60, cy + 30], [cx, cy + 40], [cx + 60, cy + 30], [cx + 140, cy + 38]]), w: 1.6 });
  return items;
};

// 32-point compass rose (drawn once, rotated live)
const compassItems = (r: number): InkItem[] => {
  const items: InkItem[] = [];
  items.push({ d: `M${-r} 0a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`, w: 2.5 });
  items.push({ d: `M${-r * 0.88} 0a${r * 0.88} ${r * 0.88} 0 1 0 ${r * 1.76} 0a${r * 0.88} ${r * 0.88} 0 1 0 ${-r * 1.76} 0`, w: 1.2 });
  items.push({ d: `M${-r * 0.38} 0a${r * 0.38} ${r * 0.38} 0 1 0 ${r * 0.76} 0a${r * 0.38} ${r * 0.38} 0 1 0 ${-r * 0.76} 0`, w: 1.2 });
  const ticks: string[] = [];
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * TAU;
    const r0 = r * (k % 2 === 0 ? 0.88 : 0.93);
    ticks.push(`M${(Math.cos(a) * r0).toFixed(1)} ${(Math.sin(a) * r0).toFixed(1)}L${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`);
  }
  items.push({ d: ticks.join(""), kind: "hatch", w: 1.2, op: 0.9 });
  const point = (a: number, len: number, wid: number) => {
    const tip: Pt = [Math.cos(a) * len, Math.sin(a) * len];
    const l: Pt = [Math.cos(a - Math.PI / 2) * wid, Math.sin(a - Math.PI / 2) * wid];
    const rr: Pt = [Math.cos(a + Math.PI / 2) * wid, Math.sin(a + Math.PI / 2) * wid];
    return { dark: polyD([[0, 0], tip, l]), light: polyD([[0, 0], tip, rr]), outline: polyD([l, tip, rr, [0, 0]]) };
  };
  const layers: [number, number, number][] = [
    [8, 0.62, 0.07],
    [4, 0.82, 0.1],
    [4, 1.12, 0.13],
  ];
  layers.forEach(([n, len, wid], li) => {
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + (k / n) * TAU + (li === 0 ? Math.PI / 8 : li === 1 ? Math.PI / 4 : 0);
      const p = point(a, r * len, r * wid);
      items.push({ d: p.dark, kind: "fill", fill: "ink", op: 0.9 });
      items.push({ d: p.light, kind: "fill", fill: "paper", op: 1 });
      items.push({ d: p.outline, w: 1.4 });
    }
  });
  // fleur-de-lis at north
  const n = -r * 1.12;
  items.push({ d: smoothD([[0, n - 4], [-14, n - 22], [-4, n - 44], [0, n - 52], [4, n - 44], [14, n - 22], [0, n - 4]]), w: 2 });
  items.push({ d: smoothD([[-4, n - 14], [-26, n - 18], [-34, n - 34], [-22, n - 36], [-10, n - 24]]), w: 1.8 });
  items.push({ d: smoothD([[4, n - 14], [26, n - 18], [34, n - 34], [22, n - 36], [10, n - 24]]), w: 1.8 });
  return items;
};

export const Compass: React.FC<{ x: number; y: number; r?: number; start: number; spin?: number }> = ({ x, y, r = 110, start, spin = 1 }) => {
  const f = useCurrentFrame();
  const items = memo(`compass:${r}`, () => compassItems(r));
  const a = f - start;
  // spins in fast, then settles into a slow living drift
  const rot = (1 - easeOut(clamp(a / 40))) * 540 * spin + Math.sin(f / 30) * 6;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <InkDraw items={items} start={start} dur={26} hatchAt={10} washAt={14} />
    </g>
  );
};

// Small engraved sailing ship, bobbing, with a wake
export const Ship: React.FC<{ x: number; y: number; s?: number; seed?: number; dir?: 1 | -1; speed?: number }> = ({ x, y, s = 1, seed = 1, dir = 1, speed = 0.25 }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const px = x + f * speed * dir;
  const bob = Math.sin(f / 9 + seed) * 3;
  const roll = Math.sin(f / 13 + seed) * 5;
  return (
    <g transform={`translate(${px} ${y + bob}) rotate(${roll}) scale(${s * dir} ${s})`} stroke={pal.ink} strokeLinecap="round" strokeLinejoin="round">
      {[0, 1, 2].map((k) => (
        <path key={k} d={`M${-40 - k * 22} ${14 + k * 3}q-12 3 -24 0`} fill="none" strokeWidth={1.2} opacity={0.6 - k * 0.15} />
      ))}
      <path d="M-34 0L34 0L26 12L-28 12Z" fill={pal.wood} strokeWidth={1.8} />
      <path d="M-30 4H30M-28 8H28" fill="none" strokeWidth={0.8} />
      <path d="M-14 0V-46M4 0V-54M20 0V-38" fill="none" strokeWidth={1.6} />
      <path d="M-24 -40Q-14 -34 -4 -40L-4 -12Q-14 -8 -24 -12Z M-6 -48Q4 -42 14 -48L14 -14Q4 -10 -6 -14Z M12 -34Q20 -30 28 -34L28 -12Q20 -9 12 -12Z" fill={pal.paper} strokeWidth={1.4} />
      <path d="M4 -54L14 -52L4 -50Z" fill={pal.ink} strokeWidth={0.8} />
      <path d="M34 0L50 -10" fill="none" strokeWidth={1.2} />
    </g>
  );
};

export const MapBase: React.FC<{ cues: MapCues; showCartouche?: boolean; cartouche?: [number, number]; compass?: [number, number] }> = ({
  cues,
  showCartouche = true,
  cartouche = [470, 890],
  compass = [1660, 700],
}) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const uid = useUid("map");
  const m = getUSMap();
  const seaD = memo("map:sea", () => hatch([rectP(X0 + 34, Y0 + 34, W - 68, H - 68)], { angle: 0, spacing: 7, seed: "sea", trim: 3, wobble: 0.8 }));
  const border = memo("map:border", borderItems);
  const cart = memo(`map:cart:${cartouche.join(",")}`, () => cartoucheItems(cartouche[0], cartouche[1]));
  const stateItems = memo("map:stateItems", () => m.states.map((s, i) => ({ d: s.d, w: 1.3, color: "inkSoft", order: (1 - (s.c[0] - 170) / 1580) * 0.9 + (i % 7) * 0.01 }) as InkItem));
  const westOrder = memo("map:west", () =>
    m.states
      .filter((s) => !s.original)
      .sort((a, b) => b.c[0] - a.c[0])
      .map((s) => s.id),
  );
  const cue = (k: keyof MapCues, d = 0) => (typeof cues[k] === "number" ? (cues[k] as number) : Infinity) + d;
  const seaOp = ramp(f, cue("sea"), cue("sea", 20), easeOut);
  const landOp = ramp(f, cue("land"), cue("land", 16), easeOut);
  const coastP = ramp(f, cue("land"), cue("land", 30), easeInOut);
  const origP = ramp(f, cue("original"), cue("original", 18), easeOut);
  const louP = ramp(f, cue("louisiana"), cue("louisiana", 40), easeInOut);
  const riverP = ramp(f, cue("rivers"), cue("rivers", 40), easeInOut);
  const labelP = ramp(f, cue("labels"), cue("labels", 16), easeOut);
  const stl = m.proj(PLACES.stLouis);
  const west = westOrder.length;
  const fillAt = (id: string) => {
    if (cues.allFilled) return 1;
    const k = westOrder.indexOf(id);
    if (k < 0) return 0;
    const t0 = cue("westStart") + (k / Math.max(1, west - 1)) * (cues.westDur ?? 60);
    return ramp(f, t0, t0 + 8, easeOut);
  };
  const labels: [string, number, number, number, number, boolean?][] = [
    ["PACIFIC OCEAN", 205, 700, 26, -80, true],
    ["ATLANTIC OCEAN", 1590, 330, 26, 58, true],
    ["GULF OF MEXICO", 1110, 900, 24, 0, true],
    ["LOUISIANA", 880, 440, 30, -8],
    ["OREGON COUNTRY", 400, 360, 18, -6],
    ["NEW SPAIN", 560, 730, 22, 0],
    ["BRITISH POSSESSIONS", 900, 150, 20, 0],
  ];
  return (
    <g>
      <defs>
        <clipPath id={`${uid}lou`}>
          <path d={m.louisiana} />
        </clipPath>
        <clipPath id={`${uid}spread`}>
          <path d={louP > 0 ? blobD(stl[0], stl[1] + 60, louP * 1100 + 1, 5, 0.22, 5, 60, 0.04) : "M0 0Z"} />
        </clipPath>
        <pattern id={`${uid}h`} width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <line x1={0} y1={0} x2={0} y2={7} stroke={pal.ink} strokeWidth={1.3} />
        </pattern>
      </defs>
      <rect x={-600} y={-600} width={3120} height={2280} fill={pal.paper} />
      <path d={seaD} fill="none" stroke={pal.ink} strokeWidth={1} opacity={0.28 * seaOp} />
      {landOp > 0 && (
        <g opacity={landOp}>
          {[46, 34, 24, 15].map((w, i) => (
            <g key={i}>
              <path d={m.coast} fill="none" stroke={pal.ink} strokeWidth={w} opacity={0.55 - i * 0.05} strokeLinejoin="round" />
              <path d={m.coast} fill="none" stroke={pal.paper} strokeWidth={w - 2.2} strokeLinejoin="round" />
            </g>
          ))}
          <path d={m.land} fill={pal.paper} />
          <path d={m.land} fill={pal.sand} opacity={0.35} />
        </g>
      )}
      {/* Louisiana Purchase wash */}
      {louP > 0 && (
        <g clipPath={`url(#${uid}lou)`}>
          <g clipPath={`url(#${uid}spread)`}>
            <path d={m.land} fill={pal.brick} opacity={0.42} />
            <path d={m.land} fill={`url(#${uid}h)`} opacity={0.25} />
          </g>
        </g>
      )}
      {/* states filling westward */}
      {m.states.map((s) => {
        const p = fillAt(s.id);
        if (p <= 0) return null;
        const flash = cues.allFilled ? 0 : clamp(1 - Math.abs(p - 0.6) * 3);
        return (
          <g key={s.id}>
            <path d={s.d} fill={pal.ground} opacity={0.45 * p} />
            {flash > 0 && <path d={s.d} fill={pal.glow} opacity={0.5 * flash} />}
          </g>
        );
      })}
      {/* original states inked */}
      {origP > 0 &&
        m.states
          .filter((s) => s.original)
          .map((s) => (
            <g key={s.id} opacity={origP}>
              <path d={s.d} fill={pal.inkSoft} opacity={0.3} />
              <path d={s.d} fill={`url(#${uid}h)`} opacity={0.7} />
              <path d={s.d} fill="none" stroke={pal.ink} strokeWidth={2.4} />
            </g>
          ))}
      {riverP > 0 && m.rivers.map((d, i) => <path key={i} d={d} fill="none" stroke={pal.inkSoft} strokeWidth={2.6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - riverP} opacity={0.9} />)}
      {landOp > 0 && <InkDraw items={stateItems} start={cue("land")} dur={30} overlap={0.25} />}
      {landOp > 0 && <path d={m.coast} fill="none" stroke={pal.ink} strokeWidth={2.4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - coastP} />}
      {labelP > 0 &&
        labels.map(([t, x, y, size, rot, sea], i) => (
          <text
            key={t}
            x={x}
            y={y}
            transform={`rotate(${rot} ${x} ${y})`}
            textAnchor="middle"
            fontFamily={sea ? ITALIC_FAMILY : DISPLAY_FAMILY}
            fontWeight={sea ? 400 : 700}
            fontSize={size}
            letterSpacing={size * (0.25 + (1 - ramp(f, cue("labels", i * 2), cue("labels", i * 2 + 14), easeOut)) * 0.5)}
            fill={pal.ink}
            opacity={0.85 * ramp(f, cue("labels", i * 2), cue("labels", i * 2 + 14), easeOut)}
          >
            {t}
          </text>
        ))}
      <InkDraw items={border} start={cue("border")} dur={28} hatchAt={10} washAt={14} />
      {showCartouche && (
        <g>
          <InkDraw items={cart} start={cue("border", 6)} dur={24} washAt={0} washDur={8} />
          <g opacity={ramp(f, cue("border", 18), cue("border", 30), easeOut)}>
            <text x={cartouche[0]} y={cartouche[1] - 14} textAnchor="middle" fontFamily={DISPLAY_FAMILY} fontWeight={800} fontSize={34} letterSpacing={6} fill={pal.ink}>
              NORTH AMERICA
            </text>
            <text x={cartouche[0]} y={cartouche[1] + 24} textAnchor="middle" fontFamily={ITALIC_FAMILY} fontSize={20} letterSpacing={4} fill={pal.ink}>
              anno MDCCCV
            </text>
          </g>
        </g>
      )}
      {cues.compass !== undefined && <Compass x={compass[0]} y={compass[1]} start={cues.compass} />}
    </g>
  );
};

// Tiny canoe (paddler silhouettes) that rides a route
export const Canoe: React.FC<{ x: number; y: number; angle: number; s?: number }> = ({ x, y, angle, s = 1 }) => {
  const f = useCurrentFrame();
  const pal = usePalette();
  const flip = Math.abs(angle) > 90;
  const paddle = Math.sin(f / 4) * 25;
  return (
    <g transform={`translate(${x} ${y}) rotate(${flip ? angle + 180 : angle}) scale(${s * (flip ? -1 : 1)} ${s})`} stroke={pal.ink} strokeLinecap="round">
      <path d="M-26 0Q0 10 26 0Q20 -3 -20 -3Z" fill={pal.wood} strokeWidth={1.6} />
      {[-12, 6].map((px, i) => (
        <g key={i}>
          <circle cx={px} cy={-10} r={3} fill={pal.ink} strokeWidth={0} />
          <path d={`M${px} -7V-2`} strokeWidth={2.2} />
          <path d={`M${px} -6l${6 * Math.cos((paddle * Math.PI) / 180)} ${10}`} strokeWidth={1.2} />
        </g>
      ))}
    </g>
  );
};

// A covered wagon icon for map routes (wheels turn with travel)
export const MapWagon: React.FC<{ x: number; y: number; angle: number; s?: number; roll: number }> = ({ x, y, angle, s = 1, roll }) => {
  const pal = usePalette();
  const flip = Math.abs(angle) > 90;
  return (
    <g transform={`translate(${x} ${y}) rotate(${(flip ? angle + 180 : angle) * 0.3}) scale(${s * (flip ? -1 : 1)} ${s})`} stroke={pal.ink} strokeLinecap="round">
      <path d="M-14 -4Q-14 -22 0 -22Q14 -22 14 -4Z" fill={pal.flagWhite} strokeWidth={1.3} />
      <path d="M-5 -21V-4M5 -21V-4" strokeWidth={0.8} fill="none" />
      <path d="M-16 -4H16V1H-16Z" fill={pal.wood} strokeWidth={1.2} />
      {[-9, 9].map((wx, i) => (
        <g key={i} transform={`translate(${wx} 4) rotate(${roll})`}>
          <circle r={5} fill="none" strokeWidth={1.3} />
          <path d="M-5 0H5M0 -5V5" strokeWidth={0.8} />
        </g>
      ))}
      <path d="M16 -1L26 -3" strokeWidth={1} />
      <ellipse cx={30} cy={-4} rx={5} ry={3} fill={pal.wood} strokeWidth={1} />
    </g>
  );
};

export const mapHash = hash;
