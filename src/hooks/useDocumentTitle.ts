import { useEffect } from "react";

export function useDocumentTitle(page: string) {
  useEffect(() => {
    const label = page.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    document.title = `Tahir ERP • ${label}`;
  }, [page]);
}
