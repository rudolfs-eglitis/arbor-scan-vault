-- Add latitude and longitude columns to trees table if they don't exist
ALTER TABLE trees 
ADD COLUMN IF NOT EXISTS lat NUMERIC,
ADD COLUMN IF NOT EXISTS lng NUMERIC;

-- Add comments to describe the coordinate system
COMMENT ON COLUMN trees.lat IS 'Latitude in WGS84 decimal degrees';
COMMENT ON COLUMN trees.lng IS 'Longitude in WGS84 decimal degrees';