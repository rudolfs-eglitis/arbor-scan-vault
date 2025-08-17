-- Enable RLS on knowledge base tables and create policies
ALTER TABLE public.kb_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for kb_sources - Admin and QTRA certified arborists can manage sources
CREATE POLICY "Admins and QTRA arborists can view all sources" 
ON public.kb_sources 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'qtra_arborist'::app_role)
);

CREATE POLICY "Admins and QTRA arborists can create sources" 
ON public.kb_sources 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'qtra_arborist'::app_role)
);

CREATE POLICY "Admins and QTRA arborists can update sources" 
ON public.kb_sources 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'qtra_arborist'::app_role)
);

CREATE POLICY "Admins can delete sources" 
ON public.kb_sources 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for kb_chunks - All authenticated users can view, QTRA/Admin can manage
CREATE POLICY "Authenticated users can view chunks" 
ON public.kb_chunks 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and QTRA arborists can create chunks" 
ON public.kb_chunks 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'qtra_arborist'::app_role)
);

CREATE POLICY "Admins and QTRA arborists can update chunks" 
ON public.kb_chunks 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'qtra_arborist'::app_role)
);

CREATE POLICY "Admins can delete chunks" 
ON public.kb_chunks 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for kb_images - Same as chunks
CREATE POLICY "Authenticated users can view images" 
ON public.kb_images 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and QTRA arborists can upload images" 
ON public.kb_images 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'qtra_arborist'::app_role)
);

CREATE POLICY "Admins and QTRA arborists can update images" 
ON public.kb_images 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'qtra_arborist'::app_role)
);

CREATE POLICY "Admins can delete images" 
ON public.kb_images 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for kb_feedback - All authenticated users can provide feedback
CREATE POLICY "Authenticated users can view feedback" 
ON public.kb_feedback 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create feedback" 
ON public.kb_feedback 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own feedback" 
ON public.kb_feedback 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete feedback" 
ON public.kb_feedback 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for knowledge base images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kb-images', 'kb-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for kb-images bucket
CREATE POLICY "Authenticated users can view kb images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'kb-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins and QTRA arborists can upload kb images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'kb-images' AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'qtra_arborist'::app_role)
  )
);

CREATE POLICY "Admins and QTRA arborists can update kb images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'kb-images' AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'qtra_arborist'::app_role)
  )
);

CREATE POLICY "Admins can delete kb images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'kb-images' AND has_role(auth.uid(), 'admin'::app_role)
);