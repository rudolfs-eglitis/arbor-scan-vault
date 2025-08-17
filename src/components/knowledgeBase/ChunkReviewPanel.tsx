import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, Save, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Chunk {
  id: number;
  pages: string | null;
  content: string;
  src_content: string | null;
  src_lang: string | null;
  lang: string;
  meta: any;
  image_ids: number[] | null;
}

interface ChunkReviewPanelProps {
  sourceId: string;
  onProgress: (reviewed: number, total: number) => void;
}

export const ChunkReviewPanel = ({ sourceId, onProgress }: ChunkReviewPanelProps) => {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [reviewedChunks, setReviewedChunks] = useState(new Set<number>());
  const { toast } = useToast();

  useEffect(() => {
    fetchChunks();
  }, [sourceId]);

  useEffect(() => {
    onProgress(reviewedChunks.size, chunks.length);
  }, [reviewedChunks, chunks.length, onProgress]);

  const fetchChunks = async () => {
    try {
      const { data, error } = await supabase
        .from('kb_chunks')
        .select('id, pages, content, src_content, src_lang, lang, meta, image_ids')
        .eq('source_id', sourceId)
        .order('pages', { ascending: true });

      if (error) throw error;

      setChunks(data || []);
    } catch (error) {
      console.error('Error fetching chunks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load text chunks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveChunk = async (chunkId: number, content: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('kb_chunks')
        .update({ 
          content,
          meta: {
            ...chunks[currentChunkIndex].meta,
            manual_review: true,
            reviewed_at: new Date().toISOString(),
          }
        })
        .eq('id', chunkId);

      if (error) throw error;

      // Update local state
      setChunks(prev => prev.map(chunk => 
        chunk.id === chunkId ? { ...chunk, content } : chunk
      ));

      // Mark as reviewed
      setReviewedChunks(prev => new Set([...prev, chunkId]));

      toast({
        title: 'Saved',
        description: 'Text chunk updated successfully',
      });
    } catch (error) {
      console.error('Error saving chunk:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (content: string) => {
    const updatedChunks = [...chunks];
    updatedChunks[currentChunkIndex].content = content;
    setChunks(updatedChunks);
  };

  const navigateChunk = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentChunkIndex > 0) {
      setCurrentChunkIndex(currentChunkIndex - 1);
    } else if (direction === 'next' && currentChunkIndex < chunks.length - 1) {
      setCurrentChunkIndex(currentChunkIndex + 1);
    }
  };

  const currentChunk = chunks[currentChunkIndex];
  const isReviewed = currentChunk ? reviewedChunks.has(currentChunk.id) : false;
  const hasChanges = currentChunk && currentChunk.content !== currentChunk.src_content;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading text chunks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chunks.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No text chunks found for this source. Please upload and process images first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Review Progress</h3>
            <Badge variant={reviewedChunks.size === chunks.length ? "default" : "secondary"}>
              {reviewedChunks.size} / {chunks.length} reviewed
            </Badge>
          </div>
          <Progress value={(reviewedChunks.size / chunks.length) * 100} />
        </CardContent>
      </Card>

      {/* Main Review Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Page {currentChunk?.pages || 'Unknown'}</span>
                {isReviewed && <Badge variant="outline" className="text-green-700">Reviewed</Badge>}
                {hasChanges && <Badge variant="outline" className="text-orange-700">Modified</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOriginal(!showOriginal)}
                >
                  {showOriginal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showOriginal ? 'Hide' : 'Show'} Original
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showOriginal && currentChunk?.src_content && (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm font-medium mb-2">Original OCR Text:</p>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {currentChunk.src_content}
                </p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Edited Text:
              </label>
              <Textarea
                value={currentChunk?.content || ''}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Edit the extracted text here..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {currentChunk?.meta?.ocr_confidence && (
                  <span>
                    OCR Confidence: {Math.round(currentChunk.meta.ocr_confidence * 100)}%
                  </span>
                )}
              </div>
              <Button
                onClick={() => saveChunk(currentChunk!.id, currentChunk!.content)}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation and Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Chunk Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => navigateChunk('prev')}
                disabled={currentChunkIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <span className="text-sm font-medium">
                {currentChunkIndex + 1} of {chunks.length}
              </span>
              
              <Button
                variant="outline"
                onClick={() => navigateChunk('next')}
                disabled={currentChunkIndex === chunks.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Chunk List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <h4 className="font-medium text-sm">All Chunks:</h4>
              {chunks.map((chunk, index) => (
                <button
                  key={chunk.id}
                  onClick={() => setCurrentChunkIndex(index)}
                  className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                    index === currentChunkIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Page {chunk.pages || 'Unknown'}</span>
                    <div className="flex gap-1">
                      {reviewedChunks.has(chunk.id) && (
                        <Badge variant="outline" className="text-xs">✓</Badge>
                      )}
                      {chunk.content !== chunk.src_content && (
                        <Badge variant="outline" className="text-xs">✎</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs opacity-75 truncate mt-1">
                    {chunk.content.substring(0, 50)}...
                  </p>
                </button>
              ))}
            </div>

            {/* Metadata */}
            {currentChunk?.meta && (
              <div className="pt-4 border-t">
                <h4 className="font-medium text-sm mb-2">Metadata:</h4>
                <div className="text-xs space-y-1 text-muted-foreground">
                  {currentChunk.meta.ocr_engine && (
                    <p>OCR Engine: {currentChunk.meta.ocr_engine}</p>
                  )}
                  {currentChunk.meta.detected_lang && (
                    <p>Detected Language: {currentChunk.meta.detected_lang}</p>
                  )}
                  {currentChunk.meta.processing_date && (
                    <p>Processed: {new Date(currentChunk.meta.processing_date).toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};