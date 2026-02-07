# Change Log (CL) v2.0

## Phase 10 — Final Polish & State Management
- Added centralized app state store (`src/store/appState.ts`) with:
  - Full data model for all entities (laptops, parts, WIP, sales, purchases, finance, suppliers, lots)
  - Reducer with 20+ action types for CRUD operations
  - Selectors for KPIs, VAT summary, and global search
  - Sequence generators for all barcode/number patterns
  - Initial state seeded from mock data
- Added `StoreProvider` context (`src/context/StoreContext.tsx`) wired into App
- Added `GlobalSearch` component (`src/components/ui/GlobalSearch.tsx`) with:
  - Live search across laptops, parts, suppliers, WIP jobs, lots
  - Debounced search with results dropdown
  - Theme-aware styling (cyber/pro)
  - Navigation to relevant page on result click
- Added `NotificationPanel` component (`src/components/ui/NotificationPanel.tsx`) with:
  - Dropdown panel from header bell icon
  - Alert list with tone-colored indicators
  - Clear individual / clear all functionality
  - Real-time alert count from store
- Added `Modal` component (`src/components/ui/Modal.tsx`) for:
  - Reusable dialog with backdrop, escape key, scroll lock
  - Header with title/badge, scrollable body, footer slot
  - Theme-aware styling
- Updated `Layout.tsx` to use GlobalSearch and NotificationPanel from store
- Updated `Dashboard.tsx` to use KPIs and activity from store state
- Updated `App.tsx` to wrap with StoreProvider
- Build: ✅ SUCCESS (501.51 kB / gzip: 116.31 kB)

## Previous Changes
- v1.7: QuickActions/ActionKeyLegend components, duplicate import fix
- v1.6: Global action feedback provider, integration tests
- v1.5: Reusable UI components, Pro theme CSS
- v1.4: Logging/idempotency hooks wired to critical UI actions
- v1.3: Dual-theme system (cyberpunk + professional)
- v1.2: Core domain models, validation, sequence generators, state machines
- v1.1: Gap analysis, MRR/TM/PCC/RR updates
- v1.0: Initial project setup, all pages, cyberpunk UI
