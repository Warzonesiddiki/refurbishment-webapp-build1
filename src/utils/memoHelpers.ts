import { memo } from "react";

export function shallowEqual<T extends Record<string, unknown>>(a: T, b: T) {
  if (a === b) return true;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => Object.is(a[k], b[k]));
}

export function byIdAndUpdatedAt<T extends { id: string; updatedAt?: string }>(prev: { item: T }, next: { item: T }) {
  return prev.item.id === next.item.id && prev.item.updatedAt === next.item.updatedAt;
}

export function withMemo<P>(component: React.ComponentType<P>, areEqual?: (prev: Readonly<P>, next: Readonly<P>) => boolean) {
  return memo(component, areEqual);
}
