import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Image, X, FolderOpen, Settings, Play } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { useProcessingQueue } from '@/hooks/useProcessingQueue';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UploadTab = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedSource, setSelectedSource] = useState('');
  const [batchSize, setBatchSize] = useState('30');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { sources } = useKnowledgeBase();
  const { createQueueItem } = useProcessingQueue();
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSelectedFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAddToQueue = async () => {
    if (!selectedSource || selectedFiles.length === 0) return;
    
    setUploading(true);
    try {
      const batchSizeNum = parseInt(batchSize);
      const totalBatches = Math.ceil(selectedFiles.length / batchSizeNum);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * batchSizeNum;
        const endIndex = Math.min(startIndex + batchSizeNum, selectedFiles.length);
        const batchFiles = selectedFiles.slice(startIndex, endIndex);
        
        // Upload files to storage
        const uploadPromises = batchFiles.map(async (file, fileIndex) => {
          const fileName = `${selectedSource}/batch-${batchIndex + 1}/page-${startIndex + fileIndex + 1}-${file.name}`;
          const { error } = await supabase.storage
            .from('kb-images')
            .upload(fileName, file);
          
          if (error) throw error;
          return fileName;
        });
        
        await Promise.all(uploadPromises);
        
        // Create queue item for this batch
        const batchName = `Batch ${batchIndex + 1} of ${totalBatches}`;
        await createQueueItem(selectedSource, batchName, batchFiles.length);
      }
      
      toast({
        title: 'Success',
        description: `Added ${selectedFiles.length} files to queue in ${totalBatches} batches`,
      });
      
      // Clear files after successful upload
      setSelectedFiles([]);
      setSelectedSource('');
      
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload files to queue',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Batch Upload</h2>
        <p className="text-muted-foreground">Upload page images or PDFs for OCR processing</p>
      </div>

      {/* Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Upload Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Target Source</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-size">Batch Size</Label>
              <Select value={batchSize} onValueChange={setBatchSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 pages per batch</SelectItem>
                  <SelectItem value="30">30 pages per batch</SelectItem>
                  <SelectItem value="50">50 pages per batch</SelectItem>
                  <SelectItem value="100">100 pages per batch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload
          </CardTitle>
          <CardDescription>
            Drag and drop images or PDFs, or click to browse. Supported formats: JPG, PNG, PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold">Drop files here or click to browse</p>
                <p className="text-muted-foreground">Upload images (JPG, PNG) or PDF documents</p>
              </div>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-primary"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Preview */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Selected Files ({selectedFiles.length})
              </CardTitle>
              <Button variant="outline" onClick={clearAll}>
                Clear All
              </Button>
            </div>
            <CardDescription>
              Total size: {formatFileSize(selectedFiles.reduce((acc, file) => acc + file.size, 0))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square border rounded-lg p-2 bg-muted/50 flex flex-col items-center justify-center text-center">
                    <Image className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-xs font-medium truncate w-full">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Summary */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Files</p>
                <p className="text-2xl font-bold">{selectedFiles.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Batches</p>
                <p className="text-2xl font-bold">{Math.ceil(selectedFiles.length / parseInt(batchSize))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Batch Size</p>
                <p className="text-2xl font-bold">{batchSize}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-lg font-bold">{formatFileSize(selectedFiles.reduce((acc, file) => acc + file.size, 0))}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button 
                className="bg-gradient-primary hover:bg-primary-hover shadow-primary"
                disabled={!selectedSource || selectedFiles.length === 0 || uploading}
                onClick={handleAddToQueue}
              >
                <Play className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Add to Queue'}
              </Button>
              <Button variant="outline">
                Preview Batches
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UploadTab;