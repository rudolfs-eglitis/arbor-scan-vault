-- Create proper RLS policies for storage objects
CREATE POLICY "Authenticated users can upload images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'kb-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can view images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'kb-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'kb-images' 
  AND auth.uid() IS NOT NULL
) 
WITH CHECK (
  bucket_id = 'kb-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'kb-images' 
  AND auth.uid() IS NOT NULL
);

-- Ensure admins can manage all images
CREATE POLICY "Admins can manage all images" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'kb-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);