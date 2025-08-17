-- Add current_stage column to processing_queue table for tracking processing stages
ALTER TABLE public.processing_queue 
ADD COLUMN current_stage TEXT;

-- Add processing_speed column to track pages per minute
ALTER TABLE public.processing_queue 
ADD COLUMN processing_speed DECIMAL(5,2);

-- Add comment for documentation
COMMENT ON COLUMN public.processing_queue.current_stage IS 'Current processing stage: loading, ocr, processing, saving, suggestions';
COMMENT ON COLUMN public.processing_queue.processing_speed IS 'Processing speed in pages per minute';