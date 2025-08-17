import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OCRRequest {
  imageUrl: string;
  sourceId: string;
  page: number;
}

interface TextResult {
  text: string;
  confidence: number;
  language: string;
  contentHash: string;
}

// Custom error classes for better error categorization
class OCRError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'OCRError';
  }
}

class AuthenticationError extends OCRError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends OCRError {
  constructor(message: string = 'Invalid input') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

// Environment validation
function validateEnvironment() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new AuthenticationError('Missing Supabase configuration');
  }

  if (!openaiApiKey) {
    throw new AuthenticationError('Missing OPENAI_API_KEY in environment variables');
  }

  return { supabaseUrl, supabaseServiceKey, openaiApiKey };
}

// Input validation
function validateInput(input: any): OCRRequest {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Request body must be a valid JSON object');
  }

  const { imageUrl, sourceId, page } = input;

  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new ValidationError('imageUrl is required and must be a string');
  }

  if (!sourceId || typeof sourceId !== 'string') {
    throw new ValidationError('sourceId is required and must be a string');
  }

  if (page === undefined || page === null || typeof page !== 'number' || page < 0) {
    throw new ValidationError('page is required and must be a non-negative number');
  }

  return { imageUrl: imageUrl.trim(), sourceId: sourceId.trim(), page };
}

// Resolve image URL to public URL if needed
async function resolveImageUrl(imageUrl: string, supabase: any): Promise<string> {
  console.log('Resolving image URL:', imageUrl);
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log('Image URL is already public:', imageUrl);
    return imageUrl;
  }

  // Handle relative paths from Supabase storage - assume they're in kb-images bucket
  const { data } = await supabase.storage
    .from('kb-images')
    .getPublicUrl(imageUrl);
    
  console.log('Resolved image URL:', data.publicUrl);
  return data.publicUrl;
}

// Verify image URL is accessible with retry logic
async function verifyImageUrl(imageUrl: string): Promise<void> {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Verifying image accessibility (attempt ${attempt}/${maxRetries}):`, imageUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(imageUrl, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new OCRError(`Image not accessible: ${response.status} - ${response.statusText}`, 404);
      }
      
      console.log('Image verification successful');
      return;
    } catch (error) {
      console.error(`Image verification failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        if (error instanceof OCRError) throw error;
        throw new OCRError(`Failed to verify image after ${maxRetries} attempts: ${error.message}`, 404);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// Process image with OpenAI Vision with progress updates
async function processImageWithOpenAI(
  imageUrl: string, 
  openaiApiKey: string, 
  supabase: any, 
  sourceId: string, 
  page: number
): Promise<any> {
  console.log('Processing image with OpenAI Vision:', imageUrl);

  // Update stage: loading image
  await updateProcessingStage(supabase, sourceId, page, 'loading');
  
  // First verify the image is accessible
  await verifyImageUrl(imageUrl);

  const systemPrompt = `You are an expert OCR system. Extract ALL text from the image with high accuracy. 
  
  Rules:
  1. Extract ALL visible text exactly as it appears
  2. Preserve original formatting, line breaks, and spacing
  3. Include headers, body text, captions, footnotes - everything
  4. For tables, preserve structure with appropriate spacing/tabs
  5. If text is unclear, make your best attempt but note uncertainty
  6. Return ONLY the extracted text, no commentary or metadata
  7. If no text is found, return "NO_TEXT_FOUND"`;

  // Prepare request body with better prompt
  const requestBody = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please extract all visible text from this image. Pay attention to both main content and any smaller text, headers, footnotes, or captions.',
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'high'
            },
          },
        ],
      },
    ],
    max_tokens: 4000,
    temperature: 0.1,
  };

  console.log('Sending request to OpenAI Vision API...');
  
  // Add timeout and retry logic for OpenAI API calls
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal: controller.signal,
  });
  
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    
    // Handle specific timeout errors
    if (errorText.includes('Timeout while downloading') || errorText.includes('invalid_image_url')) {
      throw new OCRError(`Image access timeout: The image may be too large or temporarily unavailable. ${errorText}`, 408);
    }
    
    throw new OCRError(`OpenAI API error: ${response.status} - ${errorText}`, response.status);
  }

  const result = await response.json();
  console.log('OpenAI Vision response received');

  if (!result.choices || !result.choices[0] || !result.choices[0].message) {
    throw new OCRError('Invalid OpenAI response format');
  }

  // Update stage: processing content
  await updateProcessingStage(supabase, sourceId, page, 'processing');

  return result;
}

// Process extracted text
async function processExtractedText(openaiResult: any): Promise<TextResult> {
  const extractedText = openaiResult.choices[0].message.content?.trim() || '';
  
  if (!extractedText || extractedText === 'NO_TEXT_FOUND') {
    return {
      text: '',
      confidence: 0,
      language: 'unknown',
      contentHash: ''
    };
  }

  // Calculate confidence based on response quality
  const confidence = Math.min(95, Math.max(85, 90 + (extractedText.length / 100)));

  // Simple language detection (could be enhanced)
  const language = detectLanguage(extractedText);

  // Generate content hash
  const encoder = new TextEncoder();
  const data = encoder.encode(extractedText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    text: extractedText,
    confidence,
    language,
    contentHash
  };
}

// Simple language detection
function detectLanguage(text: string): string {
  const swedishWords = ['och', 'det', 'att', 'i', 'en', 'av', 'är', 'för', 'på', 'med', 'som', 'till'];
  const englishWords = ['and', 'the', 'to', 'of', 'a', 'in', 'is', 'for', 'with', 'as', 'on', 'at'];
  
  const words = text.toLowerCase().split(/\s+/).slice(0, 50);
  const swedishCount = words.filter(word => swedishWords.includes(word)).length;
  const englishCount = words.filter(word => englishWords.includes(word)).length;
  
  if (swedishCount > englishCount) return 'sv';
  if (englishCount > 0) return 'en';
  return 'unknown';
}

// Update processing stage in queue
async function updateProcessingStage(supabase: any, sourceId: string, page: number, stage: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('processing_queue')
      .update({ current_stage: stage })
      .eq('source_id', sourceId);
    
    if (error) {
      console.log('Note: Could not update processing stage:', error.message);
    } else {
      console.log(`Updated processing stage to: ${stage}`);
    }
  } catch (error) {
    console.log('Note: Could not update processing stage:', error);
  }
}

// Update database with OCR results
async function updateDatabase(supabase: any, request: OCRRequest, textResult: TextResult): Promise<void> {
  const { imageUrl, sourceId, page } = request;
  const { text, confidence, language, contentHash } = textResult;

  // Update stage: saving results
  await updateProcessingStage(supabase, sourceId, page, 'saving');
  
  console.log('Updating database with OCR results');

  // Insert or update kb_chunks table with the extracted text
  if (text && text.length > 10) {
    const { data: chunkData, error: insertError } = await supabase
      .from('kb_chunks')
      .insert({
        source_id: sourceId,
        pages: page.toString(),
        content: text,
        content_sha256: contentHash,
        lang: language,
        meta: {
          ocr_confidence: confidence,
          ocr_provider: 'openai_vision',
          processed_at: new Date().toISOString(),
          image_url: imageUrl
        }
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting kb_chunks:', insertError);
      throw new OCRError(`Chunk insertion failed: ${insertError.message}`);
    }

    console.log(`Created chunk with ID: ${chunkData.id}`);

    // Generate suggestions if text is substantial
    if (text.length > 50) {
      await updateProcessingStage(supabase, sourceId, page, 'suggestions');
      await generateSuggestions(supabase, chunkData.id, textResult);
    }
  } else {
    console.log('No substantial text extracted, skipping chunk creation');
  }

  // Update kb_images table if there's a matching record (optional)
  const { error: updateError } = await supabase
    .from('kb_images')
    .update({
      meta: {
        ocr_processed: true,
        ocr_confidence: confidence,
        ocr_language: language,
        ocr_provider: 'openai_vision',
        processed_at: new Date().toISOString(),
        text_length: text ? text.length : 0
      }
    })
    .eq('source_id', sourceId)
    .eq('page', page);

  if (updateError) {
    console.log('Note: Could not update kb_images (this is optional):', updateError.message);
  }
}

// Generate AI suggestions (placeholder for future enhancement)
async function generateSuggestions(supabase: any, chunkId: number, textResult: TextResult): Promise<void> {
  console.log(`Generating suggestions for chunk ${chunkId}`);
  // Could implement AI-based suggestions here using the extracted text
}

// Health check endpoint
function handleHealthCheck(): Response {
  try {
    validateEnvironment();
    return new Response(
      JSON.stringify({ 
        status: 'healthy', 
        provider: 'openai_vision',
        timestamp: new Date().toISOString() 
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Health check endpoint
    if (req.method === 'GET') {
      return handleHealthCheck();
    }

    // Only accept POST requests for OCR processing
    if (req.method !== 'POST') {
      throw new ValidationError('Only POST and GET methods are allowed');
    }

    console.log('Starting OpenAI OCR processing...');

    // Validate environment
    const { supabaseUrl, supabaseServiceKey, openaiApiKey } = validateEnvironment();

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse and validate request
    const requestBody = await req.json();
    const ocrRequest = validateInput(requestBody);
    console.log('Processing OCR request:', { sourceId: ocrRequest.sourceId, page: ocrRequest.page });

    // Resolve image URL
    const resolvedImageUrl = await resolveImageUrl(ocrRequest.imageUrl, supabase);
    console.log('Resolved image URL:', resolvedImageUrl);

    // Process image with OpenAI Vision
    const openaiResult = await processImageWithOpenAI(resolvedImageUrl, openaiApiKey, supabase, ocrRequest.sourceId, ocrRequest.page);

    // Process extracted text
    const textResult = await processExtractedText(openaiResult);
    console.log('Text processing completed:', { 
      textLength: textResult.text.length, 
      confidence: textResult.confidence,
      language: textResult.language 
    });

    // Update database
    await updateDatabase(supabase, ocrRequest, textResult);

    console.log('OCR processing completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        result: {
          text: textResult.text,
          confidence: textResult.confidence,
          language: textResult.language,
          contentHash: textResult.contentHash,
          provider: 'openai_vision'
        },
        message: 'OCR processing completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OCR processing error:', error);

    let statusCode = 500;
    let errorMessage = 'An unexpected error occurred during OCR processing';
    let errorType = 'InternalError';

    if (error instanceof OCRError) {
      statusCode = error.statusCode;
      errorMessage = error.message;
      errorType = error.name;
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          type: errorType,
          message: errorMessage,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});