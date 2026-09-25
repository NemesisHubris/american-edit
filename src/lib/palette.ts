import { createContext, useContext } from "react";

// Semantic colour tokens. Every drawing asks for tokens, so the same artwork
// renders in ink & sepia before the drop and in full colour after it.
export type Palette = {
  mode: "sepia" | "color" | "blueprint";
  paper: string;
  paperDark: string;
  ink: string;
  inkSoft: string;
  sky: string;
  skyDeep: string;
  night: string;
  dawn: string;
  sun: string;
  ground: string;
  sand: string;
  stone: string;
  brick: string;
  wood: string;
  metal: string;
  steel: string;
  water: string;
  waterDeep: string;
  foam: string;
  fire: string;
  flame: string;
  glow: string;
  smoke: string;
  foliage: string;
  flagRed: string;
  flagBlue: string;
  flagWhite: string;
  gold: string;
  skin: string;
  space: string;
  moon: string;
  earth: string;
  text: string;
};

export const SEPIA: Palette = {
  mode: "sepia",
  paper: "#ead8b2",
  paperDark: "#d6bd8e",
  ink: "#2a1a0d",
  inkSoft: "#5b4128",
  sky: "#d9c197",
  skyDeep: "#a88458",
  night: "#3b2a1a",
  dawn: "#e8b77a",
  sun: "#f3dca8",
  ground: "#b48f5e",
  sand: "#d2b27c",
  stone: "#b89c70",
  brick: "#9a6a42",
  wood: "#86592f",
  metal: "#7d6547",
  steel: "#8c7454",
  water: "#a88c62",
  waterDeep: "#6e5436",
  foam: "#f2e4c4",
  fire: "#d9822b",
  flame: "#f5c46a",
  glow: "#ffd98a",
  smoke: "#cdb690",
  foliage: "#8a7440",
  flagRed: "#98542f",
  flagBlue: "#4c3a26",
  flagWhite: "#efe0bd",
  gold: "#c8943c",
  skin: "#c9a27a",
  space: "#22170d",
  moon: "#e4d2ac",
  earth: "#8c7248",
  text: "#fffaf0",
};

export const COLOR: Palette = {
  mode: "color",
  paper: "#efe3c6",
  paperDark: "#d9c49a",
  ink: "#141a33",
  inkSoft: "#2e3a63",
  sky: "#5b9bd9",
  skyDeep: "#1b3f86",
  night: "#0b1433",
  dawn: "#ff9a4a",
  sun: "#ffd45c",
  ground: "#b8793c",
  sand: "#e3b66a",
  stone: "#c9c2b4",
  brick: "#b24a2c",
  wood: "#8a4f25",
  metal: "#9aa6b8",
  steel: "#6f7f99",
  water: "#1f6fc0",
  waterDeep: "#0c3a7a",
  foam: "#f4f8ff",
  fire: "#ff6a12",
  flame: "#ffc23a",
  glow: "#fff0a8",
  smoke: "#e9e3da",
  foliage: "#3f8a3c",
  flagRed: "#c1202f",
  flagBlue: "#1c3578",
  flagWhite: "#fbf6ea",
  gold: "#f0b429",
  skin: "#d9a57c",
  space: "#070b1e",
  moon: "#d8d6d0",
  earth: "#2f7fd0",
  text: "#ffffff",
};

export const BLUEPRINT: Palette = {
  ...COLOR,
  mode: "blueprint",
  paper: "#1d4f8f",
  paperDark: "#153c70",
  ink: "#e8f2ff",
  inkSoft: "#a9c8f0",
};

export const PaletteContext = createContext<Palette>(SEPIA);
export const usePalette = () => useContext(PaletteContext);
