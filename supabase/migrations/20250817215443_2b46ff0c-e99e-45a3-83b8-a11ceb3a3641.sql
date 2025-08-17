-- Clear all processing-related data for fresh start
-- Step 1: Clear processing data tables
DELETE FROM public.kb_chunks;
DELETE FROM public.kb_images;
DELETE FROM public.queue_pages;
DELETE FROM public.processing_queue;
DELETE FROM public.page_suggestions;
DELETE FROM public.kb_feedback;

-- Step 2: Clear storage buckets
DELETE FROM storage.objects WHERE bucket_id = 'kb-images';
DELETE FROM storage.objects WHERE bucket_id = 'kb-figures';

-- Verification queries (commented out, but you can run these to verify cleanup)
-- SELECT COUNT(*) as kb_chunks_count FROM public.kb_chunks;
-- SELECT COUNT(*) as kb_images_count FROM public.kb_images;
-- SELECT COUNT(*) as queue_pages_count FROM public.queue_pages;
-- SELECT COUNT(*) as processing_queue_count FROM public.processing_queue;
-- SELECT COUNT(*) as kb_sources_count FROM public.kb_sources; -- Should remain 2
-- SELECT COUNT(*) as kb_images_storage FROM storage.objects WHERE bucket_id = 'kb-images';
-- SELECT COUNT(*) as kb_figures_storage FROM storage.objects WHERE bucket_id = 'kb-figures';