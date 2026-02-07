// ═══════════════════════════════════════════
// Global Search — searches across all entities
// ═══════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/utils/cn";

type Props = {
  theme: "cyber" | "pro";
  onNavigate: (page: string) => void;
};

const typeIcons: Record<string, string> = {
  laptop: "💻", part: "🔧", supplier: "🏢", lot: "📦", sale: "💰", wip: "⚙",
};

const typePages: Record<string, string> = {
  laptop: "inventory-laptops", part: "inventory-parts", supplier: "master-suppliers",
  lot: "master-lots", sale: "sales-all", wip: "processing-wip",
};

export function GlobalSearch({ theme, onNavigate }: Props) {
  const { state, dispatch } = useStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: "GLOBAL_SEARCH", query });
    }, 200);
    return () => clearTimeout(timer);
  }, [query, dispatch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const results = state.searchResults;

  return (
    <div className="relative hidden md:block" ref={ref}>
      <svg
        className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", theme === "pro" ? "text-slate-400" : "text-cyan-500/30")}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        placeholder="Search barcode / serial / name..."
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className={cn(
          "w-72 pl-9 pr-3 py-2 rounded-xl text-sm",
          theme === "pro" ? "bg-white border border-slate-200 shadow-sm" : ""
        )}
        style={{ fontFamily: theme === "pro" ? "Inter" : "Share Tech Mono", fontSize: "12px" }}
      />

      {/* Results dropdown */}
      {open && query.length > 0 && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-2 z-50 rounded-xl overflow-hidden max-h-80 overflow-y-auto",
          theme === "pro"
            ? "bg-white border border-slate-200 shadow-xl"
            : "glass-card border border-cyan-500/20"
        )}>
          {results.length === 0 ? (
            <div className="p-4 text-center">
              <p className={cn("text-sm", theme === "pro" ? "text-slate-400" : "text-cyan-500/30")}
                style={{ fontFamily: theme === "pro" ? "Inter" : "Share Tech Mono" }}>
                No results for "{query}"
              </p>
            </div>
          ) : (
            <div>
              <div className={cn("px-3 py-2 text-[10px] uppercase tracking-wider",
                theme === "pro" ? "text-slate-400 bg-slate-50" : "text-cyan-500/30 bg-cyan-500/5"
              )} style={{ fontFamily: theme === "pro" ? "Inter" : "Orbitron" }}>
                {results.length} results
              </div>
              {results.map(r => (
                <button
                  key={r.id}
                  className={cn(
                    "w-full text-left px-3 py-2.5 flex items-center gap-3 transition-all",
                    theme === "pro"
                      ? "hover:bg-slate-50 border-b border-slate-100"
                      : "hover:bg-cyan-500/5 border-b border-cyan-500/5"
                  )}
                  onClick={() => {
                    onNavigate(typePages[r.type] || "dashboard");
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span className="text-lg">{typeIcons[r.type] || "◈"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold truncate",
                      theme === "pro" ? "text-slate-800" : "text-cyan-100/80"
                    )}>
                      {r.label}
                    </p>
                    {r.barcode && (
                      <p className={cn("text-[11px]", theme === "pro" ? "text-slate-400" : "text-cyan-400/40")}
                        style={{ fontFamily: theme === "pro" ? "Roboto Mono" : "Share Tech Mono" }}>
                        {r.barcode}
                      </p>
                    )}
                  </div>
                  <span className={cn("text-[10px] uppercase px-2 py-0.5 rounded",
                    theme === "pro"
                      ? "bg-slate-100 text-slate-500"
                      : "bg-cyan-500/10 text-cyan-500/40"
                  )} style={{ fontFamily: theme === "pro" ? "Inter" : "Share Tech Mono" }}>
                    {r.type}
                  </span>
                  {r.status && (
                    <span className={cn("text-[10px] px-2 py-0.5 rounded",
                      theme === "pro" ? "bg-blue-50 text-blue-600" : "cyber-chip"
                    )}>
                      {r.status}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
