import type { PartCategory } from "@/store/types/PartTypes";

export function CategoryTree({ categories }: { categories: PartCategory[] }) {
  return <ul>{categories.map((c) => <li key={c.id}>{c.name}</li>)}</ul>;
}
