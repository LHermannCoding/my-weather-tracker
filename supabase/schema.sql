-- Weather Dashboard — Supabase schema
-- Run this in the Supabase SQL editor to create tables with RLS

-- ============================================================
-- TABLES
-- ============================================================

-- cities: master list of trackable cities
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL,
  latitude real NOT NULL,
  longitude real NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- weather_data: current conditions per city (worker upserts)
CREATE TABLE IF NOT EXISTS weather_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  temperature real,
  feels_like real,
  humidity integer,
  wind_speed real,
  wind_direction integer,
  weather_code integer,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(city_id)
);

-- user_favorites: which cities each user is tracking
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, city_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- cities: publicly readable
CREATE POLICY "Anyone can read cities"
  ON cities FOR SELECT
  TO anon, authenticated
  USING (true);

-- weather_data: publicly readable
CREATE POLICY "Anyone can read weather data"
  ON weather_data FOR SELECT
  TO anon, authenticated
  USING (true);

-- user_favorites: users can only access their own
CREATE POLICY "Users can read own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can add own favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can remove own favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.jwt()->>'sub' = user_id);

-- ============================================================
-- REALTIME
-- ============================================================

-- Enable Realtime on weather_data so the frontend gets live updates
ALTER PUBLICATION supabase_realtime ADD TABLE weather_data;

-- ============================================================
-- SEED DATA: popular cities
-- ============================================================

INSERT INTO cities (name, country, latitude, longitude) VALUES
  ('New York', 'United States', 40.7128, -74.0060),
  ('Los Angeles', 'United States', 34.0522, -118.2437),
  ('Chicago', 'United States', 41.8781, -87.6298),
  ('Houston', 'United States', 29.7604, -95.3698),
  ('Miami', 'United States', 25.7617, -80.1918),
  ('Seattle', 'United States', 47.6062, -122.3321),
  ('Denver', 'United States', 39.7392, -104.9903),
  ('London', 'United Kingdom', 51.5074, -0.1278),
  ('Paris', 'France', 48.8566, 2.3522),
  ('Berlin', 'Germany', 52.5200, 13.4050),
  ('Tokyo', 'Japan', 35.6762, 139.6503),
  ('Sydney', 'Australia', -33.8688, 151.2093),
  ('Toronto', 'Canada', 43.6532, -79.3832),
  ('Mexico City', 'Mexico', 19.4326, -99.1332),
  ('Dubai', 'United Arab Emirates', 25.2048, 55.2708),
  ('Singapore', 'Singapore', 1.3521, 103.8198),
  ('Mumbai', 'India', 19.0760, 72.8777),
  ('Seoul', 'South Korea', 37.5665, 126.9780),
  ('Cairo', 'Egypt', 30.0444, 31.2357),
  ('São Paulo', 'Brazil', -23.5505, -46.6333)
ON CONFLICT DO NOTHING;
