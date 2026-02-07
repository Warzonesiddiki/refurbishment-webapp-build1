import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { applyThemeClass, getInitialTheme } from "@/utils/theme";
import { DashboardSection } from "@/components/sections/Dashboard";
import { ScannerPage } from "@/components/pages/ScannerPage";
import { InventoryLaptops } from "@/components/pages/InventoryLaptops";
import { InventoryParts } from "@/components/pages/InventoryParts";
import { ReceivingImportLot } from "@/components/pages/ReceivingImportLot";
import { ReceivingVerification } from "@/components/pages/ReceivingVerification";
import { ReceivingGrading } from "@/components/pages/ReceivingGrading";
import { ProcessingTracks } from "@/components/pages/ProcessingTracks";
import { WipJobs } from "@/components/pages/WipJobs";
import { SalesNew } from "@/components/pages/SalesNew";
import { SalesAll } from "@/components/pages/SalesAll";
import { SalesReceipts } from "@/components/pages/SalesReceipts";
import { PurchasesNew } from "@/components/pages/PurchasesNew";
import { PurchasesAll } from "@/components/pages/PurchasesAll";
import { PurchasesPayments } from "@/components/pages/PurchasesPayments";
import { FinanceCash } from "@/components/pages/FinanceCash";
import { FinanceOwner } from "@/components/pages/FinanceOwner";
import { FinanceVat } from "@/components/pages/FinanceVat";
import { MasterSuppliers } from "@/components/pages/MasterSuppliers";
import { MasterLots } from "@/components/pages/MasterLots";
import { ReportsPage } from "@/components/pages/ReportsPage";
import { SettingsPage } from "@/components/pages/SettingsPage";
import { ActionFeedbackProvider } from "@/context/ActionFeedbackContext";
import { StoreProvider } from "@/context/StoreContext";
import { ToastHost } from "@/components/ui/ToastHost";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="glass-card corner-marks p-8 text-center">
      <div className="text-4xl mb-4 opacity-20 neon-text-cyan">◈</div>
      <h2 className="text-lg font-bold tracking-wider text-cyan-200/50 mb-2" style={{ fontFamily: "Orbitron" }}>
        {title.toUpperCase()}
      </h2>
      <p className="text-sm text-cyan-500/25" style={{ fontFamily: "Share Tech Mono" }}>
        Module under construction. Core layout and navigation are ready.
      </p>
    </div>
  );
}

export function App() {
  const [activePage, setActivePage] = useState<string>("dashboard");
  const [theme, setTheme] = useState<"cyber" | "pro">(() => getInitialTheme());

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":        return <DashboardSection onNavigate={setActivePage} />;
      case "scanner":          return <ScannerPage onNavigate={setActivePage} />;
      case "inventory-laptops": return <InventoryLaptops />;
      case "inventory-parts":  return <InventoryParts />;
      case "receiving-import": return <ReceivingImportLot />;
      case "receiving-verification": return <ReceivingVerification />;
      case "receiving-grading": return <ReceivingGrading />;
      case "processing-tracks": return <ProcessingTracks />;
      case "processing-wip":   return <WipJobs />;
      case "sales-new":        return <SalesNew />;
      case "sales-all":        return <SalesAll />;
      case "sales-receipts":   return <SalesReceipts />;
      case "purchases-new":    return <PurchasesNew />;
      case "purchases-all":    return <PurchasesAll />;
      case "purchases-payments": return <PurchasesPayments />;
      case "finance-cash":     return <FinanceCash />;
      case "finance-owner":    return <FinanceOwner />;
      case "finance-vat":      return <FinanceVat />;
      case "master-suppliers": return <MasterSuppliers />;
      case "master-lots":      return <MasterLots />;
      case "reports":          return <ReportsPage />;
      case "settings":         return <SettingsPage />;
      default:                 return <Placeholder title={activePage.replace(/-/g, " ")} />;
    }
  };

  return (
    <StoreProvider>
      <ActionFeedbackProvider>
        <Layout
          activePage={activePage}
          onNavigate={setActivePage}
          onToggleTheme={() => setTheme((t: "cyber" | "pro") => (t === "cyber" ? "pro" : "cyber"))}
          theme={theme}
        >
          {renderPage()}
        </Layout>
        <ToastHost />
      </ActionFeedbackProvider>
    </StoreProvider>
  );
}
