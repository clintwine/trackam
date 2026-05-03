CREATE INDEX IF NOT EXISTS notifications_to_uid_created_at_idx
ON notifications (to_uid, created_at DESC);
