-- ALMASFUFA ERP: multi-tenant row-level security baseline

-- The app should set this at transaction/session start:
--   SET app.current_company_id = '<company-uuid>';

CREATE OR REPLACE FUNCTION app_current_company_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_company_id', true), '')::uuid
$$ LANGUAGE sql STABLE;

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE laptops ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wip_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wip_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wip_labor ENABLE ROW LEVEL SECURITY;
ALTER TABLE wip_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY companies_tenant_policy ON companies
  USING (id = app_current_company_id())
  WITH CHECK (id = app_current_company_id());

-- Generic helper policy pattern for company-scoped tables.
CREATE POLICY users_tenant_policy ON users
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY roles_tenant_policy ON roles
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY suppliers_tenant_policy ON suppliers
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY lots_tenant_policy ON lots
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY laptops_tenant_policy ON laptops
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY parts_tenant_policy ON parts
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY wip_jobs_tenant_policy ON wip_jobs
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY wip_parts_tenant_policy ON wip_parts
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY wip_labor_tenant_policy ON wip_labor
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY wip_history_tenant_policy ON wip_history
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY sales_tenant_policy ON sales
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY sale_items_tenant_policy ON sale_items
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY receipts_tenant_policy ON receipts
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY purchases_tenant_policy ON purchases
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY payments_tenant_policy ON payments
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY cash_register_entries_tenant_policy ON cash_register_entries
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY owner_ledger_entries_tenant_policy ON owner_ledger_entries
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY movement_log_tenant_policy ON movement_log
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY audit_log_tenant_policy ON audit_log
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY idempotency_keys_tenant_policy ON idempotency_keys
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
CREATE POLICY sequences_tenant_policy ON sequences
  USING (company_id = app_current_company_id())
  WITH CHECK (company_id = app_current_company_id());
