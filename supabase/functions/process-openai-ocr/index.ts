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
    figures?: any[];
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        {
          role: 'system',
          content: `You are an expert OCR and content extraction specialist focusing on forestry, arboriculture, and botanical literature.

Your task is to:
1. Extract ALL text content exactly as written, preserving structure and formatting
2. Identify and describe all figures, images, diagrams, charts, tables, and illustrations
3. Maintain original language without translation or interpretation
4. Preserve scientific nomenclature, measurements, and technical terminology
5. Determine the page number from filename, headers, footers, or page markers

IMPORTANT INSTRUCTIONS:
- Extract text verbatim without summarization or interpretation
- Maintain original paragraph breaks, lists, and structure
- Preserve all scientific names in their original form
- Keep measurements, ratings, and numerical data unchanged
- Note any handwritten text, annotations, or marginal notes
- Identify page number from context clues

PAGE NUMBER DETECTION:
Look for page numbers in:
- Headers or footers
- Corner positions
- Chapter/section numbering
- Sequential indicators
If no clear page number, estimate from content context

FIGURE/IMAGE IDENTIFICATION:
When you identify figures, images, diagrams, charts, or illustrations, format them as:
[FIGURES FOUND]
Figure Type: [diagram/photo/chart/table/illustration/map/etc.]
Description: [detailed description of visual content]
Caption: [any visible caption or title]
Scientific Content: [species shown, defects illustrated, measurements, etc.]
Location: [position on page: top/middle/bottom/left/right/center]
[END FIGURES]

For tables, extract the complete table structure and data.
For charts/graphs, describe axes, data points, and trends.
For photographs, identify subjects (species, defects, symptoms, etc.).
For diagrams, describe what is being illustrated and any labels.

QUALITY INDICATORS:
- Note any unclear, damaged, or illegible text areas
- Indicate confidence level for uncertain text
- Mark any potential OCR artifacts or recognition issues

Remember: This is Phase 1 (Raw Extraction) - preserve everything as-is without interpretation or translation.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text and identify all figures from this image. Preserve original formatting and language:'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_completion_tokens: 4000,
    }),
  });

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

async function processExtractedText(openaiResult: any, supabase: any, sourceId: string, page: number): Promise<TextResult> {
  console.log('Processing extracted text and figures...');
  
  const extractedContent = openaiResult.choices[0].message.content;
  
  if (!extractedContent || extractedContent.trim().length === 0) {
    throw new OCRError('No content extracted from image', 400);
  }

  // Extract figures and save them
  const figures = await extractAndSaveFigures(extractedContent, supabase, sourceId, page);
  
  // Clean text (remove figure markers for the main text)
  const cleanedText = extractedContent
    .replace(/\[FIGURES FOUND\][\s\S]*?\[END FIGURES\]/g, '[FIGURE REMOVED]')
    .trim();

  // Calculate confidence (simplified - could be enhanced)
  const confidence = Math.min(0.95, Math.max(0.5, cleanedText.length / 100));
  
  // Detect language
  const language = detectLanguage(cleanedText);
  
  // Generate content hash
  const encoder = new TextEncoder();
  const data = encoder.encode(cleanedText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    text: cleanedText,
    confidence,
    language,
    contentHash,
    figures
  };
}

async function extractAndSaveFigures(content: string, supabase: any, sourceId: string, page: number): Promise<any[]> {
  console.log('Extracting and cataloging figures...');
  
  const figureRegex = /\[FIGURES FOUND\]([\s\S]*?)\[END FIGURES\]/g;
  const figures = [];
  let match;

  while ((match = figureRegex.exec(content)) !== null) {
    const figureContent = match[1].trim();
    
    // Parse figure details
    const figureData = parseFigureDetails(figureContent);
    
    // Store figure metadata in kb_images (upsert to handle duplicates)
    try {
      const { data, error } = await supabase
        .from('kb_images')
        .upsert({
          source_id: sourceId,
          page: page,
          caption: figureData.caption || figureData.description,
          meta: {
            figure_type: figureData.type,
            description: figureData.description,
            scientific_content: figureData.scientificContent,
            location: figureData.location,
            extraction_method: 'openai_vision_phase1'
          }
        }, {
          onConflict: 'source_id,page'
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to store figure metadata:', error);
      } else {
        figures.push({
          id: data.id,
          type: figureData.type,
          description: figureData.description,
          caption: figureData.caption,
          location: figureData.location
        });
        console.log(`Stored figure metadata for ${figureData.type} on page ${page}`);
      }
    } catch (error) {
      console.error('Error storing figure:', error);
    }
  }

  console.log(`Processed ${figures.length} figures from page ${page}`);
  return figures;
}

function parseFigureDetails(figureContent: string): any {
  const lines = figureContent.split('\n').map(line => line.trim()).filter(line => line);
  const details = {
    type: 'unknown',
    description: '',
    caption: '',
    scientificContent: '',
    location: ''
  };

  for (const line of lines) {
    if (line.startsWith('Figure Type:')) {
      details.type = line.replace('Figure Type:', '').trim();
    } else if (line.startsWith('Description:')) {
      details.description = line.replace('Description:', '').trim();
    } else if (line.startsWith('Caption:')) {
      details.caption = line.replace('Caption:', '').trim();
    } else if (line.startsWith('Scientific Content:')) {
      details.scientificContent = line.replace('Scientific Content:', '').trim();
    } else if (line.startsWith('Location:')) {
      details.location = line.replace('Location:', '').trim();
    }
  }

  return details;
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

async function updateDatabase(supabase: any, request: OCRRequest, textResult: TextResult): Promise<void> {
  console.log('Updating database with Phase 1 OCR results...');

  // Insert extracted text into kb_chunks with phase 1 metadata
  const { data: chunkData, error: chunkError } = await supabase
    .from('kb_chunks')
    .insert({
      source_id: request.sourceId,
      content: textResult.text,
      src_content: textResult.text,
      pages: request.page.toString(),
      lang: textResult.language,
      content_sha256: textResult.contentHash,
      meta: {
        processing_phase: 'phase1_extraction',
        ocr_confidence: textResult.confidence,
        ocr_method: 'openai_vision_phase1',
        figures_count: textResult.figures?.length || 0,
        processed_at: new Date().toISOString(),
        phase1_completed_at: new Date().toISOString()
      }
    })
    .select()
    .single();

  if (chunkError) {
    console.error('Failed to insert chunk:', chunkError);
    throw new OCRError(`Database error: ${chunkError.message}`, 500);
  }

  console.log(`Inserted chunk with ID: ${chunkData.id} (Phase 1 complete)`);

  // Update kb_images table with OCR metadata
  const { error: imageError } = await supabase
    .from('kb_images')
    .update({
      meta: {
        ocr_processed: true,
        ocr_confidence: textResult.confidence,
        text_length: textResult.text.length,
        content_hash: textResult.contentHash,
        processing_phase: 'phase1_extraction',
        processed_at: new Date().toISOString()
      }
    })
    .eq('source_id', request.sourceId)
    .eq('page', request.page);

  if (imageError) {
    console.warn('Failed to update image metadata:', imageError);
  }

  // Find the queue_id (UUID) from the source_id (text) to update queue_pages
  const { data: queueData, error: queueFindError } = await supabase
    .from('processing_queue')
    .select('id')
    .eq('source_id', request.sourceId)
    .single();

  if (queueFindError) {
    console.warn('Failed to find processing queue:', queueFindError);
  } else {
    // Update queue_pages with phase 1 completion and figures using the correct UUID
    const { error: queueError } = await supabase
      .from('queue_pages')
      .update({
        phase1_completed_at: new Date().toISOString(),
        figures_extracted: textResult.figures || [],
        extracted_text: textResult.text.substring(0, 1000) // Store preview
      })
      .eq('queue_id', queueData.id)
      .eq('page_number', request.page);

    if (queueError) {
      console.warn('Failed to update queue page phase 1 status:', queueError);
    }
  }

  console.log('Database updated successfully for Phase 1');
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

    // Process the extracted text and figures
    const textResult = await processExtractedText(openaiResult, supabase, ocrRequest.sourceId, ocrRequest.page);
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