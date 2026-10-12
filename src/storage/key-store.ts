const DB_NAME = 'quickquiz-sdk';
const STORE = 'keys';
const KEY_ID = 'storage-manager';

const request = <T>(r: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });

/**
 * One AES-GCM key per browser, kept in IndexedDB as a non-extractable CryptoKey: it survives a
 * reload, and its bytes can never be read out. Script on the page can still call decrypt.
 */
export async function idbKey(factory: IDBFactory = indexedDB): Promise<CryptoKey> {
  const fresh = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const open = factory.open(DB_NAME, 1);
  open.onupgradeneeded = () => open.result.createObjectStore(STORE);
  const db = await request(open);
  try {
    // Read and write in one transaction, so two tabs starting together end up with the same key.
    const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
    const found = await request<CryptoKey | undefined>(store.get(KEY_ID));
    if (found) return found;
    await request(store.put(fresh, KEY_ID));
    return fresh;
  } finally {
    db.close();
  }
}
