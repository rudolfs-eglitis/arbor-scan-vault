-- Create kb-figures storage bucket for extracted images/diagrams
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kb-figures', 'kb-figures', true);

-- Create RLS policies for kb-figures bucket
CREATE POLICY "Authenticated users can view figures" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'kb-figures' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can upload figures" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'kb-figures' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update figures" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'kb-figures' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete figures" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'kb-figures' AND has_role(auth.uid(), 'admin'::app_role));

-- Add phase tracking to processing_queue
ALTER TABLE processing_queue 
ADD COLUMN IF NOT EXISTS current_phase TEXT DEFAULT 'phase1_extraction';

-- Add figure metadata to kb_chunks
UPDATE kb_chunks 
SET meta = COALESCE(meta, '{}'::jsonb) || '{"processing_phase": "phase1_extraction", "figures": []}'::jsonb
WHERE meta->>'processing_phase' IS NULL;

-- Add phase completion tracking to queue_pages
ALTER TABLE queue_pages 
ADD COLUMN IF NOT EXISTS phase1_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phase2_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phase3_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS figures_extracted JSONB DEFAULT '[]'::jsonb;