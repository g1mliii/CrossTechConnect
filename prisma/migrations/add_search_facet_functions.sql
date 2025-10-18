-- SQL functions for efficient search facet aggregation
-- These functions optimize facet queries for large databases
-- Applied to Supabase database using Supabase MCP

-- Enable pg_trgm extension for better text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Function to get category facets with counts
CREATE OR REPLACE FUNCTION get_category_facets(search_query TEXT DEFAULT NULL)
RETURNS TABLE (
  id TEXT,
  name VARCHAR(100),
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id,
    dc.name,
    COUNT(d.id)::BIGINT as count
  FROM device_categories dc
  INNER JOIN devices d ON d.category_id = dc.id
  WHERE 
    search_query IS NULL 
    OR d.name ILIKE '%' || search_query || '%'
    OR d.brand ILIKE '%' || search_query || '%'
    OR COALESCE(d.model, '') ILIKE '%' || search_query || '%'
  GROUP BY dc.id, dc.name
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get brand facets with counts
CREATE OR REPLACE FUNCTION get_brand_facets(
  category_filter TEXT DEFAULT NULL,
  search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  name VARCHAR(100),
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.brand as name,
    COUNT(d.id)::BIGINT as count
  FROM devices d
  WHERE 
    (category_filter IS NULL OR d.category_id = category_filter)
    AND (
      search_query IS NULL 
      OR d.name ILIKE '%' || search_query || '%'
      OR d.brand ILIKE '%' || search_query || '%'
      OR COALESCE(d.model, '') ILIKE '%' || search_query || '%'
    )
  GROUP BY d.brand
  ORDER BY count DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get verified/unverified counts
CREATE OR REPLACE FUNCTION get_verified_facets(category_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  verified BIGINT,
  unverified BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(CASE WHEN d.verified = true THEN 1 END)::BIGINT as verified,
    COUNT(CASE WHEN d.verified = false THEN 1 END)::BIGINT as unverified
  FROM devices d
  WHERE category_filter IS NULL OR d.category_id = category_filter;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_devices_name_trgm ON devices USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_devices_brand_trgm ON devices USING gin (brand gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_devices_model_trgm ON devices USING gin (model gin_trgm_ops);

-- Create composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_devices_category_verified ON devices(category_id, verified);
CREATE INDEX IF NOT EXISTS idx_devices_category_brand ON devices(category_id, brand);
CREATE INDEX IF NOT EXISTS idx_devices_dimensions ON devices(width_cm, height_cm, depth_cm) WHERE width_cm IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_devices_power_weight ON devices(power_watts, weight_kg) WHERE power_watts IS NOT NULL;

-- Create index on device_specifications for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_device_specs_specifications ON device_specifications USING gin (specifications);

-- Add comments for documentation
COMMENT ON FUNCTION get_category_facets IS 'Returns category facets with device counts for search results';
COMMENT ON FUNCTION get_brand_facets IS 'Returns brand facets with device counts, optionally filtered by category';
COMMENT ON FUNCTION get_verified_facets IS 'Returns verified and unverified device counts';
