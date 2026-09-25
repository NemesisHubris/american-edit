// Modern-era models: Berlin Wall segments (graffiti, fracture into chunks),
// circuit board with racing light pulses, beige CRT computers, smartphone,
// fighter jet.
import * as THREE from "three";
import { memo } from "../../lib/math";
import { rng } from "../../lib/random";
import { box, cyl, extrude, lathe, merge, place } from "../geo";
import type { GL } from "../GLShot";

// ------------------------------------------------------------ canvas textures
export const canvasTex = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
  const cv = memo(`cv:${key}`, () => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d")!);
    return c;
  });
  const t = new THREE.CanvasTexture(cv);
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = 8;
  return t;
};

const graffiti = (ctx: CanvasRenderingContext2D, w: number, h: number, seed: string) => {
  const r = rng(seed);
  ctx.fillStyle = "#d9d4c8";
  ctx.fillRect(0, 0, w, h);
  // concrete stains
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(90,85,75,${0.03 + r() * 0.06})`;
    ctx.beginPath();
    ctx.ellipse(r() * w, r() * h, 20 + r() * 120, 10 + r() * 60, r() * 3, 0, 7);
    ctx.fill();
  }
  const cols = ["#d8342c", "#f2c230", "#2f6fd0", "#2aa15a", "#e0602a", "#9b3fc0", "#18a6b8", "#f07aa0", "#111"];
  // big bubble letters / blobs
  for (let i = 0; i < 26; i++) {
    const c = cols[Math.floor(r() * cols.length)];
    const x = r() * w;
    const y = h * 0.25 + r() * h * 0.7;
    const s = 40 + r() * 140;
    ctx.fillStyle = c;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 5;
    ctx.beginPath();
    const n = 7;
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2;
      const rr = s * (0.6 + r() * 0.5);
      const px = x + Math.cos(a) * rr * 1.4;
      const py = y + Math.sin(a) * rr * 0.6;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.quadraticCurveTo(x + Math.cos(a - 0.4) * rr * 1.8, y + Math.sin(a - 0.4) * rr * 0.9, px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // tags / words
  const words = ["FREIHEIT", "LOVE", "PEACE", "BERLIN", "1989", "TEAR IT DOWN", "HOPE", "ONE WORLD", "WIR SIND DAS VOLK"];
  for (let i = 0; i < 14; i++) {
    ctx.save();
    ctx.translate(r() * w, h * 0.3 + r() * h * 0.65);
    ctx.rotate((r() - 0.5) * 0.4);
    ctx.font = `bold ${40 + r() * 70}px sans-serif`;
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#111";
    ctx.fillStyle = cols[Math.floor(r() * cols.length)];
    const wd = words[Math.floor(r() * words.length)];
    ctx.strokeText(wd, 0, 0);
    ctx.fillText(wd, 0, 0);
    ctx.restore();
  }
  // drips
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = cols[Math.floor(r() * cols.length)];
    ctx.fillRect(r() * w, h * 0.3 + r() * h * 0.6, 3, 10 + r() * 60);
  }
};

// Berlin Wall segment (L-shaped Stützwandelement 3.6 m tall, 1.2 m wide), with the
// capping pipe; front at +z. Returns chunks (pre-fractured pieces) for crumbling.
export const wallSegmentGeo = () =>
  memo("gl:wallseg", () => {
    const slab = box(1.2, 3.6, 0.22, 0, 1.8, 0);
    const foot = box(1.2, 0.3, 2.1, 0, 0.15, -0.95);
    const pipe = place(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 20).rotateZ(Math.PI / 2), [0, 3.75, 0]);
    return { slab, foot, pipe };
  });

export const wallMaterial = (g: GL, seed: string) => {
  const tex = canvasTex(`graf${seed}`, 2048, 512, (ctx) => graffiti(ctx, 2048, 512, seed));
  tex.wrapS = THREE.RepeatWrapping;
  return g.ink({
    color: "#ffffff",
    mode: "screen",
    angle: 65,
    scale: 3.5,
    cross: 0.5,
    shade: 0.8,
    hatch: 0.7,
    uniforms: { uGraf: { value: tex }, uCrack: { value: 0 } },
    fragDecl: "uniform sampler2D uGraf; uniform float uCrack;",
    frag: /* glsl */ `
      // graffiti mapped along the wall (x) and height (y), only on the east face
      vec2 guv = vec2(vWorld.x / 19.2 + 0.5, clamp(vWorld.y / 3.6, 0.0, 1.0));
      vec3 gc = texture(uGraf, guv).rgb;
      float front = smoothstep(0.3, 0.7, N.z);
      albedo = mix(vec3(0.82, 0.8, 0.75), gc, front);
      // cracks spreading across the wall
      vec2 cp = vWorld.xy + (vec2(tvn(vWorld.xy * 2.0), tvn(vWorld.xy * 2.0 + 5.0)) - 0.5) * 0.6;
      float cr = tvn(cp * vec2(2.2, 1.1));
      float line = 1.0 - smoothstep(0.0, 0.012, abs(cr - 0.5));
      float grow = smoothstep(uCrack * 6.0, uCrack * 6.0 - 1.0, length((vWorld.xy - vec2(0.0, 2.0)) * vec2(1.0, 1.4)));
      extraInk += line * grow * 1.2;
      albedo *= 1.0 - line * grow * 0.7;
    `,
  });
};

// ------------------------------------------------------------ circuit board
type Trace = { pts: [number, number][]; len: number };
export const pcbLayout = () =>
  memo("gl:pcb", () => {
    const r = rng("pcb");
    const W = 2048;
    const traces: Trace[] = [];
    const chips: [number, number, number, number][] = []; // x, y, w, h (texture px)
    for (let i = 0; i < 9; i++) chips.push([150 + r() * 1700, 150 + r() * 1700, 90 + r() * 180, 90 + r() * 180]);
    for (let i = 0; i < 180; i++) {
      let x = Math.round((r() * W) / 16) * 16;
      let y = Math.round((r() * W) / 16) * 16;
      const pts: [number, number][] = [[x, y]];
      let dir = Math.floor(r() * 4);
      const segs = 2 + Math.floor(r() * 5);
      for (let k = 0; k < segs; k++) {
        const L = 40 + r() * 320;
        const d = [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
        ][dir];
        // 45 degree jog between straight runs
        const j = 16 + r() * 40;
        x += d[0] * L;
        y += d[1] * L;
        pts.push([x, y]);
        const turn = r() < 0.5 ? 1 : -1;
        const nd = [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
        ][(dir + turn + 4) % 4];
        x += (d[0] + nd[0]) * j;
        y += (d[1] + nd[1]) * j;
        pts.push([x, y]);
        dir = (dir + turn + 4) % 4;
      }
      let len = 0;
      for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      traces.push({ pts, len });
    }
    return { traces, chips, W };
  });

// Board texture: R = copper trace mask, G = arc-length phase along the trace (0..1
// repeating), B = pads / vias, A = solder mask.
export const pcbTexture = () => {
  const { traces, W } = pcbLayout();
  return canvasTex("pcbTex", W, W, (ctx) => {
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, W, W);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    traces.forEach((t, ti) => {
      // draw in short pieces so G can carry the phase
      let acc = (ti * 0.137) % 1;
      const w = 4 + (ti % 3) * 3;
      for (let k = 1; k < t.pts.length; k++) {
        const [x0, y0] = t.pts[k - 1];
        const [x1, y1] = t.pts[k];
        const L = Math.hypot(x1 - x0, y1 - y0);
        const n = Math.max(1, Math.ceil(L / 6));
        for (let s = 0; s < n; s++) {
          const a = s / n;
          const b = (s + 1) / n;
          const ph = (acc + (a * L) / 600) % 1;
          ctx.strokeStyle = `rgb(255,${Math.floor(ph * 255)},0)`;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.moveTo(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a);
          ctx.lineTo(x0 + (x1 - x0) * b, y0 + (y1 - y0) * b);
          ctx.stroke();
        }
        acc = (acc + L / 600) % 1;
      }
      // vias at the ends
      for (const [x, y] of [t.pts[0], t.pts[t.pts.length - 1]]) {
        ctx.fillStyle = "rgb(255,0,255)";
        ctx.beginPath();
        ctx.arc(x, y, w + 5, 0, 7);
        ctx.fill();
      }
    });
  });
};

export const makePCB = (g: GL, size = 40) => {
  const tex = pcbTexture();
  const board = g.ink({
    color: "#1f5a3a",
    mode: "screen",
    angle: 45,
    scale: 4,
    hatch: 0.5,
    shade: 0.9,
    spec: 0.6,
    gloss: 40,
    uniforms: { uPcb: { value: tex }, uPulse: { value: 0 } },
    fragDecl: "uniform sampler2D uPcb; uniform float uPulse;",
    frag: /* glsl */ `
      vec4 pc = texture(uPcb, vUv);
      vec3 copper = vec3(0.85, 0.62, 0.3);
      albedo = mix(vec3(0.08, 0.3, 0.18), copper, pc.r * 0.85);
      albedo = mix(albedo, vec3(0.9, 0.85, 0.7), pc.b * 0.6);
      // light pulses racing along the traces
      float ph = fract(pc.g - uPulse);
      float pulse = pc.r * (smoothstep(0.0, 0.04, ph) * (1.0 - smoothstep(0.04, 0.25, ph)));
      emis += vec3(0.4, 0.95, 1.0) * pulse * 2.2;
      emis += vec3(0.1, 0.35, 0.4) * pc.r * 0.25;
      hatchMul = 1.0 - pc.r * 0.6;
    `,
  });
  const geo = new THREE.PlaneGeometry(size, size);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, board);
  const group = new THREE.Group();
  group.add(mesh);
  // chips with pins, capacitors, resistors
  const { chips, W } = pcbLayout();
  const chipM = g.ink({
    color: "#1c1c1f",
    mode: "screen",
    angle: 30,
    scale: 3.4,
    spec: 0.8,
    gloss: 30,
    rim: 0.5,
    frag: /* glsl */ `
      // silk-screened part numbers + pin-1 dot on chip tops
      float top = step(0.8, N.y);
      vec2 q = vWorld.xz * vec2(4.0, 10.0);
      float txt = step(0.55, tvn(floor(q) * 0.37)) * step(0.2, fract(q.x)) * step(fract(q.y), 0.6);
      float band = step(abs(fract(vWorld.z * 0.25) - 0.5), 0.12);
      albedo = mix(albedo, vec3(0.8), txt * band * top * 0.8);
    `,
  });
  const pinM = g.ink({ color: "#c8c0b0", spec: 1, gloss: 50, hatch: 0.4 });
  const capM = g.ink({ color: "#2f5fa8", mode: "u", scale: 20, spec: 0.7, gloss: 40 });
  const parts: THREE.BufferGeometry[] = [];
  const pins: THREE.BufferGeometry[] = [];
  const caps: THREE.BufferGeometry[] = [];
  const toW = (px: number) => (px / W - 0.5) * size;
  chips.forEach(([x, y, w, h]) => {
    const cx = toW(x + w / 2);
    const cz = toW(y + h / 2);
    const ww = (w / W) * size;
    const hh = (h / W) * size;
    parts.push(box(ww, 0.35, hh, cx, 0.18, cz));
    const n = Math.max(4, Math.floor(ww / 0.35));
    for (let k = 0; k < n; k++) {
      const px = cx - ww / 2 + ((k + 0.5) / n) * ww;
      pins.push(box(0.12, 0.08, 0.35, px, 0.05, cz - hh / 2 - 0.12));
      pins.push(box(0.12, 0.08, 0.35, px, 0.05, cz + hh / 2 + 0.12));
    }
  });
  const r = rng("caps");
  for (let i = 0; i < 26; i++) {
    const x = (r() - 0.5) * size * 0.9;
    const z = (r() - 0.5) * size * 0.9;
    if (r() < 0.5) caps.push(cyl(0.35, 0.35, 0.9 + r() * 0.6, 20, x, 0.5, z));
    else parts.push(place(new THREE.CapsuleGeometry(0.12, 0.5, 4, 10).rotateZ(Math.PI / 2), [x, 0.14, z]));
  }
  // dense surface-mount resistors / capacitors
  const smd = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.1, 0.14), g.ink({ color: "#2a2622", hatch: 0.3, instanced: true, frag: "albedo = mix(albedo, vec3(0.8, 0.75, 0.65), step(0.35, abs(vObj.x) / 0.14 * 0.5));" }), 600);
  for (let i = 0; i < 600; i++) smd.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3((r() - 0.5) * size * 0.95, 0.05, (r() - 0.5) * size * 0.95), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() < 0.5 ? 0 : Math.PI / 2, 0)), new THREE.Vector3(1, 1, 1)));
  smd.frustumCulled = false;
  group.add(smd);
  group.add(new THREE.Mesh(merge(parts), chipM), new THREE.Mesh(merge(pins), pinM), new THREE.Mesh(merge(caps), capM));
  return { group, board };
};

// ------------------------------------------------------------ CRT computer
export const crtScreenTexture = (key: string, lines: string[]) =>
  canvasTex(key, 512, 384, (ctx) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 512, 384);
    ctx.font = "bold 28px monospace";
    ctx.fillStyle = "#fff";
    lines.forEach((l, i) => ctx.fillText(l, 24, 50 + i * 36));
    ctx.fillRect(24 + ctx.measureText(lines[lines.length - 1] ?? "").width + 4, 50 + (lines.length - 1) * 36 - 24, 16, 28);
  });

export const makeCRT = (g: GL, lines: string[], key: string, phosphor = "#7dff9a") => {
  const bodyM = g.ink({ color: "#d9cfb4", mode: "world", dir: [0.2, 1, 0.1], scale: 18, cross: 0.6, rim: 0.3 });
  const darkM = g.ink({ color: "#3a3a36", mode: "world", dir: [1, 0, 0], scale: 30 });
  const tex = crtScreenTexture(key, lines);
  const screenM = g.ink({
    color: "#101410",
    hatch: 0.2,
    spec: 1.2,
    gloss: 60,
    uniforms: { uScr: { value: tex }, uOn: { value: 0 }, uPh: { value: new THREE.Color(phosphor) } },
    fragDecl: "uniform sampler2D uScr; uniform float uOn; uniform vec3 uPh;",
    frag: /* glsl */ `
      vec2 su = vUv;
      float txt = texture(uScr, su).r;
      float scan = 0.75 + 0.25 * sin(su.y * 600.0);
      float roll = 0.85 + 0.15 * sin(su.y * 12.0 - uTime * 9.0);
      float vig = smoothstep(0.75, 0.3, length(su - 0.5));
      float on = uOn * (0.9 + 0.1 * tvn(vec2(uTime * 30.0, 0.0)));
      emis += uPh * (0.12 + txt * 0.9) * scan * roll * vig * on * 1.6;
      hatchMul = 1.0 - on;
    `,
  });
  const group = new THREE.Group();
  // monitor: tapered back, front bezel, curved screen
  const back = new THREE.CylinderGeometry(0.2, 0.42, 0.45, 4, 1);
  back.rotateY(Math.PI / 4);
  back.rotateX(Math.PI / 2);
  const monitor = merge([box(0.64, 0.52, 0.12, 0, 0.62, 0.2), place(back, [0, 0.62, -0.08], [0, 0, 0], [1.05, 1, 0.85]), box(0.3, 0.06, 0.26, 0, 0.33, 0.02)]);
  group.add(new THREE.Mesh(monitor, bodyM));
  const scr = new THREE.SphereGeometry(1.6, 24, 18, Math.PI * 0.5 - 0.16, 0.32, Math.PI * 0.5 - 0.12, 0.24);
  scr.translate(0, 0, -1.6 + 0.295);
  const scrMesh = new THREE.Mesh(scr, screenM);
  scrMesh.position.set(0, 0.63, 0);
  // fix uvs of the sphere patch to 0..1
  const uv = scr.attributes.uv as THREE.BufferAttribute;
  let umin = Infinity;
  let umax = -Infinity;
  let vmin = Infinity;
  let vmax = -Infinity;
  for (let i = 0; i < uv.count; i++) {
    umin = Math.min(umin, uv.getX(i));
    umax = Math.max(umax, uv.getX(i));
    vmin = Math.min(vmin, uv.getY(i));
    vmax = Math.max(vmax, uv.getY(i));
  }
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - umin) / (umax - umin), (uv.getY(i) - vmin) / (vmax - vmin));
  group.add(scrMesh);
  // base unit + keyboard with keycaps
  group.add(new THREE.Mesh(box(0.75, 0.16, 0.5, 0, 0.08, 0.05), bodyM));
  group.add(new THREE.Mesh(box(0.08, 0.02, 0.01, 0.25, 0.1, 0.305), darkM));
  const kb = new THREE.Mesh(extrude([[-0.34, 0], [0.34, 0], [0.34, 0.03], [-0.34, 0.07]], 0.24), bodyM);
  kb.rotation.y = 0;
  kb.position.set(0, 0.0, 0.5);
  kb.rotation.x = 0;
  group.add(kb);
  const keys: THREE.BufferGeometry[] = [];
  for (let row = 0; row < 5; row++)
    for (let k = 0; k < 14; k++) keys.push(box(0.036, 0.02, 0.034, -0.29 + k * 0.045 + (row % 2) * 0.01, 0.045 + row * 0.008, 0.6 - row * 0.042));
  group.add(new THREE.Mesh(merge(keys), g.ink({ color: "#e8e0cc", mode: "world", dir: [1, 0, 0], scale: 60, hatch: 0.5 })));
  return { group, screenM };
};

// ------------------------------------------------------------ smartphone
export const makePhone = (g: GL) => {
  const iconTex = canvasTex("phoneScreen", 480, 1040, (ctx) => {
    const grd = ctx.createLinearGradient(0, 0, 480, 1040);
    grd.addColorStop(0, "#3b59d9");
    grd.addColorStop(0.5, "#9a4fd6");
    grd.addColorStop(1, "#f08a4b");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 480, 1040);
    ctx.fillStyle = "#fff";
    ctx.font = "300 110px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("9:41", 240, 200);
    ctx.font = "30px sans-serif";
    ctx.fillText("Tuesday, January 9", 240, 250);
    const cols = ["#ff3b30", "#ffcc00", "#34c759", "#5ac8fa", "#ff9500", "#5856d6", "#ff2d55", "#af52de", "#007aff", "#30b0c7", "#a2845e", "#8e8e93"];
    for (let i = 0; i < 20; i++) {
      const x = 50 + (i % 4) * 100;
      const y = 330 + Math.floor(i / 4) * 120;
      ctx.fillStyle = cols[i % cols.length];
      ctx.beginPath();
      ctx.roundRect(x, y, 80, 80, 20);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(x + 40, y + 40, 18, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.roundRect(30, 930, 420, 90, 30);
    ctx.fill();
  });
  const bodyShape: [number, number][] = [];
  const W = 0.0715 / 2;
  const H = 0.147 / 2;
  const R = 0.011;
  for (let q = 0; q < 4; q++) {
    const cx = q === 0 || q === 3 ? W - R : -W + R;
    const cy = q < 2 ? H - R : -H + R;
    for (let k = 0; k <= 8; k++) {
      const a = (q * Math.PI) / 2 + (k / 8) * (Math.PI / 2);
      bodyShape.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
    }
  }
  const body = extrude(bodyShape, 0.0078, [], 0.0008);
  const frameM = g.ink({ color: "#8e939a", mode: "world", dir: [0, 1, 0], scale: 900, spec: 1.4, gloss: 60, rim: 0.8 });
  const screenM = g.ink({
    color: "#050507",
    hatch: 0.15,
    spec: 1.5,
    gloss: 90,
    uniforms: { uScr: { value: iconTex }, uOn: { value: 0 } },
    fragDecl: "uniform sampler2D uScr; uniform float uOn;",
    frag: /* glsl */ `
      vec3 sc = texture(uScr, vUv).rgb;
      emis += sc * uOn * 1.05;
      hatchMul = 1.0 - uOn;
    `,
  });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(body, frameM));
  const scr = new THREE.PlaneGeometry(W * 2 - 0.004, H * 2 - 0.004);
  const s = new THREE.Mesh(scr, screenM);
  s.position.z = 0.0039 + 0.0009;
  group.add(s);
  // camera bump on the back
  const camM = g.ink({ color: "#1a1a1c", spec: 1.2, gloss: 70, rim: 0.5 });
  const lens = (x: number, y: number) => new THREE.CylinderGeometry(0.0055, 0.0055, 0.003, 20).rotateX(Math.PI / 2).translate(x, y, -0.0058);
  const bump = merge([box(0.03, 0.03, 0.002, -W + 0.019, H - 0.022, -0.0048), lens(-W + 0.013, H - 0.015), lens(-W + 0.013, H - 0.03), lens(-W + 0.027, H - 0.022)]);
  group.add(new THREE.Mesh(bump, camM));
  return { group, screenM };
};

// ------------------------------------------------------------ fighter jet (F-16-ish), nose +z
export const jetGeo = () =>
  memo("gl:jet", () => {
    const fus = lathe(
      [
        [0.0, 7.6],
        [0.25, 6.6],
        [0.55, 5.2],
        [0.72, 3.5],
        [0.78, 1.0],
        [0.8, -2.5],
        [0.68, -4.8],
        [0.55, -5.4],
      ],
      24,
      30,
    );
    fus.rotateX(Math.PI / 2);
    const wing = extrude(
      [
        [0.6, 2.2],
        [4.8, -1.6],
        [4.8, -2.3],
        [0.6, -2.6],
        [-0.6, -2.6],
        [-4.8, -2.3],
        [-4.8, -1.6],
        [-0.6, 2.2],
      ],
      0.1,
    );
    wing.rotateX(Math.PI / 2);
    const tailV = extrude(
      [
        [0, 0],
        [-2.2, 0],
        [-3.4, 2.6],
        [-2.6, 2.6],
      ],
      0.1,
    );
    tailV.rotateY(Math.PI / 2);
    tailV.translate(0, 0.5, -2.4);
    const tailH = extrude(
      [
        [0.4, -3.8],
        [2.6, -5.0],
        [2.6, -5.4],
        [-2.6, -5.4],
        [-2.6, -5.0],
        [-0.4, -3.8],
      ],
      0.08,
    );
    tailH.rotateX(Math.PI / 2);
    const canopy = place(new THREE.SphereGeometry(0.5, 20, 12), [0, 0.6, 3.6], [0, 0, 0], [0.9, 0.8, 2.2]);
    const intake = box(1.0, 0.7, 1.8, 0, -0.65, 1.6);
    const nozzle = lathe(
      [
        [0.5, 0],
        [0.52, -0.6],
        [0.45, -1.0],
      ],
      20,
    );
    nozzle.rotateX(Math.PI / 2);
    nozzle.translate(0, 0, -5.3);
    return { body: merge([fus, wing, tailV, tailH, intake]), canopy, nozzle };
  });

export const makeJet = (g: GL, color = "#8f98a4") => {
  const G = jetGeo();
  const bodyM = g.ink({ color, mode: "world", dir: [1, 0, 0.3], scale: 4, cross: 0.6, spec: 0.5, gloss: 30, rim: 0.6 });
  const canM = g.ink({ color: "#d9a53a", spec: 1.8, gloss: 80, hatch: 0.3, rim: 0.8 });
  const nozM = g.ink({ color: "#3b3a38", mode: "u", scale: 30 });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(G.body, bodyM), new THREE.Mesh(G.canopy, canM), new THREE.Mesh(G.nozzle, nozM));
  return { group, mats: [bodyM, canM, nozM] };
};
