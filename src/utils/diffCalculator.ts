import type { DiffResult, EntitySnapshot } from "@/store/types/SnapshotTypes";

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

export function computeDiff(oldObj: unknown, newObj: unknown, basePath = ""): DiffResult[] {
  if (!isObject(oldObj) || !isObject(newObj)) {
    const path = basePath || "value";
    const type = oldObj === undefined ? "ADDED" : newObj === undefined ? "REMOVED" : oldObj === newObj ? "UNCHANGED" : "CHANGED";
    return [{ field: path.split(".").pop() ?? path, path, type, oldValue: oldObj, newValue: newObj }];
  }

  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  const diff: DiffResult[] = [];
  for (const key of keys) {
    const path = basePath ? `${basePath}.${key}` : key;
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    if (Array.isArray(oldVal) || Array.isArray(newVal)) {
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diff.push({ field: key, path, type: oldVal === undefined ? "ADDED" : newVal === undefined ? "REMOVED" : "CHANGED", oldValue: oldVal, newValue: newVal });
      } else {
        diff.push({ field: key, path, type: "UNCHANGED", oldValue: oldVal, newValue: newVal });
      }
      continue;
    }
    if (isObject(oldVal) || isObject(newVal)) diff.push(...computeDiff(oldVal ?? {}, newVal ?? {}, path));
    else {
      const type = oldVal === undefined ? "ADDED" : newVal === undefined ? "REMOVED" : oldVal === newVal ? "UNCHANGED" : "CHANGED";
      diff.push({ field: key, path, type, oldValue: oldVal, newValue: newVal });
    }
  }
  return diff;
}

export function computeEntityDiff(oldSnapshot: EntitySnapshot, newSnapshot: EntitySnapshot) {
  return computeDiff(oldSnapshot.data, newSnapshot.data);
}

export type FormattedDiff = {
  field: string;
  label: string;
  type: DiffResult["type"];
  oldValueDisplay: string;
  newValueDisplay: string;
  isSignificant: boolean;
};

export function formatDiffForDisplay(diff: DiffResult[]): FormattedDiff[] {
  return diff.map((d) => ({
    field: d.field,
    label: d.path.replace(/\./g, " › "),
    type: d.type,
    oldValueDisplay: JSON.stringify(d.oldValue),
    newValueDisplay: JSON.stringify(d.newValue),
    isSignificant: d.type !== "UNCHANGED",
  }));
}

export function groupDiffsBySection(diffs: DiffResult[], sectionMap: Record<string, string[]>) {
  const grouped: Record<string, DiffResult[]> = {};
  Object.keys(sectionMap).forEach((k) => {
    grouped[k] = diffs.filter((d) => sectionMap[k].some((prefix) => d.path.startsWith(prefix)));
  });
  return grouped;
}

export function computeArrayDiff(oldArr: unknown[], newArr: unknown[], keyField: string) {
  const oldMap = new Map(oldArr.map((x) => [String((x as Record<string, unknown>)[keyField]), x]));
  const newMap = new Map(newArr.map((x) => [String((x as Record<string, unknown>)[keyField]), x]));
  const added = [...newMap.keys()].filter((k) => !oldMap.has(k)).map((k) => newMap.get(k));
  const removed = [...oldMap.keys()].filter((k) => !newMap.has(k)).map((k) => oldMap.get(k));
  const modified = [...newMap.keys()]
    .filter((k) => oldMap.has(k) && JSON.stringify(oldMap.get(k)) !== JSON.stringify(newMap.get(k)))
    .map((k) => ({ before: oldMap.get(k), after: newMap.get(k) }));
  return { added, removed, modified };
}
