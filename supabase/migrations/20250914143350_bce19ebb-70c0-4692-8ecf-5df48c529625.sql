-- Create assessment types enum
CREATE TYPE assessment_type AS ENUM ('basic_ai', 'detailed_ai', 'qtra_validation', 'traq_validation', 'dual_validation', 'expert_manual');

-- Add assessment_type column to credit_transactions table
ALTER TABLE public.credit_transactions 
ADD COLUMN assessment_type assessment_type DEFAULT NULL;

-- Add validation_type to assessments table for tracking professional validations
ALTER TABLE public.assessments 
ADD COLUMN assessment_type assessment_type DEFAULT 'basic_ai',
ADD COLUMN validation_requested boolean DEFAULT false,
ADD COLUMN validation_type text DEFAULT NULL;

-- Create credit packages table for managing credit purchase tiers
CREATE TABLE public.credit_packages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    credits integer NOT NULL,
    price_usd numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on credit_packages
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing credit packages
CREATE POLICY "Authenticated users can view credit packages" 
ON public.credit_packages 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create policy for admins to manage credit packages
CREATE POLICY "Admins can manage credit packages" 
ON public.credit_packages 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default credit packages
INSERT INTO public.credit_packages (name, credits, price_usd) VALUES
('Starter Pack', 50, 7.50),
('Professional Pack', 150, 20.00),
('Expert Pack', 300, 35.00),
('Enterprise Pack', 750, 75.00);

-- Create expert reviews table for custom pricing requests
CREATE TABLE public.expert_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
    requester_id uuid NOT NULL,
    location_description text NOT NULL,
    urgency_level text DEFAULT 'standard',
    preferred_expert_id uuid DEFAULT NULL,
    custom_price_usd numeric(10,2) DEFAULT NULL,
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    scheduled_date timestamp with time zone DEFAULT NULL,
    completed_at timestamp with time zone DEFAULT NULL,
    expert_notes text DEFAULT NULL
);

-- Enable RLS on expert_reviews
ALTER TABLE public.expert_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for expert_reviews
CREATE POLICY "Users can view their own expert reviews" 
ON public.expert_reviews 
FOR SELECT 
USING (auth.uid() = requester_id);

CREATE POLICY "Users can create expert reviews" 
ON public.expert_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Experts can view assigned reviews" 
ON public.expert_reviews 
FOR SELECT 
USING (auth.uid() = preferred_expert_id OR has_role(auth.uid(), 'qtra_arborist'::app_role) OR has_role(auth.uid(), 'traq_arborist'::app_role));

CREATE POLICY "Experts can update assigned reviews" 
ON public.expert_reviews 
FOR UPDATE 
USING (auth.uid() = preferred_expert_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all expert reviews" 
ON public.expert_reviews 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));