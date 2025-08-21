-- =========================================================================
-- ArborQuant Complete Database Export Script
-- Generated: January 2025
-- Contains: Schema, Data, Functions, Triggers, RLS Policies
-- =========================================================================

-- ==================== ENABLE REQUIRED EXTENSIONS ====================
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "public";

-- ==================== CUSTOM TYPES ====================

-- Assessment related enums
CREATE TYPE public.assessment_status AS ENUM ('draft', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.consequence_rating AS ENUM ('very_low', 'low', 'significant', 'considerable');
CREATE TYPE public.probability_of_failure AS ENUM ('very_low', 'low', 'some', 'likely', 'probable');
CREATE TYPE public.risk_rating AS ENUM ('broadly_acceptable', 'tolerable', 'unacceptable');

-- Application role system
CREATE TYPE public.app_role AS ENUM ('user', 'certified_arborist', 'qtra_arborist', 'admin');

-- Defect and management types
CREATE TYPE public.defect_category AS ENUM ('structural', 'pathological', 'environmental', 'developmental');
CREATE TYPE public.decay_type AS ENUM ('white_rot', 'brown_rot', 'soft_rot', 'unknown');
CREATE TYPE public.management_type AS ENUM ('monitoring', 'pruning', 'treatment', 'removal', 'restriction');

-- Rating scales
CREATE TYPE public.rating05 AS (rating smallint);
CREATE TYPE public.likelihood AS ENUM ('rare', 'uncommon', 'occasional', 'frequent', 'common', 'unknown');
CREATE TYPE public.host_freq AS ENUM ('primary', 'secondary', 'occasional', 'rare', 'unknown');

-- Growth and site characteristics
CREATE TYPE public.growth_rate AS ENUM ('very_slow', 'slow', 'moderate', 'fast', 'very_fast');
CREATE TYPE public.crown_form AS ENUM ('oval', 'round', 'conical', 'columnar', 'vase', 'weeping', 'irregular');
CREATE TYPE public.maintenance AS ENUM ('low', 'moderate', 'high');

-- Location and feature types
CREATE TYPE public.location_on_plant AS ENUM ('root', 'stem', 'branch', 'leaf', 'fruit', 'bark', 'whole_plant');
CREATE TYPE public.feature_group AS ENUM ('bark', 'leaf', 'flower', 'fruit', 'habit', 'root');
CREATE TYPE public.life_expectancy_context AS ENUM ('GLOBAL', 'COUNTRY', 'ZONE');

-- Processing and suggestion types
CREATE TYPE public.processing_status AS ENUM ('pending', 'processing', 'completed', 'error');
CREATE TYPE public.suggestion_type AS ENUM ('species', 'defects', 'fungi', 'mitigations');

-- ==================== TABLES ====================

-- Core tree and assessment tables
CREATE TABLE public.trees (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tree_number text,
    species_id text,
    height_m numeric,
    dbh_cm numeric,
    crown_spread_m numeric,
    age_estimate integer,
    latitude numeric,
    longitude numeric,
    location_description text,
    site_conditions text,
    ownership text,
    protected_status boolean DEFAULT false,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.assessments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tree_id uuid,
    assessor_id uuid,
    assessment_date date DEFAULT CURRENT_DATE NOT NULL,
    status public.assessment_status DEFAULT 'draft',
    assessment_method text DEFAULT 'QTRA',
    probability_of_failure public.probability_of_failure,
    consequence_rating public.consequence_rating,
    risk_rating public.risk_rating,
    overall_condition text,
    recommendations text,
    follow_up_date date,
    weather_conditions text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- User management
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    display_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by uuid,
    PRIMARY KEY (user_id, role)
);

CREATE TABLE public.user_public_profiles (
    id uuid PRIMARY KEY,
    display_name text,
    updated_at timestamp with time zone DEFAULT now()
);

-- Knowledge base system
CREATE TABLE public.kb_sources (
    id text PRIMARY KEY,
    title text NOT NULL,
    authors text[],
    year integer,
    publisher text,
    isbn text,
    url text,
    lang text,
    kind text,
    rights text,
    notes text,
    meta jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kb_chunks (
    id bigserial PRIMARY KEY,
    source_id text NOT NULL,
    content text NOT NULL,
    src_content text,
    content_en text,
    lang text DEFAULT 'sv',
    src_lang text,
    pages text,
    species_ids text[],
    defect_ids text[],
    image_ids bigint[],
    embedding vector,
    content_sha256 text,
    meta jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kb_images (
    id bigserial PRIMARY KEY,
    source_id text NOT NULL,
    page integer,
    uri text,
    caption text,
    meta jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

-- Processing queue system
CREATE TABLE public.processing_queue (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id text NOT NULL,
    batch_name text NOT NULL,
    status public.processing_status DEFAULT 'pending' NOT NULL,
    current_phase text DEFAULT 'phase1_extraction',
    total_pages integer DEFAULT 0 NOT NULL,
    processed_pages integer DEFAULT 0 NOT NULL,
    progress_percentage integer DEFAULT 0 NOT NULL,
    current_page integer,
    current_file text,
    current_stage text,
    processing_speed numeric,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    estimated_completion timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.queue_pages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    queue_id uuid NOT NULL,
    page_number integer NOT NULL,
    status public.processing_status DEFAULT 'pending' NOT NULL,
    extracted_text text,
    ocr_confidence numeric,
    figures_extracted jsonb DEFAULT '[]',
    error_message text,
    processed_at timestamp with time zone,
    phase1_completed_at timestamp with time zone,
    phase2_completed_at timestamp with time zone,
    phase3_completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Species and defect knowledge
CREATE TABLE public.species (
    id text PRIMARY KEY,
    scientific_name text NOT NULL,
    common_names text[],
    family text,
    genus text,
    aliases text[],
    regions text[],
    notes text
);

CREATE TABLE public.defects (
    id text PRIMARY KEY,
    name text NOT NULL,
    category public.defect_category NOT NULL,
    field_indicators text[],
    mechanics_effect text,
    development text,
    qtra_guidance jsonb,
    notes text
);

CREATE TABLE public.fungi (
    id text PRIMARY KEY,
    scientific_name text NOT NULL,
    common_names text[],
    decay public.decay_type DEFAULT 'unknown',
    typical_tissue text[],
    colonization text[],
    structural_effect_src text,
    structural_effect_en text,
    source_id text DEFAULT 'book.en.schmidt.2006',
    src_lang text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Species characteristics tables
CREATE TABLE public.species_growth (
    species_id text PRIMARY KEY,
    mature_height_m numeric,
    mature_spread_m numeric,
    growth_rate public.growth_rate,
    crown_form public.crown_form,
    lifespan_years integer,
    maintenance public.maintenance,
    brittle_wood boolean,
    sucker_prone boolean,
    litter_heavy boolean,
    source_id text DEFAULT 'book.sv.stadstradslexikon.2015',
    notes text
);

CREATE TABLE public.species_site_traits (
    species_id text PRIMARY KEY,
    pollution_tolerance smallint,
    deicing_salt_tolerance smallint,
    salt_spray_tolerance smallint,
    drought_tolerance smallint,
    waterlogging_tolerance smallint,
    compaction_tolerance smallint,
    shade_tolerance smallint,
    wind_tolerance smallint,
    soil_ph_pref_low numeric,
    soil_ph_pref_high numeric,
    root_space_need_m3 numeric,
    source_id text DEFAULT 'book.sv.stadstradslexikon.2015',
    notes text
);

-- Additional lookup and reference tables
CREATE TABLE public.countries (
    id text PRIMARY KEY,
    name text NOT NULL
);

CREATE TABLE public.climate_zones (
    id text PRIMARY KEY,
    country_id text NOT NULL,
    scheme text NOT NULL,
    code text NOT NULL,
    name text
);

-- Audit and security
CREATE TABLE public.audit_logs (
    id bigserial PRIMARY KEY,
    user_id uuid,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    details jsonb DEFAULT '{}',
    timestamp timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.auth_attempts (
    id bigserial PRIMARY KEY,
    email text NOT NULL,
    ip_address inet,
    success boolean DEFAULT false,
    attempt_time timestamp with time zone DEFAULT now() NOT NULL
);

-- ==================== FUNCTIONS ====================

-- Core utility functions
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Authentication and authorization functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS TABLE(role public.app_role)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
$$;

-- User management functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_public_profiles (id, display_name)
  VALUES (NEW.id, NEW.display_name)
  ON CONFLICT (id) 
  DO UPDATE SET 
    display_name = NEW.display_name,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Queue processing functions
CREATE OR REPLACE FUNCTION public.update_queue_progress()
RETURNS trigger
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.processing_queue 
  SET 
    processed_pages = (
      SELECT COUNT(*) 
      FROM public.queue_pages 
      WHERE queue_id = NEW.queue_id AND status = 'completed'
    ),
    progress_percentage = CASE 
      WHEN total_pages > 0 THEN 
        ROUND((SELECT COUNT(*) FROM public.queue_pages WHERE queue_id = NEW.queue_id AND status = 'completed')::DECIMAL / total_pages * 100)
      ELSE 0 
    END,
    updated_at = now()
  WHERE id = NEW.queue_id;
  
  RETURN NEW;
END;
$$;

-- Tree access control functions
CREATE OR REPLACE FUNCTION public.get_trees_with_location_access()
RETURNS TABLE(
  id uuid, tree_number text, species_id text, height_m numeric, 
  dbh_cm numeric, crown_spread_m numeric, age_estimate integer,
  created_by uuid, created_at timestamp with time zone, 
  updated_at timestamp with time zone, latitude numeric, 
  longitude numeric, location_description text, site_conditions text,
  ownership text, protected_status boolean, notes text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    t.id, t.tree_number, t.species_id, t.height_m, t.dbh_cm,
    t.crown_spread_m, t.age_estimate, t.created_by, t.created_at,
    t.updated_at,
    CASE 
      WHEN auth.uid() = t.created_by OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'qtra_arborist')
      THEN t.latitude
      ELSE NULL 
    END as latitude,
    CASE 
      WHEN auth.uid() = t.created_by OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'qtra_arborist')
      THEN t.longitude
      ELSE NULL 
    END as longitude,
    t.location_description, t.site_conditions, t.ownership,
    t.protected_status, t.notes
  FROM public.trees t
  WHERE 
    auth.uid() = t.created_by OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'qtra_arborist');
$$;

-- ==================== TRIGGERS ====================

-- Updated timestamp triggers
CREATE TRIGGER tg_set_updated_at_trees
    BEFORE UPDATE ON public.trees
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER tg_set_updated_at_assessments
    BEFORE UPDATE ON public.assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER tg_set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_set_updated_at();

-- Queue progress tracking
CREATE TRIGGER tg_update_queue_progress
    AFTER INSERT OR UPDATE ON public.queue_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_queue_progress();

-- User profile sync
CREATE TRIGGER tg_sync_public_profile
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_public_profile();

-- ==================== RLS POLICIES ====================

-- Enable RLS on all tables
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Trees policies
CREATE POLICY "Users can manage their own trees" ON public.trees
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all trees" ON public.trees
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "QTRA arborists can view trees" ON public.trees
    FOR SELECT USING (has_role(auth.uid(), 'qtra_arborist'));

-- Assessments policies
CREATE POLICY "Users can manage assessments for their trees" ON public.assessments
    FOR ALL USING (
        auth.uid() = assessor_id OR 
        has_role(auth.uid(), 'admin') OR
        EXISTS (
            SELECT 1 FROM public.trees t 
            WHERE t.id = tree_id AND t.created_by = auth.uid()
        )
    );

-- Knowledge base policies
CREATE POLICY "Admins can manage KB sources" ON public.kb_sources
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage KB chunks" ON public.kb_chunks
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view KB" ON public.kb_chunks
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Profile policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Audit policies
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ==================== SAMPLE DATA INSERT ====================
-- Note: This section would contain INSERT statements for your existing data
-- Run the actual data export separately with pg_dump or custom queries

-- Species data
INSERT INTO public.species (id, scientific_name, common_names, family, genus) VALUES
('quercus-robur', 'Quercus robur', ARRAY['English Oak', 'Ek'], 'Fagaceae', 'Quercus'),
('acer-platanoides', 'Acer platanoides', ARRAY['Norway Maple', 'Lönn'], 'Sapindaceae', 'Acer'),
('betula-pendula', 'Betula pendula', ARRAY['Silver Birch', 'Vårtbjörk'], 'Betulaceae', 'Betula');

-- Basic defects
INSERT INTO public.defects (id, name, category, field_indicators) VALUES
('decay-root', 'Root Decay', 'pathological', ARRAY['Fungal fruiting bodies', 'Soft or hollow roots']),
('crack-stem', 'Stem Crack', 'structural', ARRAY['Visible crack', 'Bark disruption']),
('deadwood-crown', 'Crown Deadwood', 'developmental', ARRAY['Dead branches', 'Leaf absence']);

-- Countries and climate zones
INSERT INTO public.countries (id, name) VALUES
('SE', 'Sweden'),
('NO', 'Norway'),
('DK', 'Denmark');

INSERT INTO public.climate_zones (id, country_id, scheme, code, name) VALUES
('se-zone-1', 'SE', 'Swedish', '1', 'Zone 1 (Northern Sweden)'),
('se-zone-2', 'SE', 'Swedish', '2', 'Zone 2 (Central Sweden)'),
('se-zone-3', 'SE', 'Swedish', '3', 'Zone 3 (Southern Sweden)');

-- ==================== INDEXES ====================

-- Performance indexes
CREATE INDEX idx_trees_species ON public.trees(species_id);
CREATE INDEX idx_trees_location ON public.trees(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_assessments_tree ON public.assessments(tree_id);
CREATE INDEX idx_assessments_assessor ON public.assessments(assessor_id);
CREATE INDEX idx_kb_chunks_source ON public.kb_chunks(source_id);
CREATE INDEX idx_kb_chunks_species ON public.kb_chunks USING GIN(species_ids);
CREATE INDEX idx_queue_pages_queue ON public.queue_pages(queue_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- Vector search index (if using embeddings)
CREATE INDEX idx_kb_chunks_embedding ON public.kb_chunks 
USING hnsw (embedding vector_cosine_ops);

-- ==================== GRANTS ====================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant limited permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.species TO authenticated;
GRANT SELECT ON public.defects TO authenticated;

-- ==================== END OF SCHEMA ====================

-- To export actual data, run these commands in your Supabase SQL editor:
-- SELECT * FROM public.kb_chunks;
-- SELECT * FROM public.species_growth;
-- SELECT * FROM public.species_site_traits;
-- SELECT * FROM public.processing_queue;
-- etc. for each table with data you want to preserve