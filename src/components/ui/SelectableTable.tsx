import { BulkAction, BulkActionBar } from "@/components/ui/BulkActionBar";

type SelectableTableProps<T extends { id: string }> = {
  data: T[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  bulkActions: BulkAction[];
  renderRow: (item: T) => React.ReactNode;
};

export function SelectableTable<T extends { id: string }>({ data, selectedIds, onSelectionChange, bulkActions, renderRow }: SelectableTableProps<T>) {
  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    onSelectionChange(next);
  };
  const selectAll = () => onSelectionChange(new Set(data.map((d) => d.id)));

  return (
    <div>
      <table className="w-full">
        <thead><tr><th><input type="checkbox" onChange={selectAll} /></th><th>Data</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.id}><td><input type="checkbox" checked={selectedIds.has(d.id)} onChange={() => toggle(d.id)} /></td><td>{renderRow(d)}</td></tr>)}</tbody>
      </table>
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalCount={data.length}
        selectedIds={[...selectedIds]}
        actions={bulkActions}
        onClearSelection={() => onSelectionChange(new Set())}
      />
    </div>
  );
}
