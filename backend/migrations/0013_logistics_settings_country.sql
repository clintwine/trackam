-- Add country setting for ID scheme routing
-- Existing rows default to 'ng' (Nigeria) for backward compatibility
INSERT INTO logistics_settings (user_id, key, value)
SELECT user_id, 'country', 'ng'
FROM (SELECT DISTINCT user_id FROM logistics_settings) u
ON CONFLICT (user_id, key) DO NOTHING;
