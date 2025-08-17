import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UploadedImage {
  file: File;
  page: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  url?: string;
  error?: string;
  ocrResult?: {
    text: string;
    confidence: number;
    chunkId?: number;
  };
}

interface ImageUploadZoneProps {
  sourceId: string;
  onProgress: (total: number, completed: number) => void;
}

export const ImageUploadZone = ({ sourceId, onProgress }: ImageUploadZoneProps) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: UploadedImage[] = acceptedFiles.map((file, index) => ({
      file,
      page: images.length + index + 1,
      status: 'pending',
    }));
    
    setImages(prev => [...prev, ...newImages]);
  }, [images.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'],
    },
    multiple: true,
  });

  const uploadImage = async (image: UploadedImage): Promise<string> => {
    const fileName = `${sourceId}/page_${image.page}_${Date.now()}.${image.file.name.split('.').pop()}`;
    
    const { data, error } = await supabase.storage
      .from('kb-images')
      .upload(fileName, image.file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('kb-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const processOCR = async (imageUrl: string, page: number): Promise<any> => {
    const { data, error } = await supabase.functions.invoke('process-ocr', {
      body: {
        imageUrl,
        sourceId,
        page,
        caption: `Page ${page}`,
      },
    });

    if (error) throw error;
    return data;
  };

  const processImages = async () => {
    setIsProcessing(true);
    const pendingImages = images.filter(img => img.status === 'pending');
    
    for (let i = 0; i < pendingImages.length; i++) {
      const image = pendingImages[i];
      const imageIndex = images.findIndex(img => img === image);

      try {
        // Update status to uploading
        setImages(prev => prev.map((img, idx) => 
          idx === imageIndex ? { ...img, status: 'uploading' } : img
        ));

        // Upload image to storage
        const imageUrl = await uploadImage(image);

        // Update status to processing
        setImages(prev => prev.map((img, idx) => 
          idx === imageIndex ? { ...img, status: 'processing', url: imageUrl } : img
        ));

        // Process OCR
        const ocrResult = await processOCR(imageUrl, image.page);

        // Update with results
        setImages(prev => prev.map((img, idx) => 
          idx === imageIndex ? {
            ...img,
            status: 'completed',
            ocrResult: {
              text: ocrResult.extractedText,
              confidence: ocrResult.confidence,
              chunkId: ocrResult.chunkId,
            }
          } : img
        ));

        toast({
          title: 'Page processed',
          description: `Page ${image.page} processed successfully`,
        });

      } catch (error) {
        console.error('Error processing image:', error);
        setImages(prev => prev.map((img, idx) => 
          idx === imageIndex ? {
            ...img,
            status: 'error',
            error: error.message || 'Processing failed'
          } : img
        ));
      }

      // Update progress
      const completed = images.filter(img => 
        img.status === 'completed' || img.status === 'error'
      ).length + i + 1;
      onProgress(images.length, completed);
    }

    setIsProcessing(false);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: UploadedImage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Image className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: UploadedImage['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'error':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'processing':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'uploading':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const completedCount = images.filter(img => img.status === 'completed').length;
  const errorCount = images.filter(img => img.status === 'error').length;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`text-center p-8 cursor-pointer transition-colors ${
              isDragActive ? 'bg-muted/50' : ''
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the images here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Upload page images</p>
                <p className="text-muted-foreground">
                  Drag and drop images here, or click to select files
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Supports: JPEG, PNG, GIF, BMP, WebP
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Uploaded Images ({images.length})
            </h3>
            <div className="flex gap-2">
              {completedCount > 0 && (
                <Badge variant="outline" className="text-green-700">
                  {completedCount} completed
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="outline" className="text-red-700">
                  {errorCount} errors
                </Badge>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            {images.map((image, index) => (
              <Card key={index} className={`border ${getStatusColor(image.status)}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(image.status)}
                      <div>
                        <p className="font-medium">Page {image.page}</p>
                        <p className="text-sm text-muted-foreground">
                          {image.file.name}
                        </p>
                        {image.status === 'processing' && (
                          <div className="mt-2">
                            <Progress value={50} className="w-24" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {image.status.charAt(0).toUpperCase() + image.status.slice(1)}
                      </Badge>
                      {image.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {image.error && (
                    <Alert className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{image.error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {image.ocrResult && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-md">
                      <p className="text-sm font-medium mb-1">
                        Extracted Text (Confidence: {Math.round(image.ocrResult.confidence * 100)}%)
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {image.ocrResult.text.substring(0, 200)}...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {images.some(img => img.status === 'pending') && (
            <Button
              onClick={processImages}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Processing Images...' : 'Process All Images'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};