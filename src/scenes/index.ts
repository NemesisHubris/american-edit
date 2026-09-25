import type { SceneDef } from "./types";
import { coldOpen } from "./S01ColdOpen";
import { founding } from "./S02Founding";
import { manifest } from "./S03Manifest";
import { tested } from "./S04Tested";
import { ingenuity } from "./S05Ingenuity";
import { greatest } from "./S06Greatest";
import { pause } from "./S07Pause";
import { drop } from "./S08Drop";
import { hype } from "./S09Hype";

// Scenes in edit order. Each file in this folder exports one SceneDef.
export const SCENE_DEFS: SceneDef[] = [coldOpen, founding, manifest, tested, ingenuity, greatest, pause, drop, hype];
