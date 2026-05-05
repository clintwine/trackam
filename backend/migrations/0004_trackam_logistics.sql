-- Trackam logistics domain: riders, routes, shipments, status log, settings

CREATE TABLE IF NOT EXISTS riders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bike', 'tricycle', 'van', 'truck')),
  city_coverage TEXT NOT NULL,
  base_fee INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  distance_km INTEGER NOT NULL,
  default_rider_id TEXT REFERENCES riders(id) ON DELETE SET NULL,
  default_rider_fee INTEGER NOT NULL DEFAULT 0,
  default_goods_description TEXT,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  route_id TEXT REFERENCES routes(id) ON DELETE SET NULL,
  rider_id TEXT REFERENCES riders(id) ON DELETE SET NULL,
  goods_description TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  distance_km INTEGER NOT NULL,
  rider_fee INTEGER NOT NULL DEFAULT 0,
  fuel_cost INTEGER NOT NULL DEFAULT 0,
  total_cost INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_transit', 'delivered', 'failed', 'ghosted')),
  risk_score TEXT NOT NULL DEFAULT 'low'
    CHECK (risk_score IN ('low', 'medium', 'high')),
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  last_status_update_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delay_flag BOOLEAN NOT NULL DEFAULT FALSE,
  ghosting_flag BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipment_status_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  note TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logistics_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, key)
);

-- Seed default logistics settings for any existing users
INSERT INTO logistics_settings (user_id, key, value)
SELECT id, 'fuel_price_per_litre', '950'
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM logistics_settings ls
  WHERE ls.user_id = users.id AND ls.key = 'fuel_price_per_litre'
);

INSERT INTO logistics_settings (user_id, key, value)
SELECT id, 'fuel_efficiency_multiplier', '0.12'
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM logistics_settings ls
  WHERE ls.user_id = users.id AND ls.key = 'fuel_efficiency_multiplier'
);

INSERT INTO logistics_settings (user_id, key, value)
SELECT id, 'ghost_threshold_hours', '48'
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM logistics_settings ls
  WHERE ls.user_id = users.id AND ls.key = 'ghost_threshold_hours'
);

CREATE INDEX IF NOT EXISTS idx_riders_user_id ON riders(user_id);
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON routes(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_rider_id ON shipments(rider_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipment_status_log_shipment_id ON shipment_status_log(shipment_id);
CREATE INDEX IF NOT EXISTS idx_logistics_settings_user_id ON logistics_settings(user_id);
