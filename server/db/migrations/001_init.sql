-- KisanMitra AI: Initial Database Migration
-- PostgreSQL 13+ and PGlite include gen_random_uuid() natively in the core catalog.

-- ENUMS
DO $$ BEGIN CREATE TYPE risk_level AS ENUM ('low','moderate','high','critical'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE season_t AS ENUM ('kharif','rabi','zaid','perennial'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE soil_t AS ENUM ('red','black','alluvial','laterite','sandy','loamy','clayey','saline_alkaline','unknown'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE irrigation_t AS ENUM ('rainfed','canal','borewell','drip','sprinkler','farm_pond','mixed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE growth_stage_t AS ENUM ('land_preparation','sowing','germination','vegetative','flowering','fruiting_grain_fill','maturity','harvest','post_harvest'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE lang_t AS ENUM ('en','hi','te','ta','mr','kn'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE msg_role_t AS ENUM ('user','assistant'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE advisory_status_t AS ENUM ('pending','completed','failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 80),
  preferred_language lang_t NOT NULL DEFAULT 'en',
  simple_mode BOOLEAN NOT NULL DEFAULT false,
  daily_ai_quota INT NOT NULL DEFAULT 20 CHECK (daily_ai_quota BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CROP CATALOG TABLE (global, read-only for users)
CREATE TABLE IF NOT EXISTS crops (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('cereals','pulses','oilseeds','vegetables','fruits','cash_crops','plantation_spices','floriculture')),
  name_en TEXT NOT NULL UNIQUE,
  names_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  typical_seasons season_t[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_crops_category ON crops(category) WHERE is_active;

-- FARMS TABLE
CREATE TABLE IF NOT EXISTS farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  village TEXT,
  total_area_acres NUMERIC(10,2) NOT NULL CHECK (total_area_acres > 0),
  soil_type soil_t NOT NULL DEFAULT 'unknown',
  irrigation_source irrigation_t NOT NULL DEFAULT 'rainfed',
  latitude NUMERIC(9,6) CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(9,6) CHECK (longitude BETWEEN -180 AND 180),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_farms_user ON farms(user_id);

DO $$ BEGIN
  CREATE TRIGGER trg_farms_updated
    BEFORE UPDATE ON farms
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ADVISORIES TABLE
CREATE TABLE IF NOT EXISTS advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_id INT REFERENCES crops(id),
  crop_name TEXT NOT NULL,
  crop_category TEXT NOT NULL,
  variety TEXT,
  growth_stage growth_stage_t NOT NULL,
  season season_t NOT NULL,
  sowing_date DATE,
  area_acres NUMERIC(10,2) NOT NULL CHECK (area_acres > 0),
  recent_weather TEXT NOT NULL,
  focus_areas TEXT[] NOT NULL CHECK (array_length(focus_areas,1) >= 1),
  symptoms TEXT,
  last_fertilizer_applied TEXT,
  last_pesticide_applied TEXT,
  output_language lang_t NOT NULL DEFAULT 'en',
  detail_level TEXT NOT NULL DEFAULT 'simple' CHECK (detail_level IN ('simple','detailed')),
  has_photo BOOLEAN NOT NULL DEFAULT false,
  status advisory_status_t NOT NULL DEFAULT 'pending',
  risk_level risk_level,
  title TEXT,
  result JSONB,
  model_used TEXT,
  is_saved BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_adv_user_created ON advisories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_adv_user_saved ON advisories(user_id) WHERE is_saved;
CREATE INDEX IF NOT EXISTS idx_adv_user_risk ON advisories(user_id, risk_level);
CREATE INDEX IF NOT EXISTS idx_adv_search ON advisories USING gin (to_tsvector('simple', coalesce(crop_name,'') || ' ' || coalesce(title,'')));

DO $$ BEGIN
  CREATE TRIGGER trg_adv_updated
    BEFORE UPDATE ON advisories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- DIAGNOSES TABLE (Photo Diagnosis)
CREATE TABLE IF NOT EXISTS diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop_hint TEXT,
  notes TEXT,
  output_language lang_t NOT NULL DEFAULT 'en',
  image_mime TEXT NOT NULL,
  image_sha256 TEXT NOT NULL,
  result JSONB NOT NULL,
  model_used TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_diag_user_created ON diagnoses(user_id, created_at DESC);

-- CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisory_id UUID NOT NULL REFERENCES advisories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role msg_role_t NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_adv ON chat_messages(advisory_id, created_at);

-- FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisory_id UUID NOT NULL REFERENCES advisories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating IN (-1,1)),
  comment TEXT CHECK (char_length(comment) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (advisory_id, user_id)
);

-- AI USAGE LOGS TABLE
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('advisory','diagnosis','chat')),
  model TEXT NOT NULL,
  prompt_tokens INT,
  output_tokens INT,
  latency_ms INT,
  success BOOLEAN NOT NULL,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_usage_user_day ON ai_usage_logs(user_id, created_at DESC);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE farms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE farms          FORCE ROW LEVEL SECURITY;
  ALTER TABLE advisories     FORCE ROW LEVEL SECURITY;
  ALTER TABLE diagnoses      FORCE ROW LEVEL SECURITY;
  ALTER TABLE chat_messages  FORCE ROW LEVEL SECURITY;
  ALTER TABLE feedback       FORCE ROW LEVEL SECURITY;
  ALTER TABLE ai_usage_logs  FORCE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS farms_owner ON farms;
  CREATE POLICY farms_owner ON farms
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    WITH CHECK (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS advisories_owner ON advisories;
  CREATE POLICY advisories_owner ON advisories
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    WITH CHECK (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS diagnoses_owner ON diagnoses;
  CREATE POLICY diagnoses_owner ON diagnoses
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    WITH CHECK (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS chat_owner ON chat_messages;
  CREATE POLICY chat_owner ON chat_messages
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    WITH CHECK (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS feedback_owner ON feedback;
  CREATE POLICY feedback_owner ON feedback
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    WITH CHECK (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS usage_owner ON ai_usage_logs;
  CREATE POLICY usage_owner ON ai_usage_logs
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    WITH CHECK (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
EXCEPTION WHEN OTHERS THEN null; END $$;
