-- Fix the trees table schema to handle coordinates properly
-- Make latitude and longitude nullable and add defaults
ALTER TABLE trees ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE trees ALTER COLUMN longitude DROP NOT NULL;
ALTER TABLE trees ALTER COLUMN latitude SET DEFAULT 0.0;
ALTER TABLE trees ALTER COLUMN longitude SET DEFAULT 0.0;

-- Update existing null values
UPDATE trees SET latitude = 0.0 WHERE latitude IS NULL;
UPDATE trees SET longitude = 0.0 WHERE longitude IS NULL;