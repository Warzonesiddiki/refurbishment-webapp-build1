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

  private async withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.openDb();
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  private openDb(): Promise<IDBDatabase> {
    if (!indexedDbAvailable()) {
      throw new StorageUnavailableError("IndexedDB is unavailable");
    }

    return new Promise((resolve, reject) => {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.withStore<string | undefined>("readonly", (store) => store.get(key));
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn("[IndexedDBAdapter] falling back to localStorage get", error);
      return this.fallback.get<T>(key);
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const payload = JSON.stringify(value);
    try {
      await this.withStore("readwrite", (store) => store.put(payload, key));
    } catch (error) {
      console.warn("[IndexedDBAdapter] falling back to localStorage set", error);
      await this.fallback.set(key, value);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.withStore("readwrite", (store) => store.delete(key));
    } catch {
      await this.fallback.remove(key);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.withStore("readwrite", (store) => store.clear());
    } catch {
      await this.fallback.clear();
    }
  }

  async keys(): Promise<string[]> {
    try {
      const allKeys = await this.withStore<IDBValidKey[]>("readonly", (store) => store.getAllKeys());
      return allKeys.map(String).filter((key) => key.startsWith(STORAGE_PREFIX));
    } catch {
      return this.fallback.keys();
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }
}
