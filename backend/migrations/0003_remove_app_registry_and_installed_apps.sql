ALTER TABLE users
DROP COLUMN IF EXISTS installed_apps;

DROP TABLE IF EXISTS app_registry;
