-- OLI Phase 1c: driver-initiated handovers
-- Allows non-platform custodians (e.g. couriers/drivers) to pass custody via OTP-verified sessions

-- handover_tokens.user_id is now optional (drivers have no platform account)
ALTER TABLE handover_tokens ALTER COLUMN user_id DROP NOT NULL;

-- Extra columns on tokens for custodian (non-user) givers
ALTER TABLE handover_tokens ADD COLUMN IF NOT EXISTS custodian_session_id TEXT;
ALTER TABLE handover_tokens ADD COLUMN IF NOT EXISTS giver_name            TEXT;
ALTER TABLE handover_tokens ADD COLUMN IF NOT EXISTS giver_phone           TEXT;

-- Giver identity on events (operators: derived from users; drivers: stored here)
ALTER TABLE handover_events ADD COLUMN IF NOT EXISTS giver_name          TEXT;
ALTER TABLE handover_events ADD COLUMN IF NOT EXISTS giver_phone         TEXT;
ALTER TABLE handover_events ADD COLUMN IF NOT EXISTS custodian_session_id TEXT;

-- Custodian sessions: lightweight OTP-verified sessions for non-platform users
CREATE TABLE IF NOT EXISTS custodian_sessions (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  handover_event_id   TEXT NOT NULL REFERENCES handover_events(id) ON DELETE CASCADE,
  shipment_id         TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  waybill_id          TEXT REFERENCES lite_waybills(id),
  phone               TEXT NOT NULL,
  receiver_name       TEXT NOT NULL,
  receiver_actor_type TEXT NOT NULL,
  -- OTP (cleared after verification)
  otp_hash            TEXT,
  otp_expires_at      TIMESTAMPTZ,
  -- Issued after OTP verification
  session_token       TEXT UNIQUE,
  session_expires_at  TIMESTAMPTZ,
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custodian_sessions_event ON custodian_sessions(handover_event_id);
CREATE INDEX IF NOT EXISTS idx_custodian_sessions_token ON custodian_sessions(session_token)
  WHERE session_token IS NOT NULL;
