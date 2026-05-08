-- OLI Phase 1d: close handover network gaps

-- receiver_bvn is not always available (consumer deliveries, pickup events)
ALTER TABLE handover_events ALTER COLUMN receiver_bvn DROP NOT NULL;

-- Track when a custodian session is deliberately closed (e.g. after final delivery)
ALTER TABLE custodian_sessions ADD COLUMN IF NOT EXISTS invalidated_at TIMESTAMPTZ;
