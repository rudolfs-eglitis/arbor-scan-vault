-- Fix security issues from handoff summary view
-- Replace the view with a more secure implementation

-- Drop the potentially insecure view
DROP VIEW IF EXISTS handoff_summary;

-- Create a secure function instead that respects RLS
CREATE OR REPLACE FUNCTION public.get_handoff_summary()
RETURNS TABLE(
  category text,
  count bigint,
  description text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    'Knowledge Sources'::text as category,
    COUNT(*) as count,
    'Preserved scientific literature and documentation'::text as description
  FROM kb_sources WHERE id != 'system.handoff.readme'
  UNION ALL
  SELECT 
    'Knowledge Chunks'::text as category,
    COUNT(*) as count,
    'Processed text content with AI embeddings'::text as description  
  FROM kb_chunks
  UNION ALL
  SELECT 
    'Species Data'::text as category,
    COUNT(*) as count,
    'Tree species with growth, site traits, and ecology data'::text as description
  FROM species
  UNION ALL
  SELECT 
    'Defects Catalog'::text as category,
    COUNT(*) as count,
    'Tree defect types with QTRA guidance'::text as description
  FROM defects
  UNION ALL
  SELECT 
    'Fungi Database'::text as category,
    COUNT(*) as count,
    'Pathogenic fungi with host relationships'::text as description
  FROM fungi;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_handoff_summary() TO authenticated;