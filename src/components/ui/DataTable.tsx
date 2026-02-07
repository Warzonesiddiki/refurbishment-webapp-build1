import { cn } from "@/utils/cn";

type Column<T> = {
  key: string;
  label: string;
  render?: (row: T, idx: number) => React.ReactNode;
  mono?: boolean;
  neon?: string;
  align?: "left" | "center" | "right";
  width?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectedKeys?: string[];
  showSelect?: boolean;
  onSelectToggle?: (key: string) => void;
  onSelectAll?: () => void;
  footer?: React.ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyIcon = "⬡",
  emptyTitle = "NO DATA FOUND",
  emptyMessage = "Adjust filters or add new records.",
  onRowClick,
  selectedKeys = [],
  showSelect,
  onSelectToggle,
  onSelectAll,
  footer,
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={cn("glass-card corner-marks p-12 text-center", className)}>
        <div className="text-5xl mb-4 opacity-20">{emptyIcon}</div>
        <h3
          className="text-lg font-bold tracking-wider text-cyan-200/50 mb-2"
          style={{ fontFamily: "var(--font-heading, Orbitron)" }}
        >
          {emptyTitle}
        </h3>
        <p
          className="text-sm text-cyan-500/25"
          style={{ fontFamily: "var(--font-mono, 'Share Tech Mono')" }}
        >
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("glass-card corner-marks p-0 overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {showSelect && (
                <th className="py-3 px-4 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedKeys.length === data.length && data.length > 0}
                    onChange={onSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn("py-3 px-4", col.align === "right" ? "text-right" : "text-left")}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const key = rowKey(row);
              const isSelected = selectedKeys.includes(key);
              return (
                <tr
                  key={key}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    isSelected && "!bg-cyan-500/5"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {showSelect && (
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSelectToggle?.(key);
                        }}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "py-3 px-4",
                        col.align === "right" && "text-right",
                        col.neon
                      )}
                      style={
                        col.mono
                          ? { fontFamily: "var(--font-mono, 'Share Tech Mono')", fontSize: "12px" }
                          : undefined
                      }
                    >
                      {col.render
                        ? col.render(row, idx)
                        : String((row as Record<string, unknown>)[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {footer && (
        <div className="px-4 py-3 border-t border-cyan-500/10 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
