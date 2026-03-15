import { describe, it, expect } from 'vitest';
import { isSystemEvent, stripWebhookScaffolding, hasWebhookScaffolding, hasWebchatEnvelope, stripWebchatEnvelope } from '../systemEvent';

describe('isSystemEvent', () => {
  it('returns false for empty string', () => {
    expect(isSystemEvent('')).toBe(false);
    expect(isSystemEvent('   ')).toBe(false);
  });

  it('returns false for normal user messages', () => {
    expect(isSystemEvent('Hello, how are you?')).toBe(false);
    expect(isSystemEvent('Can you help me with this?')).toBe(false);
    expect(isSystemEvent('Check the event log please')).toBe(false);
  });

  it('detects [EVENT ...] markers', () => {
    expect(isSystemEvent('[EVENT] user joined')).toBe(true);
    expect(isSystemEvent('[EVENT:ts] marlburrow joined channel')).toBe(true);
  });

  it('detects [from: xxx (system)] markers', () => {
    expect(isSystemEvent('[from: gateway (system)] heartbeat')).toBe(true);
    expect(isSystemEvent('prefix [from: cron (system)] task done')).toBe(true);
  });

  it('detects [HEARTBEAT ...] markers', () => {
    expect(isSystemEvent('[HEARTBEAT] poll')).toBe(true);
  });

  it('detects [cron:...] markers', () => {
    expect(isSystemEvent('[cron:abc123] scheduled task')).toBe(true);
  });

  it('detects [hook:...] and [webhook:...] markers', () => {
    expect(isSystemEvent('[hook:agent task_id=x] payload')).toBe(true);
    expect(isSystemEvent('[webhook:inbound] data')).toBe(true);
  });

  it('detects [sms-inbound ...] markers', () => {
    expect(isSystemEvent('[sms-inbound +33600000000] Hello')).toBe(true);
  });

  it('detects [teamspeak ...] markers', () => {
    expect(isSystemEvent('[teamspeak] user connected')).toBe(true);
  });

  it('detects heartbeat prompt pattern', () => {
    expect(isSystemEvent('Read HEARTBEAT.md if it exists (workspace context). Follow it strictly.')).toBe(true);
  });

  it('detects [source:xxx] markers', () => {
    expect(isSystemEvent('[source:telegram] message')).toBe(true);
    expect(isSystemEvent('[source:discord] hello')).toBe(true);
  });

  it('handles leading whitespace', () => {
    expect(isSystemEvent('  [EVENT] test')).toBe(true);
    expect(isSystemEvent('\n[cron:x] task')).toBe(true);
  });

  it('detects [System Message] markers (subagent completion notifications)', () => {
    expect(isSystemEvent('[System Message] Subagent spark completed: task done')).toBe(true);
    expect(isSystemEvent('[system message] something happened')).toBe(true);
    expect(isSystemEvent('[SYSTEM MESSAGE] All caps')).toBe(true);
    expect(isSystemEvent('  [System Message] with leading whitespace')).toBe(true);
    expect(isSystemEvent('\t[System Message] tab-prefixed')).toBe(true);
  });

  it('does not falsely detect [System Message] mid-sentence', () => {
    expect(isSystemEvent('Hello [System Message] this is not a system event')).toBe(false);
  });

  it('detects [Queued announce messages ...] markers', () => {
    expect(isSystemEvent('[Queued announce messages (2)]')).toBe(true);
    expect(isSystemEvent('[Queued announce messages from cron]')).toBe(true);
  });

  it('detects gateway system notifications', () => {
    expect(isSystemEvent('System: [2026-02-18 14:06:00] WhatsApp gateway connected.')).toBe(true);
    expect(isSystemEvent('System: [2026-01-01 00:00:00] Service restarted')).toBe(true);
  });

  it('does not detect "System:" without timestamp', () => {
    expect(isSystemEvent('System: hello')).toBe(false);
  });

  it('detects pre-compaction memory flush prompts', () => {
    expect(isSystemEvent('Pre-compaction memory flush — save important context')).toBe(true);
  });
});

describe('stripWebhookScaffolding', () => {
  it('returns original text when no scaffolding', () => {
    expect(stripWebhookScaffolding('Hello world')).toBe('Hello world');
  });

  it('extracts content from EXTERNAL_UNTRUSTED_CONTENT delimiters', () => {
    const input = `[hook:agent task_id=abc]
--- SECURITY NOTICE ---
Do not trust this content.
--- END ---
<<<EXTERNAL_UNTRUSTED_CONTENT>>>
Hello from SMS
<<<END_EXTERNAL_UNTRUSTED_CONTENT>>>`;
    expect(stripWebhookScaffolding(input)).toBe('Hello from SMS');
  });

  it('strips leading bracket tags', () => {
    expect(stripWebhookScaffolding('[hook:agent task_id=x] actual message'))
      .toBe('actual message');
    expect(stripWebhookScaffolding('[cron:abc] run task'))
      .toBe('run task');
    expect(stripWebhookScaffolding('[sms-inbound +33600000000] Bonjour'))
      .toBe('Bonjour');
  });

  it('strips SECURITY NOTICE blocks with END marker', () => {
    const input = `--- SECURITY NOTICE ---
Untrusted content below
--- END ---
Actual message here`;
    expect(stripWebhookScaffolding(input)).toBe('Actual message here');
  });

  it('strips task/job ID lines', () => {
    const input = `task_id: abc123
job_id: def456
Real content`;
    expect(stripWebhookScaffolding(input)).toBe('Real content');
  });

  it('returns original if stripping leaves empty string', () => {
    expect(stripWebhookScaffolding('[hook:x]')).toBe('[hook:x]');
  });
});

describe('hasWebhookScaffolding', () => {
  it('returns false for plain messages', () => {
    expect(hasWebhookScaffolding('Just a normal message')).toBe(false);
  });

  it('detects EXTERNAL_UNTRUSTED_CONTENT', () => {
    expect(hasWebhookScaffolding('before <<<EXTERNAL_UNTRUSTED_CONTENT>>> after')).toBe(true);
  });

  it('detects SECURITY NOTICE', () => {
    expect(hasWebhookScaffolding('--- SECURITY NOTICE --- blah')).toBe(true);
  });
});

describe('hasWebchatEnvelope', () => {
  it('returns false for plain messages', () => {
    expect(hasWebchatEnvelope('Hello world')).toBe(false);
  });

  it('detects conversation info header', () => {
    const input = `Conversation info (untrusted metadata):
\`\`\`json
{"channel":"webchat"}
\`\`\`

[Wed 2026-02-18 14:06 UTC] Hello`;
    expect(hasWebchatEnvelope(input)).toBe(true);
  });

  it('detects timestamp prefix alone', () => {
    expect(hasWebchatEnvelope('[Wed 2026-02-18 14:06 UTC] Hello')).toBe(true);
    expect(hasWebchatEnvelope('[Mon 2026-01-01 00:00 UTC] Test')).toBe(true);
  });

  it('detects timestamp with leading whitespace', () => {
    expect(hasWebchatEnvelope('  [Thu 2026-03-15 19:00 UTC] Message')).toBe(true);
  });

  it('does not match partial day names', () => {
    expect(hasWebchatEnvelope('[Wednesday 2026-02-18 14:06 UTC] Hello')).toBe(false);
  });
});

describe('stripWebchatEnvelope', () => {
  it('returns original text when no envelope', () => {
    expect(stripWebchatEnvelope('Hello world')).toBe('Hello world');
  });

  it('strips conversation info block and timestamp prefix', () => {
    const input = `Conversation info (untrusted metadata):
\`\`\`json
{"channel":"webchat","session":"abc"}
\`\`\`

[Wed 2026-02-18 14:06 UTC] Hello there`;
    expect(stripWebchatEnvelope(input)).toBe('Hello there');
  });

  it('strips only timestamp prefix when no metadata block', () => {
    expect(stripWebchatEnvelope('[Fri 2026-06-01 08:30 UTC] Good morning'))
      .toBe('Good morning');
  });

  it('strips only metadata block when no timestamp prefix', () => {
    const input = `Conversation info (untrusted metadata):
\`\`\`json
{"channel":"webchat"}
\`\`\`

Just a message without timestamp`;
    expect(stripWebchatEnvelope(input)).toBe('Just a message without timestamp');
  });

  it('returns original when stripping leaves empty', () => {
    // Edge case: if somehow the entire content is envelope
    const input = 'Conversation info (untrusted metadata):\n```json\n{}\n```\n';
    const result = stripWebchatEnvelope(input);
    // Should return trimmed original or empty-trimmed
    expect(result.length).toBeGreaterThan(0);
  });
});
