-- Database cleanup for fresh project handoff
-- Preserves knowledge base and reference data, cleans operational/test data

-- 1. Clean up test/demo trees and assessments (operational data)
DELETE FROM assessments WHERE created_at < NOW() - INTERVAL '1 day';
DELETE FROM trees WHERE created_by NOT IN (
  SELECT id FROM auth.users WHERE email = 'rudolfs.eglitis@gmail.com'
);

-- 2. Clean up processing queue (development artifacts)
DELETE FROM queue_pages;
DELETE FROM processing_queue WHERE status IN ('completed', 'failed');

-- 3. Clean up test user data but preserve admin
DELETE FROM user_roles WHERE user_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'rudolfs.eglitis@gmail.com'
);

-- 4. Clean up orphaned profile data
DELETE FROM profiles WHERE id NOT IN (
  SELECT id FROM auth.users WHERE email = 'rudolfs.eglitis@gmail.com'
);

-- 5. Reset credit system for fresh start
DELETE FROM credit_transactions;
DELETE FROM user_credits;

-- 6. Clean up audit logs (development noise)
DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '7 days';

-- 7. Clean up auth attempts log
DELETE FROM auth_attempts WHERE attempt_time < NOW() - INTERVAL '7 days';

-- 8. Add metadata to mark database as prepared for handoff
INSERT INTO kb_sources (
  id,
  title,
  kind,
  lang,
  notes,
  meta
) VALUES (
  'system.handoff.readme',
  'Database Handoff Documentation',
  'documentation',
  'en',
  'This database has been prepared for project handoff. Knowledge base content, species data, defects, and reference tables are preserved. All test users, operational data, and development artifacts have been cleaned up.',
  jsonb_build_object(
    'handoff_prepared_at', NOW(),
    'preserved_data', jsonb_build_array(
      'kb_sources', 'kb_chunks', 'kb_images',
      'species', 'species_growth', 'species_site_traits', 'species_ecology',
      'defects', 'fungi', 'countries', 'climate_zones',
      'glossary', 'features'
    ),
    'cleaned_data', jsonb_build_array(
      'trees', 'assessments', 'profiles', 'user_roles',
      'processing_queue', 'queue_pages', 'credit_transactions',
      'audit_logs', 'auth_attempts'
    ),
    'admin_user', 'rudolfs.eglitis@gmail.com'
  )
) ON CONFLICT (id) DO UPDATE SET
  notes = EXCLUDED.notes,
  meta = EXCLUDED.meta;

-- 9. Update statistics for clean handoff
UPDATE kb_sources SET meta = jsonb_set(
  COALESCE(meta, '{}'),
  '{handoff_ready}',
  'true'
) WHERE id != 'system.handoff.readme';

-- 10. Create summary view for new developers
CREATE OR REPLACE VIEW handoff_summary AS
SELECT 
  'Knowledge Sources' as category,
  COUNT(*) as count,
  'Preserved scientific literature and documentation' as description
FROM kb_sources WHERE id != 'system.handoff.readme'
UNION ALL
SELECT 
  'Knowledge Chunks' as category,
  COUNT(*) as count,
  'Processed text content with AI embeddings' as description  
FROM kb_chunks
UNION ALL
SELECT 
  'Species Data' as category,
  COUNT(*) as count,
  'Tree species with growth, site traits, and ecology data' as description
FROM species
UNION ALL
SELECT 
  'Defects Catalog' as category,
  COUNT(*) as count,
  'Tree defect types with QTRA guidance' as description
FROM defects
UNION ALL
SELECT 
  'Fungi Database' as category,
  COUNT(*) as count,
  'Pathogenic fungi with host relationships' as description
FROM fungi;

-- Grant access to summary view
GRANT SELECT ON handoff_summary TO authenticated;