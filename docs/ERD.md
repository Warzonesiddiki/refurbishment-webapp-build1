# ERD v1.0

Core entities and relationships (PostgreSQL):

- companies(id)
- users(id, company_id) -> companies
- roles(id), permissions(id), role_permissions(role_id, permission_id), user_roles(user_id, role_id)
- suppliers(id, company_id)
- lots(id, supplier_id, company_id)
- laptops(id, lot_id, company_id)
- parts(id, company_id)
- wip_jobs(id, laptop_id, company_id)
- wip_parts(id, wip_job_id, part_id)
- wip_labor(id, wip_job_id, user_id)
- wip_history(id, wip_job_id)
- sales(id, company_id)
- sale_items(id, sale_id, laptop_id)
- receipts(id, sale_id)
- purchases(id, company_id)
- payments(id, purchase_id)
- cash_register_entries(id, company_id)
- owner_ledger_entries(id, company_id)
- movement_log(id, company_id)
- audit_log(id, company_id)
- idempotency_keys(id, company_id)
- sequences(id, company_id)

Constraints:
- Unique barcodes for laptops/parts
- Unique numbers for lots, WIP, invoices, purchases, receipts, payments
- Stock invariants enforced by constraints
