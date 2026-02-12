import type { PartCategory } from "@/store/types/PartTypes";

const uid = () => crypto.randomUUID();

export type CategoryState = { categories: PartCategory[]; partCategoryUsage?: Record<string, number> };

export type CategoryAction =
  | { type: "ADD_CATEGORY"; payload: Omit<PartCategory, "id"> }
  | { type: "UPDATE_CATEGORY"; payload: { id: string; updates: Partial<PartCategory> } }
  | { type: "DELETE_CATEGORY"; payload: { id: string } }
  | { type: "REORDER_CATEGORIES"; payload: { categoryId: string; newSortOrder: number } };

export function categoryReducer(state: CategoryState = { categories: [] }, action: CategoryAction): CategoryState {
  switch (action.type) {
    case "ADD_CATEGORY":
      return { ...state, categories: [...state.categories, { ...action.payload, id: uid() }] };
    case "UPDATE_CATEGORY":
      return { ...state, categories: state.categories.map((c) => (c.id === action.payload.id ? { ...c, ...action.payload.updates } : c)) };
    case "DELETE_CATEGORY": {
      const hasChildren = state.categories.some((c) => c.parentId === action.payload.id);
      const used = (state.partCategoryUsage?.[action.payload.id] ?? 0) > 0;
      if (hasChildren || used) return state;
      return { ...state, categories: state.categories.filter((c) => c.id !== action.payload.id) };
    }
    case "REORDER_CATEGORIES":
      return { ...state, categories: state.categories.map((c) => (c.id === action.payload.categoryId ? { ...c, sortOrder: action.payload.newSortOrder } : c)) };
    default:
      return state;
  }
}

export function selectCategoryTree(categories: PartCategory[]) {
  const byParent = new Map<string | undefined, PartCategory[]>();
  categories.forEach((c) => {
    const group = byParent.get(c.parentId) ?? [];
    group.push(c);
    byParent.set(c.parentId, group);
  });
  return byParent;
}

export function selectCategoryPath(categories: PartCategory[], id: string) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const path: PartCategory[] = [];
  let cursor = byId.get(id);
  while (cursor) {
    path.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return path;
}
