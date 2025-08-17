-- Create processing queue tables and page suggestion system

-- Create enum for processing status
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'error', 'paused');

-- Create enum for suggestion types
CREATE TYPE suggestion_type AS ENUM ('species', 'defect', 'fungus', 'mitigation', 'feature', 'other');

-- Create processing queue table
CREATE TABLE public.processing_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES public.kb_sources(id) ON DELETE CASCADE,
  batch_name TEXT NOT NULL,
  status processing_status NOT NULL DEFAULT 'pending',
  total_pages INTEGER NOT NULL DEFAULT 0,
  processed_pages INTEGER NOT NULL DEFAULT 0,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create individual page processing table
CREATE TABLE public.queue_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID NOT NULL REFERENCES public.processing_queue(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  status processing_status NOT NULL DEFAULT 'pending',
  extracted_text TEXT,
  ocr_confidence DECIMAL(3,2),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(queue_id, page_number)
);

-- Create page suggestions table for AI-suggested data extraction
CREATE TABLE public.page_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.queue_pages(id) ON DELETE CASCADE,
  suggestion_type suggestion_type NOT NULL,
  suggested_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2),
  target_table TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, applied
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for processing_queue
CREATE POLICY "Authenticated users can view processing queue" 
ON public.processing_queue 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage processing queue" 
ON public.processing_queue 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for queue_pages  
CREATE POLICY "Authenticated users can view queue pages" 
ON public.queue_pages 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage queue pages" 
ON public.queue_pages 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for page_suggestions
CREATE POLICY "Authenticated users can view page suggestions" 
ON public.page_suggestions 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and QTRA arborists can manage suggestions" 
ON public.page_suggestions 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'qtra_arborist'::app_role));

-- Create function to update queue progress
CREATE OR REPLACE FUNCTION update_queue_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the processing queue progress when pages are updated
  UPDATE public.processing_queue 
  SET 
    processed_pages = (
      SELECT COUNT(*) 
      FROM public.queue_pages 
      WHERE queue_id = NEW.queue_id AND status = 'completed'
    ),
    progress_percentage = CASE 
      WHEN total_pages > 0 THEN 
        ROUND((SELECT COUNT(*) FROM public.queue_pages WHERE queue_id = NEW.queue_id AND status = 'completed')::DECIMAL / total_pages * 100)
      ELSE 0 
    END,
    updated_at = now()
  WHERE id = NEW.queue_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update queue progress
CREATE TRIGGER update_queue_progress_trigger
  AFTER UPDATE OF status ON public.queue_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_progress();

-- Create function to update updated_at timestamp
CREATE TRIGGER update_processing_queue_updated_at
  BEFORE UPDATE ON public.processing_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER update_queue_pages_updated_at
  BEFORE UPDATE ON public.queue_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER update_page_suggestions_updated_at
  BEFORE UPDATE ON public.page_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();

-- Create indexes for performance
CREATE INDEX idx_processing_queue_status ON public.processing_queue(status);
CREATE INDEX idx_processing_queue_source_id ON public.processing_queue(source_id);
CREATE INDEX idx_queue_pages_queue_id ON public.queue_pages(queue_id);
CREATE INDEX idx_queue_pages_status ON public.queue_pages(status);
CREATE INDEX idx_page_suggestions_page_id ON public.page_suggestions(page_id);
CREATE INDEX idx_page_suggestions_type_status ON public.page_suggestions(suggestion_type, status);