import { APP_STATE_KEY, IStorageAdapter, STORAGE_PREFIX } from "@/store/persistence/IStorageAdapter";
import { StorageQuotaError, StorageUnavailableError } from "@/store/persistence/errors";

type MemoryStore = Record<string, string>;

function isQuotaError(error: unknown) {
  return error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
}

function hasLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export class LocalStorageAdapter implements IStorageAdapter {
  private memoryFallback: MemoryStore = {};

  private get storage(): Storage | null {
    return hasLocalStorage() ? window.localStorage : null;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = this.storage ? this.storage.getItem(key) : this.memoryFallback[key] ?? null;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`[LocalStorageAdapter] parse failed for ${key}`);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const payload = JSON.stringify(value);
    try {
      if (this.storage) {
        this.storage.setItem(key, payload);
      } else {
        this.memoryFallback[key] = payload;
      }
    } catch (error) {
      if (isQuotaError(error)) throw new StorageQuotaError("Failed to persist state: quota exceeded", error);
      if (!this.storage) throw new StorageUnavailableError("LocalStorage unavailable and memory fallback failed", error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    if (this.storage) this.storage.removeItem(key);
    delete this.memoryFallback[key];
  }

  async clear(): Promise<void> {
    if (this.storage) {
      const rm: string[] = [];
      for (let i = 0; i < this.storage.length; i += 1) {
        const key = this.storage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) rm.push(key);
      }
      rm.forEach((k) => this.storage?.removeItem(k));
    }
    this.memoryFallback = {};
  }

  async keys(): Promise<string[]> {
    const localKeys: string[] = [];
    if (this.storage) {
      for (let i = 0; i < this.storage.length; i += 1) {
        const key = this.storage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) localKeys.push(key);
      }
    }
    return [...new Set([...localKeys, ...Object.keys(this.memoryFallback)])];
  }

  async has(key: string): Promise<boolean> {
    if (this.storage?.getItem(key) != null) return true;
    return key in this.memoryFallback;
  }
}

export const DEFAULT_LOCAL_STORAGE_KEY = APP_STATE_KEY;
