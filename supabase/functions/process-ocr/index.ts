import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ocrApiKey = Deno.env.get('OCR_API_KEY');
const serviceAccountJson = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== OCR Function Started ===');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { imageUrl, sourceId, page, caption } = await req.json();
    
    console.log('Processing OCR for image:', { sourceId, page, imageUrl });
    console.log('Environment check:', {
      hasServiceAccount: !!serviceAccountJson,
      hasOcrApiKey: !!ocrApiKey,
      serviceAccountLength: serviceAccountJson ? serviceAccountJson.length : 0
    });

    // Get the storage URL for the image if it's just a path
    let fullImageUrl = imageUrl;
    if (!imageUrl.startsWith('http')) {
      const { data: urlData } = supabase.storage
        .from('kb-images')
        .getPublicUrl(imageUrl);
      fullImageUrl = urlData.publicUrl;
    }

    // Helper function to get OAuth token from service account
    const getAccessToken = async () => {
      if (!serviceAccountJson) {
        throw new Error('Service account JSON not configured');
      }
      
      try {
        console.log('Parsing service account JSON...');
        const serviceAccount = JSON.parse(serviceAccountJson);
        console.log('Service account parsed successfully:', {
          client_email: serviceAccount.client_email,
          project_id: serviceAccount.project_id,
          private_key_id: serviceAccount.private_key_id,
          hasPrivateKey: !!serviceAccount.private_key,
          privateKeyStartsWith: serviceAccount.private_key?.substring(0, 30) + '...'
        });
        
        // Use the service account to get access token
        const now = Math.floor(Date.now() / 1000);
        const payload = {
          iss: serviceAccount.client_email,
          scope: 'https://www.googleapis.com/auth/cloud-platform',
          aud: 'https://oauth2.googleapis.com/token',
          exp: now + 3600,
          iat: now
        };
        
        // For simplicity, we'll use the googleapis node library approach
        // Convert the service account key format for JWT
        const header = {
          alg: 'RS256',
          typ: 'JWT',
          kid: serviceAccount.private_key_id
        };
        
        console.log('Preparing private key for JWT signing...');
        // Prepare the private key - remove the header/footer and newlines
        let privateKeyContent = serviceAccount.private_key
          .replace('-----BEGIN PRIVATE KEY-----', '')
          .replace('-----END PRIVATE KEY-----', '')
          .replace(/\s/g, '');
        
        // Decode base64 to get the raw bytes
        const privateKeyBytes = Uint8Array.from(atob(privateKeyContent), c => c.charCodeAt(0));
        console.log('Private key decoded, length:', privateKeyBytes.length);
        
        // Import the private key for signing
        const cryptoKey = await crypto.subtle.importKey(
          'pkcs8',
          privateKeyBytes,
          {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256',
          },
          false,
          ['sign']
        );
        console.log('Private key imported successfully for signing');
        
        // Create the JWT
        const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const signatureInput = `${headerB64}.${payloadB64}`;
        
        const signature = await crypto.subtle.sign(
          'RSASSA-PKCS1-v1_5',
          cryptoKey,
          new TextEncoder().encode(signatureInput)
        );
        
        const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
          .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        
        const jwt = `${headerB64}.${payloadB64}.${signatureB64}`;
        console.log('JWT created successfully, requesting access token...');
        
        // Exchange JWT for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
        });
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Token request error:', errorText);
          throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
        }
        
        const tokenData = await tokenResponse.json();
        console.log('Successfully obtained access token');
        return tokenData.access_token;
      } catch (error) {
        console.error('Error getting access token:', error);
        throw error;
      }
    };

    // Process OCR using Google Cloud Vision API
    let visionApiUrl: string;
    let headers: Record<string, string>;
    
    if (serviceAccountJson) {
      console.log('Using service account authentication');
      try {
        const accessToken = await getAccessToken();
        visionApiUrl = 'https://vision.googleapis.com/v1/images:annotate';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        };
      } catch (error) {
        console.error('Service account authentication failed, falling back to API key:', error);
        if (!ocrApiKey) {
          throw new Error('Neither service account nor API key authentication is available');
        }
        visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${ocrApiKey}`;
        headers = {
          'Content-Type': 'application/json',
        };
      }
    } else if (ocrApiKey) {
      console.log('Using API key authentication');
      visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${ocrApiKey}`;
      headers = {
        'Content-Type': 'application/json',
      };
    } else {
      throw new Error('No authentication method available for Google Cloud Vision API');
    }
    
    const requestBody = {
      requests: [
        {
          image: {
            source: {
              imageUri: fullImageUrl
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

    console.log('Making Vision API request to:', visionApiUrl);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('Full image URL being processed:', fullImageUrl);

    const ocrResponse = await fetch(visionApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log('Vision API response status:', ocrResponse.status);
    const ocrResult = await ocrResponse.json();
    console.log('Google Vision API Result:', JSON.stringify(ocrResult, null, 2));

    if (!ocrResponse.ok) {
      console.error('Vision API request failed:', ocrResponse.status, ocrResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Vision API request failed: ${ocrResponse.status}`,
          details: ocrResult.error?.message || 'Unknown API error'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (ocrResult.responses && ocrResult.responses[0] && ocrResult.responses[0].textAnnotations) {
      const textAnnotations = ocrResult.responses[0].textAnnotations;
      const parsedText = textAnnotations[0]?.description || '';
      const confidence = textAnnotations[0]?.confidence || 0.8;

      console.log('OCR extraction successful:', {
        textLength: parsedText.length,
        confidence: confidence,
        textPreview: parsedText.substring(0, 100) + (parsedText.length > 100 ? '...' : '')
      });

      // Generate content hash for deduplication
      const encoder = new TextEncoder();
      const data = encoder.encode(parsedText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const contentSha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      console.log('Updating kb_images table with OCR results...');
      // Update existing kb_images record with OCR results
      const { data: imageData, error: imageError } = await supabase
        .from('kb_images')
        .update({
          meta: {
            ocr_processed: true,
            ocr_confidence: confidence,
            ocr_engine: 'google-cloud-vision',
            processing_date: new Date().toISOString(),
            ocr_text: parsedText
          }
        })
        .eq('source_id', sourceId)
        .eq('page', page)
        .select()
        .single();

      if (imageError) {
        console.error('Error updating image:', imageError);
        throw imageError;
      }
      console.log('kb_images updated successfully:', imageData?.id);

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
      console.log('Language detected:', detectedLang);

      console.log('Inserting into kb_chunks table...');
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
      } else {
        console.log('kb_chunks record created successfully:', chunkData?.id);
      }

      // Generate AI suggestions for the extracted content
      if (chunkData?.id && parsedText.trim().length > 50) {
        try {
          console.log('Creating page suggestion...');
          // Create suggestion for species identification
          const speciesSuggestion = {
            page_id: chunkData.id,
            suggestion_type: 'species_mention',
            target_table: 'species_defects',
            suggested_data: {
              content_snippet: parsedText.substring(0, 200),
              suggested_species: [],
              suggested_defects: [],
              confidence: confidence * 0.8 // Lower confidence for AI suggestions
            },
            confidence_score: confidence * 0.8,
            status: 'pending'
          };

          const { error: suggestionError } = await supabase
            .from('page_suggestions')
            .insert(speciesSuggestion);

          if (suggestionError) {
            console.error('Error creating suggestion:', suggestionError);
          } else {
            console.log('Page suggestion created successfully');
          }
        } catch (suggestionErr) {
          console.error('Error in suggestion generation:', suggestionErr);
        }
      } else {
        console.log('Skipping page suggestion (text too short or no chunk created)');
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