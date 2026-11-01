# NovaClient dashboard UI rebuild

The old dashboard stylesheets and supplemental CSS layers are not loaded by index.html. workspace.css is the replacement design system; workspace.js owns collapsible navigation and command search. API/authorization and administrative action controllers are preserved independently of the new visual layer.

## Public ReactVibe sources inspected
Upstream: https://github.com/siddhantmani/reactvibe at 644d0f53fed56f3bbbc5366c0eeba302c9d82460.
Documentation: https://reactvibe.com/docs/dashboard-ui/chart and /list; motion /network-pulse.
Upstream README declares MIT. No TaskForge PRO code was accessed or used.

src/components.jsx contains new, data-driven adaptations of the public Performance Trend Chart, Comparative Bar Chart, Distribution Breakdown Chart, Progress Overview List and Network Pulse patterns. It does not import demo datasets, Next fonts, store templates or brand names. These are adaptations, not unmodified upstream components. Purple/black Nova identity is retained; green distinguishes the independent activation series.

Charts consume authenticated server data: history samples, creation and activation dates, current license states, versions, per-currency income and payment methods. Financial charts do not combine currencies; floating-point conversion is for plotting only, not ledger calculation or persistence. Trend gaps remain gaps. All React roots are unmounted when their hosts are removed (refresh/logout). No customer data is persisted by React UI.

## Build
Run `npm ci --ignore-scripts` and `npm run build` on Windows. package-lock.json pins registry integrity hashes. build.mjs invokes the pinned @esbuild/win32-x64 binary; React/ReactDOM 19.2.5, scheduler 0.27.0, esbuild win32-x64 0.25.12. The local environment has Node without npm on PATH; npm 11.6.2 was obtained in ignored work/npm-runtime and used for the lockfile. No global package manager installation or install scripts were needed. The build targets the project Windows environment, not a portable Linux toolchain.

The API row builders escape remote values before passing their generated markup to StructuredDataTable. That adapter preserves existing administrative action attributes; arbitrary API HTML is never accepted. Existing business controllers are retained, while the previous stylesheets are no longer linked. This is an interface replacement, not a rewrite of authorization or services.

No browser or GPU visual validation is performed by automation, as project instructions prohibit it. Integration tests run in jsdom with synthetic HTTP. Production publication is separate from a local build.

Tests: npm test validates React chart mounting, keyboard tooltip, zero totals, escaping, cleanup and CSS. The synthetic HTTP integration test passed 48 requests including twelve route switches, keys, roles/Kanban, finance, sidebar, command search and logout races.
