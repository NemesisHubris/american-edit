// Engine test bench: lathe bell, fluted columns, terrain, sky.
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { GLShot, driveCamera, drawIn } from "../gl/GLShot";
import { lathe, terrain } from "../gl/geo";
import { makeSky } from "../gl/sky";
import { fbm2 } from "../gl/noise";

export const GLTest: React.FC<{ color?: boolean }> = ({ color = false }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <GLShot
      color={color}
      setup={(g) => {
        g.shared.uSunDir.value.set(-0.6, 0.35, 0.5).normalize();
        g.shared.uSunCol.value.set(1.0, 0.9, 0.75);
        g.shared.uSky.value.set(0.42, 0.42, 0.48);
        g.shared.uGround.value.set(0.25, 0.2, 0.16);
        const sky = makeSky(g.shared, { clouds: 0.5, rays: 0.7, horizon: "#f6dcae", top: "#8fb0cf" });
        g.scene.add(sky.mesh);
        g.enableShadows(2048, 14, 40);
        const bellMat = g.ink({ color: "#8a6a3a", mode: "u", scale: 140, scale2: 60, spec: 0.6, gloss: 40, rim: 0.3 });
        const bell = new THREE.Mesh(
          lathe(
            [
              [0.0, 3.2],
              [0.35, 3.2],
              [0.9, 3.0],
              [1.1, 2.4],
              [1.25, 1.4],
              [1.55, 0.6],
              [1.95, 0.15],
              [2.0, 0.0],
              [1.85, 0.05],
            ],
            96,
            80,
          ),
          bellMat,
        );
        bell.position.set(0, 2.2, 0);
        g.scene.add(bell);
        const colMat = g.ink({ color: "#e8dcc4", mode: "v", scale: 30, scale2: 48, cross: 0.6 });
        const flutes = (r: number) =>
          lathe(
            Array.from({ length: 20 }, (_, i) => [r * (1 - (i / 19) * 0.12), (i / 19) * 9] as [number, number]),
            96,
          );
        const cg = flutes(0.55);
        const p = cg.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i);
          const z = p.getZ(i);
          const a = Math.atan2(z, x);
          const k = 1 - 0.06 * Math.pow(Math.abs(Math.cos(a * 10)), 0.5);
          p.setX(i, x * k);
          p.setZ(i, z * k);
        }
        cg.computeVertexNormals();
        for (let i = 0; i < 5; i++) {
          const c = new THREE.Mesh(cg, colMat);
          c.position.set(-7 + i * 3.5, 0, -6);
          g.scene.add(c);
        }
        const gMat = g.ink({ color: "#b89c70", mode: "world", dir: [1, 0, 0.3], scale: 5, cross: 0.4 });
        const ground = new THREE.Mesh(
          terrain(120, 120, 160, 160, (x, z) => fbm2(x * 0.05, z * 0.05) * 3 - 1.5 + Math.max(0, -z - 15) * 0.15),
          gMat,
        );
        g.scene.add(ground);
        return (f) => {
          driveCamera(
            g,
            [
              { f: 0, pos: [8, 4, 12], look: [0, 3, 0], fov: 45 },
              { f: 90, pos: [-6, 5, 11], look: [0, 3, -2], fov: 42 },
            ],
            f,
            0.01,
          );
          bell.rotation.z = Math.sin(f / 12) * 0.12;
          drawIn([bellMat, colMat], f, 0, 40);
        };
      }}
    />
  </AbsoluteFill>
);
