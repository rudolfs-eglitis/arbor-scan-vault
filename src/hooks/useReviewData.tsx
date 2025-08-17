import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReviewChunk {
  id: number;
  source_id: string;
  content: string;
  content_en: string | null;
  src_content: string | null;
  lang: string;
  pages: string | null;
  species_ids: string[] | null;
  defect_ids: string[] | null;
  image_ids: number[] | null;
  meta: any;
  created_at: string;
  embedding: any;
}

export interface ReviewSource {
  id: string;
  title: string;
  authors: string[] | null;
  year: number | null;
  publisher: string | null;
  created_at: string;
  meta: any;
}

export interface SpeciesAggregation {
  species_id: string;
  chunks: ReviewChunk[];
  pages: number[];
  totalContent: string;
}

export interface ReviewProgress {
  totalChunks: number;
  reviewedChunks: number;
  percentage: number;
}

export interface PageSuggestion {
  id: string;
  page_id: string;
  suggestion_type: 'species' | 'defect' | 'fungus' | 'mitigation' | 'feature' | 'other';
  suggested_data: any;
  confidence_score: number | null;
  target_table: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export const useReviewData = () => {
  const [sources, setSources] = useState<ReviewSource[]>([]);
  const [chunks, setChunks] = useState<ReviewChunk[]>([]);
  const [suggestions, setSuggestions] = useState<PageSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'page' | 'species'>('page');
  const { toast } = useToast();

  // Fetch all sources that have chunks
  const fetchSources = useCallback(async () => {
    try {
      // Get all sources
      const { data: allSources, error: sourcesError } = await supabase
        .from('kb_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (sourcesError) throw sourcesError;
      
      // For each source, check if it has chunks
      const sourcesWithChunks = [];
      for (const source of allSources || []) {
        const { count } = await supabase
          .from('kb_chunks')
          .select('*', { count: 'exact', head: true })
          .eq('source_id', source.id);
        
        if (count && count > 0) {
          sourcesWithChunks.push({
            id: source.id,
            title: source.title,
            authors: source.authors,
            year: source.year,
            publisher: source.publisher,
            created_at: source.created_at,
            meta: source.meta
          });
        }
      }

      setSources(sourcesWithChunks);
    } catch (error) {
      console.error('Error fetching sources:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch review sources',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Fetch chunks for selected source
  const fetchChunksForSource = useCallback(async (sourceId: string) => {
    if (!sourceId) {
      setChunks([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('kb_chunks')
        .select('*')
        .eq('source_id', sourceId)
        .order('pages', { ascending: true });

      if (error) throw error;
      setChunks(data || []);
    } catch (error) {
      console.error('Error fetching chunks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch content chunks',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Fetch AI suggestions for current source
  const fetchSuggestions = useCallback(async (sourceId: string) => {
    if (!sourceId) {
      setSuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('page_suggestions')
        .select('*')
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, []);

  // Aggregate content by species
  const getSpeciesAggregations = useCallback((chunks: ReviewChunk[]): SpeciesAggregation[] => {
    const speciesMap = new Map<string, SpeciesAggregation>();

    chunks.forEach(chunk => {
      if (chunk.species_ids && chunk.species_ids.length > 0) {
        chunk.species_ids.forEach(speciesId => {
          if (!speciesMap.has(speciesId)) {
            speciesMap.set(speciesId, {
              species_id: speciesId,
              chunks: [],
              pages: [],
              totalContent: ''
            });
          }

          const aggregation = speciesMap.get(speciesId)!;
          aggregation.chunks.push(chunk);
          
          // Extract page numbers from chunk.pages (e.g., "1-3" or "5")
          if (chunk.pages) {
            const pageNumbers = chunk.pages.split(/[,-]/).map(p => parseInt(p.trim())).filter(p => !isNaN(p));
            pageNumbers.forEach(pageNum => {
              if (!aggregation.pages.includes(pageNum)) {
                aggregation.pages.push(pageNum);
              }
            });
          }

          // Combine content
          if (aggregation.totalContent) {
            aggregation.totalContent += '\n\n' + (chunk.content_en || chunk.content);
          } else {
            aggregation.totalContent = chunk.content_en || chunk.content;
          }
        });
      }
    });

    // Sort pages for each species
    speciesMap.forEach(aggregation => {
      aggregation.pages.sort((a, b) => a - b);
    });

    return Array.from(speciesMap.values()).sort((a, b) => a.species_id.localeCompare(b.species_id));
  }, []);

  // Calculate review progress
  const getReviewProgress = useCallback((chunks: ReviewChunk[]): ReviewProgress => {
    const totalChunks = chunks.length;
    // Count chunks that have been edited (have content_en different from content or meta.reviewed = true)
    const reviewedChunks = chunks.filter(chunk => 
      chunk.content_en !== chunk.content || 
      (chunk.meta && chunk.meta.reviewed === true)
    ).length;

    return {
      totalChunks,
      reviewedChunks,
      percentage: totalChunks > 0 ? Math.round((reviewedChunks / totalChunks) * 100) : 0
    };
  }, []);

  // Update chunk content
  const updateChunkContent = useCallback(async (chunkId: number, content: string, contentEn?: string) => {
    try {
      const updates: any = { content };
      if (contentEn) {
        updates.content_en = contentEn;
      }
      
      // Mark as reviewed in meta
      const currentChunk = chunks.find(c => c.id === chunkId);
      if (currentChunk) {
        updates.meta = {
          ...currentChunk.meta,
          reviewed: true,
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'user' // TODO: get actual user ID
        };
      }

      const { error } = await supabase
        .from('kb_chunks')
        .update(updates)
        .eq('id', chunkId);

      if (error) throw error;

      // Update local state
      setChunks(prev => prev.map(chunk => 
        chunk.id === chunkId 
          ? { ...chunk, ...updates }
          : chunk
      ));

      toast({
        title: 'Success',
        description: 'Content updated successfully'
      });
    } catch (error) {
      console.error('Error updating chunk:', error);
      toast({
        title: 'Error',
        description: 'Failed to update content',
        variant: 'destructive'
      });
    }
  }, [chunks, toast]);

  // Handle source selection
  const selectSource = useCallback((sourceId: string) => {
    setSelectedSourceId(sourceId);
    fetchChunksForSource(sourceId);
    fetchSuggestions(sourceId);
  }, [fetchChunksForSource, fetchSuggestions]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSources();
      setLoading(false);
    };

    loadData();
  }, [fetchSources]);

  return {
    sources,
    chunks,
    suggestions,
    loading,
    selectedSourceId,
    viewMode,
    setViewMode,
    selectSource,
    getSpeciesAggregations: () => getSpeciesAggregations(chunks),
    getReviewProgress: () => getReviewProgress(chunks),
    updateChunkContent,
    refreshSources: fetchSources,
    refreshChunks: () => fetchChunksForSource(selectedSourceId),
    refreshSuggestions: () => fetchSuggestions(selectedSourceId)
  };
};