/**
 * Detect whether a user-role message is actually a system event
 * (heartbeat, webhook, cron, channel event, etc.) rather than
 * a real human message.
 */

const SYSTEM_PATTERNS: RegExp[] = [
  // Explicit markers
  /^\[EVENT\b/i,
  /\[from:\s*[^\]]*\(system\)\]/i,
  /^\[HEARTBEAT\b/i,
  /^\[cron:/i,
  /^\[hook:/i,
  /^\[webhook:/i,
  /^\[sms-inbound\b/i,
  /^\[teamspeak\b/i,

  // Heartbeat prompt pattern (the standard OpenClaw heartbeat)
  /^Read HEARTBEAT\.md if it exists/,

  // System event envelope: [source:xxx]
  /^\[source:\s*\w+\]/i,
];

export function isSystemEvent(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return SYSTEM_PATTERNS.some(pat => pat.test(trimmed));
}
