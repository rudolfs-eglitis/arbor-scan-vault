-- Update kb_chunks table to default to English instead of Swedish
ALTER TABLE kb_chunks ALTER COLUMN lang SET DEFAULT 'en';

-- Update kb_sources table to default to English instead of Swedish  
ALTER TABLE kb_sources ALTER COLUMN lang SET DEFAULT 'en';

-- Update any other language-related defaults
UPDATE kb_chunks SET lang = 'en' WHERE lang = 'sv' AND content_en IS NOT NULL;

-- Add comment to document the English-first approach
COMMENT ON COLUMN kb_chunks.lang IS 'Primary language for extracted content, defaults to English (en)';
COMMENT ON COLUMN kb_chunks.src_lang IS 'Original source language (may differ from processed content language)';
COMMENT ON COLUMN kb_chunks.content IS 'Primary content in English (canonical version)';
COMMENT ON COLUMN kb_chunks.src_content IS 'Original content in source language (when different from English)';
COMMENT ON COLUMN kb_chunks.content_en IS 'English translation (for backward compatibility during transition)';