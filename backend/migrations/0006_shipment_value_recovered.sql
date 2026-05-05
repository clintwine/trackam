-- Add shipment_value column and allow 'recovered' status transition

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS shipment_value BIGINT NOT NULL DEFAULT 0;

-- Drop old status CHECK, add new one that includes 'recovered'
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_status_check;
ALTER TABLE shipments
  ADD CONSTRAINT shipments_status_check
  CHECK (status IN ('pending', 'in_transit', 'delivered', 'failed', 'ghosted', 'recovered'));
