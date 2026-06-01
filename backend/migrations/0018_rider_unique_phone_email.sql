-- Each operator's rider roster must have unique phone (and email when set).
-- Per-operator scope (user_id) so different operators can have riders with
-- the same phone — only collisions within one operator's roster are blocked.
--
-- Partial unique on email so historical rows with NULL email don't collide.

CREATE UNIQUE INDEX IF NOT EXISTS uniq_riders_user_phone
  ON riders (user_id, phone)
  WHERE is_active = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_riders_user_email
  ON riders (user_id, lower(email))
  WHERE is_active = TRUE AND email IS NOT NULL;
