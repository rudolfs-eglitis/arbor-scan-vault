-- Add columns to track current processing file
ALTER TABLE public.processing_queue 
ADD COLUMN current_page integer,
ADD COLUMN current_file text;