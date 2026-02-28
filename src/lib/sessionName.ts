import type { Session } from '../types';

/**
 * Derive a human-friendly display name for a session.
 *
 * Priority:
 * 1. label (if set, e.g. sub-agent labels)
 * 2. "Main" for kind=main
 * 3. Kind + channel (e.g. "Cron · telegram")
 * 4. Channel name capitalized
 * 5. Cleaned session key (strip agent:xxx: prefix, truncate UUIDs)
 */
export function sessionDisplayName(session: Session): string {
  if (session.label) return session.label;

  const kind = session.kind;
  const channel = session.channel;

  if (kind === 'main') {
    return channel ? `Main · ${capitalize(channel)}` : 'Main';
  }

  if (kind === 'cron') {
    return channel ? `Cron · ${capitalize(channel)}` : 'Cron';
  }

  if (kind === 'isolated') {
    return channel ? `Task · ${capitalize(channel)}` : 'Task';
  }

  if (channel) return capitalize(channel);

  // Fallback: clean the session key
  return cleanSessionKey(session.key);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function cleanSessionKey(key: string): string {
  // Strip "agent:<id>:" prefix
  const stripped = key.replace(/^agent:[^:]+:/, '');
  // If it looks like a UUID, show first 8 chars
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(stripped)) {
    return stripped.slice(0, 8) + '…';
  }
  return stripped;
}

const AGENT_KEY_RE = /^agent:([^:]+):/;

export function extractAgentIdFromKey(key: string): string | undefined {
  return key.match(AGENT_KEY_RE)?.[1];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

/**
 * Turn a raw agent ID like "my-cool_agent" into "My Cool Agent".
 * Returns undefined for UUIDs / hex-heavy IDs that aren't human-readable.
 */
export function formatAgentId(id: string): string | undefined {
  if (UUID_RE.test(id)) return undefined;
  return id
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
