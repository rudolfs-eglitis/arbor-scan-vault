-- Update RLS policies to restrict knowledge base management to admins only
-- Remove QTRA arborist access from knowledge base tables

-- Update kb_sources policies
DROP POLICY IF EXISTS "Admins and QTRA arborists can create sources" ON public.kb_sources;
DROP POLICY IF EXISTS "Admins and QTRA arborists can update sources" ON public.kb_sources;
DROP POLICY IF EXISTS "Admins and QTRA arborists can view all sources" ON public.kb_sources;

CREATE POLICY "Admins can create sources" 
ON public.kb_sources 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sources" 
ON public.kb_sources 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all sources" 
ON public.kb_sources 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update kb_images policies  
DROP POLICY IF EXISTS "Admins and QTRA arborists can upload images" ON public.kb_images;
DROP POLICY IF EXISTS "Admins and QTRA arborists can update images" ON public.kb_images;

CREATE POLICY "Admins can upload images" 
ON public.kb_images 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update images" 
ON public.kb_images 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update kb_chunks policies
DROP POLICY IF EXISTS "Admins and QTRA arborists can create chunks" ON public.kb_chunks;
DROP POLICY IF EXISTS "Admins and QTRA arborists can update chunks" ON public.kb_chunks;

CREATE POLICY "Admins can create chunks" 
ON public.kb_chunks 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update chunks" 
ON public.kb_chunks 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));