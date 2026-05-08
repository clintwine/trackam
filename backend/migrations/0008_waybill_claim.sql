-- OLI Phase 1b: waybill-shipment linking, claim tokens, waybill_id on events

-- Claim token: a short physical code printed on the waybill PDF.
-- The sender hands it to the operator with the goods.
-- Single-use — proves physical handoff without any auth.
ALTER TABLE lite_waybills
  ADD COLUMN IF NOT EXISTS claim_token      TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS claimed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;

-- Backfill claim tokens for any waybills created before this migration
UPDATE lite_waybills
SET claim_token = UPPER(SUBSTRING(MD5(id || RANDOM()::TEXT) FROM 1 FOR 8))
WHERE claim_token IS NULL;

-- Link a shipment to the waybill it was registered against
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS waybill_id TEXT REFERENCES lite_waybills(id) ON DELETE SET NULL;

-- Carry waybill_id on every handover event so events are queryable
-- across shipments and operators by the global waybill key
ALTER TABLE handover_events
  ADD COLUMN IF NOT EXISTS waybill_id TEXT REFERENCES lite_waybills(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_waybill_id       ON shipments(waybill_id);
CREATE INDEX IF NOT EXISTS idx_handover_events_waybill_id ON handover_events(waybill_id);
CREATE INDEX IF NOT EXISTS idx_lite_waybills_claim_token  ON lite_waybills(claim_token);
