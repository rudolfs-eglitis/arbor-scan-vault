import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrphanedRecord {
  source_id: string;
  page: number;
  uri: string;
  batch_number?: string;
}

export const useOrphanedRecords = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const findOrphanedRecords = async (): Promise<OrphanedRecord[]> => {
    try {
      // Find kb_images that don't have corresponding processing_queue items
      const { data, error } = await supabase
        .from('kb_images')
        .select(`
          source_id,
          page,
          uri,
          meta
        `)
        .not('source_id', 'in', `(
          SELECT DISTINCT source_id 
          FROM processing_queue 
          WHERE source_id IS NOT NULL
        )`);

      if (error) throw error;

      return data?.map(record => ({
        source_id: record.source_id,
        page: record.page,
        uri: record.uri,
        batch_number: record.meta && typeof record.meta === 'object' && 'batch' in record.meta 
          ? String(record.meta.batch) 
          : undefined
      })) || [];

    } catch (error) {
      console.error('Error finding orphaned records:', error);
      throw error;
    }
  };

  const cleanupOrphanedRecords = async (records?: OrphanedRecord[]) => {
    setIsLoading(true);
    try {
      let recordsToClean = records;
      
      if (!recordsToClean) {
        recordsToClean = await findOrphanedRecords();
      }

      if (recordsToClean.length === 0) {
        toast({
          title: 'No Orphaned Records',
          description: 'No orphaned records found to clean up.',
        });
        return [];
      }

      console.log('Cleaning up orphaned records:', recordsToClean);

      // Delete storage files
      const storageFilesToDelete = recordsToClean.map(record => record.uri);
      
      if (storageFilesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('kb-images')
          .remove(storageFilesToDelete);

        if (storageError) {
          console.warn('Some storage files could not be deleted:', storageError);
        }
      }

      // Delete database records
      const recordsToDelete = recordsToClean.map(record => ({
        source_id: record.source_id,
        page: record.page
      }));

      for (const record of recordsToDelete) {
        const { error: dbError } = await supabase
          .from('kb_images')
          .delete()
          .eq('source_id', record.source_id)
          .eq('page', record.page);

        if (dbError) {
          console.error('Error deleting database record:', dbError);
        }
      }

      toast({
        title: 'Cleanup Complete',
        description: `Cleaned up ${recordsToClean.length} orphaned records.`,
      });

      return recordsToClean;

    } catch (error) {
      console.error('Error cleaning up orphaned records:', error);
      toast({
        title: 'Cleanup Failed',
        description: 'Failed to clean up orphaned records. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    findOrphanedRecords,
    cleanupOrphanedRecords,
    isLoading
  };
};