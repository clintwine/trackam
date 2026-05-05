-- Add recipient contact fields to shipments for delivery accountability
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS recipient_phone TEXT;

-- Add risk_score_breakdown so we can explain the score to the user
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS risk_score_points INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_score_reasons TEXT[] NOT NULL DEFAULT '{}';
