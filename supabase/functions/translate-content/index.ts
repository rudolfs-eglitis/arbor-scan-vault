import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  chunkId: number;
  sourceId: string;
  content: string;
  originalLanguage?: string;
}

interface TranslationResult {
  translatedContent: string;
  detectedLanguage: string;
  confidence: number;
}

class TranslationError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
  }
}

function validateEnvironment() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

  if (!supabaseUrl || !supabaseKey || !openaiApiKey) {
    throw new TranslationError('Missing required environment variables', 500);
  }

  return { supabaseUrl, supabaseKey, openaiApiKey };
}

function validateInput(body: any): TranslationRequest {
  if (!body || typeof body !== 'object') {
    throw new TranslationError('Invalid request body', 400);
  }

  const { chunkId, sourceId, content, originalLanguage } = body;

  if (!chunkId || !sourceId || !content) {
    throw new TranslationError('Missing required fields: chunkId, sourceId, content', 400);
  }

  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new TranslationError('Content must be a non-empty string', 400);
  }

  return { chunkId, sourceId, content: content.trim(), originalLanguage };
}

async function detectLanguageAndTranslate(content: string, openaiApiKey: string): Promise<TranslationResult> {
  console.log('Starting language detection and translation...');
  
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
          content: `You are a language detection and translation expert specializing in forestry, arboriculture, and botanical content.

TASK:
1. Detect the language of the provided text
2. If the text is NOT in English, translate it to English while preserving:
   - Scientific names (Latin binomials) exactly as written
   - Technical terminology and measurements
   - Structural formatting and organization
   - Specialized forestry/botanical terms

RESPONSE FORMAT:
Return a JSON object with exactly these fields:
{
  "detectedLanguage": "language_code",
  "translatedContent": "translated_text_here",
  "confidence": confidence_score_0_to_1
}

LANGUAGE CODES: Use ISO 639-1 codes (en, sv, de, fr, etc.)

TRANSLATION GUIDELINES:
- Maintain technical accuracy above all
- Preserve scientific nomenclature
- Keep measurements and units unchanged
- Maintain document structure and formatting
- If already in English, return original text
- For mixed-language content, translate non-English portions`
        },
        {
          role: 'user',
          content: content
        }
      ],
      max_completion_tokens: 4000,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI translation error:', errorText);
    throw new TranslationError(`Translation failed: ${response.status} ${response.statusText}`, 500);
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);

  if (!result.detectedLanguage || !result.translatedContent || typeof result.confidence !== 'number') {
    throw new TranslationError('Invalid translation response format', 500);
  }

  console.log(`Translation completed. Language: ${result.detectedLanguage}, Confidence: ${result.confidence}`);
  return result;
}

async function updateChunkTranslation(
  supabase: any,
  chunkId: number,
  translationResult: TranslationResult
): Promise<void> {
  console.log(`Updating chunk ${chunkId} with translation...`);

  const { error } = await supabase
    .from('kb_chunks')
    .update({
      content_en: translationResult.translatedContent,
      lang: translationResult.detectedLanguage,
      meta: {
        processing_phase: 'phase2_translation',
        translation_confidence: translationResult.confidence,
        original_language: translationResult.detectedLanguage,
        translation_completed_at: new Date().toISOString()
      }
    })
    .eq('id', chunkId);

  if (error) {
    console.error('Database update error:', error);
    throw new TranslationError(`Failed to update chunk: ${error.message}`, 500);
  }

  console.log(`Successfully updated chunk ${chunkId}`);
}

async function updateQueuePagePhase2(
  supabase: any,
  chunkId: number
): Promise<void> {
  // Find the queue page associated with this chunk
  const { data: chunk, error: chunkError } = await supabase
    .from('kb_chunks')
    .select('source_id, pages')
    .eq('id', chunkId)
    .single();

  if (chunkError || !chunk) {
    console.warn(`Could not find chunk ${chunkId} for queue page update`);
    return;
  }

  // Update queue_pages phase2_completed_at
  const { error: updateError } = await supabase
    .from('queue_pages')
    .update({
      phase2_completed_at: new Date().toISOString()
    })
    .eq('queue_id', chunk.source_id)
    .eq('page_number', parseInt(chunk.pages) || 1);

  if (updateError) {
    console.warn('Failed to update queue page phase 2 status:', updateError);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('=== TRANSLATE CONTENT FUNCTION START ===');
    
    const { supabaseUrl, supabaseKey, openaiApiKey } = validateEnvironment();
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const requestBody = await req.json();
    const { chunkId, sourceId, content } = validateInput(requestBody);
    
    console.log(`Processing translation for chunk ${chunkId}, source ${sourceId}`);
    
    // Check if content is already in English or very short
    if (content.length < 50) {
      console.log('Content too short for translation, skipping');
      await updateChunkTranslation(supabase, chunkId, {
        translatedContent: content,
        detectedLanguage: 'en',
        confidence: 1.0
      });
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Short content passed through without translation',
        detectedLanguage: 'en',
        confidence: 1.0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Perform language detection and translation
    const translationResult = await detectLanguageAndTranslate(content, openaiApiKey);
    
    // Update the chunk with translation results
    await updateChunkTranslation(supabase, chunkId, translationResult);
    
    // Update queue page status
    await updateQueuePagePhase2(supabase, chunkId);
    
    console.log('=== TRANSLATE CONTENT FUNCTION COMPLETE ===');
    
    return new Response(JSON.stringify({
      success: true,
      chunkId,
      detectedLanguage: translationResult.detectedLanguage,
      confidence: translationResult.confidence,
      originalLength: content.length,
      translatedLength: translationResult.translatedContent.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Translation function error:', error);
    
    const statusCode = error instanceof TranslationError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({
      error: message,
      type: error.constructor.name
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});