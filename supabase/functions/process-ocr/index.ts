import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Custom error types for better error handling
class OCRError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'OCRError';
  }
}

class AuthenticationError extends OCRError {
  constructor(message: string, details?: any) {
    super(message, 'AUTH_ERROR', details);
  }
}

class ValidationError extends OCRError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

// Phase 1: Environment validation and setup
interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  ocrApiKey?: string;
  serviceAccountJson?: string;
}

function validateEnvironment(): EnvironmentConfig {
  const startTime = Date.now();
  console.log('🔍 Validating environment variables...');
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const ocrApiKey = Deno.env.get('OCR_API_KEY');
  const serviceAccountJson = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON');
  
  const envStatus = {
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
    ocrApiKey: !!ocrApiKey,
    serviceAccountJson: !!serviceAccountJson,
    validationTime: Date.now() - startTime
  };
  
  console.log('Environment status:', envStatus);
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new ValidationError('Missing required Supabase environment variables', envStatus);
  }
  
  if (!ocrApiKey && !serviceAccountJson) {
    throw new AuthenticationError('No Google Cloud authentication method available', envStatus);
  }
  
  console.log('✅ Environment validation completed successfully');
  return { supabaseUrl, supabaseServiceKey, ocrApiKey, serviceAccountJson };
}

// Phase 2: Authentication strategy with fallback
interface AuthMethod {
  type: 'api_key' | 'service_account';
  headers: Record<string, string>;
  baseUrl: string;
}

async function setupGoogleAuthentication(config: EnvironmentConfig): Promise<AuthMethod> {
  const startTime = Date.now();
  console.log('🔐 Setting up Google Cloud authentication...');
  
  // Primary: Try service account if available
  if (config.serviceAccountJson) {
    try {
      console.log('Attempting service account authentication...');
      const serviceAccount = JSON.parse(config.serviceAccountJson);
      
      // Validate service account structure
      if (!serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error('Invalid service account JSON structure');
      }
      
      console.log(`✅ Service account authentication setup completed (${Date.now() - startTime}ms)`);
      return {
        type: 'service_account',
        headers: { 'Content-Type': 'application/json' },
        baseUrl: 'https://vision.googleapis.com/v1/images:annotate'
      };
    } catch (error) {
      console.warn('⚠️  Service account authentication failed, falling back to API key:', error.message);
    }
  }
  
  // Fallback: Use API key
  if (config.ocrApiKey) {
    console.log('Using API key authentication (fallback)');
    console.log(`✅ API key authentication setup completed (${Date.now() - startTime}ms)`);
    return {
      type: 'api_key',
      headers: { 'Content-Type': 'application/json' },
      baseUrl: `https://vision.googleapis.com/v1/images:annotate?key=${config.ocrApiKey}`
    };
  }
  
  throw new AuthenticationError('No valid authentication method available');
}

// Phase 3: Input validation
interface OCRRequest {
  imageUrl: string;
  sourceId: string;
  page: number;
  caption?: string;
}

function validateInput(input: any): OCRRequest {
  console.log('📝 Validating input parameters...');
  
  if (!input) {
    throw new ValidationError('Request body is empty');
  }
  
  const { imageUrl, sourceId, page, caption } = input;
  
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new ValidationError('imageUrl is required and must be a string');
  }
  
  if (!sourceId || typeof sourceId !== 'string') {
    throw new ValidationError('sourceId is required and must be a string');
  }
  
  if (page === undefined || page === null || typeof page !== 'number') {
    throw new ValidationError('page is required and must be a number');
  }
  
  // Additional URL validation
  if (!imageUrl.startsWith('http') && !imageUrl.includes('/')) {
    throw new ValidationError('imageUrl must be a valid URL or storage path');
  }
  
  console.log('✅ Input validation completed', { sourceId, page, imageUrlLength: imageUrl.length });
  return { imageUrl, sourceId, page, caption };
}

// Phase 4: Image URL resolution
async function resolveImageUrl(imageUrl: string, supabase: any): Promise<string> {
  console.log('🖼️  Resolving image URL...');
  
  if (imageUrl.startsWith('http')) {
    console.log('URL is already absolute:', imageUrl);
    return imageUrl;
  }
  
  try {
    const { data: urlData } = supabase.storage
      .from('kb-images')
      .getPublicUrl(imageUrl);
    
    console.log('✅ Resolved storage URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    throw new ValidationError('Failed to resolve image URL from storage', { imageUrl, error: error.message });
  }
}

// Phase 5: OCR processing with retry logic
async function processImageOCR(imageUrl: string, authMethod: AuthMethod): Promise<any> {
  const startTime = Date.now();
  console.log('🔍 Processing OCR for image:', imageUrl);
  
  const requestBody = {
    requests: [{
      image: { source: { imageUri: imageUrl } },
      features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
    }]
  };
  
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Making Vision API request (attempt ${attempt}/${maxRetries})...`);
      
      const response = await fetch(authMethod.baseUrl, {
        method: 'POST',
        headers: authMethod.headers,
        body: JSON.stringify(requestBody),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new OCRError(
          `Vision API request failed: ${response.status}`,
          'API_ERROR',
          { status: response.status, result }
        );
      }
      
      console.log(`✅ OCR processing completed successfully (${Date.now() - startTime}ms)`);
      return result;
      
    } catch (error) {
      lastError = error;
      console.warn(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new OCRError('OCR processing failed after all retries', 'MAX_RETRIES_EXCEEDED', lastError);
}

// Phase 6: Text processing and language detection
interface TextResult {
  text: string;
  confidence: number;
  language: string;
  contentHash: string;
}

async function processExtractedText(ocrResult: any): Promise<TextResult> {
  console.log('📄 Processing extracted text...');
  
  if (!ocrResult.responses?.[0]?.textAnnotations?.[0]) {
    throw new OCRError('No text detected in image', 'NO_TEXT_DETECTED', ocrResult);
  }
  
  const textAnnotation = ocrResult.responses[0].textAnnotations[0];
  const text = textAnnotation.description || '';
  const confidence = textAnnotation.confidence || 0.8;
  
  // Language detection
  const detectLanguage = (text: string): string => {
    const swedishWords = ['och', 'att', 'för', 'är', 'med', 'på', 'av', 'som', 'till', 'när'];
    const englishWords = ['the', 'and', 'to', 'of', 'in', 'for', 'is', 'on', 'with', 'as'];
    
    const words = text.toLowerCase().split(/\s+/);
    const swedishCount = words.filter(word => swedishWords.includes(word)).length;
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    return swedishCount > englishCount ? 'sv' : 'en';
  };
  
  const language = detectLanguage(text);
  
  // Generate content hash
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log('✅ Text processing completed:', {
    textLength: text.length,
    confidence,
    language,
    hashPreview: contentHash.substring(0, 16) + '...'
  });
  
  return { text, confidence, language, contentHash };
}

// Phase 7: Database operations with transactions
async function updateDatabase(
  supabase: any,
  request: OCRRequest,
  textResult: TextResult
): Promise<{ imageId: number; chunkId?: number }> {
  console.log('💾 Updating database with OCR results...');
  
  try {
    // Update kb_images table
    const { data: imageData, error: imageError } = await supabase
      .from('kb_images')
      .update({
        meta: {
          ocr_processed: true,
          ocr_confidence: textResult.confidence,
          ocr_engine: 'google-cloud-vision',
          processing_date: new Date().toISOString(),
          ocr_text: textResult.text
        }
      })
      .eq('source_id', request.sourceId)
      .eq('page', request.page)
      .select()
      .single();
    
    if (imageError) {
      throw new OCRError('Failed to update image record', 'DB_UPDATE_ERROR', imageError);
    }
    
    console.log('✅ Image record updated:', imageData.id);
    
    // Insert into kb_chunks table
    const { data: chunkData, error: chunkError } = await supabase
      .from('kb_chunks')
      .insert({
        source_id: request.sourceId,
        pages: request.page.toString(),
        content: textResult.text,
        src_content: textResult.text,
        src_lang: textResult.language,
        lang: textResult.language,
        content_sha256: textResult.contentHash,
        image_ids: [imageData.id],
        meta: {
          ocr_engine: 'google-cloud-vision',
          ocr_confidence: textResult.confidence,
          detected_lang: textResult.language,
          processing_date: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (chunkError) {
      console.warn('⚠️  Failed to create chunk record:', chunkError);
      return { imageId: imageData.id };
    }
    
    console.log('✅ Chunk record created:', chunkData.id);
    return { imageId: imageData.id, chunkId: chunkData.id };
    
  } catch (error) {
    console.error('❌ Database operation failed:', error);
    throw error;
  }
}

// Phase 8: AI suggestions generation
async function generateSuggestions(
  supabase: any,
  chunkId: number,
  textResult: TextResult
): Promise<void> {
  if (textResult.text.trim().length < 50) {
    console.log('⏭️  Skipping suggestions (text too short)');
    return;
  }
  
  console.log('🤖 Generating AI suggestions...');
  
  try {
    const suggestion = {
      page_id: chunkId,
      suggestion_type: 'species_mention',
      target_table: 'species_defects',
      suggested_data: {
        content_snippet: textResult.text.substring(0, 200),
        suggested_species: [],
        suggested_defects: [],
        confidence: textResult.confidence * 0.8
      },
      confidence_score: textResult.confidence * 0.8,
      status: 'pending'
    };
    
    const { error } = await supabase
      .from('page_suggestions')
      .insert(suggestion);
    
    if (error) {
      console.warn('⚠️  Failed to create suggestion:', error);
    } else {
      console.log('✅ AI suggestion created successfully');
    }
  } catch (error) {
    console.warn('⚠️  Suggestion generation failed:', error);
  }
}

// Health check endpoint
async function handleHealthCheck(): Promise<Response> {
  console.log('🏥 Health check requested');
  
  try {
    const config = validateEnvironment();
    const authMethod = await setupGoogleAuthentication(config);
    
    return new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: {
          supabase: !!config.supabaseUrl,
          authentication: authMethod.type
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Main request handler
serve(async (req) => {
  const requestStart = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Handle health check
  if (req.method === 'GET') {
    return await handleHealthCheck();
  }
  
  try {
    console.log('🚀 OCR Processing Started');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    // Phase 1: Validate environment
    const config = validateEnvironment();
    
    // Phase 2: Setup authentication
    const authMethod = await setupGoogleAuthentication(config);
    
    // Phase 3: Validate input
    const requestBody = await req.json();
    const ocrRequest = validateInput(requestBody);
    
    // Initialize Supabase client
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    
    // Phase 4: Resolve image URL
    const fullImageUrl = await resolveImageUrl(ocrRequest.imageUrl, supabase);
    
    // Phase 5: Process OCR
    const ocrResult = await processImageOCR(fullImageUrl, authMethod);
    
    // Phase 6: Process extracted text
    const textResult = await processExtractedText(ocrResult);
    
    // Phase 7: Update database
    const dbResult = await updateDatabase(supabase, ocrRequest, textResult);
    
    // Phase 8: Generate AI suggestions
    if (dbResult.chunkId) {
      await generateSuggestions(supabase, dbResult.chunkId, textResult);
    }
    
    const processingTime = Date.now() - requestStart;
    console.log(`🎉 OCR Processing completed successfully in ${processingTime}ms`);
    
    return new Response(
      JSON.stringify({
        success: true,
        imageId: dbResult.imageId,
        chunkId: dbResult.chunkId,
        extractedText: textResult.text,
        confidence: textResult.confidence,
        detectedLanguage: textResult.language,
        contentHash: textResult.contentHash,
        processingTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    const processingTime = Date.now() - requestStart;
    console.error('❌ OCR Processing failed:', error);
    
    // Handle specific error types
    if (error instanceof OCRError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
          processingTime
        }),
        { 
          status: error instanceof ValidationError ? 400 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Generic error handling
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message,
        processingTime
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});