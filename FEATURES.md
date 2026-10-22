# NovaClient website: feature source map

Reviewed 2026-10-22 against the local client source. No codebase-memory connector was available. This file is a navigation aid, not a replacement for re-reading the implementation before future claims.

| Website content | Source |
| --- | --- |
| Twelve input modes and per-mode configuration | src/game/client/components/menus_novaclient.cpp, s_apModes, apAmount, apOthers |
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
