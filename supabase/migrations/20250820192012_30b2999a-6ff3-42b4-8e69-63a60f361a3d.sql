-- Enable RLS on existing tables that don't have it
ALTER TABLE public.assessment_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.climate_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fungi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fungus_defect_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fungus_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fungus_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fungus_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mitigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_ecology ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_life_expectancy_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_origin_climate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_site_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_swedish_regs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sweden_climate_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sweden_site_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.use_cases ENABLE ROW LEVEL SECURITY;

-- Create policies for read-only reference data (open to all authenticated users)
CREATE POLICY "Authenticated users can view climate zones" ON public.climate_zones FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view countries" ON public.countries FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view defects" ON public.defects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view features" ON public.features FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view fungi" ON public.fungi FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view fungus defect links" ON public.fungus_defect_links FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view fungus hosts" ON public.fungus_hosts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view fungus management" ON public.fungus_management FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view fungus signs" ON public.fungus_signs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view glossary" ON public.glossary FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view media" ON public.media FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view mitigations" ON public.mitigations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view species" ON public.species FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view species defects" ON public.species_defects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view species ecology" ON public.species_ecology FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view species features" ON public.species_features FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view species growth" ON public.species_growth FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view species life expectancy" ON public.species_life_expectancy_profile FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view species origin climate" ON public.species_origin_climate FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view species site traits" ON public.species_site_traits FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view species swedish regs" ON public.species_swedish_regs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view species tags" ON public.species_tags FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view species use cases" ON public.species_use_cases FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view sweden climate zones" ON public.sweden_climate_zones FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view sweden site categories" ON public.sweden_site_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view tags" ON public.tags FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view use cases" ON public.use_cases FOR SELECT USING (auth.uid() IS NOT NULL);

-- Assessment outcomes policies (authenticated users can manage their own data)
CREATE POLICY "Authenticated users can view assessment outcomes" ON public.assessment_outcomes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create assessment outcomes" ON public.assessment_outcomes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update assessment outcomes" ON public.assessment_outcomes FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Admin policies for managing reference data
CREATE POLICY "Admins can manage defects" ON public.defects FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage features" ON public.features FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage fungi" ON public.fungi FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage species" ON public.species FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage assessment outcomes" ON public.assessment_outcomes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));