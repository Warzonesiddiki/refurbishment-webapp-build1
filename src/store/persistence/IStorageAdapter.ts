import { StorageError } from "@/store/persistence/errors";

export interface IStorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  has(key: string): Promise<boolean>;
}

export const STORAGE_PREFIX = "almasfufa:";
export const APP_STATE_KEY = `${STORAGE_PREFIX}app-state`;

export function wrapStorageError(error: unknown, fallbackMessage: string): StorageError {
  if (error instanceof StorageError) return error;
  return new StorageError("UNKNOWN", fallbackMessage, error);
}
