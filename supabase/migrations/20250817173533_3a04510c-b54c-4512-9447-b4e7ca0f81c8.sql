-- Make the kb-images bucket public so images can be displayed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'kb-images';

-- Create RLS policies for public read access to images
CREATE POLICY "Allow public read access to kb-images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'kb-images');

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload to kb-images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'kb-images' AND auth.uid() IS NOT NULL);

-- Allow admin users to manage images
CREATE POLICY "Allow admin users to manage kb-images" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'kb-images' AND has_role(auth.uid(), 'admin'::app_role));