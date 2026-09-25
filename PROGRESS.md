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
| 2 | The Founding | done | Candle flicker w/ light pool + swaying shadow; quill dips and writes "IN CONGRESS, July 4, 1776." in real time (camera tracks pen); Independence Hall draws at dawn w/ rising sun, sweeping rays, birds, tilt up the spire; Liberty Bell swings, crack draws in; muskets on stone wall in rolling fog; night crossing w/ oars, drifting ice, snow. Transitions: burn, morph, whip, ink, morph, ink. Declaration quote 5.5–11s. Motion PASS (min 1.03). |
| 3 | Manifest Destiny | done | 1805 slam over the map drawing itself (border, cartouche, spinning compass, coastal water-lines, ships); original states inked; Louisiana wash spreads from St. Louis; L&C dotted trail with paddling canoe to Fort Clatsop, camera follows; Pacific bluff w/ explorers, sea stacks, gulls; close curling breaker (new keyframed CrashWave); Alamo framed inset draws with drifting smoke & embers; wagon train w/ turning wheels, walking oxen, dust, jagged Rockies; states fill east->west with Oregon Trail wagons. 3 quotes (Clark, Alamo, O'Sullivan). Motion PASS (min 1.16). |
| 4 | A Nation Tested | done | Napoleon guns (fg + mid) fire on beats w/ recoil, rolling wheel, muzzle flash, smoke bursts, sparks; 1863 slam lands on the first shot. Worm split-rail fence at dawn with fog rolling at three depths; Lincoln silhouette backlit by sun rays w/ fast clouds, blowing coat tails & grass; Lincoln Memorial columns draw while the camera tilts from steps to attic (frieze state names, seated statue in the shadows). Quote 4.6–10s. Motion PASS (min 1.18). |
| 5 | American Ingenuity | done | New 3D projector (src/lib/three.ts): 4-4-0 locomotive charges at camera w/ pumping rods, lit headlamp, balloon-stack smoke from a moving emitter, rails/ties/telegraph poles in perspective; 1869 slam. Golden spike hammered on two beats w/ sparks. Edison lamp: blueprint->engraving scan-line morph, filament brightens to a flare. 3D Wright Flyer lifts off the dunes and banks past (blueprint morph). Model T line w/ hoist + welding sparks (blueprint morph). Hoover Dam jets, spillway, mist. Golden Gate emerges as fog clears. Empire State rises floor by floor w/ steel frame, derrick and tilt to the spire. Wright quote 5.1–8.5s. Motion PASS (min 1.04). |
| 6 | The Greatest Generation | done | 3D Higgins boats bob in crashing surf; ramps slam down on beats revealing troops, foam burst + spray droplets on the lens; 1944 slam w/ heavy shake. Hedgehogs on the beach w/ smoke banks, embers, a distant blast flash. Helmet in the sand as the wash advances/recedes over it. 3D P-51 formation roars past over the ocean w/ speed streaks. Iwo Jima silhouette: pole rises 34°→64°, 48-star flag ripples, fast sky. Eisenhower quote 4.1–7.8s. Motion PASS (min 1.56). |
| 7 | The Pause | done | Saturn V + umbilical tower (swing arms, hammerhead) at dawn, searchlight beams, LOX vapor venting from the stages, full Moon rising behind, marsh + lagoon; second shot tilts slowly up the rocket to the escape tower with the Moon behind. Deliberately calm. Kennedy quote 0.7–5s. Motion PASS (min 1.01). |
| 8 | The Drop | done | Ignition exactly on the 1:15 beat: white flash, huge shake + zoom punch, F-1 plumes, billowing smoke; ColorFlood blob sweeps sepia -> full colour from the engines (frames 1–15); stays colour. Rocket clears the tower (tracking), LM descends with radial dust streaks, boot presses into lunar dust in slow motion, astronaut salutes by the flag w/ LM + Earth. Colour mode now renders rich sky gradients. Armstrong quote 2.1–6s. Motion PASS (min 0.81 single frame in slow-mo). |
| 9 | The Hype | done | 20 shots, one cut per beat (0.5–1 s), full colour, bass hits on every beat: Earthrise; Berlin Wall with graffiti + celebrating crowd cracks, then crumbles in falling chunks with light behind; PCB with light racing along traces (flat + 3D macro); vintage computers flicker on to READY.; glowing network arcs across the U.S. map; 3D smartphone lights up and rotates in slow motion (two angles); jets streak overhead w/ vapor trails; flying past Mount Rushmore (tone-sculpted heads) + close pass; Grand Canyon fly-over at golden hour (buttes, haze, river); fireworks over a skyline with crowd (4 variants + finale). Reagan 1.1–4.5s, Jobs 5.6–10.5s. Motion PASS (min 1.04). |
| 10 | Ending | done | Slow-motion 50-star flag at sunrise in full colour, sun rising with sweeping rays, a light band sweeping across the cloth, dust motes; title card: AMERICA (Cinzel, gold, letters rise from blur, shine sweep) + ★ EST. 1776 ★ over the wider flag; hold; hard cut to black on the 7.5 s beat. Motion PASS except the final 0.5 s of black (intentional cut to black). |

## Final
- [ ] Assemble HistoryEdit, full render to out/history-edit.mp4
- [ ] Whole-timeline stills + motion checks
- [ ] 720p preview committed to out/preview.mp4
