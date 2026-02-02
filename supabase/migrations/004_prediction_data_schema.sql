-- Migration: Add prediction data tables for customer analytics
-- This migration creates 5 new tables to support comprehensive customer behavior prediction

-- 1. Purchase History Table
-- Tracks all customer purchases including devices, plans, and services
CREATE TABLE purchase_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES customer_sessions(id) ON DELETE CASCADE,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('device', 'plan_change', 'add_service', 'accessory')),
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL, -- Price in KRW
  purchase_date TIMESTAMPTZ NOT NULL,
  contract_months INTEGER, -- Contract duration for devices/plans (e.g., 24, 36)
  metadata JSONB, -- Additional purchase details (color, storage, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customer Demographics Table
-- Stores demographic and subscription information for each customer
CREATE TABLE customer_demographics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID UNIQUE NOT NULL REFERENCES customer_sessions(id) ON DELETE CASCADE,
  age_range TEXT NOT NULL CHECK (age_range IN ('20s', '30s', '40s', '50s', '60+')),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  occupation TEXT,
  income_range TEXT CHECK (income_range IN ('low', 'medium', 'high', 'very_high')),
  residential_area TEXT, -- City or region
  customer_tier TEXT NOT NULL DEFAULT 'bronze' CHECK (customer_tier IN ('bronze', 'silver', 'gold', 'vip')),
  subscription_start_date TIMESTAMPTZ NOT NULL,
  current_plan_type TEXT NOT NULL,
  current_plan_price INTEGER NOT NULL, -- Monthly price in KRW
  average_monthly_usage_gb DECIMAL(8,2) NOT NULL, -- Average data usage in GB
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Family Members Table
-- Tracks family members and their mobile service status
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES customer_sessions(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('spouse', 'child', 'parent', 'sibling', 'other')),
  age_range TEXT NOT NULL CHECK (age_range IN ('child', 'teen', 'adult', 'senior')),
  has_mobile_line BOOLEAN NOT NULL DEFAULT false,
  line_type TEXT CHECK (line_type IN ('prepaid', 'postpaid', 'shared_data')),
  data_usage_level TEXT CHECK (data_usage_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. App Usage Metrics Table
-- Tracks daily engagement metrics for T-world app usage
CREATE TABLE app_usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES customer_sessions(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  chatbot_sessions_count INTEGER NOT NULL DEFAULT 0,
  avg_session_duration_seconds INTEGER NOT NULL DEFAULT 0,
  features_used TEXT[] NOT NULL DEFAULT '{}', -- Array of feature names
  pages_visited TEXT[] NOT NULL DEFAULT '{}', -- Array of page names
  search_queries TEXT[] NOT NULL DEFAULT '{}', -- Array of search terms
  help_topics_viewed TEXT[] NOT NULL DEFAULT '{}', -- Array of help topics
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, metric_date) -- One record per customer per day
);

-- 5. Customer Devices Table
-- Tracks current and historical devices owned by customers
CREATE TABLE customer_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES customer_sessions(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL CHECK (device_type IN ('smartphone', 'tablet', 'wearable', 'other')),
  manufacturer TEXT NOT NULL, -- Samsung, Apple, LG, etc.
  model_name TEXT NOT NULL,
  purchase_date TIMESTAMPTZ NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT true, -- Is this the current active device?
  device_age_months INTEGER NOT NULL, -- Calculated age in months
  condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  battery_health_percent INTEGER CHECK (battery_health_percent >= 0 AND battery_health_percent <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_purchase_history_session_id ON purchase_history(session_id);
CREATE INDEX idx_purchase_history_purchase_date ON purchase_history(purchase_date);
CREATE INDEX idx_purchase_history_purchase_type ON purchase_history(purchase_type);

CREATE INDEX idx_customer_demographics_session_id ON customer_demographics(session_id);
CREATE INDEX idx_customer_demographics_tier ON customer_demographics(customer_tier);
CREATE INDEX idx_customer_demographics_age_range ON customer_demographics(age_range);

CREATE INDEX idx_family_members_session_id ON family_members(session_id);
CREATE INDEX idx_family_members_has_line ON family_members(has_mobile_line);

CREATE INDEX idx_app_usage_metrics_session_id ON app_usage_metrics(session_id);
CREATE INDEX idx_app_usage_metrics_metric_date ON app_usage_metrics(metric_date);

CREATE INDEX idx_customer_devices_session_id ON customer_devices(session_id);
CREATE INDEX idx_customer_devices_is_current ON customer_devices(is_current);
CREATE INDEX idx_customer_devices_purchase_date ON customer_devices(purchase_date);

-- Add Row Level Security (RLS) policies
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_devices ENABLE ROW LEVEL SECURITY;

-- Public read access for all prediction data tables
CREATE POLICY "Allow public read access" ON purchase_history
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON customer_demographics
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON family_members
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON app_usage_metrics
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON customer_devices
  FOR SELECT USING (true);

-- Admin insert/update/delete access
CREATE POLICY "Allow service role all access" ON purchase_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role all access" ON customer_demographics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role all access" ON family_members
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role all access" ON app_usage_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role all access" ON customer_devices
  FOR ALL USING (auth.role() = 'service_role');
