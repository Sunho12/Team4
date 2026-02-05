-- Migration 009: Add agency consent fields to conversation_summaries
-- This allows tracking whether customers consent to sharing their conversation data with agency staff

-- Add agency_consent column (default false)
ALTER TABLE conversation_summaries
ADD COLUMN IF NOT EXISTS agency_consent BOOLEAN DEFAULT false;

-- Add consent_updated_at column (nullable, records when consent was given/updated)
ALTER TABLE conversation_summaries
ADD COLUMN IF NOT EXISTS consent_updated_at TIMESTAMPTZ;

-- Create index for filtering by consent status
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_agency_consent
ON conversation_summaries(agency_consent);

-- Add comment for documentation
COMMENT ON COLUMN conversation_summaries.agency_consent IS 'Whether the customer consented to sharing conversation data with agency staff';
COMMENT ON COLUMN conversation_summaries.consent_updated_at IS 'Timestamp when the customer gave or updated their consent';
