# Changelog

All notable changes to PinchChat are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/), with [Conventional Commits](https://www.conventionalcommits.org/).

## [1.31.1] — 2026-02-13

### Fixed
- Replace remaining hardcoded `text-zinc-*` classes in App.tsx with theme CSS variables for proper light/OLED theme support

## [1.31.0] — 2026-02-13
### Added
- Unit test infrastructure with Vitest — 27 tests across 3 suites (relativeTime, sessionDisplayName, messagesToMarkdown)
- `npm test` and `npm run test:watch` scripts
- Test step added to CI workflow (runs on all Node.js matrix versions)

## [1.30.1] — 2026-02-13
### Fixed
- Added missing `aria-label` attributes to icon-only buttons (sidebar close, search clear, JSON copy) for screen reader accessibility
- Added i18n keys for new aria-labels (EN + FR)

## [1.30.0] — 2026-02-13
### Added
- Service worker for PWA support — static assets are cached for instant loads and offline shell
- App is now installable as a standalone PWA on mobile and desktop (Add to Home Screen)
- Enhanced manifest with orientation, categories, and complete icon set

## [1.29.2] — 2026-02-13
### Fixed
- Images now show a pulsing loading skeleton while loading and a graceful error fallback (icon + alt text) when they fail to load

## [1.29.1] — 2026-02-13
### Fixed
- External links in markdown messages now open in a new tab with `rel="noopener noreferrer"` for security

## [1.29.0] — 2026-02-13
### Added
- System theme option — automatically follows OS light/dark preference via `prefers-color-scheme`, updates dynamically when OS setting changes

## [1.28.2] — 2026-02-13
### Fixed
- Resolved all 3 ESLint warnings (react-hooks/set-state-in-effect) — lint now passes with 0 errors and 0 warnings

## [1.28.1] — 2026-02-13
### Fixed
- Docker: added security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- Docker: index.html is no longer cached, ensuring SPA updates are always picked up after redeploy
### Changed
- Added `engines` field (`node >=18`) and `lint:fix` npm script to package.json

## [1.28.0] — 2026-02-13
### Added
- Multi-tab split view — open 2 sessions side by side with a resizable divider
- Split view button in sidebar session actions (columns icon)
- Secondary pane supports full chat: history, streaming, sending, aborting
- Divider width persisted in localStorage

## [1.27.0] — 2026-02-13
### Added
- Syntax highlighting in chat input textarea — real-time markdown coloring (code blocks, inline code, bold, italic, headings, links) using transparent overlay technique
- Toggle button (highlighter icon) to enable/disable syntax highlighting, persisted in localStorage

## [1.26.0] — 2026-02-13
### Added
- Drag & drop session reordering in sidebar — custom order persists in localStorage, works within pinned/unpinned groups

## [1.24.0] — 2026-02-13
### Added
- Raw JSON viewer toggle on each message — hover to reveal `{⁠}` button, click to show full gateway payload as formatted JSON with copy support

## [1.20.2] — 2026-02-13
### Fixed
- Theme switcher now actually works — migrated ~150 hardcoded Tailwind color classes across all 17 components to CSS custom properties
- All UI elements (backgrounds, text, borders, accents, hover states) now respond to Dark/Light/OLED theme changes in real-time
- Added theme-aware hover, separator, and scrollbar variables per theme mode
- Markdown styles (code, blockquotes, tables) now use theme variables instead of hardcoded colors

## [1.20.0] — 2026-02-12
### Added
- Theme switcher — Dark, Light, and OLED Black modes with 6 configurable accent colors (Cyan, Violet, Emerald, Amber, Rose, Blue)
- CSS custom properties system for consistent theming across all components
- Theme and accent preferences persisted in localStorage

## [1.18.0] — 2026-02-12
### Added
- Improved thinking/reasoning indicator with elapsed time counter — shows pulsing "Reasoning..." with timer when agent is thinking with hidden content, instead of generic bouncing dots

## [1.16.0] — 2026-02-12
### Added
- Display agent avatar from OpenClaw identity config — shown in assistant message bubbles and header when configured

## [1.15.1] — 2026-02-12
### Fixed
- Metadata viewer popup was invisible due to parent `overflow-hidden` — now renders via portal outside the message bubble

## [1.15.0] — 2026-02-12
### Added
- Message metadata viewer — discreet ℹ️ button on hover shows raw message details (id, role, timestamp, channel, etc.)

## [1.14.2] — 2026-02-12
### Fixed
- Textarea scrollbar only appears when content overflows max-height (no more permanent scrollbar)

## [1.14.1] — 2026-02-12
### Fixed
- Session deletion now persists across page refreshes via localStorage blacklist — deleted sessions no longer reappear after reload

## [1.14.0] — 2026-02-12
### Added
- Collapse/expand all tool calls toggle — floating button appears when conversation has tool calls, lets you collapse or expand all at once

## [1.13.0] — 2026-02-12
### Added
- Keyboard shortcuts Alt+↑ / Alt+↓ to navigate between sessions
- Shortcut documented in the keyboard shortcuts help panel (?)

## [1.12.0] — 2026-02-12

### Added
- Export conversation as Markdown file — download button in header saves current session with formatted messages, tool calls, thinking blocks, and timestamps

## [1.11.1] — 2026-02-12

### Fixed
- **Windows horizontal scrollbar** — hide horizontal scrollbar in textarea input; add word-wrap to prevent overflow

## [1.11.0] — 2026-02-12

### Added
- **Relative timestamps in sidebar** — each session shows how recently it was active (2m, 3h, 1d)
- **Message preview in sidebar** — last message preview shown below session name
- **Recency sorting** — sessions sorted by most recently updated within pinned/unpinned groups

## [1.10.0] — 2026-02-12

### Added
- **Agent name badge** — display the agent name (e.g. "Marlbot") in the header next to the session label (`17ff52a`)

## [1.9.0] — 2026-02-12

### Added
- **Human-friendly session titles** — header and sidebar now show readable names (Main, Cron, Task + channel) instead of raw UUIDs; falls back to label or cleaned key (`52a1a7f`)

## [1.8.1] — 2026-02-12

### Fixed
- **Markdown rendering in long messages** — `autoFormatText` no longer wraps markdown prose in code fences; bold, headings, and bullet lists are now correctly rendered (`4c8faf0`)

## [1.7.0] — 2026-02-12

### Added
- **Delete session from sidebar** — trash icon on hover with confirmation dialog; calls `sessions.delete` on the gateway (`e94325b`)

## [1.6.0] — 2026-02-12

### Added
- **System event detection** — heartbeats, cron triggers, webhooks, and channel events now display as subtle inline notifications instead of full user message bubbles (`581675d`)

## [1.5.0] — 2026-02-12

### Added
- **Resizable sidebar** — drag the right edge to resize the sidebar; width persists across sessions (`fa9b10a`)

## [1.4.0] — 2026-02-12

New features and mobile fixes.

### Added
- **Session pinning** — pin important sessions to the top of the sidebar for quick access (`e24378a`)
- **Model badge** — see which AI model is handling the current session, displayed next to the token progress bar (`96f2883`, `1465ae1`)

### Fixed
- **Mobile viewport overflow** — chat messages no longer clip on left/right edges on iPhone (`8ef1b42`)

## [1.3.0] — 2026-02-12

New features improving daily usability.

### Added
- **Unread message indicators** — sessions with new messages show a visual badge in the sidebar so you never miss activity (`c0d27a7`)
- **Copy buttons on tool calls** — expanded tool call parameters and results now have one-click copy buttons (`908dbb4`)
- **Troubleshooting guide** — README now includes a troubleshooting section for common connection and build issues (`7a55940`)

### Fixed
- **CI lint errors** — resolved lint issues in Sidebar, TypingIndicator, and useGateway (`6734b54`)

## [1.2.2] — 2026-02-12

Code readability and developer experience polish.

### Added
- **Language labels on code blocks** — fenced code blocks now show the language name (e.g. "python", "bash") in a subtle label for easier identification (`ae3f683`)
- **Elapsed time on thinking indicator** — see how long the agent has been thinking with a live counter (`0c95150`)

## [1.2.1] — 2026-02-12

Small UX and documentation polish.

### Added
- **Auto-focus chat input** — input field automatically focuses when switching sessions or on connection, so you can start typing immediately (`f2038a2`)
- **Keyboard navigation for sessions** — use arrow keys to navigate the session list in the sidebar (`f55a24c`)
- **i18n contribution guide** — README now includes a section explaining how to add new languages (`f827307`)

## [1.2.0] — 2026-02-12

Polish, performance, and developer experience improvements.

### Added
- **Browser tab title** — shows the active session name in the tab title (`e53ef36`)
- **PWA support** — manifest, apple-touch-icon, and proper favicon sizes for installable webapp (`b8cbc75`)
- **Channel/type icons in session list** — Discord, Telegram, cron, and webchat sessions now show recognizable icons in the sidebar (`73d9e5f`)
- **Date separators** — visual dividers between messages from different days for easier conversation scanning (`375bd10`)
- **Screenshot in README** — added a real screenshot of the app to the README (`788909f`)
- **Loading indicator** — spinner when switching sessions (`cb882f5`)
- **Login URL validation** — inline hint when gateway URL doesn't start with ws:// or wss://, connect button disabled until valid (`dc49734`)

### Changed
- **Lazy-loaded Chat component** — reduces initial bundle size by deferring heavy markdown/syntax-highlighting imports (`b5eafde`)

### Fixed
- **Notification API guard** — no longer crashes in browsers that don't support the Notification API (`8301cba`)
- **ESLint + CI** — resolved all ESLint errors including React compiler rules; added lint step to CI pipeline (`916910f`, `29482e3`)
- **WebSocket reconnection** — exponential backoff with jitter instead of fixed-interval retry, preventing thundering herd on server restart (`f8be728`)

## [1.1.0] — 2026-02-11

A massive feature release turning PinchChat from a basic chat UI into a polished, accessible, and well-documented webchat client for OpenClaw.

### Added
- **OG card image + social meta tags** — rich previews when sharing links on Twitter/Discord/etc. (`88b6494`)
- **Retry/resend button on user messages** — resend a message if something went wrong (`5b2f3a3`)
- **Browser notifications + tab badge** — get notified of new messages even when the tab is in the background (`473d23c`)
- **PR template + security policy** — standardized PR descriptions and responsible disclosure process (`d020094`)
- **ErrorBoundary** — graceful crash recovery with a user-friendly error screen instead of a blank page (`b61a232`)
- **Keyboard shortcuts modal** — press `?` to see all available shortcuts (`ae83545`)
- **Session search filter** — filter sessions in the sidebar with `Ctrl+K` shortcut (`1779709`)
- **Emoji icons on tool call badges** — visual icons per tool type (🔍 web_search, ⚡ exec, 📖 read, etc.) (`72f7d76`)
- **Line break support** — messages now preserve single line breaks via remark-breaks (`59104b4`)
- **Copy button on assistant messages** — one-click copy of the full message text (`dd5b56e`)
- **Animated UI demo on landing page** — interactive fake chat showing tool call visualization, typing effects, and thinking indicators (`d26c498`)
- **Connection lost/reconnected banner** — visual feedback when WebSocket connection drops or recovers (`32a2166`)
- **Scroll-to-bottom button** — appears when scrolled up in chat, click to jump to latest messages (`b56c80a`)
- **Inline image display** — images render directly in chat with a click-to-expand lightbox (`762a5f2`)
- **Logo integration** — PinchChat logo in header, login screen, favicon, and OG meta tags (`97c16be`)
- **GitHub Pages landing page** — feature showcase at [marlburrow.github.io/pinchchat](https://marlburrow.github.io/pinchchat/) (`4f47732`)
- **Docker support** — Dockerfile, docker-compose.yml, CI auto-publish to `ghcr.io/marlburrow/pinchchat` (`5fd7300`)
- **Language selector** — toggle EN/FR in the header at runtime (`9b3aed4`)
- **Copy button on code blocks** — one-click copy for code snippets (`b6a989b`)
- **i18n support** — English and French UI via `VITE_LOCALE` env var (`99b7db9`)
- **Runtime login screen** — enter gateway credentials at runtime, no secrets baked into the build (`36f9480`)
- **NO_REPLY filtering** — silently hides agent NO_REPLY messages from the chat (`8834b2a`)
- **GitHub Actions CI** — lint and build checks on every push and PR (`a6b26b0`)
- **Issue templates** — bug report and feature request forms (`2d3ee47`)
- **Contributing guide** — CONTRIBUTING.md with dev setup and PR guidelines (`e34643d`)

### Changed
- **Landing page layout** — moved demo to hero section, replaced grid with alternating feature sections (`d118498`)
- **Token progress bars** — unified with subtle cyan opacity ramp, replacing the multi-color gradient (`84c8e24`)
- **Features rewrite** — pragmatic feature descriptions in README and landing page, highlighting real differentiators (`f556c8d`)
- **Architecture diagram** — replaced ASCII art with a Mermaid diagram in the README (`02d2ab3`)
- **Smart auto-scroll** — only auto-scrolls when the user is near the bottom (`3e7a596`)
- **Timestamp locale** — uses the selected i18n locale instead of hardcoded `fr-FR` (`88c393e`)
- **Vendor code-splitting** — split React and markdown dependencies into separate chunks, eliminating the 500KB bundle warning (`d7bdf3b`)

### Fixed
- **Prefers-reduced-motion** — all animations respect the user's OS motion preference (`fd66fed`)
- **ARIA accessibility** — added ARIA attributes to interactive elements for screen reader support (`78f82fd`)
- Landing page demo messages left-aligned (inherited text-align:center from hero) (`02e4bcf`)
- i18n key for 'Parameters' label in tool call expansion (`195ad62`)
- Sidebar overlay closes on Escape key + aria-hidden for screen readers (`91c22a1`)
- Corrected `index.html` lang attribute, page title, favicon path, and added SEO meta tags (`24c7d00`)
- Localized all hardcoded French strings to English with ARIA accessibility attributes (`3370916`)
- Fixed OpenClaw repo link in README (`604f902`)

### Improved
- **TypeScript strictness** — replaced `any` types with proper interfaces across gateway client, hooks, and components (`693229c`)

### Renamed
- **ClawChat → PinchChat** — full project rename across all files, configs, and docs (`d58c34f`)

## [1.0.0] — 2026-02-11

Initial release as ClawChat.

- Dark neon theme with Tailwind CSS v4
- WebSocket connection to OpenClaw gateway
- Session sidebar with token usage progress bars
- Markdown rendering with GFM and syntax highlighting
- Tool call badges with expandable JSON panels
- Thinking block display (collapsible)
- File upload with image compression and drag & drop
- Streaming response display
