export type NavChild = { id: string; label: string; section?: string };
export type NavItem = { id: string; label: string; icon: string; children?: NavChild[] };

export const navigation: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "scanner", label: "Scanner", icon: "📱" },
  {
    id: "inventory",
    label: "Inventory",
    icon: "📦",
    children: [
      { id: "inventory-laptops", label: "Laptops" },
      { id: "inventory-parts", label: "Parts" },
    ],
  },
  {
    id: "receiving",
    label: "Receiving",
    icon: "📥",
    children: [
      { id: "receiving-import", label: "Import Lot" },
      { id: "receiving-verification", label: "Verification" },
      { id: "receiving-grading", label: "Grading" },
    ],
  },
  {
    id: "processing",
    label: "Processing",
    icon: "⚙️",
    children: [
      { id: "processing-tracks", label: "Tracks A-E" },
      { id: "processing-wip", label: "WIP Jobs" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: "💰",
    children: [
      { id: "sales-new", label: "New Sale" },
      { id: "sales-all", label: "All Sales" },
      { id: "sales-receipts", label: "Receipts" },
    ],
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: "🛒",
    children: [
      { id: "purchases-new", label: "New Purchase" },
      { id: "purchases-all", label: "All Purchases" },
      { id: "purchases-payments", label: "Payments" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: "🏦",
    children: [
      { id: "finance-cash", label: "Cash Register" },
      { id: "finance-owner", label: "Owner Ledger" },
      { id: "finance-vat", label: "VAT Report" },
    ],
  },
  {
    id: "master",
    label: "Master Data",
    icon: "📋",
    children: [
      { id: "master-suppliers", label: "Suppliers" },
      { id: "master-lots", label: "Lots" },
    ],
  },
  { id: "reports", label: "Reports", icon: "📈" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export const kpiRows = [
  [
    { label: "Total Laptops", value: 127, trend: "+12" },
    { label: "In Processing", value: 43, trend: "+5" },
    { label: "Ready for Sale", value: 68, trend: "+8" },
    { label: "Today's Sales", value: "AED 2,450", trend: "+15%" },
  ],
  [
    { label: "Pending Verification", value: 12, trend: "-3" },
    { label: "Pending Grading", value: 8, trend: "-2" },
    { label: "Low Stock Parts", value: 5, trend: "+1" },
    { label: "This Month Profit", value: "AED 15,200", trend: "+22%" },
  ],
];

export const trackSummary = [
  { name: "Track A", laptops: 12, color: "bg-blue-500" },
  { name: "Track B", laptops: 8, color: "bg-green-500" },
  { name: "Track C", laptops: 15, color: "bg-yellow-500" },
  { name: "Track D", laptops: 5, color: "bg-purple-500" },
  { name: "Track E", laptops: 3, color: "bg-red-500" },
];

export const activityFeed = [
  { action: "Laptop ALM-LP-20240115-0023 graded as Grade A", time: "2 min ago" },
  { action: "Part ALM-PT-20240114-0089 added to WIP job", time: "15 min ago" },
  { action: "Sale completed for AED 1,200 (Invoice ALM-INV-202401-0045)", time: "1 hour ago" },
  { action: "Lot ALM-LOT-202401-03 verification completed", time: "2 hours ago" },
];

export const alertList = [
  {
    id: "low-stock",
    title: "Low Stock Alert",
    description: "Battery packs below reorder level (3 units)",
    tone: "red",
  },
  {
    id: "pending-verification",
    title: "Pending Verification",
    description: "Lot ALM-LOT-202401-04 needs verification",
    tone: "yellow",
  },
  {
    id: "backup-required",
    title: "Backup Required",
    description: "Last backup was 2 days ago",
    tone: "blue",
  },
];

export const laptopTable = [
  {
    barcode: "ALM-LP-20240115-0023",
    brand: "Dell",
    model: "Latitude 5420",
    specs: "i7/16GB/512GB",
    grade: "A",
    status: "Ready for Sale",
    track: "Completed",
    cost: 850,
    date: "Jan 15, 2024",
  },
  {
    barcode: "ALM-LP-20240115-0024",
    brand: "HP",
    model: "EliteBook 840",
    specs: "i5/8GB/256GB",
    grade: "B",
    status: "In Processing",
    track: "Track A",
    cost: 620,
    date: "Jan 16, 2024",
  },
  {
    barcode: "ALM-LP-20240115-0025",
    brand: "Lenovo",
    model: "ThinkPad T14",
    specs: "i7/16GB/1TB",
    grade: "A",
    status: "Ready for Sale",
    track: "Completed",
    cost: 950,
    date: "Jan 17, 2024",
  },
  {
    barcode: "ALM-LP-20240115-0026",
    brand: "Apple",
    model: "MacBook Pro 13",
    specs: "M1/8GB/256GB",
    grade: "C",
    status: "Pending Grading",
    track: "-",
    cost: 780,
    date: "Jan 18, 2024",
  },
];

export const partTable = [
  {
    barcode: "ALM-PT-20240114-0089",
    name: "Battery Pack",
    category: "Power",
    spec: "6-cell Li-ion",
    condition: "New",
    onHand: 12,
    available: 10,
    reorder: 5,
    cost: 45,
    location: "Shelf A3",
  },
  {
    barcode: "ALM-PT-20240114-0090",
    name: "RAM Module",
    category: "Memory",
    spec: "16GB DDR4",
    condition: "Refurbished",
    onHand: 8,
    available: 6,
    reorder: 5,
    cost: 32,
    location: "Shelf B1",
  },
  {
    barcode: "ALM-PT-20240114-0091",
    name: "SSD Drive",
    category: "Storage",
    spec: "512GB NVMe",
    condition: "New",
    onHand: 15,
    available: 15,
    reorder: 5,
    cost: 68,
    location: "Shelf C2",
  },
  {
    barcode: "ALM-PT-20240114-0092",
    name: "Keyboard",
    category: "Input",
    spec: "US Layout",
    condition: "Refurbished",
    onHand: 3,
    available: 2,
    reorder: 5,
    cost: 28,
    location: "Shelf D4",
  },
];

export const processingTracks = {
  trackA: ["Queue", "Cleaning", "Windows Install", "QC", "Packing"],
  trackB: ["Queue", "Disassembly", "Paint Queue", "Painting", "Drying", "Reassembly", "To Testing"],
  trackC: ["Queue", "Diagnosis", "Awaiting Parts", "Repair", "Repair Complete", "To Testing"],
  trackD: ["L1 Queue", "L1 Testing", "L1 Failed", "L2 Queue", "L2 Testing", "L2 Failed", "Passed"],
  trackE: ["Queue", "Disassembly/Harvest", "Parts Logged", "Complete/Disposed"],
};

export const settingsDefaults = {
  currency: "AED",
  vatRate: 5,
  laborRate: 50,
  reorderLevel: 5,
  sequences: {
    laptop: "ALM-LP-YYYYMMDD-NNNN",
    part: "ALM-PT-YYYYMMDD-NNNN",
    lot: "ALM-LOT-YYYYMM-NN",
    wip: "ALM-WIP-YYYYMMDD-NNNN",
    invoice: "ALM-INV-YYYYMM-NNNN",
    purchase: "ALM-PO-YYYYMM-NNNN",
    receipt: "ALM-RC-YYYYMM-NNNN",
    payment: "ALM-PAY-YYYYMM-NNNN",
  },
};
