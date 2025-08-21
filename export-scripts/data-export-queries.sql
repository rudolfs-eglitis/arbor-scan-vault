-- =========================================================================
-- ArborQuant Data Export Queries
-- Run these in your current Supabase SQL Editor to extract existing data
-- Copy the results and use them in your fresh project setup
-- =========================================================================

-- ==================== KNOWLEDGE BASE DATA ====================

-- Export KB Sources
SELECT 
  id, title, authors, year, publisher, isbn, url, lang, kind, rights, notes, 
  meta, created_at
FROM public.kb_sources
ORDER BY created_at;

-- Export KB Chunks (content only, embeddings will need regeneration)
SELECT 
  id, source_id, content, src_content, content_en, lang, src_lang, 
  pages, species_ids, defect_ids, image_ids, content_sha256, meta, created_at
FROM public.kb_chunks
ORDER BY source_id, id;

-- Export KB Images
SELECT 
  id, source_id, page, uri, caption, meta, created_at
FROM public.kb_images
ORDER BY source_id, page;

-- ==================== SPECIES AND REFERENCE DATA ====================

-- Export Species
SELECT 
  id, scientific_name, common_names, family, genus, aliases, regions, notes
FROM public.species
ORDER BY scientific_name;

-- Export Species Growth Data
SELECT 
  species_id, mature_height_m, mature_spread_m, growth_rate, crown_form,
  lifespan_years, maintenance, brittle_wood, sucker_prone, litter_heavy,
  source_id, notes
FROM public.species_growth
ORDER BY species_id;

-- Export Species Site Traits
SELECT 
  species_id, pollution_tolerance, deicing_salt_tolerance, salt_spray_tolerance,
  drought_tolerance, waterlogging_tolerance, compaction_tolerance, shade_tolerance,
  wind_tolerance, soil_ph_pref_low, soil_ph_pref_high, root_space_need_m3,
  source_id, notes
FROM public.species_site_traits
ORDER BY species_id;

-- Export Species Features
SELECT 
  species_id, feature_id, detail, detail_en, evidence, evidence_en,
  season_hint, source_id, src_lang, detail_src, evidence_src, pages
FROM public.species_features
ORDER BY species_id, feature_id;

-- Export Species Ecology
SELECT 
  species_id, native_regions, wildlife_value, pollinator_value, 
  allergenicity, invasiveness_risk, source_id, notes
FROM public.species_ecology
ORDER BY species_id;

-- Export Species Climate Data
SELECT 
  species_id, provenance, hardiness_min, hardiness_max, heat_tolerance,
  urban_heat_island_tolerance, drought_legacy_resilience, sweden_zones,
  source_id, notes
FROM public.species_origin_climate
ORDER BY species_id;

-- Export Species Use Cases
SELECT 
  species_id, use_case_id, suitability, sweden_site_category, source_id, notes
FROM public.species_use_cases
ORDER BY species_id, use_case_id;

-- ==================== DEFECTS AND FUNGI DATA ====================

-- Export Defects
SELECT 
  id, name, category, field_indicators, mechanics_effect, development,
  qtra_guidance, notes
FROM public.defects
ORDER BY category, name;

-- Export Fungi
SELECT 
  id, scientific_name, common_names, decay, typical_tissue, colonization,
  structural_effect_src, structural_effect_en, source_id, src_lang, 
  notes, created_at
FROM public.fungi
ORDER BY scientific_name;

-- Export Fungus Hosts
SELECT 
  fungus_id, species_id, frequency, evidence_src, evidence_en, src_lang
FROM public.fungus_hosts
ORDER BY fungus_id, species_id;

-- Export Mitigations
SELECT 
  id, mtype, defect_id, species_id, action, action_en, timing, timing_en,
  conditions, conditions_en, follow_up, follow_up_en, action_src, timing_src,
  conditions_src, follow_up_src, src_lang
FROM public.mitigations
ORDER BY mtype, defect_id;

-- ==================== REFERENCE TABLES ====================

-- Export Countries
SELECT id, name FROM public.countries ORDER BY name;

-- Export Climate Zones
SELECT 
  id, country_id, scheme, code, name
FROM public.climate_zones
ORDER BY country_id, scheme, code;

-- Export Features
SELECT 
  id, group_name, label, description
FROM public.features
ORDER BY group_name, label;

-- Export Tags
SELECT id, label FROM public.tags ORDER BY label;

-- Export Species Tags
SELECT species_id, tag_id FROM public.species_tags ORDER BY species_id;

-- Export Glossary
SELECT 
  term, definition, synonyms, lang
FROM public.glossary
ORDER BY lang, term;

-- ==================== PROCESSING QUEUE DATA ====================

-- Export Processing Queue (active items only)
SELECT 
  id, source_id, batch_name, status, current_phase, total_pages,
  processed_pages, progress_percentage, current_page, current_file,
  current_stage, processing_speed, started_at, completed_at,
  estimated_completion, error_message, created_at, updated_at
FROM public.processing_queue
WHERE status != 'completed' OR completed_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Export Queue Pages (recent only)
SELECT 
  id, queue_id, page_number, status, extracted_text, ocr_confidence,
  figures_extracted, error_message, processed_at, phase1_completed_at,
  phase2_completed_at, phase3_completed_at, created_at, updated_at
FROM public.queue_pages qp
WHERE EXISTS (
  SELECT 1 FROM public.processing_queue pq 
  WHERE pq.id = qp.queue_id 
  AND (pq.status != 'completed' OR pq.completed_at > NOW() - INTERVAL '7 days')
)
ORDER BY queue_id, page_number;

-- ==================== USER AND TREE DATA ====================

-- Export User Profiles (anonymized)
SELECT 
  id, 
  CASE 
    WHEN email = 'rudolfs.eglitis@gmail.com' THEN email 
    ELSE 'user_' || SUBSTR(id::text, 1, 8) || '@example.com'
  END as email,
  display_name, avatar_url, created_at, updated_at
FROM public.profiles
ORDER BY created_at;

-- Export User Roles
SELECT user_id, role, assigned_at, assigned_by
FROM public.user_roles
ORDER BY user_id, role;

-- Export Trees (with anonymized user references)
SELECT 
  id, tree_number, species_id, height_m, dbh_cm, crown_spread_m,
  age_estimate, latitude, longitude, location_description, site_conditions,
  ownership, protected_status, notes, created_by, created_at, updated_at
FROM public.trees
ORDER BY created_at;

-- Export Assessments
SELECT 
  id, tree_id, assessor_id, assessment_date, status, assessment_method,
  probability_of_failure, consequence_rating, risk_rating, overall_condition,
  recommendations, follow_up_date, weather_conditions, notes,
  created_at, updated_at
FROM public.assessments
ORDER BY assessment_date DESC;

-- ==================== GENERATION COMMANDS ====================

/*
To use these queries:

1. Copy each query above
2. Run in your current Supabase SQL Editor
3. Export results as CSV or copy as INSERT statements
4. Use the data in your fresh project setup

For INSERT statement generation, you can use:
*/

-- Example: Generate INSERT statements for species
SELECT 
  'INSERT INTO public.species (id, scientific_name, common_names, family, genus, aliases, regions, notes) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || scientific_name || ''', ' ||
  COALESCE('ARRAY[' || ARRAY_TO_STRING(ARRAY(SELECT '''' || unnest(common_names) || ''''), ',') || ']', 'NULL') || ', ' ||
  COALESCE('''' || family || '''', 'NULL') || ', ' ||
  COALESCE('''' || genus || '''', 'NULL') || ', ' ||
  COALESCE('ARRAY[' || ARRAY_TO_STRING(ARRAY(SELECT '''' || unnest(aliases) || ''''), ',') || ']', 'NULL') || ', ' ||
  COALESCE('ARRAY[' || ARRAY_TO_STRING(ARRAY(SELECT '''' || unnest(regions) || ''''), ',') || ']', 'NULL') || ', ' ||
  COALESCE('''' || notes || '''', 'NULL') ||
  ');' as insert_statement
FROM public.species
ORDER BY scientific_name;

-- Run similar queries for other tables to generate INSERT statements