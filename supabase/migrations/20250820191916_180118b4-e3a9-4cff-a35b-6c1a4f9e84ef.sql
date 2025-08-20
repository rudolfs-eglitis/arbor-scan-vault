-- Create tree-photos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tree-photos', 'tree-photos', true);

-- Create policies for tree-photos bucket
CREATE POLICY "Authenticated users can view tree photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'tree-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload tree photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tree-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own tree photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tree-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own tree photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'tree-photos' AND auth.uid() IS NOT NULL);

-- Create enum for assessment status
CREATE TYPE assessment_status AS ENUM ('draft', 'completed', 'reviewed', 'archived');

-- Create enum for risk rating
CREATE TYPE risk_rating AS ENUM ('very_low', 'low', 'moderate', 'high', 'very_high');

-- Create enum for target type
CREATE TYPE target_type AS ENUM ('people', 'property', 'infrastructure', 'vehicle', 'other');

-- Create trees table
CREATE TABLE public.trees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_number TEXT,
    species_id TEXT REFERENCES public.species(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    dbh_cm DECIMAL(6, 2) CHECK (dbh_cm >= 1 AND dbh_cm <= 1500),
    height_m DECIMAL(5, 2) CHECK (height_m >= 1 AND height_m <= 120),
    crown_spread_m DECIMAL(5, 2),
    age_estimate INTEGER,
    location_description TEXT,
    site_conditions TEXT,
    ownership TEXT,
    protected_status BOOLEAN DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on trees
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;

-- Create policies for trees
CREATE POLICY "Authenticated users can view trees"
ON public.trees FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create trees"
ON public.trees FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users can update trees they created"
ON public.trees FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete trees"
ON public.trees FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create assessments table
CREATE TABLE public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    assessor_id UUID REFERENCES auth.users(id),
    assessment_method TEXT DEFAULT 'QTRA',
    weather_conditions TEXT,
    overall_condition TEXT,
    probability_of_failure risk_rating,
    consequence_rating risk_rating,
    risk_rating risk_rating,
    recommendations TEXT,
    follow_up_date DATE,
    status assessment_status DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on assessments
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Create policies for assessments
CREATE POLICY "Authenticated users can view assessments"
ON public.assessments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create assessments"
ON public.assessments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND assessor_id = auth.uid());

CREATE POLICY "Users can update assessments they created"
ON public.assessments FOR UPDATE
USING (auth.uid() = assessor_id);

CREATE POLICY "Admins can manage all assessments"
ON public.assessments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create tree_defects table
CREATE TABLE public.tree_defects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
    defect_id TEXT REFERENCES public.defects(id),
    location_on_tree TEXT,
    severity_rating INTEGER CHECK (severity_rating >= 1 AND severity_rating <= 5),
    extent_percentage DECIMAL(5, 2),
    description TEXT,
    affects_structure BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on tree_defects
ALTER TABLE public.tree_defects ENABLE ROW LEVEL SECURITY;

-- Create policies for tree_defects
CREATE POLICY "Authenticated users can view tree defects"
ON public.tree_defects FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create tree defects"
ON public.tree_defects FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update tree defects for their assessments"
ON public.tree_defects FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.assessments a 
        WHERE a.id = tree_defects.assessment_id 
        AND a.assessor_id = auth.uid()
    )
);

-- Create tree_targets table
CREATE TABLE public.tree_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
    target_type target_type NOT NULL,
    description TEXT,
    distance_m DECIMAL(6, 2),
    occupancy_frequency TEXT,
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on tree_targets
ALTER TABLE public.tree_targets ENABLE ROW LEVEL SECURITY;

-- Create policies for tree_targets
CREATE POLICY "Authenticated users can view tree targets"
ON public.tree_targets FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create tree targets"
ON public.tree_targets FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update tree targets for their assessments"
ON public.tree_targets FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.assessments a 
        WHERE a.id = tree_targets.assessment_id 
        AND a.assessor_id = auth.uid()
    )
);

-- Create tree_photos table
CREATE TABLE public.tree_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
    tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    caption TEXT,
    photo_type TEXT,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on tree_photos
ALTER TABLE public.tree_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for tree_photos
CREATE POLICY "Authenticated users can view tree photos"
ON public.tree_photos FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload tree photos"
ON public.tree_photos FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND uploaded_by = auth.uid());

CREATE POLICY "Users can update photos they uploaded"
ON public.tree_photos FOR UPDATE
USING (auth.uid() = uploaded_by);

-- Create tree_neighbors table
CREATE TABLE public.tree_neighbors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE,
    neighbor_tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE,
    distance_m DECIMAL(6, 2),
    relationship_type TEXT,
    influence_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT different_trees CHECK (primary_tree_id != neighbor_tree_id)
);

-- Enable RLS on tree_neighbors
ALTER TABLE public.tree_neighbors ENABLE ROW LEVEL SECURITY;

-- Create policies for tree_neighbors
CREATE POLICY "Authenticated users can view tree neighbors"
ON public.tree_neighbors FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create tree neighbor relationships"
ON public.tree_neighbors FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_trees_updated_at
    BEFORE UPDATE ON public.trees
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON public.assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_set_updated_at();

-- Create assessment view for QTRA methodology
CREATE TABLE public.assessment_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    methodology TEXT NOT NULL,
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on assessment_views
ALTER TABLE public.assessment_views ENABLE ROW LEVEL SECURITY;

-- Create policies for assessment_views
CREATE POLICY "Authenticated users can view assessment views"
ON public.assessment_views FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage assessment views"
ON public.assessment_views FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default QTRA assessment view
INSERT INTO public.assessment_views (name, description, methodology, configuration)
VALUES (
    'QTRA',
    'Quantified Tree Risk Assessment methodology',
    'QTRA',
    '{
        "probability_factors": ["size_of_part", "target_zone", "defect_severity"],
        "consequence_factors": ["target_value", "occupancy"],
        "risk_matrix": {
            "very_low": {"min": 0, "max": 1000000},
            "low": {"min": 1000001, "max": 10000000},
            "moderate": {"min": 10000001, "max": 100000000},
            "high": {"min": 100000001, "max": 1000000000},
            "very_high": {"min": 1000000001, "max": null}
        }
    }'
);

-- Create indexes for performance
CREATE INDEX idx_trees_location ON public.trees USING btree (latitude, longitude);
CREATE INDEX idx_trees_species ON public.trees (species_id);
CREATE INDEX idx_trees_created_by ON public.trees (created_by);
CREATE INDEX idx_assessments_tree_id ON public.assessments (tree_id);
CREATE INDEX idx_assessments_assessor ON public.assessments (assessor_id);
CREATE INDEX idx_assessments_date ON public.assessments (assessment_date);
CREATE INDEX idx_tree_defects_assessment ON public.tree_defects (assessment_id);
CREATE INDEX idx_tree_targets_assessment ON public.tree_targets (assessment_id);
CREATE INDEX idx_tree_photos_assessment ON public.tree_photos (assessment_id);
CREATE INDEX idx_tree_photos_tree ON public.tree_photos (tree_id);