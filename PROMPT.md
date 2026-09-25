# Edit Plan

Build the complete American history edit in this Remotion project. Use the existing Test1776 setup, YearSlam, and WordPop components as the starting point.

=== OVERVIEW ===
- Composition: HistoryEdit, 1920x1080, 30fps, 1:45 (3150 frames).
- No narration or spoken words. Only music, animated artwork, year flashes, and quotes.
- Every scene is rich, detailed, highly animated artwork. Never plain text on a black background, and never a static drawing.
- You may install d3-geo, us-atlas, and topojson-client for accurate map geometry. Ask before installing anything else.

=== ART STYLE: "LIVING ENGRAVINGS" ===
- Detailed ink line art on aged parchment that draws itself stroke by stroke (SVG path stroke animation), then gains cross-hatch shading and sepia washes.
- Paper texture, ink bleed, vignette, subtle film grain.
- Everything is ink and sepia until the Moon landing drop at 1:15. At the drop, the linework floods with full rich color (deep blues, golds, reds) and stays in color to the end.
- Drawings must look detailed and intentional, like a history book engraving: real architectural detail, perspective, shading. Never simple clip-art shapes.
- If a real public-domain image exists in assets/images, use it with a parchment frame, animated zoom, and ink-bleed transition. Otherwise draw the scene in code.

=== MOTION RULES (very important) ===
The edit must feel highly animated and alive at all times. Never a static drawing with a slow pan.
- No frame is ever still. Something is always moving: the camera, the subject, particles, or the environment.
- Once a drawing finishes drawing itself, it comes to life: objects move within the scene, not just the camera around them.
- Every scene has at least 3 layers of motion at once: foreground, subject, and background, moving at different speeds for depth.
- Living environments: animated smoke and steam, drifting fog, ink-drawn rippling water and crashing waves, flickering candle and fire light, floating dust and embers, drifting clouds, a sun rising with moving light rays.
- Moving subjects: the locomotive charges toward camera with wheels turning and smoke billowing, wagon wheels roll, the Wright Flyer lifts off and banks, water pours through Hoover Dam, the Empire State Building rises floor by floor, landing craft ramps drop and waves crash, planes fly past, the Saturn V lifts off with exhaust plumes, the Berlin Wall cracks and falls in chunks, fireworks burst, the flag ripples with wave-deformed cloth.
- Dynamic camera: fast push-ins, whip pans between shots, tilts up tall subjects like the Saturn V and Empire State Building, fly-throughs across the map, 2.5D depth where the camera moves between layers.
- Shot length: 1.5–3 seconds before the drop, 0.5–1 second per shot in the hype section, one cut per beat.
- Transitions are animated: ink wipes, page burns, one drawing's lines morphing into the next, whip pans with motion blur. No plain fades.
- All motion uses springs or easing, never plain linear movement. All randomness is seeded so renders are deterministic.

=== REUSABLE COMPONENTS (build these first) ===
- Parchment: aged paper background with texture, stains, vignette, grain.
- InkDraw: animates any SVG path drawing itself, then fades in hatching and wash.
- MapScene: accurate U.S. map from us-atlas with territories and states filling in on cue, trails drawing as dotted ink lines, compass rose and ornate border.
- CameraMove: push-ins, pans, tilts, whip pans, and parallax between layers.
- Particles: smoke, steam, fog, dust, embers, sparks, and fireworks, all in the ink style.
- Water: animated ink-line waves, ripples, and pouring water.
- Cloth: a flag with wave-deformed rippling fabric.
- Transitions: ink wipe, page burn, line morph, whip pan with motion blur.
- ColorFlood: transition from sepia to full color.
- Effects: white flash, camera shake on beat hits, zoom punch, light leaks.
- YearSlam (existing): huge year number slamming in with a flash at the start of each era.
- WordPop (existing): quotes popping in word by word, bold white serif, with a soft dark gradient behind them over artwork. Speaker and year in small text underneath. Each quote readable for about 3 seconds.

=== MUSIC AND TIMING ===
- If a track exists in assets/music, analyze it (Remotion's bundled ffmpeg or a small script) to find beat timestamps and the drop, save them to beats.json, and snap every cut and shake to those beats. Move the Moon landing to land exactly on the drop.
- If no track exists yet, use a 120 BPM beat grid in beats.json so I can swap in real music later, and render without audio.
- Planned music: quiet orchestral intro and build, near-silent pause at 1:10, hard switch to heavy phonk bass at the 1:15 drop, total silence for the ending.

=== SCENES ===

1. COLD OPEN (0:00–0:03)
Rapid half-second flashes of three animated drawings: a boot pressing into lunar dust with particles puffing up, a flag rippling on a windswept ridge, rocket engines igniting with exhaust blasting outward. Hard cut to black. YearSlam "1776".

2. THE FOUNDING (0:03–0:18)
Candle flame flickering and casting moving light across a wooden desk, a quill dipping into ink and writing across parchment in real time, camera whip-pans to Independence Hall drawing itself at dawn as sunlight rays sweep across it and birds cross the sky, the Liberty Bell swinging slightly with its crack drawing in, muskets against a stone wall with fog rolling past, rowboats crossing an icy river at night with oars pulling and ice chunks drifting.
Quote: "We hold these truths to be self-evident, that all men are created equal." – Declaration of Independence, 1776

3. MANIFEST DESTINY (0:18–0:35)
YearSlam "1805". Parchment map of North America with a spinning compass rose and ornate border drawing in. Original states in ink, the Louisiana Purchase floods in with a spreading wash, then states fill westward one by one to the Pacific as the camera flies across the map. The Lewis and Clark trail draws as a dotted line with a tiny animated canoe moving along the river. Covered wagons in line art roll along the Oregon Trail with turning wheels and dust trailing behind. Pacific waves crash in ink at the coast. A framed inset of the Alamo's facade draws itself with smoke drifting past.
Quotes:
"Ocian in view! O! the joy." – William Clark, 1805
"Remember the Alamo!" – Battle cry, 1836
"...our manifest destiny to overspread the continent..." – John L. O'Sullivan, 1845

4. A NATION TESTED (0:35–0:45)
YearSlam "1863". Cannons firing with recoil and smoke bursts on a foggy battlefield, fog rolling across a split-rail fence at Gettysburg at dawn, a lone tall silhouette in a stovepipe hat against a sky with clouds drifting fast, camera tilts up the Lincoln Memorial columns as they draw themselves.
Quote: "...government of the people, by the people, for the people, shall not perish from the earth." – Abraham Lincoln, 1863

5. AMERICAN INGENUITY (0:45–1:00)
YearSlam "1869". Faster cuts. Steam locomotive charging toward camera with wheels pumping and smoke billowing, golden spike hammered into rail with sparks flying, light bulb filament glowing brighter until it flares, Wright Flyer lifting off sand dunes and banking past camera, Model T rolling down an assembly line, water thundering through Hoover Dam with spray, Golden Gate Bridge emerging as fog rolls away, Empire State Building rising floor by floor as the camera tilts up with it. Use blueprint-to-engraving morphs for the inventions.
Quote: "Success four flights thursday morning" – Orville Wright, 1903

6. THE GREATEST GENERATION (1:00–1:10)
YearSlam "1944". Heavier shake. Landing craft ramps slamming down in rough, crashing surf, spray hitting the camera, steel beach obstacles as smoke drifts across, a helmet in the sand with waves washing over it, fighter planes roaring past in formation over the ocean, the Iwo Jima flag being raised as a silhouette against a moving sky.
Quote: "The eyes of the world are upon you." – Dwight D. Eisenhower, 1944

7. THE PAUSE (1:10–1:15)
Near-silent. Saturn V standing on the launch pad at dawn, vapor venting and drifting, the full Moon rising behind it, slow tilt up the length of the rocket.
Quote: "We choose to go to the Moon." – John F. Kennedy, 1962

8. THE DROP (1:15)
Engines ignite on the beat with a huge shake, flash, and exhaust plume. ColorFlood: the whole image bursts from sepia into full color. The rocket clears the tower and the camera tracks it up, the lunar module descends with dust blasting outward, a boot presses into lunar dust in slow motion with particles floating, the flag stands on the Moon.
Quote: "That's one small step for man, one giant leap for mankind." – Neil Armstrong, 1969

9. THE HYPE (1:15–1:37)
Fastest cuts, one animated shot per beat, all in full color. Earth rising over the lunar horizon, the Berlin Wall cracking and crumbling in falling chunks, a circuit board with light racing along its traces, vintage computers powering on with screens flickering, glowing lines spreading across the U.S. map, a smartphone lighting up and rotating in slow motion, fighter jets streaking overhead with vapor trails, the camera flying past Mount Rushmore, a fly-over of the Grand Canyon at golden hour, fireworks bursting over a city skyline.
Quotes:
"Mr. Gorbachev, tear down this wall!" – Ronald Reagan, 1987
"Every once in a while, a revolutionary product comes along that changes everything." – Steve Jobs, 2007

10. ENDING (1:37–1:45)
Silence. A flag rippling in slow motion at sunrise, drawn in full color, sun rays moving across it. Title card "AMERICA" with "EST. 1776" underneath. Hold, then cut to black.

=== WORKFLOW ===
- Build the reusable components first, then each scene as its own file in src/scenes/.
- After each scene: render it alone to out/scenes/, then check both quality and motion:
  - Extract 4–6 stills and fix anything that looks weak, cluttered, or clip-art-like, or where text is overlapping or cut off.
  - Extract frames 5 apart from a short section. If consecutive frames look nearly identical, add more movement before moving on.
- Only move on once the scene looks polished and alive.
- Keep a PROGRESS.md checklist updated with each scene's status and any notes.
- Quote wording must match this prompt exactly, including punctuation and the spelling "Ocian".
- Commit after each finished scene.
- When all scenes are done, assemble them in HistoryEdit, render the full video to out/history-edit.mp4, extract stills and motion checks across the whole timeline, fix any issues, and re-render.
- Keep full renders out of git. Commit a 720p preview to out/preview.mp4 so I can download it from GitHub.

=== DONE WHEN ===
- out/history-edit.mp4 is 1920x1080, 30fps, about 1:45.
- All 10 scenes are implemented as detailed, highly animated artwork in the living-engravings style.
- Motion checks pass for every scene: no stretch of near-identical frames.
- The sepia-to-color flood happens at the Moon landing.
- Every quote appears with exact wording.
- Cuts snap to beats.json.
- Stills from every scene have been inspected and show no weak art or text problems.
- out/preview.mp4 is committed and pushed.
