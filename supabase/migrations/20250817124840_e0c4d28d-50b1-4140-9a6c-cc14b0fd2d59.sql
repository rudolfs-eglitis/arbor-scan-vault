-- Create kb_images table for storing page images
CREATE TABLE IF NOT EXISTS public.kb_images (
  id           bigserial PRIMARY KEY,
  source_id    text NOT NULL REFERENCES public.kb_sources(id) ON DELETE CASCADE,
  page         int,
  caption      text,
  uri          text,             -- storage path or URL
  meta         jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now()
);

-- Add image_ids column to kb_chunks if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kb_chunks' AND column_name = 'image_ids') THEN
        ALTER TABLE public.kb_chunks ADD COLUMN image_ids bigint[] NULL;
    END IF;
END $$;

-- Add content_sha256 column to kb_chunks if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kb_chunks' AND column_name = 'content_sha256') THEN
        ALTER TABLE public.kb_chunks ADD COLUMN content_sha256 text;
    END IF;
END $$;

-- Create unique index for deduplication if it doesn't exist
DROP INDEX IF EXISTS kb_chunks_dedup;
CREATE UNIQUE INDEX kb_chunks_dedup
  ON public.kb_chunks (source_id, pages, content_sha256);