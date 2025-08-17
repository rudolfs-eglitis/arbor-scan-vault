import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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
      console.log('Testing OCR function with image...');
      
      const testPayload = {
        imageUrl: "book.sv.stadstradslexikon.2015/batch-1/page-1-20250817_174025.jpg",
        sourceId: "book.sv.stadstradslexikon.2015", 
        page: 1,
        caption: "Page 1"
      };

      console.log('Calling process-ocr function with payload:', testPayload);

      const { data, error } = await supabase.functions.invoke('process-ocr', {
        body: testPayload
      });

      console.log('OCR function response:', { data, error });

      if (error) {
        console.error('OCR function error:', error);
        setResult({
          success: false,
          error: error.message || 'Function call failed',
          details: JSON.stringify(error, null, 2)
        });
        
        toast({
          title: 'OCR Test Failed',
          description: error.message || 'Function call failed',
          variant: 'destructive',
        });
      } else {
        console.log('OCR function succeeded:', data);
        setResult(data as OCRTestResult);
        
        toast({
          title: 'OCR Test Successful',
          description: `Extracted ${data.extractedText?.length || 0} characters with ${Math.round((data.confidence || 0) * 100)}% confidence`,
        });
      }

    } catch (error) {
      console.error('Error testing OCR function:', error);
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
          <CardTitle>OCR Function Test</CardTitle>
          <CardDescription>
            Test the Google Cloud Vision OCR function with a single image to verify the service account authentication.
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
              {testing ? 'Testing OCR Function...' : 'Test OCR Function'}
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