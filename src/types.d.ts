// Minimal typings for the map packages (they ship without types).
declare module "d3-geo" {
  export interface GeoProjection {
    (p: [number, number]): [number, number] | null;
    fitExtent(extent: [[number, number], [number, number]], object: unknown): GeoProjection;
    scale(): number;
    translate(): [number, number];
  }
  export function geoAlbers(): GeoProjection;
  export interface GeoPath {
    (object: unknown): string | null;
    centroid(object: unknown): [number, number];
    bounds(object: unknown): [[number, number], [number, number]];
    digits(d: number): GeoPath;
  }
  export function geoPath(projection?: GeoProjection): GeoPath;
}

declare module "topojson-client" {
  export function feature(topology: unknown, object: unknown): { type: string; features: GeoFeature[] };
  export function mesh(topology: unknown, object?: unknown, filter?: (a: unknown, b: unknown) => boolean): { type: string; coordinates: [number, number][][] };
  export function merge(topology: unknown, objects: unknown[]): unknown;
  export type GeoFeature = { type: string; id: string; properties: { name: string }; geometry: unknown };
}
