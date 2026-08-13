import { Locks, LockEntry } from '@/interfaces/common/tsvLockEntry';

export class TSVOfflineEditLockManager {
  private readonly CHANNEL = 'tsv-offline-edit-lock';
  private readonly STORAGE_KEY = 'tsv_offline_edit_locks_v1';
  private readonly LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes

  public readonly tabId: string;
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(locks: Locks) => void> = [];

  constructor() {
    this.tabId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(this.CHANNEL);
        this.channel.addEventListener('message', (ev) => {
          if (ev?.data?.type === 'update') {
            const locks = this.purgeExpired(ev.data.locks || {});
            this.listeners.forEach((l) => l(locks));
          }
        });
      } catch {
        this.channel = null;
      }
    }

    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith(this.STORAGE_KEY)) {
        const locks = this.purgeExpired(this.readLocks());
        this.listeners.forEach((l) => l(locks));
      }
    });
  }

  private readLocks(): Locks {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private writeLocks(locks: Locks) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(locks));
      this.broadcast(locks);
    } catch (err) {
      console.error('writeLocks failed:', err);
    }
  }

  private purgeExpired(locks: Locks): Locks {
    const now = Date.now();
    for (const key of Object.keys(locks)) {
      const entry = locks[key];
      if (entry.expiryStartedAt && now - entry.expiryStartedAt > this.LOCK_TTL_MS) {
        delete locks[key];
      }
    }
    return locks;
  }

  private broadcast(locks: Locks) {
    try {
      this.channel?.postMessage({ type: 'update', locks });
      localStorage.setItem(`${this.STORAGE_KEY}_last_update`, Date.now().toString());
      this.listeners.forEach((l) => l(locks));
    } catch (err) {
      console.error('writeLocks failed:', err);
    }
  }

  startEditing(taskId: number) {
    const locks = this.purgeExpired(this.readLocks());
    const me: LockEntry = locks[this.tabId] || { taskIds: [], updatedAt: Date.now() };
    console.log('startEditing', me);

    if (!me.taskIds.includes(taskId)) me.taskIds.push(taskId);
    me.updatedAt = Date.now();
    delete me.expiryStartedAt;
    locks[this.tabId] = me;
    this.writeLocks(locks);
  }

  stopEditing(taskId: number) {
    const locks = this.purgeExpired(this.readLocks());
    const me = locks[this.tabId];
    if (!me) return;
    me.taskIds = me.taskIds.filter((id) => id !== taskId);
    if (me.taskIds.length === 0) delete locks[this.tabId];
    else me.updatedAt = Date.now();
    this.writeLocks(locks);
  }

  startExpiryCountdown() {
    const locks = this.purgeExpired(this.readLocks());
    const now = Date.now();
    let changed = false;
    for (const key of Object.keys(locks)) {
      const entry = locks[key];
      if (!entry.expiryStartedAt) {
        entry.expiryStartedAt = now;
        changed = true;
      }
    }
    if (changed) {
      this.writeLocks(locks);
    }
  }

  isAnyEditing(): boolean {
    const locks = this.purgeExpired(this.readLocks());
    return Object.keys(locks).length > 0;
  }

  getLocks(): Locks {
    return this.purgeExpired(this.readLocks());
  }

  onChange(cb: (locks: Locks) => void) {
    this.listeners.push(cb);
    cb(this.getLocks());
    return () => {
      const idx = this.listeners.indexOf(cb);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  isTaskLocked(taskId: number): boolean {
    const locks = this.getLocks();
    const me = locks[this.tabId];
    return !!me && me.taskIds.includes(taskId);
  }
}

export const tsvOfflineEditLock = new TSVOfflineEditLockManager();
