import { IStorageAdapter, STORAGE_PREFIX } from "@/store/persistence/IStorageAdapter";
import { LocalStorageAdapter } from "@/store/persistence/LocalStorageAdapter";
import { StorageUnavailableError } from "@/store/persistence/errors";

const DB_NAME = "AlmasfufaDB";
const STORE_NAME = "appState";
const DB_VERSION = 1;

function indexedDbAvailable() {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

export class IndexedDBAdapter implements IStorageAdapter {
  private fallback = new LocalStorageAdapter();
  private dbPromise: Promise<IDBDatabase> | null = null;
  private static warnedOperations = new Set<string>();

  private warnFallbackOnce(operation: string, error: unknown) {
    if (IndexedDBAdapter.warnedOperations.has(operation)) {
      return;
    }
    IndexedDBAdapter.warnedOperations.add(operation);
    console.warn(`[IndexedDBAdapter] falling back to localStorage ${operation}`, error);
  }

  private async withFallback<T>(operation: "get" | "set" | "remove" | "clear" | "keys", task: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    try {
      return await task();
    } catch (error) {
      this.warnFallbackOnce(operation, error);
      return fallback();
    }
  }

  private async withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.openDb();
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  private openDb(): Promise<IDBDatabase> {
    if (!indexedDbAvailable()) {
      throw new StorageUnavailableError("IndexedDB is unavailable");
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => {
          db.close();
          this.dbPromise = null;
        };
        resolve(db);
      };
      req.onblocked = () => {
        this.dbPromise = null;
        reject(new StorageUnavailableError("IndexedDB open request was blocked"));
      };
      req.onerror = () => {
        this.dbPromise = null;
        reject(req.error);
      };
    });

    return this.dbPromise;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.withFallback(
      "get",
      async () => {
        const raw = await this.withStore<string | undefined>("readonly", (store) => store.get(key));
        if (!raw) return null;
        return JSON.parse(raw) as T;
      },
      () => this.fallback.get<T>(key)
    );
  }

  async set<T>(key: string, value: T): Promise<void> {
    return this.withFallback(
      "set",
      async () => {
        const payload = JSON.stringify(value);
        await this.withStore("readwrite", (store) => store.put(payload, key));
      },
      () => this.fallback.set(key, value)
    );
  }

  async remove(key: string): Promise<void> {
    return this.withFallback(
      "remove",
      () => this.withStore("readwrite", (store) => store.delete(key)),
      () => this.fallback.remove(key)
    );
  }

  async clear(): Promise<void> {
    return this.withFallback(
      "clear",
      () => this.withStore("readwrite", (store) => store.clear()),
      () => this.fallback.clear()
    );
  }

  async keys(): Promise<string[]> {
    return this.withFallback(
      "keys",
      async () => {
        const allKeys = await this.withStore<IDBValidKey[]>("readonly", (store) => store.getAllKeys());
        return allKeys.map(String).filter((key) => key.startsWith(STORAGE_PREFIX));
      },
      () => this.fallback.keys()
    );
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }
}
