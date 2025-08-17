import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, FileText, Database, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProcessedPage {
  id: string;
  page_number: number;
  extracted_text?: string;
  ocr_confidence?: number;
  processed_at: string;
}

interface ProcessedImage {
  id: number;
  page?: number;
  uri?: string;
  caption?: string;
  meta?: any;
}

interface ProcessedChunk {
  id: number;
  content: string;
  pages?: string;
  meta?: any;
  created_at: string;
}

interface QueueResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queueItem: any;
}

const QueueResultsModal = ({ open, onOpenChange, queueItem }: QueueResultsModalProps) => {
  const [pages, setPages] = useState<ProcessedPage[]>([]);
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [chunks, setChunks] = useState<ProcessedChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchResults = async () => {
    if (!queueItem) return;
    
    setLoading(true);
    try {
      // Fetch completed pages
      const { data: pagesData, error: pagesError } = await supabase
        .from('queue_pages')
        .select('*')
        .eq('queue_id', queueItem.id)
        .eq('status', 'completed')
        .order('page_number');

      if (pagesError) throw pagesError;

      // Fetch images for this source
      const { data: imagesData, error: imagesError } = await supabase
        .from('kb_images')
        .select('*')
        .eq('source_id', queueItem.source_id)
        .order('page');

      if (imagesError) throw imagesError;

      // Fetch chunks for this source
      const { data: chunksData, error: chunksError } = await supabase
        .from('kb_chunks')
        .select('*')
        .eq('source_id', queueItem.source_id)
        .order('created_at', { ascending: false });

      if (chunksError) throw chunksError;

      setPages(pagesData || []);
      setImages(imagesData || []);
      setChunks(chunksData || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch processing results',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (uri: string) => {
    if (!uri) return null;
    if (uri.startsWith('http')) return uri;
    
    // Convert storage path to public URL
    const { data } = supabase.storage
      .from('kb-images')
      .getPublicUrl(uri);
    
    return data.publicUrl;
  };

  const viewImage = (uri: string) => {
    const url = getImageUrl(uri);
    if (url) {
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    if (open && queueItem) {
      fetchResults();
    }
  }, [open, queueItem]);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading results...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Processing Results: {queueItem?.batch_name}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pages">Pages ({pages.length})</TabsTrigger>
            <TabsTrigger value="images">Images ({images.length})</TabsTrigger>
            <TabsTrigger value="chunks">Text Chunks ({chunks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{pages.length}</p>
                      <p className="text-sm text-muted-foreground">Pages Processed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{images.length}</p>
                      <p className="text-sm text-muted-foreground">Images Uploaded</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{chunks.length}</p>
                      <p className="text-sm text-muted-foreground">Text Chunks Created</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Processing Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Source:</strong> {queueItem?.kb_sources?.title}</p>
                  <p><strong>Total Pages:</strong> {queueItem?.total_pages}</p>
                  <p><strong>Successfully Processed:</strong> {pages.length}</p>
                  <p><strong>Success Rate:</strong> {queueItem?.total_pages ? Math.round((pages.length / queueItem.total_pages) * 100) : 0}%</p>
                  {queueItem?.completed_at && (
                    <p><strong>Completed:</strong> {new Date(queueItem.completed_at).toLocaleString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages">
            <ScrollArea className="h-96">
              {pages.length === 0 ? (
                <div className="text-center text-muted-foreground p-8">
                  No successfully processed pages found
                </div>
              ) : (
                <div className="space-y-4">
                  {pages.map((page) => (
                    <Card key={page.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Page {page.page_number}</CardTitle>
                          <div className="flex items-center gap-2">
                            {page.ocr_confidence && (
                              <Badge variant="secondary">
                                {Math.round(page.ocr_confidence * 100)}% confidence
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {new Date(page.processed_at).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {page.extracted_text ? (
                          <div className="bg-muted p-3 rounded-md">
                            <p className="text-sm whitespace-pre-wrap">
                              {page.extracted_text.substring(0, 300)}
                              {page.extracted_text.length > 300 && '...'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">No text extracted</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="images">
            <ScrollArea className="h-96">
              {images.length === 0 ? (
                <div className="text-center text-muted-foreground p-8">
                  No images found
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <Card key={image.id}>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          {image.page ? `Page ${image.page}` : 'Image'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {image.uri && (
                          <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                            <Button
                              variant="outline"
                              onClick={() => viewImage(image.uri!)}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Image
                            </Button>
                          </div>
                        )}
                        {image.caption && (
                          <p className="text-sm text-muted-foreground">{image.caption}</p>
                        )}
                        {image.meta?.ocr_confidence && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(image.meta.ocr_confidence * 100)}% OCR
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chunks">
            <ScrollArea className="h-96">
              {chunks.length === 0 ? (
                <div className="text-center text-muted-foreground p-8">
                  No text chunks found
                </div>
              ) : (
                <div className="space-y-4">
                  {chunks.map((chunk) => (
                    <Card key={chunk.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Chunk #{chunk.id}</CardTitle>
                          <div className="flex items-center gap-2">
                            {chunk.pages && (
                              <Badge variant="outline">Pages: {chunk.pages}</Badge>
                            )}
                            <Badge variant="secondary">
                              {new Date(chunk.created_at).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm whitespace-pre-wrap">
                            {chunk.content.substring(0, 400)}
                            {chunk.content.length > 400 && '...'}
                          </p>
                        </div>
                        {chunk.meta && Object.keys(chunk.meta).length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <strong>Metadata:</strong> {JSON.stringify(chunk.meta)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default QueueResultsModal;