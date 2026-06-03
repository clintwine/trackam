-- Session-bound identity model: capture rider ID once at onboarding,
-- never again at handover time. The founder/admin manually verifies the
-- uploaded ID photo. The legacy `bvn` column is kept for historical data
-- but no longer written to by new code.

ALTER TABLE riders
  ADD COLUMN IF NOT EXISTS govt_id_type TEXT
    CHECK (govt_id_type IN ('nin', 'voters_card', 'passport', 'drivers_license'));

ALTER TABLE riders
  ADD COLUMN IF NOT EXISTS govt_id_number TEXT;

-- govt_id_photo is base64-encoded image data (data URL form: "data:image/png;base64,...").
-- Stored inline as TEXT to keep deployments infra-free. Can be migrated to
-- object storage later via a backfill job — the column type stays TEXT and
-- becomes a URL instead.
ALTER TABLE riders
  ADD COLUMN IF NOT EXISTS govt_id_photo TEXT;

-- Verification state. NULL = pending review. Set timestamps on approval/rejection.
ALTER TABLE riders
  ADD COLUMN IF NOT EXISTS govt_id_verified_at TIMESTAMPTZ;

ALTER TABLE riders
  ADD COLUMN IF NOT EXISTS govt_id_verified_by TEXT
    REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE riders
  ADD COLUMN IF NOT EXISTS govt_id_rejection_reason TEXT;

-- Index for the admin pending-review queue.
CREATE INDEX IF NOT EXISTS idx_riders_govt_id_pending
  ON riders(user_id)
  WHERE govt_id_type IS NOT NULL AND govt_id_verified_at IS NULL;
