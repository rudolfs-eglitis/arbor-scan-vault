import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface OCRTestResult {
  success: boolean;
  text?: string;
  confidence?: number;
  language?: string;
  contentHash?: string;
  provider?: string;
  error?: string;
}

export const OCRTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<OCRTestResult | null>(null);
  const { toast } = useToast();

  const findTestImage = async (): Promise<string | null> => {
    // First check root level for image files
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('kb-images')
      .list('', { limit: 100 });

    if (rootError) {
      throw new Error(`Storage error: ${rootError.message}`);
    }

    if (!rootFiles || rootFiles.length === 0) {
      throw new Error('No files found in storage.');
    }

    // Look for actual image files in root
    const rootImage = rootFiles.find(file => 
      file.name && 
      file.metadata && 
      file.metadata.mimetype?.startsWith('image/')
    );

    if (rootImage) {
      const { data: urlData } = await supabase.storage
        .from('kb-images')
        .getPublicUrl(rootImage.name);
      return urlData.publicUrl;
    }

    // If no images in root, check subdirectories
    for (const item of rootFiles) {
      if (item.name && !item.metadata) { // This is likely a directory
        const { data: subFiles, error: subError } = await supabase.storage
          .from('kb-images')
          .list(item.name, { limit: 100 });
        
        if (!subError && subFiles) {
          const subImage = subFiles.find(file => 
            file.name && 
            file.metadata && 
            file.metadata.mimetype?.startsWith('image/')
          );
          
          if (subImage) {
            const { data: urlData } = await supabase.storage
              .from('kb-images')
              .getPublicUrl(`${item.name}/${subImage.name}`);
            return urlData.publicUrl;
          }
        }
      }
    }

    return null;
  };

  const testOCRFunction = async () => {
    setTesting(true);
    setResult(null);

    try {
      const testImageUrl = await findTestImage();
      
      if (!testImageUrl) {
        throw new Error('No image files found in storage. Please upload an image first to test OCR functionality.');
      }

      console.log('Testing OpenAI Vision OCR with image:', testImageUrl);

      // Call the OpenAI OCR edge function
      const { data, error } = await supabase.functions.invoke('process-openai-ocr', {
        body: {
          imageUrl: testImageUrl,
          sourceId: 'test-source',
          page: 1
        }
      });

      if (error) {
        console.error('Edge function invocation error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data?.success) {
        console.error('OCR processing failed:', data);
        throw new Error(data?.error?.message || 'OpenAI OCR processing failed');
      }

      const testResult: OCRTestResult = {
        success: true,
        text: data.result.text,
        confidence: Math.round(data.result.confidence),
        language: data.result.language,
        contentHash: data.result.contentHash,
        provider: data.result.provider
      };

      setResult(testResult);
      toast({
        title: 'OCR Test Successful',
        description: `Extracted ${data.result.text.length} characters with ${data.result.confidence}% confidence using OpenAI Vision`,
      });

    } catch (error) {
      console.error('OCR test error:', error);
      const errorResult: OCRTestResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      setResult(errorResult);
      toast({
        title: 'OCR Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
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
          <CardTitle>OpenAI Vision OCR Test</CardTitle>
          <CardDescription>
            Test the OpenAI GPT-4 Vision OCR service with superior text extraction and content understanding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              This will test OpenAI Vision OCR processing on any available image in your storage.
              Upload an image first if no test images are available.
            </p>
            
        <Button 
          onClick={testOCRFunction} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testing OpenAI Vision OCR...' : 'Test OpenAI Vision OCR'}
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
                      <strong>Confidence:</strong> {result.confidence}%
                    </div>
                    <div>
                      <strong>Language:</strong> {result.language?.toUpperCase()}
                    </div>
                    <div>
                      <strong>Provider:</strong> {result.provider}
                    </div>
                    <div>
                      <strong>Content Hash:</strong> 
                      <code className="text-xs bg-muted px-1 ml-2">{result.contentHash?.substring(0, 16)}...</code>
                    </div>
                    <div>
                      <strong>Extracted Text ({result.text?.length || 0} chars):</strong>
                      <div className="mt-2 p-3 bg-muted rounded-md text-sm max-h-40 overflow-y-auto">
                        {result.text || 'No text extracted'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <strong>Error:</strong> {result.error}
                    </div>
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