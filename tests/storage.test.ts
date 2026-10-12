// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { StorageManager } from '../src/client';
import { idbKey } from '../src/storage/key-store';

class MemoryStorage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  key(i: number) { return [...this.map.keys()][i] ?? null; }
  getItem(k: string) { return this.map.get(k) ?? null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
}

const newKey = () =>
  crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

function setup() {
  const storage = new MemoryStorage();
  const manager = new StorageManager({ storage, key: newKey });
  return { storage, manager };
}

describe('StorageManager', () => {
  it('round-trips JSON values', async () => {
    const key = await newKey();
    const manager = new StorageManager({ storage: new MemoryStorage(), key: async () => key });
    await manager.set('profile', { name: 'ada', streak: 3, tags: ['a', 'b'] });
    expect(await manager.get('profile')).toEqual({ name: 'ada', streak: 3, tags: ['a', 'b'] });
  });

  it('stores ciphertext, never the plain value', async () => {
    const { storage, manager } = setup();
    await manager.set('profile', { name: 'ada-lovelace' });
    const raw = storage.getItem('qq.profile')!;
    expect(raw.startsWith('v1.')).toBe(true);
    expect(raw).not.toContain('ada-lovelace');
    expect(atob(raw.slice(3))).not.toContain('ada-lovelace');
  });

  it('compresses: a repetitive value is much smaller than its JSON', async () => {
    const { storage, manager } = setup();
    const value = { text: 'quiz '.repeat(2000) };
    await manager.set('big', value);
    expect(storage.getItem('qq.big')!.length).toBeLessThan(JSON.stringify(value).length / 10);
  });

  it('uses a fresh IV per write', async () => {
    const key = await newKey();
    const storage = new MemoryStorage();
    const manager = new StorageManager({ storage, key: async () => key });
    await manager.set('a', 1);
    const first = storage.getItem('qq.a');
    await manager.set('a', 1);
    expect(storage.getItem('qq.a')).not.toBe(first);
  });

  it('returns undefined for a missing key', async () => {
    expect(await setup().manager.get('nope')).toBeUndefined();
  });

  it('drops an entry that was tampered with', async () => {
    const { storage, manager } = setup();
    await manager.set('a', { ok: true });
    const raw = storage.getItem('qq.a')!;
    storage.setItem('qq.a', raw.slice(0, -4) + (raw.endsWith('AAAA') ? 'BBBB' : 'AAAA'));
    expect(await manager.get('a')).toBeUndefined();
    expect(storage.getItem('qq.a')).toBeNull();
  });

  it('drops an entry copied under another name', async () => {
    const key = await newKey();
    const storage = new MemoryStorage();
    const manager = new StorageManager({ storage, key: async () => key });
    await manager.set('a', 'secret');
    storage.setItem('qq.b', storage.getItem('qq.a')!);
    expect(await manager.get('b')).toBeUndefined();
  });

  it('drops an entry written under a different key', async () => {
    const storage = new MemoryStorage();
    await new StorageManager({ storage, key: newKey }).set('a', 1);
    expect(await new StorageManager({ storage, key: newKey }).get('a')).toBeUndefined();
  });

  it('drops an entry in an unknown format', async () => {
    const { storage, manager } = setup();
    storage.setItem('qq.a', 'plain text');
    expect(await manager.get('a')).toBeUndefined();
    expect(storage.getItem('qq.a')).toBeNull();
  });

  it('rejects a value JSON cannot hold', async () => {
    await expect(setup().manager.set('a', undefined)).rejects.toThrow(TypeError);
  });

  it('remove and clear touch only the SDK namespace', async () => {
    const { storage, manager } = setup();
    storage.setItem('theme', 'dark');
    await manager.set('a', 1);
    await manager.set('b', 2);
    manager.remove('a');
    expect(await manager.get('a')).toBeUndefined();
    expect(await manager.get('b')).toBe(2);
    manager.clear();
    expect(await manager.get('b')).toBeUndefined();
    expect(storage.getItem('theme')).toBe('dark');
  });

  it('keeps one key across calls, and retries after the key provider fails', async () => {
    let calls = 0;
    let fail = true;
    const manager = new StorageManager({
      storage: new MemoryStorage(),
      key: async () => {
        calls++;
        if (fail) throw new Error('idb down');
        return newKey();
      },
    });
    await expect(manager.set('a', 1)).rejects.toThrow('idb down');
    fail = false;
    await manager.set('a', 1);
    await manager.set('b', 2);
    expect(calls).toBe(2);
  });

  it('throws when no storage exists (server render)', async () => {
    await expect(new StorageManager({ key: newKey }).set('a', 1)).rejects.toThrow('not available');
  });
});

// Just enough of IndexedDB for idbKey: open, one store, get, put.
function fakeIndexedDB() {
  const data = new Map<string, unknown>();
  const req = <T>(run: () => T) => {
    const r: { result?: T; onsuccess?: () => void } = {};
    queueMicrotask(() => { r.result = run(); r.onsuccess?.(); });
    return r;
  };
  const store = { get: (k: string) => req(() => data.get(k)), put: (v: unknown, k: string) => req(() => { data.set(k, v); return k; }) };
  const db = { transaction: () => ({ objectStore: () => store }), createObjectStore: () => store, close: () => {} };
  const factory = {
    open: () => {
      const r = req(() => db) as { result?: typeof db; onsuccess?: () => void; onupgradeneeded?: () => void };
      (r as { result: typeof db }).result = db;
      queueMicrotask(() => r.onupgradeneeded?.());
      return r;
    },
  };
  return { factory: factory as unknown as IDBFactory, data };
}

describe('idbKey', () => {
  it('creates a non-extractable key once and returns the same key after', async () => {
    const { factory, data } = fakeIndexedDB();
    const first = await idbKey(factory);
    expect(first.extractable).toBe(false);
    expect(first.algorithm.name).toBe('AES-GCM');
    expect(data.size).toBe(1);
    expect(await idbKey(factory)).toBe(first);
  });
});
