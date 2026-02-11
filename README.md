<p align="center">
  <img src="public/logo.png" alt="PinchChat" width="120" />
</p>

<h1 align="center">PinchChat</h1>

[![CI](https://github.com/MarlBurroW/pinchchat/actions/workflows/ci.yml/badge.svg)](https://github.com/MarlBurroW/pinchchat/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ghcr.io-blue)](https://github.com/MarlBurroW/pinchchat/pkgs/container/pinchchat)
[![Website](https://img.shields.io/badge/website-GitHub%20Pages-blueviolet)](https://marlburrow.github.io/pinchchat/)

**A sleek, dark-themed webchat UI for [OpenClaw](https://github.com/openclaw/openclaw) — monitor sessions, stream responses, and inspect tool calls in real-time.**

> 🎬 **[See the live demo →](https://marlburrow.github.io/pinchchat/)** — interactive preview of the UI with tool call visualization, streaming, and more.

<p align="center">
  <img src="public/screenshot.png" alt="PinchChat Screenshot" width="800" />
</p>

## ✨ Features

- 🔧 **Tool call visualization** — see what your agent is doing in real-time: colored badges, visible parameters, expandable results. The killer feature missing from every other chat UI.
- 💬 **GPT-like interface** — sessions in a sidebar, switch between conversations. Familiar if you've used ChatGPT or Claude.
- 📋 **Multi-session navigation** — browse all active sessions including cron jobs, sub-agents, and background tasks
- ⚡ **Live streaming** — watch the agent think and write token by token
- 📊 **Token usage tracking** — progress bars per session so you know how much context is left
- 🖼️ **Inline images** — generated or read images render directly in chat with lightbox preview
- 🎯 **Chat-focused** — no settings menus or config panels cluttering the screen. Just the conversation.
- 🌐 **i18n** — English and French built-in, easy to extend

## 🚀 Quick Start

### Docker (recommended)

```bash
docker run -p 3000:80 ghcr.io/marlburrow/pinchchat:latest
```

Open `http://localhost:3000` and enter your OpenClaw gateway URL + token on the login screen.

Or use Docker Compose:

```bash
curl -O https://raw.githubusercontent.com/MarlBurroW/pinchchat/main/docker-compose.yml
docker compose up -d
```

### From source

**Prerequisites:** Node.js 18+, an OpenClaw gateway running and accessible.

```bash
git clone https://github.com/MarlBurroW/pinchchat.git
cd pinchchat
npm install
cp .env.example .env
npm run dev
```

Optionally edit `.env` to pre-fill the gateway URL:

```env
VITE_GATEWAY_WS_URL=ws://localhost:18789
VITE_LOCALE=en          # or "fr" for French UI
```

### Production build

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

```mermaid
graph TD
    subgraph Browser["🌐 PinchChat (Browser)"]
        Login["LoginScreen<br/><i>credentials</i>"]
        App["App.tsx<br/><i>router</i>"]
        UI["Chat + Sidebar<br/><i>main UI</i>"]
        Hook["useGateway<br/><i>WebSocket state machine</i><br/>auth · sessions · messages"]

        Login --> App --> UI
        App & UI --> Hook
    end

    Hook <-->|"WebSocket (JSON frames)"| Gateway["🔌 OpenClaw Gateway<br/><code>ws://host:18789</code>"]
    Gateway <-->|API| LLM["🤖 LLM Provider<br/><i>Anthropic, OpenAI, etc.</i>"]
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

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🔗 Links

- [OpenClaw](https://github.com/openclaw/openclaw) — the AI agent platform PinchChat connects to
