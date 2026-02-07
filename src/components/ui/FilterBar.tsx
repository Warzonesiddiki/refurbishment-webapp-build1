import { cn } from "@/utils/cn";

type FilterBarProps = {
  children: React.ReactNode;
  onClear?: () => void;
  className?: string;
};

export function FilterBar({ children, onClear, className }: FilterBarProps) {
  return (
    <div className={cn("glass-card p-4", className)}>
      <div className="flex flex-wrap gap-3 items-center">
        {children}
        {onClear && (
          <button
            className="btn-ghost text-xs"
            onClick={onClear}
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}

export function SearchInput({
  placeholder = "Search...",
  value,
  onChange,
  className,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative flex-1 min-w-[200px]", className)}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/30"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
        style={{ fontFamily: "var(--font-mono, 'Share Tech Mono')", fontSize: "12px" }}
      />
    </div>
  );
}

export function SelectFilter({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (v: string) => void;
  className?: string;
}) {
  return (
    <select
      className={cn("px-3 py-2 rounded-lg text-sm min-w-[130px]", className)}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
