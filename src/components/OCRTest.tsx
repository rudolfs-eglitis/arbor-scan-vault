import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createWorker } from 'tesseract.js';

interface OCRTestResult {
  success: boolean;
  imageId?: number;
  chunkId?: number;
  extractedText?: string;
  confidence?: number;
  detectedLanguage?: string;
  contentHash?: string;
  error?: string;
  details?: string;
}

export const OCRTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<OCRTestResult | null>(null);
  const { toast } = useToast();

  const testOCRFunction = async () => {
    setTesting(true);
    setResult(null);

    try {
      console.log('Testing Tesseract.js OCR with image...');
      
      const imageUrl = "book.sv.stadstradslexikon.2015/batch-1/page-1-20250817_174025.jpg";
      const sourceId = "book.sv.stadstradslexikon.2015";
      const page = 1;

      // Get the public URL for the image
      console.log('Resolving image URL from Supabase storage...');
      const { data: urlData } = supabase.storage
        .from('kb-images')
        .getPublicUrl(imageUrl);
      
      const fullImageUrl = urlData.publicUrl;
      console.log('Full image URL:', fullImageUrl);

      // Initialize Tesseract worker
      console.log('Initializing Tesseract.js worker...');
      const worker = await createWorker('eng+swe', 1, {
        logger: m => console.log('Tesseract:', m)
      });

      // Perform OCR
      console.log('Performing OCR with Tesseract.js...');
      const ocrResult = await worker.recognize(fullImageUrl);
      
      console.log('Tesseract OCR result:', ocrResult);
      
      // Clean up worker
      await worker.terminate();

      const extractedText = ocrResult.data.text;
      const confidence = ocrResult.data.confidence / 100; // Convert to 0-1 scale

      // Simple language detection
      const detectLanguage = (text: string): string => {
        const swedishWords = ['och', 'att', 'för', 'är', 'med', 'på', 'av', 'som', 'till', 'när'];
        const englishWords = ['the', 'and', 'to', 'of', 'in', 'for', 'is', 'on', 'with', 'as'];
        
        const words = text.toLowerCase().split(/\s+/);
        const swedishCount = words.filter(word => swedishWords.includes(word)).length;
        const englishCount = words.filter(word => englishWords.includes(word)).length;
        
        return swedishCount > englishCount ? 'sv' : 'en';
      };

      const detectedLanguage = detectLanguage(extractedText);

      // Generate content hash
      const encoder = new TextEncoder();
      const data = encoder.encode(extractedText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      console.log('OCR processing completed successfully');

      setResult({
        success: true,
        extractedText: extractedText,
        confidence: confidence,
        detectedLanguage: detectedLanguage,
        contentHash: contentHash
      });
      
      toast({
        title: 'OCR Test Successful',
        description: `Extracted ${extractedText.length} characters with ${Math.round(confidence * 100)}% confidence using Tesseract.js`,
      });

    } catch (error) {
      console.error('Error testing Tesseract.js OCR:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setResult({
        success: false,
        error: errorMessage,
        details: JSON.stringify(error, null, 2)
      });
      
      toast({
        title: 'OCR Test Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tesseract.js OCR Test</CardTitle>
          <CardDescription>
            Test the Tesseract.js OCR engine with a single image. This runs entirely in the browser without requiring API keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              This will test OCR processing on:<br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                book.sv.stadstradslexikon.2015/batch-1/page-1-20250817_174025.jpg
              </code>
            </p>
            
            <Button 
              onClick={testOCRFunction} 
              disabled={testing}
              className="w-full"
            >
              {testing ? 'Testing Tesseract.js OCR...' : 'Test Tesseract.js OCR'}
            </Button>
          </div>

          {result && (
            <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Test Result
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.success ? (
                  <div className="space-y-3">
                    <div>
                      <strong>Image ID:</strong> {result.imageId}
                    </div>
                    <div>
                      <strong>Chunk ID:</strong> {result.chunkId}
                    </div>
                    <div>
                      <strong>Confidence:</strong> {Math.round((result.confidence || 0) * 100)}%
                    </div>
                    <div>
                      <strong>Detected Language:</strong> {result.detectedLanguage?.toUpperCase()}
                    </div>
                    <div>
                      <strong>Content Hash:</strong> 
                      <code className="text-xs bg-muted px-1 ml-2">{result.contentHash?.substring(0, 16)}...</code>
                    </div>
                    <div>
                      <strong>Extracted Text ({result.extractedText?.length || 0} chars):</strong>
                      <div className="mt-2 p-3 bg-muted rounded-md text-sm max-h-40 overflow-y-auto">
                        {result.extractedText || 'No text extracted'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <strong>Error:</strong> {result.error}
                    </div>
                    {result.details && (
                      <div>
                        <strong>Details:</strong>
                        <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                          {result.details}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};