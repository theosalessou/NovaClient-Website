# One orbital world (revision after user rejection)

The old square zoom/side-text composition was rejected and is retired. The symbol
must stay whole, its light belongs to the background, and text/feature objects move
around or on it. Source is buildless in website/dist; no new runtime package.

## Implementation map

- index.html: original hero/anchors/downloads, four feature chapters, native
  details#reference retaining about/inputs/all feature captures/community.
- model-story.css: fixed .orbital-world, perspective1100px, preserve-3d, a transparent
  WebGL plane at Z0 and live HTML cards with real positive/negative translateZ.
- emblem-journey.js: viewport camera fit and elliptical X/Z paths with Y rotation.
- nova-scene.js: input/lifecycle, actual card reparenting into/out of that shared
  perspective world, native-anchor expansion, background-light transforms.
- nova-emblem.js: thinner/smoother existing shape, ring, feature pins, central feature
  surface, ground light, transparent renderer and finite interpolation.

The model itself does not zoom past a square clip. Its camera fits the whole shape.
Texts rotate along an orbit; CSS3D sorts them in front/behind the WebGL plane. A
front-facing panel remains interactive. Other panels are inert/aria-hidden until
selected. Pause returns the original nodes to their original articles; no duplicate
text/IDs or inaccessible hidden-card trap. Failed/no WebGL preserves CSS3D text and
a transparent native icon. Reduced motion restores static reading from the start.

The central mesh uses real existing Fast Practice, Minimap and Team Panel captures,
loaded only on selection and reused on later visits. The thirteen-inputs surface
is factual typography, not a fabricated game screenshot. The full original image
catalogue is retained in the reference. No image editing, ImageGen or copied demo.

## Budget

The canvas covers the viewport in CSS only. DPR1. Its backing buffer is capped at
768*768 pixels in AREA with maximum1280x900 dimensions, reduced to512*512 area for
<=4 reported logical cores/<=4GB reported memory. Dimensions maintain viewport
aspect ratio, not a square. Constrained hardware also reduces geometry segments
and disables MSAA. Desktop uses MSAA for smoother silhouette edges.

No PMREM, shadow map, postprocessing/bloom chain, particle system, autoplay or idle
timer. Ground/scene illumination uses a128px gradient texture. Background gradients
are static layers moved via transform, not full-screen background-position repaint.
Eight slow active frames (submission>24ms or continuing RAF interval>42ms, excluding
long idle gaps) reduce the area budget once. These are runtime proxies, not GPU
profiling or a guarantee of universal device performance. Input interpolation ends
at explicit tolerances; hidden tabs/page cache deactivate rendering. Initial hero
is one rendered frame in the deterministic test. Save-Data/reduced motion skip
heavy renderer imports. Texture-load failure keeps the factual label without retries.

## Checks

```powershell
node --check website/dist/nova-scene.js
node --check website/dist/nova-emblem.js
node --check website/dist/emblem-journey.js
node --experimental-vm-modules scripts/test_website_model_story.mjs
```

23 source/geometry/lifecycle tests pass with actual Three.js geometry and mock
renderer/clock/image loading. They check XYZ travel/full-turn rotation, shared
perspective-parent/reparenting, four attached labels, real capture mapping, camera
vertices within frustum at24 viewport/chapter combinations, transparency/area,
idle, touch, preference/failure/race paths, reference links, reading and downshift.
The first test run caught clipping in780x360 landscape; responsive vertical offset
was corrected and the entire suite rerun. These are NOT browser rasterization,
GPU/FPS/Core Web Vitals or screenshot tests. Project AGENTS forbids UI automation.
User visual approval and real-device performance remain unverified.

## Delivery

Local preview address is http://127.0.0.1:8766/. The user subsequently requested
PC shutdown at completion, so the owned preview server is stopped at delivery.
Restart with `python -m http.server 8766 --bind 127.0.0.1 --directory G:/NovaClient/website/dist`.
Cache versions: loader13, emblem5,
math3, CSS3. No commit/push/deploy/new Site/client build/ZIP/backend change. The
historical Sites ID was unavailable in the preceding task; production is still
GitHub Pages and has not been updated by this local revision. Preserve unrelated
preexisting vendor/account/dashboard changes during any later selective publication.

## 1 November revision: close-ups supersede whole-model chapter framing
Chapter focus moves continuously between top/left/bottom/right physical regions. Renderer now consumes zoom/fx/fy/fz, transforms focus by the body matrix, and uses perspective camera zoom (2.55 compact / 3.05 desktop). Entire emblem is intended only in overview; excluded tips during exploration are intentional. Actual feature surface follows the focus. Open CSS3D typography retains orbit and gains local depth without panel backgrounds. 23 source/geometry/lifecycle tests passed; tests now verify detail magnification, distinct regions, and visible feature surface across six viewports rather than requiring every vertex in-frame. No browser raster/GPU verification or deploy.

## 1 November — shared model matrices and collision-safe labels (latest)
Supersedes the independent CSS Y-axis orbit and finite-only idle policy above. Live text is projected with the actual model world matrix, camera inverse and perspective projection into CSS matrix3d. Body tilt affects X/Y/Z and perspective of real DOM links; a screen-safe correction retains orientation while keeping the text clear of the real capture and viewport margins. Only selected chapter text is visible. Removed duplicate mesh labels/oversized core board (core has no screenshot); captures are smaller and offset from copy. A sr-only title is explicitly clipped, hero copy hidden during exploration, no overlapping chapter transitions. Purple emissive silhouette rim and stronger radial illumination. Passive drift/breathing at a low timer-driven rate only on unconstrained devices with full budget, no hidden-tab/pause/Save-Data/reduced-motion work; slow-frame downshift also disables passive movement. Tests freeze passive timers for deterministic geometry then separately advance/cancel them. Not a browser/GPU performance or visual approval.

## 1 November — foreground media and RAF-paced emission (latest)
User screenshot confirmed a separate bug: ring geometry occluded the real feature capture, despite copy/capture bounds being disjoint. The real capture now has depthTest/depthWrite disabled and renderOrder30, after all body/ring/rim/glow meshes. Intentional foreground presentation keeps it intact. Passive motion uses elapsed frame dt with larger XYZ amplitudes and a zero-delay gate before RAF instead of the rejected50ms stepping. It is refresh-paced, not a guaranteed FPS. Added four additive, untone-mapped tip-emission sprites using the shared glow texture, stronger body emissive and wider silhouette rim. Existing constrained/reduced/hidden/reading/slow-frame safeguards remain. CPU render-budget proxy now includes the full draw callback, not just renderer submission. Real-device profiling and user visual acceptance still required.

## 1 November — current: one celestial site, no content below the scroll
Earlier whole-catalogue reference and lower download/FAQ/footer policies above are superseded by explicit user request. index.html now has only hero+four-chapter model story in main. Removed all old below-story sections; replaced old site.js section/filter/reveal infrastructure with motion, native download/help panels, progress and official release resolution. Optional services/account header remains untouched. The CSS is model-only and no longer loads legacy landing style.css. A new focused DOM test asserts this topology and validates panel switching/closing/deep links, motion preferences and online/offline release resolution. No client activation required.

nova-emblem.js replaces Phong with a procedural stellar ShaderMaterial, no specular terms: plasma filaments, fine variation and emission; a faint BackSide corona replaces harsh rim/tip sprites, central haze is subdued. The four bright tip sprites and unused mesh-label/light/floor rigs are removed. Rings have independent XYZ precession. A seeded32–180-point3D dust cloud (area/hardware capped,56max constrained) reuses the renderer/time uniform. Shared radiance drives the star, mediaHalo and actual HTML text's directional wash. Real media draws in front of rings, untouched assets. Bounds now reserve96px top desktop/landscape,150px portrait and bottom control clearance. Text does not become GPU geometry: it remains an accessible CSS3D plane using real camera/model matrices.

Validation:27 renderer-mock/real-geometry lifecycle tests plus the focused jsdom DOM/CSS suite passed. A new panel-resume test caught missing dirty invalidation; setActive now redraws immediately on resume. No actual shader compilation/raster, device FPS or browser visual QA performed; do not treat these tests as user acceptance. User preview required. No public deploy.

## 1 November — orbital library (latest user revision)
Content removal is superseded: all original about/input/feature story/toolkit/community material returns in a bounded four-tab orbital side library, not below-scroll sections. Existing download/help/license/platform disclosures remain linked. Desktop star shifts left; mobile library occupies a bounded foreground area. Original images focus on hover or keyboard focus, and pin on click/touch with Escape/close. The actual Three capture has a projected interactive hitbox for the same inspection. Text and images remain factual original sources, no invented gameplay. New module orbit-atlas.js; native account/download/help controls unchanged.

## 1 November — drone route and15 orbital content stations (latest)
The side library/tabs are explicitly rejected and removed, not merely hidden. All original overview/13 inputs/5 feature stories/toolkit categories/community/FAQ/download/license material is embedded in15 model chapters. Prev/next and a station selector replace the4-link rail. Original image inspection works by hover/keyboard or pinned touch/click. Compact reading planes can scroll their text for access on small screens; there is no fixed sidebar or conventional catalogue below the model. Reduced motion still exposes static semantic content.

cinematicFlight in emblem-journey.js owns an authored model-local route from positive Z, through the actual central opening, to negative Z. Rotation turns smoothly only after clearing the opening; no look-at target crosses the camera. Renderer consumes the new damped flight parameter only for the15-station composition; camera zoom1, body-local camera transform and continuous yaw reveal the rear. Tangential reading planes use the current-side projection, so back-side text is not mirrored. Original four-station geometry tests remain regression tests, not proof of the new composition's visual acceptance. Sampled path-clearance test covers1001 progress values. No browser raster/shader/GPU validation or deploy.

## 1 November — front tips, gravity gate, rear tips (latest)
The previous direct opening-to-aperture route is superseded. The route dwells at all four front tips (progress .10/.21/.33/.44), recentres, crosses a narrow central segment, turns after clearance, then visits the rear tips (.65/.77/.89/1). Camera looks at each corresponding tip outside transit. Scroll entering .485–.515 triggers a single smooth passage to .575 forward or .425 backwards; it re-arms only outside .46–.56. A transient .75-radian roll suggests a gravity change; readable planes are suppressed during transit only. Reduced motion never invokes the gate.

Information-plane fixes: overview appears initially rather than waiting for story entry/reveal>.98; CSS backface culling is disabled on the actual DOM reading planes, whose GL projection depth convention can disagree with CSS back-face semantics; homogeneous matrix is normalized to w=1. The latter is code-level corrective reasoning, not confirmed browser-pixel diagnosis. Station selector uses the persisted article ID instead of the new shared parent ID after reparenting.30 source/geometry/clock tests now include actual15-card layout, visible initial/front/rear stations,1001 route samples and forward/back/reduced gate behavior. No visual/GPU verification.

## 1 November — smooth reversible passage and paired tip information (latest)
Automatic gravity scroll jumps are removed. Passage spans .44–.68, with much lower transient roll (.12rad), slower pose damping and quaternion slerp. Reverse travel blends to forward-looking +localZ through the opening instead of retracing with the camera facing backwards. Camera orientation remains interpolated on exit. Eight tip stops retain their content until the visitor comes within .035 of another stop;16 panels form two per stop, not one constantly-replaced card. Clean separated planes, compact native text scrolling, no tabs, duplicate download heading removed. Download/platform information forms the final pair with equal Windows and Linux buttons; Linux still resolves only published official assets or falls back to releases, not an invented package. All route links/select controls map to tip stops so download can actually be reached after grouping.

Performance changes are code-level: framebuffer cap640² vs768² (512² constrained), particles120 vs180 (32 constrained), no repeated transform/style writes for already-hidden information planes. These are not measured browser/GPU improvements.29 mocked-geometry/lifecycle/route tests and DOM suite passed, including stable paired content, no injected scroll, reverse facing direction, both platform controls and online/offline release fallback. Real-device profiling remains outstanding.

## 1 November — opening framing correction
Initial look target is the model origin, not the upper tip (Y1.8). First valid cinematic pose initializes orientation immediately; subsequent travel remains damped. Other route keys and panel placement unchanged. Projection regression covers3viewport sizes with±5%vertical-centre tolerance, not browser raster/GPU QA.

## 1 November — finite wheel inertia
New orbit-scroll.js smooths vertical page wheel input with a finite RAF interpolator. Nested panels, zoom, touch and keyboard remain native; pointer/keyboard/visibility/preferences cancel inertia. No autonomous aperture jump. Camera position/orientation damping softened slightly. Synthetic input-clock tests passed, not browser/device performance evidence.

## 1 November — reverse-in-place inside the passage
Transit orientation now remembers which exterior side the camera entered from. Reversing input before exiting does not turn the camera: it backs out facing its entry heading. Entry side changes only outside .44–.68. New front/rear retreat tests passed; full-crossing behavior and smoothing retained. No browser/GPU visual verification.
