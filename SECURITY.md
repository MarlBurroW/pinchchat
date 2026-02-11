# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅        |

## Architecture

PinchChat is a **static frontend** — it runs entirely in the browser. There is no server-side component.

- Gateway credentials are entered at runtime and stored in `localStorage`
- No secrets are baked into the build
- All communication happens over WebSocket to your own OpenClaw gateway

## Reporting a Vulnerability

If you discover a security issue, please **do not** open a public issue.

Instead, email **contact@nicolasvarrot.fr** with:

- A description of the vulnerability
- Steps to reproduce
- Potential impact

You'll receive a response within 48 hours. Valid reports will be credited in the fix commit.
