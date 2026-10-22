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
