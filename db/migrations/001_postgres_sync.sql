CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_save_states (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  slot text NOT NULL DEFAULT 'main',
  save jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  client_updated_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, slot)
);

CREATE TABLE IF NOT EXISTS player_run_states (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  slot text NOT NULL DEFAULT 'main',
  run jsonb NOT NULL,
  client_updated_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, slot)
);

CREATE TABLE IF NOT EXISTS black_powder_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount <> 0),
  reason text,
  placement text,
  idempotency_key text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS ad_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  placement text NOT NULL,
  reward_type text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  provider text,
  ad_unit_id text,
  idempotency_key text NOT NULL,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS addon_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  addon_uid text,
  event_type text NOT NULL,
  cat text,
  rarity text,
  source text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supply_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  spot_id text NOT NULL,
  cooldown_bucket integer NOT NULL,
  idempotency_key text NOT NULL,
  rewards jsonb NOT NULL DEFAULT '{}'::jsonb,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, idempotency_key),
  UNIQUE (player_id, spot_id, cooldown_bucket)
);

CREATE INDEX IF NOT EXISTS supply_claims_player_spot_idx ON supply_claims (player_id, spot_id, claimed_at DESC);

CREATE TABLE IF NOT EXISTS supply_spots (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text,
  source text,
  geom geography(Point, 4326) NOT NULL,
  tags jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS supply_spots_geom_idx ON supply_spots USING gist (geom);

CREATE TABLE IF NOT EXISTS sweet_spots (
  id text PRIMARY KEY,
  cell_id text NOT NULL UNIQUE,
  geom geography(Point, 4326) NOT NULL,
  field jsonb NOT NULL DEFAULT '{}'::jsonb,
  rarity text,
  module_cost integer,
  module_budget integer,
  density_total integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sweet_spots_geom_idx ON sweet_spots USING gist (geom);
