-- BVN: rename column so plaintext BVN is never stored
ALTER TABLE handover_events RENAME COLUMN receiver_bvn TO receiver_bvn_hash;

-- Dispute status: add 'disputed' to the set of valid shipment statuses
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_status_check;
ALTER TABLE shipments ADD CONSTRAINT shipments_status_check
  CHECK (status IN (
    'pending', 'in_transit', 'delivered', 'failed',
    'ghosted', 'handed_over', 'disputed'
  ));

-- Phone verifications: lightweight OTP table for sender identity at waybill creation
CREATE TABLE IF NOT EXISTS phone_verifications (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone            TEXT        NOT NULL,
  otp_hash         TEXT,
  otp_expires_at   TIMESTAMPTZ,
  verified_at      TIMESTAMPTZ,
  token            TEXT        UNIQUE,
  token_expires_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications (phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_token ON phone_verifications (token);
