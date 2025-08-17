import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ocrApiKey = Deno.env.get('OCR_API_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { imageUrl, sourceId, page, caption } = await req.json();
    
    console.log('Processing OCR for image:', { sourceId, page, imageUrl });

    // Process OCR using Google Cloud Vision API
    const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${ocrApiKey}`;
    
    const requestBody = {
      requests: [
        {
          image: {
            source: {
              imageUri: imageUrl
            }
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1
            }
          ]
        }
      ]
    };

    const ocrResponse = await fetch(visionApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const ocrResult = await ocrResponse.json();
    console.log('Google Vision API Result:', ocrResult);

    if (ocrResult.responses && ocrResult.responses[0] && ocrResult.responses[0].textAnnotations) {
      const textAnnotations = ocrResult.responses[0].textAnnotations;
      const parsedText = textAnnotations[0]?.description || '';
      const confidence = textAnnotations[0]?.confidence || 0.8;

      // Generate content hash for deduplication
      const encoder = new TextEncoder();
      const data = encoder.encode(parsedText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const contentSha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Insert into kb_images
      const { data: imageData, error: imageError } = await supabase
        .from('kb_images')
        .insert({
          source_id: sourceId,
          page: page,
          uri: imageUrl,
          caption: caption,
          meta: {
            ocr_processed: true,
            ocr_confidence: confidence,
            ocr_engine: 'google-cloud-vision',
            processing_date: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (imageError) {
        console.error('Error inserting image:', imageError);
        throw imageError;
      }

      // Detect language (simple heuristic)
      const detectLanguage = (text: string): string => {
        const swedishWords = ['och', 'att', 'för', 'är', 'med', 'på', 'av', 'som', 'till', 'när'];
        const englishWords = ['the', 'and', 'to', 'of', 'in', 'for', 'is', 'on', 'with', 'as'];
        
        const words = text.toLowerCase().split(/\s+/);
        const swedishCount = words.filter(word => swedishWords.includes(word)).length;
        const englishCount = words.filter(word => englishWords.includes(word)).length;
        
        return swedishCount > englishCount ? 'sv' : 'en';
      };

      const detectedLang = detectLanguage(parsedText);

      // Insert into kb_chunks
      const { data: chunkData, error: chunkError } = await supabase
        .from('kb_chunks')
        .insert({
          source_id: sourceId,
          pages: page?.toString(),
          content: parsedText,
          src_content: parsedText,
          src_lang: detectedLang,
          lang: detectedLang,
          content_sha256: contentSha256,
          image_ids: [imageData.id],
          meta: {
            ocr_engine: 'google-cloud-vision',
            ocr_confidence: confidence,
            detected_lang: detectedLang,
            figures_detected: [],
            processing_date: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (chunkError) {
        console.error('Error inserting chunk:', chunkError);
        // Don't throw here, image was already saved
      }

      return new Response(
        JSON.stringify({
          success: true,
          imageId: imageData.id,
          chunkId: chunkData?.id,
          extractedText: parsedText,
          confidence: confidence,
          detectedLanguage: detectedLang,
          contentHash: contentSha256
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('Google Vision API processing failed:', ocrResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'OCR processing failed',
          details: ocrResult.error?.message || 'No text detected in image'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in process-ocr function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});