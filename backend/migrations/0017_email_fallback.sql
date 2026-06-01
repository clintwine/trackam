-- Add email columns for OTP / link delivery fallback when SMS is unavailable.
-- Nullable for backwards compatibility — frontend forms enforce required on
-- new entries; legacy rows simply have no email and cannot receive fallback.

-- Riders — used by the handover injector to pass expectedReceiverEmail to OLI
-- Switch so a rider can receive their handover OTP / custody link via email
-- when SMS to their phone fails.
ALTER TABLE riders ADD COLUMN email TEXT;

-- Shipments — recipient email (final delivery contact)
ALTER TABLE shipments ADD COLUMN recipient_email TEXT;
