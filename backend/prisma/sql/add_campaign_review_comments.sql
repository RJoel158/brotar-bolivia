ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS review_rejection_reason TEXT;

DO $$ BEGIN
  CREATE TYPE campaign_review_action AS ENUM ('approved', 'rejected', 'changes_requested');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS campaign_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  reviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  action campaign_review_action NOT NULL,
  reason TEXT,
  section_notes JSONB,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_reviews_campaign_id ON campaign_reviews (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reviews_created_at ON campaign_reviews (created_at);
