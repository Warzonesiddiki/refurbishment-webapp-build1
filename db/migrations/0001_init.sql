-- ALMASFUFA ERP: core schema bootstrap (PostgreSQL)
-- Phase 13 foundational backend/database completion

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tenancy / auth
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trn TEXT,
  currency_code TEXT NOT NULL DEFAULT 'AED',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, email)
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, code)
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY(role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY(user_id, role_id)
);

-- Master data
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trn TEXT,
  contact TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE TABLE lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  lot_number TEXT NOT NULL,
  arrival_date DATE,
  purchase_date DATE,
  total_cost_ex_vat NUMERIC(14,2) DEFAULT 0,
  freight NUMERIC(14,2) DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','verified','grading','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, lot_number)
);

-- Inventory
CREATE TABLE laptops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
  barcode TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  specs TEXT,
  grade TEXT CHECK (grade IN ('A','B','C')),
  status TEXT NOT NULL CHECK (status IN ('pending_verification','pending_grading','in_processing','ready_for_sale','sold')),
  track TEXT CHECK (track IN ('A','B','C','D','E','completed')),
  cost_ex_vat NUMERIC(14,2) DEFAULT 0,
  version_no INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, barcode)
);

CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  specification TEXT,
  condition TEXT CHECK (condition IN ('New','Refurbished','Used')),
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 0,
  unit_cost_ex_vat NUMERIC(14,2) DEFAULT 0,
  location TEXT,
  version_no INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, barcode),
  CHECK (quantity_on_hand >= 0),
  CHECK (quantity_reserved >= 0),
  CHECK (quantity_reserved <= quantity_on_hand)
);

-- WIP
CREATE TABLE wip_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  wip_number TEXT NOT NULL,
  laptop_id UUID NOT NULL REFERENCES laptops(id) ON DELETE RESTRICT,
  track TEXT NOT NULL CHECK (track IN ('A','B','C','D','E')),
  stage TEXT NOT NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  priority TEXT CHECK (priority IN ('High','Normal','Low')),
  status TEXT NOT NULL CHECK (status IN ('active','in_progress','awaiting_parts','completed')),
  parts_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  labor_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  version_no INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, wip_number)
);

CREATE TABLE wip_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  wip_job_id UUID NOT NULL REFERENCES wip_jobs(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_cost_ex_vat NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wip_labor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  wip_job_id UUID NOT NULL REFERENCES wip_jobs(id) ON DELETE CASCADE,
  tech_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  hours NUMERIC(8,2) NOT NULL CHECK (hours > 0),
  hourly_rate NUMERIC(14,2) NOT NULL CHECK (hourly_rate >= 0),
  work_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wip_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  wip_job_id UUID NOT NULL REFERENCES wip_jobs(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  payload JSONB,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  customer TEXT,
  subtotal_ex_vat NUMERIC(14,2) NOT NULL CHECK (subtotal_ex_vat >= 0),
  vat_amount NUMERIC(14,2) NOT NULL CHECK (vat_amount >= 0),
  total_inc_vat NUMERIC(14,2) NOT NULL CHECK (total_inc_vat >= 0),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid','partial','unpaid')),
  payment_method TEXT,
  sold_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, invoice_number)
);

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  laptop_id UUID REFERENCES laptops(id) ON DELETE SET NULL,
  sku TEXT,
  description TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_price_ex_vat NUMERIC(14,2) NOT NULL CHECK (unit_price_ex_vat >= 0),
  unit_cost_ex_vat NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (unit_cost_ex_vat >= 0)
);

CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL,
  reference TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, receipt_number)
);

-- Purchases
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  purchase_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
  subtotal_ex_vat NUMERIC(14,2) NOT NULL CHECK (subtotal_ex_vat >= 0),
  vat_amount NUMERIC(14,2) NOT NULL CHECK (vat_amount >= 0),
  total_inc_vat NUMERIC(14,2) NOT NULL CHECK (total_inc_vat >= 0),
  status TEXT NOT NULL CHECK (status IN ('open','closed')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid','partial','due')),
  method TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, purchase_number)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  payment_number TEXT NOT NULL,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL,
  reference TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, payment_number)
);

-- Finance
CREATE TABLE cash_register_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('opening','cash_in','cash_out','adjustment','closing')),
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  balance NUMERIC(14,2) NOT NULL,
  reason TEXT,
  entry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE owner_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('investment','drawing','profit')),
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  balance NUMERIC(14,2) NOT NULL,
  entry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Observability / integrity
CREATE TABLE movement_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT,
  qty INTEGER,
  note TEXT,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  payload JSONB,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_hash TEXT,
  response_code INTEGER,
  response_body JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, request_key, endpoint)
);

CREATE TABLE sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sequence_type TEXT NOT NULL,
  period_key TEXT NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, sequence_type, period_key)
);

-- Performance indexes
CREATE INDEX idx_laptops_company_status ON laptops(company_id, status);
CREATE INDEX idx_laptops_company_track ON laptops(company_id, track);
CREATE INDEX idx_parts_company_name ON parts(company_id, name);
CREATE INDEX idx_wip_jobs_company_status ON wip_jobs(company_id, status);
CREATE INDEX idx_sales_company_date ON sales(company_id, sold_at DESC);
CREATE INDEX idx_purchases_company_date ON purchases(company_id, purchased_at DESC);
CREATE INDEX idx_movement_company_created ON movement_log(company_id, created_at DESC);
CREATE INDEX idx_audit_company_created ON audit_log(company_id, created_at DESC);
CREATE INDEX idx_idempotency_company_expiry ON idempotency_keys(company_id, expires_at);
