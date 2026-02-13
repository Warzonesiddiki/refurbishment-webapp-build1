-- TAHIR ERP: data-integrity and concurrency helper functions

-- Keep updated_at fresh for mutable tables.
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_touch_updated_at BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_users_touch_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_suppliers_touch_updated_at BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_lots_touch_updated_at BEFORE UPDATE ON lots
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_laptops_touch_updated_at BEFORE UPDATE ON laptops
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_parts_touch_updated_at BEFORE UPDATE ON parts
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_wip_jobs_touch_updated_at BEFORE UPDATE ON wip_jobs
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_sales_touch_updated_at BEFORE UPDATE ON sales
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_purchases_touch_updated_at BEFORE UPDATE ON purchases
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Atomic sequence generation per (company, type, period).
CREATE OR REPLACE FUNCTION next_sequence_value(
  p_company_id UUID,
  p_sequence_type TEXT,
  p_period_key TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_value INTEGER;
BEGIN
  INSERT INTO sequences (company_id, sequence_type, period_key, current_value)
  VALUES (p_company_id, p_sequence_type, p_period_key, 1)
  ON CONFLICT (company_id, sequence_type, period_key)
  DO UPDATE SET
    current_value = sequences.current_value + 1,
    updated_at = NOW()
  RETURNING current_value INTO v_value;

  RETURN v_value;
END;
$$ LANGUAGE plpgsql;

-- Reserve part quantity with row-locking and invariant enforcement.
CREATE OR REPLACE FUNCTION reserve_part_stock(
  p_part_id UUID,
  p_company_id UUID,
  p_qty INTEGER
) RETURNS TABLE(quantity_on_hand INTEGER, quantity_reserved INTEGER, quantity_available INTEGER) AS $$
DECLARE
  v_on_hand INTEGER;
  v_reserved INTEGER;
BEGIN
  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'reserve quantity must be > 0';
  END IF;

  SELECT parts.quantity_on_hand, parts.quantity_reserved
  INTO v_on_hand, v_reserved
  FROM parts
  WHERE parts.id = p_part_id
    AND parts.company_id = p_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'part not found or not in tenant scope';
  END IF;

  IF (v_on_hand - v_reserved) < p_qty THEN
    RAISE EXCEPTION 'insufficient available stock';
  END IF;

  UPDATE parts
  SET quantity_reserved = quantity_reserved + p_qty,
      version_no = version_no + 1,
      updated_at = NOW()
  WHERE id = p_part_id
    AND company_id = p_company_id;

  RETURN QUERY
  SELECT p.quantity_on_hand,
         p.quantity_reserved,
         (p.quantity_on_hand - p.quantity_reserved) AS quantity_available
  FROM parts p
  WHERE p.id = p_part_id
    AND p.company_id = p_company_id;
END;
$$ LANGUAGE plpgsql;

-- Consume reserved stock when work is completed.
CREATE OR REPLACE FUNCTION consume_reserved_part_stock(
  p_part_id UUID,
  p_company_id UUID,
  p_qty INTEGER
) RETURNS TABLE(quantity_on_hand INTEGER, quantity_reserved INTEGER, quantity_available INTEGER) AS $$
DECLARE
  v_reserved INTEGER;
BEGIN
  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'consume quantity must be > 0';
  END IF;

  SELECT parts.quantity_reserved
  INTO v_reserved
  FROM parts
  WHERE parts.id = p_part_id
    AND parts.company_id = p_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'part not found or not in tenant scope';
  END IF;

  IF v_reserved < p_qty THEN
    RAISE EXCEPTION 'insufficient reserved stock';
  END IF;

  UPDATE parts
  SET quantity_on_hand = quantity_on_hand - p_qty,
      quantity_reserved = quantity_reserved - p_qty,
      version_no = version_no + 1,
      updated_at = NOW()
  WHERE id = p_part_id
    AND company_id = p_company_id;

  RETURN QUERY
  SELECT p.quantity_on_hand,
         p.quantity_reserved,
         (p.quantity_on_hand - p.quantity_reserved) AS quantity_available
  FROM parts p
  WHERE p.id = p_part_id
    AND p.company_id = p_company_id;
END;
$$ LANGUAGE plpgsql;

-- Release reserved stock back to available pool.
CREATE OR REPLACE FUNCTION release_part_stock(
  p_part_id UUID,
  p_company_id UUID,
  p_qty INTEGER
) RETURNS TABLE(quantity_on_hand INTEGER, quantity_reserved INTEGER, quantity_available INTEGER) AS $$
DECLARE
  v_reserved INTEGER;
BEGIN
  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'release quantity must be > 0';
  END IF;

  SELECT parts.quantity_reserved
  INTO v_reserved
  FROM parts
  WHERE parts.id = p_part_id
    AND parts.company_id = p_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'part not found or not in tenant scope';
  END IF;

  IF v_reserved < p_qty THEN
    RAISE EXCEPTION 'cannot release more than reserved';
  END IF;

  UPDATE parts
  SET quantity_reserved = quantity_reserved - p_qty,
      version_no = version_no + 1,
      updated_at = NOW()
  WHERE id = p_part_id
    AND company_id = p_company_id;

  RETURN QUERY
  SELECT p.quantity_on_hand,
         p.quantity_reserved,
         (p.quantity_on_hand - p.quantity_reserved) AS quantity_available
  FROM parts p
  WHERE p.id = p_part_id
    AND p.company_id = p_company_id;
END;
$$ LANGUAGE plpgsql;

-- Server-side idempotency claim helper.
CREATE OR REPLACE FUNCTION claim_idempotency_key(
  p_company_id UUID,
  p_request_key TEXT,
  p_endpoint TEXT,
  p_request_hash TEXT,
  p_ttl_seconds INTEGER DEFAULT 86400
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO idempotency_keys (
    company_id,
    request_key,
    endpoint,
    request_hash,
    expires_at
  ) VALUES (
    p_company_id,
    p_request_key,
    p_endpoint,
    p_request_hash,
    NOW() + make_interval(secs => p_ttl_seconds)
  );

  RETURN TRUE;
EXCEPTION WHEN unique_violation THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Optional maintenance helper.
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys() RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM idempotency_keys
  WHERE expires_at < NOW();

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;
