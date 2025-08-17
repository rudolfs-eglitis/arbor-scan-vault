import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SourceMeta {
  totalPages?: number;
  uploadedPages?: number;
  processedPages?: number;
  chunksCount?: number;
}

export interface KnowledgeSource {
  id: string;
  title: string;
  authors?: string[];
  year?: number;
  publisher?: string;
  kind?: string;
  notes?: string;
  created_at: string;
  meta?: SourceMeta;
}

export interface SourceStats {
  totalSources: number;
  totalChunks: number;
  totalPages: number;
  uploadedPages: number;
}

export const useKnowledgeBase = () => {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SourceStats>({
    totalSources: 0,
    totalChunks: 0,
    totalPages: 0,
    uploadedPages: 0
  });
  const { toast } = useToast();

  const mapDbSourceToKnowledgeSource = (dbSource: any): KnowledgeSource => {
    return {
      id: dbSource.id,
      title: dbSource.title,
      authors: dbSource.authors,
      year: dbSource.year,
      publisher: dbSource.publisher,
      kind: dbSource.kind,
      notes: dbSource.notes,
      created_at: dbSource.created_at,
      meta: dbSource.meta as SourceMeta
    };
  };

  const fetchSources = async () => {
    try {
      const { data, error } = await supabase
        .from('kb_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedSources = (data || []).map(mapDbSourceToKnowledgeSource);
      setSources(mappedSources);
    } catch (error) {
      console.error('Error fetching sources:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch knowledge sources',
        variant: 'destructive'
      });
    }
  };

  const fetchStats = async () => {
    try {
      // Get sources count
      const { count: sourcesCount } = await supabase
        .from('kb_sources')
        .select('*', { count: 'exact', head: true });

      // Get chunks count  
      const { count: chunksCount } = await supabase
        .from('kb_chunks')
        .select('*', { count: 'exact', head: true });

      // Calculate page stats from sources meta
      const { data: sourcesWithMeta } = await supabase
        .from('kb_sources')
        .select('meta')
        .not('meta', 'is', null);

      let totalPages = 0;
      let uploadedPages = 0;

      sourcesWithMeta?.forEach(source => {
        const meta = source.meta as SourceMeta;
        if (meta?.totalPages) {
          totalPages += meta.totalPages;
        }
        if (meta?.uploadedPages) {
          uploadedPages += meta.uploadedPages;
        }
      });

      setStats({
        totalSources: sourcesCount || 0,
        totalChunks: chunksCount || 0,
        totalPages,
        uploadedPages
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const addSource = async (sourceData: Omit<KnowledgeSource, 'id' | 'created_at'>) => {
    try {
      // Generate a unique ID for the source
      const sourceId = `source.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
      
      const dbData = {
        id: sourceId,
        title: sourceData.title,
        authors: sourceData.authors || null,
        year: sourceData.year || null,
        publisher: sourceData.publisher || null,
        kind: sourceData.kind || null,
        notes: sourceData.notes || null,
        meta: sourceData.meta as any
      };

      const { data, error } = await supabase
        .from('kb_sources')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      const mappedSource = mapDbSourceToKnowledgeSource(data);
      setSources(prev => [mappedSource, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Knowledge source added successfully'
      });
      
      return mappedSource;
    } catch (error) {
      console.error('Error adding source:', error);
      toast({
        title: 'Error',
        description: 'Failed to add knowledge source',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateSource = async (id: string, updates: Partial<KnowledgeSource>) => {
    try {
      const dbUpdates = {
        ...updates,
        meta: updates.meta as any
      };

      const { data, error } = await supabase
        .from('kb_sources')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const mappedSource = mapDbSourceToKnowledgeSource(data);
      setSources(prev => prev.map(source => 
        source.id === id ? mappedSource : source
      ));

      toast({
        title: 'Success',
        description: 'Source updated successfully'
      });

      return mappedSource;
    } catch (error) {
      console.error('Error updating source:', error);
      toast({
        title: 'Error',
        description: 'Failed to update source',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('kb_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSources(prev => prev.filter(source => source.id !== id));
      toast({
        title: 'Success',
        description: 'Source deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting source:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete source',
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSources(), fetchStats()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    sources,
    stats,
    loading,
    addSource,
    updateSource,
    deleteSource,
    refreshSources: fetchSources,
    refreshStats: fetchStats
  };
};