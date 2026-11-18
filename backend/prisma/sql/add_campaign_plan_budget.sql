DO $$ BEGIN
  CREATE TYPE progress_status AS ENUM ('planned', 'in_progress', 'completed', 'delayed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS campaign_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  responsible_name VARCHAR(160),
  planned_start_on DATE,
  planned_end_on DATE,
  status progress_status NOT NULL DEFAULT 'planned',
  progress_percent SMALLINT NOT NULL DEFAULT 0,
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT chk_campaign_activities_progress CHECK (progress_percent BETWEEN 0 AND 100),
  CONSTRAINT chk_campaign_activities_dates CHECK (
    planned_start_on IS NULL OR planned_end_on IS NULL OR planned_end_on >= planned_start_on
  )
);

CREATE INDEX IF NOT EXISTS idx_campaign_activities_campaign_id ON campaign_activities (campaign_id);

CREATE TABLE IF NOT EXISTS campaign_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  category VARCHAR(80) NOT NULL,
  description VARCHAR(300) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 1.00,
  unit_price DECIMAL(12,2),
  planned_amount DECIMAL(12,2) NOT NULL,
  display_order SMALLINT NOT NULL DEFAULT 0,
  notes TEXT,
  CONSTRAINT chk_campaign_budgets_quantity CHECK (quantity > 0),
  CONSTRAINT chk_campaign_budgets_planned_amount CHECK (planned_amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_campaign_budgets_campaign_id ON campaign_budgets (campaign_id);
