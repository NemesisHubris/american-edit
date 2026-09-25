import type { SceneDef } from "./types";
import { coldOpen } from "./S01ColdOpen";
import { founding } from "./S02Founding";
import { manifest } from "./S03Manifest";
import { tested } from "./S04Tested";
import { ingenuity } from "./S05Ingenuity";
import { greatest } from "./S06Greatest";

// Scenes in edit order. Each file in this folder exports one SceneDef.
export const SCENE_DEFS: SceneDef[] = [coldOpen, founding, manifest, tested, ingenuity, greatest];
