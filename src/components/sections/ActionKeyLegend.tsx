import { actionKeys, actionLabels, ActionKey } from "@/data/actionKeys";
import { cn } from "@/utils/cn";

const categories: { title: string; keys: ActionKey[] }[] = [
  { title: "Scanner & Intake", keys: [actionKeys.scan, actionKeys.importLot, actionKeys.verificationComplete, actionKeys.gradingSave] },
  { title: "Inventory", keys: [actionKeys.addLaptop, actionKeys.addPart, actionKeys.export] },
  { title: "Processing", keys: [actionKeys.wipMoveStage, actionKeys.addWipJob] },
  { title: "Sales", keys: [actionKeys.newSale, actionKeys.addSaleItem, actionKeys.completeSale, actionKeys.exportSales, actionKeys.exportReceipts] },
  { title: "Purchases", keys: [actionKeys.savePurchase, actionKeys.savePurchaseDraft, actionKeys.exportPurchases, actionKeys.exportPayments] },
  { title: "Finance", keys: [actionKeys.openDay, actionKeys.closeDay, actionKeys.exportCash, actionKeys.exportVat, actionKeys.exportOwner] },
  { title: "Master & Reports", keys: [actionKeys.exportSuppliers, actionKeys.exportLots, actionKeys.exportReports, actionKeys.backup] },
];

export function ActionKeyLegend() {
  return (
    <div data-component="sections-ActionKeyLegend" data-testid="component-sections-ActionKeyLegend" className="glass-card corner-marks p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-bold tracking-[0.15em] text-cyan-300" style={{ fontFamily: 'Orbitron' }}>
          ACTION KEY LEGEND
        </h3>
        <span className="cyber-chip">Shortcuts</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div key={cat.title} className="glass-card p-4 border border-cyan-500/10">
            <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-500/40 mb-2" style={{ fontFamily: 'Orbitron' }}>{cat.title}</p>
            <div className="flex flex-wrap gap-2">
              {cat.keys.map((key) => (
                <span
                  key={key}
                  data-action={key}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[11px] font-semibold border border-cyan-500/15 text-cyan-100/70",
                    "hover:border-cyan-500/30 hover:text-cyan-100 transition-colors"
                  )}
                  style={{ fontFamily: 'Share Tech Mono' }}
                  title={actionLabels[key]}
                >
                  {actionLabels[key]}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-cyan-500/25" style={{ fontFamily: 'Share Tech Mono' }}>
        All primary buttons carry data-action attributes. Use these keys with the global shortcuts or open Command Palette (Ctrl+K).
      </p>
    </div>
  );
}
