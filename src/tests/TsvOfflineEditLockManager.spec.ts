import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TSVOfflineEditLockManager } from '@/services/tsvOfflineEditLockManager';

class MockBroadcastChannel {
  static channels: Record<string, MockBroadcastChannel> = {};
  public name: string;
  private handler?: (ev: any) => void;
  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.channels[name] = this;
  }
  addEventListener(_: string, handler: (ev: any) => void) {
    this.handler = handler;
  }
  postMessage(msg: any) {
    // simulate the event object shape the manager expects
    this.handler && this.handler({ data: msg });
  }
  close() {
    delete MockBroadcastChannel.channels[this.name];
  }
}

describe('TSVOfflineEditLockManager - constructor behaviors', () => {
  const STORAGE_KEY = 'tsv_offline_edit_locks_v1';
  let originalBroadcast: any;

  beforeEach(() => {
    // preserve original and set mock by default
    originalBroadcast = (globalThis as any).BroadcastChannel;
    (globalThis as any).BroadcastChannel = MockBroadcastChannel;
    localStorage.clear();
    MockBroadcastChannel.channels = {};
  });

  afterEach(() => {
    // restore
    (globalThis as any).BroadcastChannel = originalBroadcast;
    vi.restoreAllMocks();
    localStorage.clear();
    MockBroadcastChannel.channels = {};
  });

  it('sets tabId and calls onChange immediately with current locks', () => {
    const mgr = new TSVOfflineEditLockManager();
    const cb = vi.fn();
    mgr.onChange(cb);
    // initial immediate call
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({});
    expect(typeof mgr.tabId).toBe('string');
    // pattern: timestamp_randomBase36(7)
    expect(mgr.tabId).toMatch(/^\d+_[a-z0-9]{7}$/);
  });

  it('handles BroadcastChannel messages and purges expired locks before notifying listeners', () => {
    const mgr = new TSVOfflineEditLockManager();
    const cb = vi.fn();
    mgr.onChange(cb);
    cb.mockClear();

    // craft a stale lock (expiryStartedAt far in the past)
    const staleExpiry = Date.now() - 1000 * 60 * 60; // 1 hour ago
    const payload = {
      type: 'update',
      locks: {
        someTab: {
          taskIds: [1],
          updatedAt: Date.now() - 2000,
          expiryStartedAt: staleExpiry,
        },
      },
    };

    // postMessage via the mock channel
    const channel = (mgr as any).channel as MockBroadcastChannel;
    expect(channel).toBeInstanceOf(MockBroadcastChannel);
    channel.postMessage(payload);

    // listener should get purged result (empty)
    expect(cb).toHaveBeenCalled();
    // Last call arg should be empty object since stale entry purged
    const lastArg = cb.mock.calls[cb.mock.calls.length - 1][0];
    expect(lastArg).toEqual({});
  });

  it('responds to storage events and forwards parsed locks to listeners', () => {
    // seed localStorage with a valid lock entry
    const seeded = {
      good: { taskIds: [42], updatedAt: Date.now() },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

    const mgr = new TSVOfflineEditLockManager();
    const cb = vi.fn();
    mgr.onChange(cb);
    cb.mockClear();

    // dispatch a storage event that the constructor's listener should react to
    const evt = new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: localStorage.getItem(STORAGE_KEY),
    } as any);
    window.dispatchEvent(evt);

    expect(cb).toHaveBeenCalled();
    const lastArg = cb.mock.calls[cb.mock.calls.length - 1][0];
    expect(lastArg).toEqual(seeded);
  });

  it('falls back gracefully when BroadcastChannel construction throws and still listens to storage', () => {
    // make BroadcastChannel throw
    (globalThis as any).BroadcastChannel = function () {
      throw new Error('BroadcastChannel not available');
    };

    const mgr = new TSVOfflineEditLockManager();
    // channel should be null when constructor catches
    expect((mgr as any).channel).toBeNull();

    const cb = vi.fn();
    mgr.onChange(cb);
    cb.mockClear();

    const seeded = { fallback: { taskIds: [7], updatedAt: Date.now() } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    const evt = new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: localStorage.getItem(STORAGE_KEY),
    } as any);
    window.dispatchEvent(evt);

    expect(cb).toHaveBeenCalled();
    const lastArg = cb.mock.calls[cb.mock.calls.length - 1][0];
    expect(lastArg).toEqual(seeded);
  });
});
