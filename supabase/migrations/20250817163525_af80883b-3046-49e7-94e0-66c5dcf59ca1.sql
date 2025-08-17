-- Add unique constraint to prevent duplicate images for same source and page
ALTER TABLE public.kb_images 
ADD CONSTRAINT unique_source_page UNIQUE (source_id, page);