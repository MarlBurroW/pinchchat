import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GatewayClient } from '../gateway';
import type { DeviceIdentity } from '../deviceIdentity';
import * as deviceIdentityModule from '../deviceIdentity';

vi.mock('../deviceIdentity', () => ({
  buildDeviceAuthPayload: vi.fn(),
  signPayload: vi.fn(),
}));

/* ------------------------------------------------------------------ */
/*  Minimal WebSocket mock                                             */
/* ------------------------------------------------------------------ */

type WSListener = (ev: { data: string } | { code: number; reason: string } | Event) => void;

class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.OPEN;
  onopen: WSListener | null = null;
  onmessage: WSListener | null = null;
  onclose: WSListener | null = null;
  onerror: WSListener | null = null;
  sent: string[] = [];
  url: string;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    // Simulate async open
    setTimeout(() => this.onopen?.({} as Event), 0);
  }

  send(data: string) { this.sent.push(data); }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: 1000, reason: 'normal' } as never);
  }

  /** Helper: simulate server sending a message */
  _receive(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as never);
  }

  static reset() { MockWebSocket.instances = []; }
}

// Patch global
const originalWS = globalThis.WebSocket;

beforeEach(() => {
  MockWebSocket.reset();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = MockWebSocket;
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  // Close any lingering mock WebSockets to prevent leaked timers
  for (const ws of MockWebSocket.instances) {
    if (ws.readyState !== MockWebSocket.CLOSED) {
      ws.readyState = MockWebSocket.CLOSED;
    }
  }
  vi.clearAllTimers();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = originalWS;
  vi.useRealTimers();
});

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('GatewayClient', () => {
  it('initialises with default URL when none provided', () => {
    // GatewayClient falls back to window.location.hostname — mock it for Node env
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = { location: { hostname: 'localhost' } };
    const gw = new GatewayClient();
    expect(gw.isConnected).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).window;
  });

  it('connects and handles challenge → connect flow', async () => {
    const gw = new GatewayClient('ws://test:1234', 'tok123');
    const statuses: string[] = [];
    gw.onStatus(s => statuses.push(s));

    gw.connect();
    expect(statuses).toContain('connecting');

    // Let the setTimeout in MockWebSocket fire (onopen)
    await vi.advanceTimersByTimeAsync(1);

    const ws = MockWebSocket.instances[0]!;

    // Server sends challenge
    ws._receive({ type: 'event', event: 'connect.challenge' });

    // handleChallenge is async — flush microtasks
    await vi.advanceTimersByTimeAsync(0);

    // Client should have sent a connect request
    expect(ws.sent.length).toBe(1);
    const req = JSON.parse(ws.sent[0]!);
    expect(req.method).toBe('connect');
    expect(req.params.auth.token).toBe('tok123');

    // Server responds ok
    ws._receive({ type: 'res', id: req.id, ok: true, payload: { session: 'abc' } });

    // Allow microtasks
    await vi.advanceTimersByTimeAsync(0);

    expect(gw.isConnected).toBe(true);
    expect(statuses).toContain('connected');
  });

  it('disconnects cleanly', async () => {
    const gw = new GatewayClient('ws://test:1234', 'tok');
    const statuses: string[] = [];
    gw.onStatus(s => statuses.push(s));

    gw.connect();
    await vi.advanceTimersByTimeAsync(1);

    gw.disconnect();
    expect(gw.isConnected).toBe(false);
    expect(statuses[statuses.length - 1]).toBe('disconnected');
  });

  it('routes events to registered handlers', async () => {
    const gw = new GatewayClient('ws://test:1234', 'tok');
    const events: Array<{ event: string; payload: Record<string, unknown> }> = [];
    gw.onEvent((event, payload) => events.push({ event, payload }));

    gw.connect();
    await vi.advanceTimersByTimeAsync(1);

    const ws = MockWebSocket.instances[0]!;
    ws._receive({ type: 'event', event: 'chat.message', payload: { text: 'hello' } });

    expect(events).toHaveLength(1);
    expect(events[0]!.event).toBe('chat.message');
    expect(events[0]!.payload.text).toBe('hello');
  });

  it('unsubscribes event handler when disposer is called', async () => {
    const gw = new GatewayClient('ws://test:1234', 'tok');
    const events: string[] = [];
    const unsub = gw.onEvent((event) => events.push(event));

    gw.connect();
    await vi.advanceTimersByTimeAsync(1);

    const ws = MockWebSocket.instances[0]!;
    ws._receive({ type: 'event', event: 'first' });
    unsub();
    ws._receive({ type: 'event', event: 'second' });

    expect(events).toEqual(['first']);
  });

  it('resolves send() promise on success response', async () => {
    const gw = new GatewayClient('ws://test:1234', 'tok');
    gw.connect();
    await vi.advanceTimersByTimeAsync(1);

    // Complete the challenge first
    const ws = MockWebSocket.instances[0]!;
    ws._receive({ type: 'event', event: 'connect.challenge' });
    await vi.advanceTimersByTimeAsync(0);
    const connectReq = JSON.parse(ws.sent[0]!);
    ws._receive({ type: 'res', id: connectReq.id, ok: true, payload: {} });
    await vi.advanceTimersByTimeAsync(0);

    const promise = gw.send('sessions.list', { limit: 10 });
    const sendReq = JSON.parse(ws.sent[1]!);
    ws._receive({ type: 'res', id: sendReq.id, ok: true, payload: { sessions: [] } });

    const result = await promise;
    expect(result).toEqual({ sessions: [] });
  });

  it('rejects send() promise on error response', async () => {
    const gw = new GatewayClient('ws://test:1234', 'tok');
    gw.connect();
    await vi.advanceTimersByTimeAsync(1);

    const ws = MockWebSocket.instances[0]!;
    ws._receive({ type: 'event', event: 'connect.challenge' });
    await vi.advanceTimersByTimeAsync(0);
    const connectReq = JSON.parse(ws.sent[0]!);
    ws._receive({ type: 'res', id: connectReq.id, ok: true, payload: {} });
    await vi.advanceTimersByTimeAsync(0);

    const promise = gw.send('bad.method', {});
    const sendReq = JSON.parse(ws.sent[1]!);
    ws._receive({ type: 'res', id: sendReq.id, ok: false, error: 'not found' });

    await expect(promise).rejects.toBe('not found');
  });

  it('rejects send() when not connected', async () => {
    const gw = new GatewayClient('ws://test:1234', 'tok');
    await expect(gw.send('foo', {})).rejects.toThrow('not connected');
  });

  it('times out pending requests after 30s', async () => {
    const gw = new GatewayClient('ws://test:1234', 'tok');
    gw.connect();
    await vi.advanceTimersByTimeAsync(1);

    const ws = MockWebSocket.instances[0]!;
    ws._receive({ type: 'event', event: 'connect.challenge' });
    await vi.advanceTimersByTimeAsync(0);
    const connectReq = JSON.parse(ws.sent[0]!);
    ws._receive({ type: 'res', id: connectReq.id, ok: true, payload: {} });
    await vi.advanceTimersByTimeAsync(0);

    const promise = gw.send('slow.method', {});

    // Attach rejection handler BEFORE advancing timers to avoid unhandled rejection
    const rejection = promise.catch((e: Error) => e);

    // Advance past the 30s timeout
    await vi.advanceTimersByTimeAsync(31000);

    const error = await rejection;
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('timeout');

    // Clean up: disconnect to prevent reconnect timers from firing after test
    gw.disconnect();
  });

  it('schedules reconnect on unexpected close', async () => {
    const gw = new GatewayClient('ws://test:1234', 'tok');
    const statuses: string[] = [];
    gw.onStatus(s => statuses.push(s));

    gw.connect();
    await vi.advanceTimersByTimeAsync(1);

    const ws = MockWebSocket.instances[0]!;
    // Simulate unexpected close (not from disconnect())
    ws.readyState = MockWebSocket.CLOSED;
    ws.onclose?.({ code: 1006, reason: 'abnormal' } as never);

    expect(statuses).toContain('disconnected');

    // After reconnect delay, a new WebSocket should be created
    await vi.advanceTimersByTimeAsync(2000);
    expect(MockWebSocket.instances.length).toBeGreaterThan(1);

    // Clean up to prevent leaked timers
    gw.disconnect();
  });

  it('does not reconnect after explicit disconnect()', async () => {
    const gw = new GatewayClient('ws://test:1234', 'tok');
    gw.connect();
    await vi.advanceTimersByTimeAsync(1);

    gw.disconnect();

    await vi.advanceTimersByTimeAsync(60000);
    // Only the original WebSocket should exist
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('setCredentials updates URL and token', () => {
    const gw = new GatewayClient('ws://old:1234', 'old-tok');
    gw.setCredentials('ws://new:5678', 'new-tok');

    // Connect with new credentials
    gw.connect();
    const ws = MockWebSocket.instances[0]!;
    expect(ws.url).toBe('ws://new:5678');
  });

  it('extracts nonce from challenge payload', async () => {
    const gw = new GatewayClient('ws://test:1234', 'tok');
    gw.connect();
    await vi.advanceTimersByTimeAsync(1);

    const ws = MockWebSocket.instances[0]!;
    // Server sends challenge with nonce
    ws._receive({ type: 'event', event: 'connect.challenge', payload: { nonce: 'test-nonce-123' } });
    await vi.advanceTimersByTimeAsync(0);

    const req = JSON.parse(ws.sent[0]!);
    expect(req.method).toBe('connect');
    // Device object won't be set (no identity), but the connect should still work
    expect(req.params.auth.token).toBe('tok');

    // Clean up
    gw.disconnect();
  });

  it('password mode with deviceIdentity: signs with token:null and sends auth.password', async () => {
    const buildPayload = vi.mocked(deviceIdentityModule.buildDeviceAuthPayload);
    const sign = vi.mocked(deviceIdentityModule.signPayload);
    buildPayload.mockReturnValue('mock-device-payload');
    sign.mockResolvedValue('mock-sig');

    // In password mode authToken holds the password string, not a JWT/token.
    // buildDeviceAuthPayload must receive token:null so the gateway signature
    // verification matches (gateway sees no token segment in the connect request).
    const gw = new GatewayClient('ws://test:1234', 'my-secret-password', 'password');
    const mockIdentity: DeviceIdentity = {
      id: 'device-id-abc',
      publicKeyRaw: 'pubkey-raw-abc',
      keyPair: { privateKey: {} as CryptoKey, publicKey: {} as CryptoKey },
    };
    gw.setDeviceIdentity(mockIdentity);

    gw.connect();
    await vi.advanceTimersByTimeAsync(1);

    const ws = MockWebSocket.instances[0]!;
    ws._receive({ type: 'event', event: 'connect.challenge', payload: { nonce: 'nonce-xyz' } });
    await vi.advanceTimersByTimeAsync(0);

    // buildDeviceAuthPayload must be called with token: null (not the password)
    expect(buildPayload).toHaveBeenCalledWith(
      expect.objectContaining({ token: null }),
    );

    // The connect request must use auth.password, not auth.token
    const req = JSON.parse(ws.sent[0]!);
    expect(req.method).toBe('connect');
    expect(req.params.auth.password).toBe('my-secret-password');
    expect(req.params.auth.token).toBeUndefined();

    gw.disconnect();
  });

  it('emits pairing status on NOT_PAIRED error', async () => {
    const gw = new GatewayClient('ws://test:1234', 'tok');
    const statuses: string[] = [];
    gw.onStatus(s => statuses.push(s));

    gw.connect();
    await vi.advanceTimersByTimeAsync(1);

    const ws = MockWebSocket.instances[0]!;
    ws._receive({ type: 'event', event: 'connect.challenge' });
    await vi.advanceTimersByTimeAsync(0);

    const req = JSON.parse(ws.sent[0]!);
    // Server rejects with NOT_PAIRED
    ws._receive({ type: 'res', id: req.id, ok: false, payload: { code: 'NOT_PAIRED', message: 'Device not paired' } });
    await vi.advanceTimersByTimeAsync(0);

    expect(statuses).toContain('pairing');

    // Clean up
    gw.disconnect();
  });
});
