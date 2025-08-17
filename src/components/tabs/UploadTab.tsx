import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Image, X, FolderOpen, Settings, Play, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { useProcessingQueue } from '@/hooks/useProcessingQueue';
import { useOrphanedRecords } from '@/hooks/useOrphanedRecords';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UploadProgress, useUploadProgress } from '@/components/upload/UploadProgress';

const UploadTab = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedSource, setSelectedSource] = useState('');
  const [batchSize, setBatchSize] = useState('30');
  const [existingPages, setExistingPages] = useState<number[]>([]);
  const [duplicateFiles, setDuplicateFiles] = useState<Set<number>>(new Set());
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { sources } = useKnowledgeBase();
  const { createQueueItem } = useProcessingQueue();
  const { cleanupOrphanedRecords, isLoading: isCleaningUp } = useOrphanedRecords();
  const { toast } = useToast();
  const { isUploading, currentFiles, startUpload, cancelUpload, completeUpload } = useUploadProgress();

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
      checkForDuplicates([...selectedFiles, ...files]);
    }
  };

  // Check for existing pages when source changes
  const checkExistingPages = async (sourceId: string) => {
    if (!sourceId) {
      setExistingPages([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('kb_images')
        .select('page')
        .eq('source_id', sourceId)
        .order('page');

      if (error) throw error;
      
      const pages = data?.map(item => item.page) || [];
      setExistingPages(pages);
      checkForDuplicates(selectedFiles);
    } catch (error) {
      console.error('Error checking existing pages:', error);
    }
  };

  // Check for duplicates based on file position (page number)
  const checkForDuplicates = (files: File[]) => {
    if (!selectedSource || existingPages.length === 0) {
      setDuplicateFiles(new Set());
      setShowDuplicateWarning(false);
      return;
    }

    const duplicates = new Set<number>();
    files.forEach((_, index) => {
      const pageNumber = index + 1;
      if (existingPages.includes(pageNumber)) {
        duplicates.add(index);
      }
    });

    setDuplicateFiles(duplicates);
    setShowDuplicateWarning(duplicates.size > 0);
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

  const handleCleanupOrphaned = async () => {
    try {
      await cleanupOrphanedRecords();
      // Refresh the existing pages check
      if (selectedSource) {
        await checkExistingPages(selectedSource);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  const handleAddToQueue = async () => {
    if (!selectedSource || selectedFiles.length === 0) return;
    
    console.log('Starting upload process with:', { selectedSource, fileCount: selectedFiles.length });
    
    // Check file size limits (50MB per file)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = selectedFiles.filter(file => file.size > maxFileSize);
    
    if (oversizedFiles.length > 0) {
      toast({
        title: 'File Size Error',
        description: `${oversizedFiles.length} files exceed 50MB limit. Please reduce file sizes.`,
        variant: 'destructive',
      });
      return;
    }

    // Show duplicate warning if there are duplicates
    if (duplicateFiles.size > 0) {
      const duplicateCount = duplicateFiles.size;
      const duplicatePages = Array.from(duplicateFiles).map(i => i + 1).join(', ');
      
      const confirmed = window.confirm(
        `⚠️ Duplicate Detection\n\n${duplicateCount} files will replace existing pages: ${duplicatePages}\n\nDo you want to continue? This will overwrite the existing images and their OCR data.`
      );
      
      if (!confirmed) return;
    }

    startUpload(selectedFiles);
    
    try {
      const batchSizeNum = parseInt(batchSize);
      const totalBatches = Math.ceil(selectedFiles.length / batchSizeNum);
      console.log('Processing batches:', { totalBatches, batchSize: batchSizeNum });
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * batchSizeNum;
        const endIndex = Math.min(startIndex + batchSizeNum, selectedFiles.length);
        const batchFiles = selectedFiles.slice(startIndex, endIndex);
        
        console.log(`Processing batch ${batchIndex + 1}/${totalBatches} with ${batchFiles.length} files`);
        
        // Process files one by one to avoid overwhelming the database
        const fileResults = [];
        for (let batchFileIndex = 0; batchFileIndex < batchFiles.length; batchFileIndex++) {
          const file = batchFiles[batchFileIndex];
          const globalFileIndex = startIndex + batchFileIndex;
          const fileName = `${selectedSource}/batch-${batchIndex + 1}/page-${globalFileIndex + 1}-${file.name}`;
          const pageNumber = globalFileIndex + 1;
          
          console.log(`Processing file ${globalFileIndex + 1}/${selectedFiles.length}: ${file.name}`);
          
          try {
            // Upload to storage with upsert to handle duplicates
            console.log('Uploading to storage:', fileName);
            const { error: storageError } = await supabase.storage
              .from('kb-images')
              .upload(fileName, file, { upsert: true });
            
            if (storageError) {
              console.error('Storage error:', storageError);
              throw new Error(`Storage upload failed for ${file.name}: ${storageError.message}`);
            }
            
            console.log('Storage upload successful, inserting database record...');
            
            // Insert/update database record
            const imageRecord = {
              source_id: selectedSource,
              page: pageNumber,
              uri: fileName,
              caption: `Page ${pageNumber}`,
              meta: {
                filename: file.name,
                fileSize: file.size,
                batch: batchIndex + 1,
                uploadedAt: new Date().toISOString(),
                replaced: duplicateFiles.has(globalFileIndex)
              }
            };
            
            console.log('Inserting image record:', imageRecord);
            
            const { data: imageData, error: imageError } = await supabase
              .from('kb_images')
              .upsert(imageRecord, {
                onConflict: 'source_id,page'
              })
              .select();
            
            if (imageError) {
              console.error('Database error:', imageError);
              throw new Error(`Database insert failed for ${file.name}: ${imageError.message}`);
            }
            
            console.log('Database insert successful:', imageData);
            fileResults.push(fileName);
            
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            throw new Error(`Failed to process ${file.name}: ${error.message}`);
          }
        }
        
        console.log(`Batch ${batchIndex + 1} completed, creating queue item...`);
        
        // Create queue item for this batch
        const batchName = `Batch ${batchIndex + 1} of ${totalBatches}`;
        try {
          await createQueueItem(selectedSource, batchName, batchFiles.length);
          console.log('Queue item created successfully');
        } catch (queueError) {
          console.error('Queue creation error:', queueError);
          throw new Error(`Failed to create queue item: ${queueError.message}`);
        }
      }
      
      console.log('Upload process completed successfully');
      
      toast({
        title: 'Success',
        description: `Added ${selectedFiles.length} files to queue in ${totalBatches} batches`,
      });
      
      // Clear files after successful upload
      setSelectedFiles([]);
      setSelectedSource('');
      setDuplicateFiles(new Set());
      setShowDuplicateWarning(false);
      completeUpload();
      
    } catch (error) {
      console.error('Error uploading files:', error);
      
      // Provide specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      cancelUpload();
    }
  };

  // Calculate optimal recommendations for Galaxy S24 photos
  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  const avgFileSize = selectedFiles.length > 0 ? totalSize / selectedFiles.length : 5 * 1024 * 1024; // 5MB default
  const recommendedBatchCount = Math.ceil(avgFileSize / (1024 * 1024)) <= 5 ? 20 : 10; // Adjust based on file size

  if (isUploading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Uploading Files</h2>
          <p className="text-muted-foreground">Please wait while your files are being uploaded...</p>
        </div>
        <UploadProgress
          files={currentFiles}
          onCancel={cancelUpload}
          onProgress={(fileIndex, progress) => {
            // Handle individual file progress if needed
          }}
          onComplete={completeUpload}
          onError={(error) => {
            toast({
              title: 'Upload Error',
              description: error,
              variant: 'destructive',
            });
            cancelUpload();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Batch Upload</h2>
        <p className="text-muted-foreground">Upload page images or PDFs for OCR processing</p>
      </div>

      {/* File Size Information */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>File Limits:</strong> Maximum 50MB per file (Supabase Free Plan limit). For Galaxy S24 photos (~5MB each), 
          we recommend uploading <strong>10-20 images at once</strong> for optimal performance. 
          Total batch size should stay under 200MB.
        </AlertDescription>
      </Alert>

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
              <Select value={selectedSource} onValueChange={(value) => {
                setSelectedSource(value);
                checkExistingPages(value);
              }}>
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
              {existingPages.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Existing pages: {existingPages.join(', ')}
                </p>
              )}
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

      {/* Duplicate Warning */}
      {showDuplicateWarning && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>Duplicate Files Detected:</strong> {duplicateFiles.size} files will replace existing pages ({Array.from(duplicateFiles).map(i => i + 1).join(', ')}). 
            Uploading will overwrite the existing images and their OCR data.
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCleanupOrphaned}
                disabled={isCleaningUp}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
              >
                {isCleaningUp ? 'Cleaning...' : 'Clean Up Orphaned Files'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Cleanup Tool */}
      {existingPages.length > 0 && !showDuplicateWarning && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Database Cleanup:</strong> Found {existingPages.length} existing pages. 
            If you've deleted queue items but files remain, use this cleanup tool.
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCleanupOrphaned}
                disabled={isCleaningUp}
              >
                {isCleaningUp ? 'Cleaning...' : 'Clean Up Orphaned Files'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
              {selectedFiles.map((file, index) => {
                const isDuplicate = duplicateFiles.has(index);
                const pageNumber = index + 1;
                
                return (
                  <div key={index} className="relative group">
                    <div className={`aspect-square border rounded-lg p-2 flex flex-col items-center justify-center text-center ${
                      isDuplicate 
                        ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-600' 
                        : 'bg-muted/50'
                    }`}>
                      <Image className={`h-8 w-8 mb-2 ${isDuplicate ? 'text-yellow-600' : 'text-muted-foreground'}`} />
                      <p className="text-xs font-medium truncate w-full">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      <p className="text-xs font-semibold">Page {pageNumber}</p>
                      {isDuplicate && (
                        <Badge variant="outline" className="text-xs mt-1 bg-yellow-100 text-yellow-800 border-yellow-300">
                          Duplicate
                        </Badge>
                      )}
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
                );
              })}
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
                disabled={!selectedSource || selectedFiles.length === 0 || isUploading}
                onClick={handleAddToQueue}
              >
                <Play className="h-4 w-4 mr-2" />
                Add to Queue
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