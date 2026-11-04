## Current access policy (29 October 2026)

NovaClient 2.2.7 opens and plays without activation keys. License-service outages
cannot gate input/render/local practice or force activation. Optional signed device
identity remains for account linking, service tickets and role-restricted cosmetics;
new enrollment is Member. Backend enrollment is local/tested, pending deployment
when the VPS is reachable. Historical activation references below describe legacy
clients, not a requirement to play the current build.

# NovaClient website: feature source map

Reviewed 2026-10-22 against the local client source. No codebase-memory connector was available. This file is a navigation aid, not a replacement for re-reading the implementation before future claims.

| Website content | Source |
| --- | --- |
| Thirteen input modes and per-mode configuration | src/game/client/components/menus_novaclient.cpp, s_apModes, apAmount, apOthers; Fast (JuKKi) source adaptation documented in docs/fast-jukki-input.md |
| Fast Practice and Copy World | menus_novaclient.cpp gameplay settings; fast practice component |
| Aspect ratio, optimizer, fog, HUD, camera, visual settings | menus_novaclient.cpp settings and gs_apExampleFeatures |
| Voice chat | src/game/client/components/voice_chat.h, platform-gated AVAILABLE; menus_novaclient.cpp voice settings |
| Twitch | menus_novaclient.cpp Twitch connection, channel and sound controls |
| Team Panel, map attempts, race history, KoG, achievements | client components and NovaClient navigation |
| BestClient, RushieClient, AMF indicators | src/game/client/components/bestclient/clientindicator/client_indicator.cpp |
| Roles and Premium | license implementation, NovaClient menu gating, AGENTS.md role policy |

## Publication constraints
- English copy; black and purple palette. No fictional feature previews or third-party screenshots.
- Voice availability is Windows-specific. Achievements require a linked KoG profile.
- Copy World and Fast Practice operate locally; do not imply server mutation.
- Performance settings support tuning for hardware; no universal FPS guarantee.
- Premium availability depends on role. Do not describe every cosmetic as available to every license.
- Download resolves the latest published matching Windows package from NovaClient-Dist, with an official releases fallback.

## 2026-10-28 — native title glow (website source prepared, not published)

- In-game Title editor has an optional glow with an immediate preview:
  `src/game/client/components/menus_kog.cpp`, `title_glow.h`, `kog_stats.cpp`.
- Ownership and the separate signed editor permission are unchanged. The optional
  `glow` field is validated/persisted by `title_permissions.py` / `dashboard_admin.py`
  and included in signed drafts/catalogs. Missing fields preserve legacy behavior.
- Website title rendering and dashboard controls have local matching source in
  `dist/titles.js` and `dist/license/dashboard/`; this task does not publish them.
- Guide was removed from the client in 2.2.7. Historical guide media are archived,
  not distributed. Appearance Background now supports independent gradient/local-image
  normal map and 100%-entities backgrounds (`background.cpp`, `custom_background.cpp`,
  `maplayers.cpp`, `menus_novaclient.cpp`). This does not change the website background.

## Design references
GetLayers (https://www.getlayers.ai/docs), React Bits (https://reactbits.dev), 21st (https://21st.dev), Uiverse (https://uiverse.io), Spell (https://spell.sh), Alche (https://alche.studio), BestClient (https://bestclient.fun). Aether is provisionally interpreted as Aether/UI (https://aetherui.in); the direct page returned 403 during research.

Original native CSS/JS implementation inspired by the references, without copying their component source. Existing static deployment is preserved. Motion intensity 6, density 4, variance 8; user-requested purple, glows and text-first presentation override skill defaults. Decorative rings are abstract illumination, not feature demonstrations. No new runtime dependencies.

## Player website account
- Discord identify login uses the existing server-only OAuth integration: `services/novaclient-licenses/premium.py`, `novaclient_licenses.py`.
- Temporary, device-bound website proof is emitted only after signed v2 validation. One-use codes expire after ten minutes and are stored hashed: `website_accounts.py`; client button in `menus_novaclient.cpp` Diagnostics and signed response consumption in `license.cpp`.
- Main nickname linking calls `Store.link_player`, the same routine used by Discord `/link`; it does not prove KoG nickname ownership.
- Profiles use gameplay_stats, gameplay_map_tries, the effective license role and dashboard title assignment. Title glyph colors, RGB, wave and pulse follow `CKoGStats::RenderTitle` in `kog_stats.cpp`.
- Leaderboards show client-recorded totals (playtime, tries, saves, freezes, lasts, deaths), not official KoG ranking: `Store.leaderboard`.

## Shared player titles and public profiles
- Current title selection: `services/novaclient-licenses/novaclient_licenses.py` signed presence, `licenses.selected_title`.
- Earned catalog: `src/game/client/components/kog_stats_data.cpp`; generated website catalog at `services/novaclient-licenses/earned_titles.json` (regenerate after catalog changes).
- Per-letter gradient/RGB/wave/pulse formulas: `src/game/client/components/kog_stats.cpp`, mirrored in `dist/titles.js`.
- Public profile allowlist, opaque identifiers and assignment validation: `services/novaclient-licenses/website_accounts.py`. No private license or device metadata is public.

## 2026-10-23 update
- Real user-provided captures integrated next to practice, minimap, statboard, team, Twitch, indicators, KoG, titles and keyboard descriptions in `dist/assets/features/`. No fabricated demonstrations.
- Dedicated `/premium/` page; removed landing payment section; same role restrictions as `CLicense::HasPremium` and `CanCustomizeIndicator`.
- Key action presets: `menus_settings_controls.cpp`, central `CBinds::Bind`; immediate-mode 3D is called only for Keybindings and has an active-menu guard.
- Website linking calls `Store.link_player` after device proof; v2 signed `kog_player` claim is consumed by `CLicense`, enabling the Titles tab. OAuth alone does not unlock earned or assigned titles.

- Native Linux activation backend: `novaclient_linux_security.h`, OpenSSL 3 ES256 and libsecret credential storage. Optional online identity uses a desktop keyring; playing does not require one; Linux automatic updates are disabled until separate platform manifests exist. Website Linux download resolves only a real published package, otherwise links to official releases.
- Retired earned title ID 55 remains reserved and cannot unlock, render or be published; every other title ID is preserved.

- Complete settings snapshot: `src/engine/shared/config.cpp`, `config_domains.h`, `binds.cpp` and `hud_layout.cpp`; documented in `../docs/novaclient-settings.md`. Persists defaults, inherited preferences, binds and editable HUD state in user storage.

- Download platform chooser: local Windows SVG and Simple Icons Linux mark (CC0, https://github.com/simple-icons/simple-icons/blob/develop/icons/linux.svg). Both options use official NovaClient-Dist releases, with explicit Linux publication fallback.

## Administrative CRM
- Static owner workspace: `dist/license/dashboard/`; authenticated API origin `https://api.novaclient.tech/license/`.
- License/customer CRUD, signed device verification, lifecycle/ID reference integrity and complete retained record export: `services/novaclient-licenses/crm_admin.py`, `novaclient_licenses.py`.
- Original-currency Decimal income ledger, Pix/Wise/crypto methods, revisions, CSV and sales plans: `services/novaclient-licenses/crm_finance.py`; confirmed Pix integration in `premium.py`.
- Discord update/terminal bridge: `scripts/discord_admin_bridge.py`, `scripts/discord_license_bot.py`; separate admin credential, UID/cgroup enforcement and no bot token in the frontend.


## 2026-10-31 — model-led landing (local source, not published)

- Emblem details are symbolic brand storytelling, not interactive gameplay or
  server mutation. Actual feature illustrations further down remain real captures.
- Movement chapter: 13 selectable modes including appended Fast (JuKKi), verified
  in `src/engine/shared/config.h`, `config_variables_novaclient.h`,
  `src/game/client/components/menus_novaclient.cpp` and `bestclient/inputs.cpp`.
  Hero journey/input list corrected from 12 to13; saved mode IDs are not changed.
- Practice: `fast_practice.{h,cpp}`, Copy World in `menus_novaclient.cpp`; local
  practice only, not a promise to change the live server.
- Perspective: aspect_ratio, camera, HUD/minimap and optimizer components.
- Connection: Team Panel and Twitch controls in menus_novaclient; voice availability
  is Windows-gated by `voice_chat.h::AVAILABLE`, explicitly stated in the chapter.
- Poster `dist/assets/emblem-poster.png` is the unmodified emblem screenshot supplied
  by the user for this request. No generated image or third-party demo media.
- Original CSS/Three.js scene code; ReactDrops catalogue is reference-only. No
  ReactDrops component source/dependency is copied or imported. Its custom license
  is not MIT/OSI and must be checked before future source reuse.
- See `MODEL-STORY.md` for architecture, budgets, test commands and validation limits.


## 2026-10-31 — orbital rework after rejected preview (local only)

Supersedes the visual composition of the preceding model-led entry. The whole
emblem now stays visible across the site; text moves around it in a shared CSS3D
perspective scene, with actual translateZ/depth ordering, not just camera angles.
Four labels are attached to its points. Its central 3D surface displays:
- thirteen-mode information from the verified source selection;
- `assets/features/fast-practice.png`;
- `assets/features/minimap.png`;
- `assets/features/team-panel.png`.
These are existing real captures, not a fabricated live game simulation. The files
remain unmodified and are lazily requested when the corresponding feature is selected.
The full existing catalogue/media is retained under details#reference; native
anchors expand it. Visible voice copy still states Windows availability.

The rejected screenshot poster is no longer used as the live fallback; icon.png
was checked to have real RGBA transparency (alpha range0..255). No image asset was
edited/generated for this revision. See MODEL-STORY.md for the revised contract.

## 1 November 2026 — model-only landing
The user explicitly removed the conventional below-scroll catalogue, community, download section, FAQ section and footer. Core13-input/Practice/View/Connection facts remain in four attached model chapters; download/help are native panels. Account/Premium/leaderboard routes are unchanged. Official release resolver and no-key/platform/license notices remain. Real feature PNGs are still original files mapped on the model; celestial surface/particles are brand decoration, not a fabricated gameplay demonstration. No new client capability is claimed by this presentation change.

## 1 November — orbital library (latest user revision)
Content removal is superseded: all original about/input/feature story/toolkit/community material returns in a bounded four-tab orbital side library, not below-scroll sections. Existing download/help/license/platform disclosures remain linked. Desktop star shifts left; mobile library occupies a bounded foreground area. Original images focus on hover or keyboard focus, and pin on click/touch with Escape/close. The actual Three capture has a projected interactive hitbox for the same inspection. Text and images remain factual original sources, no invented gameplay. New module orbit-atlas.js; native account/download/help controls unchanged.

## 1 November — drone route and15 orbital content stations (latest)
The side library/tabs are explicitly rejected and removed, not merely hidden. All original overview/13 inputs/5 feature stories/toolkit categories/community/FAQ/download/license material is embedded in15 model chapters. Prev/next and a station selector replace the4-link rail. Original image inspection works by hover/keyboard or pinned touch/click. Compact reading planes can scroll their text for access on small screens; there is no fixed sidebar or conventional catalogue below the model. Reduced motion still exposes static semantic content.

cinematicFlight in emblem-journey.js owns an authored model-local route from positive Z, through the actual central opening, to negative Z. Rotation turns smoothly only after clearing the opening; no look-at target crosses the camera. Renderer consumes the new damped flight parameter only for the15-station composition; camera zoom1, body-local camera transform and continuous yaw reveal the rear. Tangential reading planes use the current-side projection, so back-side text is not mirrored. Original four-station geometry tests remain regression tests, not proof of the new composition's visual acceptance. Sampled path-clearance test covers1001 progress values. No browser raster/shader/GPU validation or deploy.

## 1 November — smooth reversible passage and paired tip information (latest)
Automatic gravity scroll jumps are removed. Passage spans .44–.68, with much lower transient roll (.12rad), slower pose damping and quaternion slerp. Reverse travel blends to forward-looking +localZ through the opening instead of retracing with the camera facing backwards. Camera orientation remains interpolated on exit. Eight tip stops retain their content until the visitor comes within .035 of another stop;16 panels form two per stop, not one constantly-replaced card. Clean separated planes, compact native text scrolling, no tabs, duplicate download heading removed. Download/platform information forms the final pair with equal Windows and Linux buttons; Linux still resolves only published official assets or falls back to releases, not an invented package. All route links/select controls map to tip stops so download can actually be reached after grouping.

Performance changes are code-level: framebuffer cap640² vs768² (512² constrained), particles120 vs180 (32 constrained), no repeated transform/style writes for already-hidden information planes. These are not measured browser/GPU improvements.29 mocked-geometry/lifecycle/route tests and DOM suite passed, including stable paired content, no injected scroll, reverse facing direction, both platform controls and online/offline release fallback. Real-device profiling remains outstanding.

## 1 November — mobile composition, ethereal body and non-intersecting orbits (latest)
Compact viewports use the constrained geometry/buffer profile (512² pixel-area cap, no MSAA,<=32 dust points and no passive idle loop). Portrait composition lifts the model14svh above two lower reading planes. Landscape keeps left/right cards; responsive header,44px targets,16px native selector text, notch safe-area padding, original pinch zoom and touch scrolling preserved. Hover opacity is gated away from touch. Real mobile browser/device profiling remains required.

The stellar shader now emits variable alpha (veil) using additive transparency with no depth writes instead of an opaque filled body. Ring geometry is enlarged and de-flattened, made thinner/fainter and placed on the far side of the body according to camera-local Z. Both hoops fade out in the central passage; they do not switch through the model while visible.33 source/mock-renderer geometry/lifecycle tests passed, including full vertex checks of both hoops beyond the body bounds at front/rear tip poses and mobile quality/transparency constraints. No actual shader raster/GPU/FPS validation was performed.

## 1 November — ten richer stations, faster pacing, diffuse mythic model (latest)
Explicit user confirmation approves the screenshot feedback.16 panels consolidated to10 without removing source information: toolkit lists now join their related feature cards; installation/platform notes join download. Five content pairs map onto the existing eight tip visits, preserving front/aperture/rear route and reverse-in-place. Navigation maps all ten IDs to correct group stops. Paired text remains unchanged between relevant tips; repeated internal headings removed. Station travel reduced112svh→94svh and card count reduced16→10. Responsiveness modestly accelerated (wheel8→10, pose5.5→7, orientation4.5→6); no automated scroll jump.

Desktop reading panes390px with up to490px text area, constrained by viewport/control clearance, larger15px text; mobile retains two compact planes and14px text with native scrolling. Sharpness rises within explicit budgets: desktop1024²/mobile640² backing area, pixel scale<=1.5desktop/1.25compact, with512² fallback on slow frames. This is not unlimited DPR/200% or a real-device performance guarantee.

Latest image feedback also rejects glossy-looking luminous strips/interlacing. The body uses a flat ShapeGeometry silhouette/hole instead of overlapping translucent extruded walls, DoubleSide/forceSinglePass and emission-only low-frequency haze: no veins or specular material. A512px procedural CanvasTexture follows the exact real curve/hole with two fixed blur radii, mapped to a model-aligned additive plane for diffuse emitted glow. It is generated once, not blurred every frame; original gameplay PNGs untouched.34 source/geometry/lifecycle tests plus DOM and wheel suites passed. No GPU shader/raster or visual approval implied.

## 1 November — replacement dashboard UI
React public-pattern adapters in dashboard-ui/src/components.jsx replace trend/comparison/distribution/progress charts, player feed and shared data tables. workspace.css replaces the legacy stylesheets; index.html uses a rebuilt grouped navigation shell. Authenticated business controllers and real data retained. See dashboard-ui/README.md for upstream source revision, build and limitations. No TaskForge PRO code.

## 04 November 2026 — editorial public website
Homepage rebuilt as a static editorial page with numbered sections, feature copy verified against client sources (menus_novaclient.cpp, inputs.cpp, fast_practice.cpp, finish_card.cpp), native details FAQ and explicit Windows/Linux downloads. No fictitious statistics, testimonials or network-latency guarantees. Canvas/WebGL is not loaded on the new homepage. Motion14.9.1 is bundled locally; only short opacity/transform entrances, with reduced-motion and pause. Source: dashboard-ui/src/landing-motion.js; npm run build reproduces the bundle.
Public account, Premium, leaderboard and legal pages share nova-portal.css. Their forms, IDs, controller scripts, entitlement copy, auth/payment routes and hidden states are preserved from current origin/main. Administrative dashboard and backend remain unchanged. Account/payment actions are not optimistic. Native details, keyboard focus, legible hierarchy, balanced headings and responsive controls adopted; command menu, speculative charts, skeletons and decorative3D omitted because the landing has no journey/data justification.
Validation: CSS parser + JSDOM structural/service-contract checks; no UI automation, screenshots or human gameplay/performance claims. Deployment and observed remote status are recorded in repository-root MEMORIA_HANDOFF.md (parent project).
