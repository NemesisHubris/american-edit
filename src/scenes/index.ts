import type { SceneDef } from "./types";
import { coldOpen } from "./S01ColdOpen";
import { founding } from "./S02Founding";
import { manifest } from "./S03Manifest";

// Scenes in edit order. Each file in this folder exports one SceneDef.
export const SCENE_DEFS: SceneDef[] = [coldOpen, founding, manifest];
