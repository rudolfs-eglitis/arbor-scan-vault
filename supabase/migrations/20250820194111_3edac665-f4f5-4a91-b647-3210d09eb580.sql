-- Drop the problematic security definer views and recreate as regular views or functions
DROP VIEW IF EXISTS public.v_defect_species_mitigations CASCADE;
DROP VIEW IF EXISTS public.v_fungus_with_mgmt CASCADE;
DROP VIEW IF EXISTS public.v_species_fungi CASCADE;
DROP VIEW IF EXISTS public.v_species_profile CASCADE;

-- Recreate them as regular views without security definer
CREATE VIEW public.v_defect_species_mitigations AS
SELECT 
  d.id as defect_id,
  d.name as defect_name,
  s.id as species_id,
  s.scientific_name,
  sd.likelihood,
  m.action,
  m.conditions_en,
  m.timing_en,
  m.follow_up_en
FROM public.defects d
LEFT JOIN public.species_defects sd ON d.id = sd.defect_id
LEFT JOIN public.species s ON sd.species_id = s.id
LEFT JOIN public.mitigations m ON (d.id = m.defect_id OR s.id = m.species_id);

CREATE VIEW public.v_fungus_with_mgmt AS
SELECT 
  f.id,
  f.scientific_name,
  f.common_names,
  f.decay,
  f.structural_effect_en,
  fm.action_en,
  fm.conditions_en,
  fm.timing_en,
  fm.follow_up_en
FROM public.fungi f
LEFT JOIN public.fungus_management fm ON f.id = fm.fungus_id;

CREATE VIEW public.v_species_fungi AS
SELECT 
  s.id as species_id,
  s.scientific_name,
  f.id as fungus_id,
  f.scientific_name as fungus_name,
  fh.frequency,
  fh.evidence_en
FROM public.species s
LEFT JOIN public.fungus_hosts fh ON s.id = fh.species_id
LEFT JOIN public.fungi f ON fh.fungus_id = f.id;

CREATE VIEW public.v_species_profile AS
SELECT 
  s.id,
  s.scientific_name,
  s.common_names,
  s.genus,
  s.family,
  sg.mature_height_m,
  sg.mature_spread_m,
  sg.growth_rate,
  sg.lifespan_years,
  se.wildlife_value,
  se.pollinator_value,
  se.allergenicity,
  st.pollution_tolerance,
  st.drought_tolerance,
  st.shade_tolerance
FROM public.species s
LEFT JOIN public.species_growth sg ON s.id = sg.species_id
LEFT JOIN public.species_ecology se ON s.id = se.species_id
LEFT JOIN public.species_site_traits st ON s.id = st.species_id;