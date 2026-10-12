import { idbKey } from './key-store';

type WebStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

export interface StorageManagerOptions {
  /** Prefix of every stored key, so the SDK never touches the app's own entries. Default `qq`. */
  namespace?: string;
  /** Default `sessionStorage`. */
  storage?: WebStorage;
  /** Default: a non-extractable key in IndexedDB. */
  key?: () => Promise<CryptoKey>;
}

const FORMAT = 'v1.';
const IV_BYTES = 12;
const utf8 = new TextEncoder();

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
};
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function gzip(bytes: Uint8Array<ArrayBuffer>, mode: 'compress' | 'decompress') {
  const transform = mode === 'compress' ? new CompressionStream('gzip') : new DecompressionStream('gzip');
  const stream = new Response(bytes).body!.pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * Keeps JSON values in session storage, gzip-compressed then AES-GCM encrypted. The stored key
 * is bound to the ciphertext, so an entry copied under another name will not decrypt.
 */
export class StorageManager {
  private readonly namespace: string;
  private key?: Promise<CryptoKey>;

  constructor(private readonly options: StorageManagerOptions = {}) {
    this.namespace = options.namespace ?? 'qq';
  }

  async set(name: string, value: unknown): Promise<void> {
    const json = JSON.stringify(value);
    if (json === undefined) throw new TypeError(`StorageManager: "${name}" is not JSON-serializable`);
    const id = this.id(name);
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const packed = await gzip(utf8.encode(json), 'compress');
    const sealed = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: utf8.encode(id) },
      await this.getKey(),
      packed,
    );
    const out = new Uint8Array(IV_BYTES + sealed.byteLength);
    out.set(iv);
    out.set(new Uint8Array(sealed), IV_BYTES);
    this.storage.setItem(id, FORMAT + toBase64(out));
  }

  /** The stored value, or `undefined` when absent. An entry that cannot be read is removed. */
  async get<T = unknown>(name: string): Promise<T | undefined> {
    const id = this.id(name);
    const raw = this.storage.getItem(id);
    if (raw === null) return undefined;
    const key = await this.getKey();
    try {
      if (!raw.startsWith(FORMAT)) throw new Error('unknown format');
      const bytes = fromBase64(raw.slice(FORMAT.length));
      const packed = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: bytes.slice(0, IV_BYTES), additionalData: utf8.encode(id) },
        key,
        bytes.slice(IV_BYTES),
      );
      return JSON.parse(new TextDecoder().decode(await gzip(new Uint8Array(packed), 'decompress'))) as T;
    } catch {
      // Tampered, copied from another name, or written under a key that is gone: same as missing.
      this.storage.removeItem(id);
      return undefined;
    }
  }

  remove(name: string): void {
    this.storage.removeItem(this.id(name));
  }

  /** Removes this namespace's entries only. */
  clear(): void {
    const prefix = `${this.namespace}.`;
    const ids: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const k = this.storage.key(i);
      if (k?.startsWith(prefix)) ids.push(k);
    }
    ids.forEach((k) => this.storage.removeItem(k));
  }

  private id(name: string) {
    return `${this.namespace}.${name}`;
  }

  private get storage(): WebStorage {
    const s = this.options.storage ?? globalThis.sessionStorage;
    if (!s) throw new Error('StorageManager: sessionStorage is not available here (server render?)');
    return s;
  }

  private getKey() {
    this.key ??= (this.options.key ?? idbKey)().catch((e) => {
      this.key = undefined; // let the next call retry
      throw e;
    });
    return this.key;
  }
}
