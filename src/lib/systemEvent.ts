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

  // OpenClaw subagent completion notifications
  /^\[System Message\]/i,

  // Queued announce messages (batched system messages)
  /^\[Queued announce messages/i,

  // Gateway system notifications (e.g. "System: [2026-02-18 ...] WhatsApp gateway connected.")
  /^System:\s*\[\d{4}-\d{2}-\d{2}/,

  // Pre-compaction memory flush prompts
  /^Pre-compaction memory flush/i,
];

export function isSystemEvent(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return SYSTEM_PATTERNS.some(pat => pat.test(trimmed));
}

/**
 * Strip webhook/hook scaffolding from message content.
 * OpenClaw wraps inbound webhook payloads in security envelopes like:
 *   [hook:agent task_id=xxx job_id=xxx]
 *   --- SECURITY NOTICE ---
 *   ...
 *   <<<EXTERNAL_UNTRUSTED_CONTENT>>>
 *   actual message
 *   <<<END_EXTERNAL_UNTRUSTED_CONTENT>>>
 *
 * This extracts the actual user content and returns it clean.
 * Also strips leading [hook:...] / [cron:...] / [sms-inbound ...] tags
 * and SECURITY NOTICE blocks when no EXTERNAL_UNTRUSTED_CONTENT delimiters exist.
 */
export function stripWebhookScaffolding(text: string): string {
  const trimmed = text.trim();

  // Extract content between <<<EXTERNAL_UNTRUSTED_CONTENT>>> delimiters
  const extMatch = trimmed.match(
    /<<<EXTERNAL_UNTRUSTED_CONTENT>>>\s*([\s\S]*?)\s*<<<END_EXTERNAL_UNTRUSTED_CONTENT>>>/
  );
  if (extMatch) {
    return extMatch[1].trim();
  }

  // Strip leading bracket tags: [hook:...], [cron:...], [sms-inbound ...], etc.
  let cleaned = trimmed.replace(/^\[(?:hook|cron|webhook|sms-inbound)[^\]]*\]\s*/i, '');

  // Strip SECURITY NOTICE blocks (--- SECURITY NOTICE --- ... --- END ---)
  cleaned = cleaned.replace(
    /---\s*SECURITY NOTICE\s*---[\s\S]*?---\s*END\s*---\s*/i,
    ''
  );

  // Strip standalone security notice lines without END marker
  cleaned = cleaned.replace(
    /---\s*SECURITY NOTICE\s*---[^\n]*\n(?:.*\n)*?(?=\S)/i,
    ''
  );

  // Strip task/job ID lines
  cleaned = cleaned.replace(/^(?:task_id|job_id|Task|Job)\s*[:=]\s*\S+\s*\n?/gim, '');

  return cleaned.trim() || trimmed;
}

/**
 * Check if a message contains webhook scaffolding that should be cleaned.
 */
export function hasWebhookScaffolding(text: string): boolean {
  return /<<<EXTERNAL_UNTRUSTED_CONTENT>>>/.test(text) ||
    /---\s*SECURITY NOTICE\s*---/i.test(text);
}
