# 🦞 PinchChat

[![CI](https://github.com/MarlBurroW/pinchchat/actions/workflows/ci.yml/badge.svg)](https://github.com/MarlBurroW/pinchchat/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

**A sleek, dark-themed webchat UI for [OpenClaw](https://github.com/openclaw/openclaw) — monitor sessions, stream responses, and inspect tool calls in real-time.**

> 🖼️ *Screenshot coming soon — [contributions welcome](https://github.com/MarlBurroW/pinchchat/issues)!*

## ✨ Features

- 🌑 **Dark neon theme** — easy on the eyes, built with Tailwind CSS v4
- 📊 **Token progress bars** — track token usage per session in real-time
- 🔧 **Tool call badges** — expandable panels with syntax-highlighted JSON
- 📋 **Session sidebar** — browse active sessions with live activity indicators
- 📝 **Markdown rendering** — full GFM support with code highlighting
- 📎 **File upload** — attach files to your messages
- ⚡ **Streaming responses** — watch the AI think in real-time
- 🔐 **Runtime login** — enter gateway credentials at runtime, no secrets in the build
- 🌐 **i18n support** — English and French, configurable via `VITE_LOCALE`

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **OpenClaw gateway** running and accessible

### Installation

```bash
git clone https://github.com/MarlBurroW/pinchchat.git
cd pinchchat
npm install
cp .env.example .env
```

Optionally edit `.env` to pre-fill the gateway URL:

```env
VITE_GATEWAY_WS_URL=ws://localhost:18789
VITE_LOCALE=en          # or "fr" for French UI
```

Start the dev server:

```bash
npm run dev
```

### Production

```bash
npm run build
npx vite preview
```

Or serve the `dist/` folder with nginx, Caddy, or any static file server.

## ⚙️ Configuration

All configuration is optional — credentials are entered at runtime via the login screen.

| Variable | Description | Default |
|---|---|---|
| `VITE_GATEWAY_WS_URL` | Pre-fill the gateway URL on the login screen | `ws://<hostname>:18789` |
| `VITE_LOCALE` | UI language (`en` or `fr`) | `en` |

> **Note:** The gateway token is entered at runtime and stored in `localStorage` — it is never baked into the build.

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    PinchChat (Browser)               │
│                                                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  Login    │→ │  App.tsx   │→ │  Chat + Sidebar  │  │
│  │  Screen   │  │ (router)  │  │  (main UI)       │  │
│  └──────────┘  └─────┬─────┘  └────────┬─────────┘  │
│                      │                  │            │
│                ┌─────▼──────────────────▼─────┐      │
│                │     useGateway (hook)         │      │
│                │  WebSocket state machine      │      │
│                │  auth · sessions · messages   │      │
│                └─────────────┬────────────────┘      │
└──────────────────────────────┼───────────────────────┘
                               │ WebSocket (JSON frames)
                               ▼
                    ┌─────────────────────┐
                    │  OpenClaw Gateway   │
                    │  (ws://host:18789)  │
                    └─────────────────────┘
```

### Key Components

| File | Role |
|---|---|
| `src/hooks/useGateway.ts` | WebSocket connection, auth, message streaming, session management |
| `src/components/LoginScreen.tsx` | Runtime credential entry (stored in `localStorage`) |
| `src/components/Chat.tsx` | Message list with auto-scroll and streaming display |
| `src/components/ChatInput.tsx` | Input with file upload, paste, drag & drop, image compression |
| `src/components/ChatMessage.tsx` | Markdown rendering, tool calls, thinking blocks |
| `src/components/Sidebar.tsx` | Session list with token usage bars and activity indicators |
| `src/components/Header.tsx` | Connection status, token progress bar, logout |
| `src/lib/i18n.ts` | Lightweight i18n (English + French) |
| `src/lib/gateway.ts` | WebSocket protocol helpers and message types |

### Data Flow

1. **Login** — User enters gateway URL + token → stored in `localStorage`
2. **Connect** — `useGateway` opens a WebSocket and authenticates with the token
3. **Sessions** — Gateway pushes session list; user selects one in the sidebar
4. **Messages** — Messages stream in via WebSocket frames; the hook assembles partial chunks into complete messages
5. **Send** — User input (+ optional file attachments) is sent as a JSON frame over the WebSocket

## 🛠 Tech Stack

- [React](https://react.dev/) 19
- [Vite](https://vite.dev/) 7
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Radix UI](https://www.radix-ui.com/) primitives
- [highlight.js](https://highlightjs.org/) via rehype-highlight
- [Lucide React](https://lucide.dev/) icons
- [react-markdown](https://github.com/remarkjs/react-markdown) with GFM

## 📄 License

[MIT](LICENSE) © Nicolas Varrot

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🔗 Links

- [OpenClaw](https://github.com/openclaw/openclaw) — the AI agent platform PinchChat connects to
