# Progress

Living-engravings American history edit — 1920x1080, 30fps, 1:45 (3150 frames).

## Foundation
- [x] Map deps installed (d3-geo, us-atlas, topojson-client)
- [x] `beats.json`: 120 BPM grid (no track in assets/music yet); drop planned at 1:15
- [x] `scripts/beats.mjs`: analyzes a track in assets/music (tempo, beat phase, drop) — tested on a synthetic 128 BPM track
- [x] `src/timeline.ts`: every cut/shake snapped to beats.json; Moon landing anchored to the drop
- [x] Fonts: Liberation Serif (quotes), Liberation Serif Italic (attributions), Cinzel (years, title) — all OFL
- [x] Paper + grain textures pre-rendered to assets/textures (`TexPaper`, `TexGrain*` compositions)
- [x] Dev tools: `Sheet` contact-sheet composition, `scripts/motion-check.mjs`

## Reusable components
- [x] Parchment (Paper + PaperOverlay: texture, vignette, grain, flicker)
- [x] InkDraw (stroke-by-stroke drawing, hatching, washes) + engraving generator (`src/lib/engrave.ts`)
- [x] CameraMove (Camera + parallax Layers, handheld drift)
- [x] Particles (smoke, fog, dust, embers, sparks, fireworks)
- [x] Water (ink sea, crashing wave, ripples, pour)
- [x] Cloth (wave-deformed flag)
- [x] Transitions (ink wipe, page burn, line morph, whip pan with motion blur, flash, punch)
- [x] ColorFlood (sepia -> colour)
- [x] Effects (flashes, beat shake + zoom punch, light leaks)
- [x] Sky kit (engraved sky, clouds, sun + rays, birds, moon, stars)
- [x] YearSlam (extended: Cinzel, splatter, exit), WordPop + Quote (gradient, attribution)
- [x] MapScene (us-atlas lower 48, coastlines w/o land borders, Louisiana Purchase region, rivers, L&C + Oregon trails, compass, cartouche, ships)

## Scenes
| # | Scene | Status | Notes |
|---|-------|--------|-------|
| 1 | Cold open | done | Boot in lunar dust (low-gravity grains), flag on windswept ridge, Saturn V F-1 ignition; flash cuts on beats; black card with 13-star ring, embers, shockwave; YearSlam 1776 impact on the 2.0s beat. Motion check PASS (min 0.99 on the dark card). |
| 2 | The Founding | todo | |
| 3 | Manifest Destiny | todo | |
| 4 | A Nation Tested | todo | |
| 5 | American Ingenuity | todo | |
| 6 | The Greatest Generation | todo | |
| 7 | The Pause | todo | |
| 8 | The Drop | todo | |
| 9 | The Hype | todo | |
| 10 | Ending | todo | |

## Final
- [ ] Assemble HistoryEdit, full render to out/history-edit.mp4
- [ ] Whole-timeline stills + motion checks
- [ ] 720p preview committed to out/preview.mp4
