import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractionRequest {
  chunkId: number;
  sourceId: string;
  content: string;
  pageNumber?: number;
}

interface StructuredSuggestion {
  targetTable: string;
  suggestedData: any;
  confidenceScore: number;
  suggestionType: 'species_data' | 'defect_data' | 'fungi_data' | 'measurement_data' | 'other';
  rationale: string;
}

class ExtractionError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
  }
}

function validateEnvironment() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

  if (!supabaseUrl || !supabaseKey || !openaiApiKey) {
    throw new ExtractionError('Missing required environment variables', 500);
  }

  return { supabaseUrl, supabaseKey, openaiApiKey };
}

function validateInput(body: any): ExtractionRequest {
  if (!body || typeof body !== 'object') {
    throw new ExtractionError('Invalid request body', 400);
  }

  const { chunkId, sourceId, content, pageNumber } = body;

  if (!chunkId || !sourceId || !content) {
    throw new ExtractionError('Missing required fields: chunkId, sourceId, content', 400);
  }

  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new ExtractionError('Content must be a non-empty string', 400);
  }

  return { chunkId, sourceId, content: content.trim(), pageNumber };
}

async function extractStructuredData(content: string, openaiApiKey: string): Promise<StructuredSuggestion[]> {
  console.log('Starting structured data extraction...');
  
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
          content: `You are an expert in forestry, arboriculture, and botanical data extraction. Your task is to analyze scientific text and extract structured data that can populate a forestry knowledge base.

EXTRACTION TARGETS:
1. SPECIES DATA: Scientific names, common names, growth characteristics, site preferences, defect susceptibilities
2. DEFECT DATA: Defect names, descriptions, field indicators, development patterns, management approaches
3. FUNGI DATA: Scientific names, decay types, host relationships, structural effects, identification signs
4. MEASUREMENT DATA: Heights, spreads, tolerance ratings, lifespan estimates, environmental parameters
5. MANAGEMENT DATA: Treatment recommendations, timing, conditions, follow-up actions

AVAILABLE DATABASE TABLES:
- species: id, scientific_name, common_names[], family, genus, regions[]
- defects: id, name, category, field_indicators[], development, mechanics_effect
- fungi: id, scientific_name, common_names[], decay, colonization[], typical_tissue[]
- species_growth: species_id, mature_height_m, mature_spread_m, growth_rate, lifespan_years
- species_site_traits: species_id, pollution_tolerance, drought_tolerance, shade_tolerance (1-5 scale)
- mitigations: defect_id, species_id, mtype, action, conditions, timing, follow_up

RESPONSE FORMAT:
Return a JSON object with a "suggestions" array. Each suggestion must have:
{
  "targetTable": "table_name",
  "suggestedData": {object_with_table_columns},
  "confidenceScore": 0.0-1.0,
  "suggestionType": "species_data|defect_data|fungi_data|measurement_data|other",
  "rationale": "explanation_of_extraction"
}

EXTRACTION GUIDELINES:
- Only extract data that is explicitly stated in the text
- Use fuzzy matching for existing species/defect IDs when possible
- Convert measurements to appropriate units (meters, years, 1-5 scales)
- Assign confidence based on text clarity and completeness
- Include rationale explaining what text supported the extraction
- Generate multiple suggestions if text contains data for multiple tables
- Skip ambiguous or unclear information

CONFIDENCE SCORING:
- 0.9-1.0: Explicit, complete data with clear values
- 0.7-0.8: Clear data with minor gaps or assumptions
- 0.5-0.6: Partial data requiring interpretation
- Below 0.5: Too ambiguous, don't suggest

Return {"suggestions": []} if no extractable structured data is found.`
        },
        {
          role: 'user',
          content: `Extract structured data from this text:\n\n${content}`
        }
      ],
      max_completion_tokens: 4000,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI extraction error:', errorText);
    throw new ExtractionError(`Data extraction failed: ${response.status} ${response.statusText}`, 500);
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);

  if (!result.suggestions || !Array.isArray(result.suggestions)) {
    console.log('No structured suggestions found in content');
    return [];
  }

  console.log(`Extracted ${result.suggestions.length} structured suggestions`);
  return result.suggestions;
}

async function fuzzyMatchExistingRecords(
  supabase: any,
  suggestions: StructuredSuggestion[]
): Promise<StructuredSuggestion[]> {
  console.log('Performing fuzzy matching against existing records...');

  const enhancedSuggestions = [];

  for (const suggestion of suggestions) {
    let enhancedSuggestion = { ...suggestion };

    try {
      // Fuzzy match species by scientific name
      if (suggestion.targetTable === 'species' && suggestion.suggestedData.scientific_name) {
        const { data: species } = await supabase
          .from('species')
          .select('id, scientific_name')
          .ilike('scientific_name', `%${suggestion.suggestedData.scientific_name}%`)
          .limit(3);

        if (species && species.length > 0) {
          enhancedSuggestion.suggestedData.potential_matches = species;
          enhancedSuggestion.rationale += ` | Found ${species.length} potential species matches.`;
        }
      }

      // Fuzzy match defects by name
      if (suggestion.targetTable === 'defects' && suggestion.suggestedData.name) {
        const { data: defects } = await supabase
          .from('defects')
          .select('id, name')
          .ilike('name', `%${suggestion.suggestedData.name}%`)
          .limit(3);

        if (defects && defects.length > 0) {
          enhancedSuggestion.suggestedData.potential_matches = defects;
          enhancedSuggestion.rationale += ` | Found ${defects.length} potential defect matches.`;
        }
      }

      // Fuzzy match fungi by scientific name
      if (suggestion.targetTable === 'fungi' && suggestion.suggestedData.scientific_name) {
        const { data: fungi } = await supabase
          .from('fungi')
          .select('id, scientific_name')
          .ilike('scientific_name', `%${suggestion.suggestedData.scientific_name}%`)
          .limit(3);

        if (fungi && fungi.length > 0) {
          enhancedSuggestion.suggestedData.potential_matches = fungi;
          enhancedSuggestion.rationale += ` | Found ${fungi.length} potential fungi matches.`;
        }
      }

      enhancedSuggestions.push(enhancedSuggestion);
    } catch (error) {
      console.warn(`Fuzzy matching failed for suggestion:`, error);
      enhancedSuggestions.push(suggestion);
    }
  }

  return enhancedSuggestions;
}

async function storeSuggestions(
  supabase: any,
  chunkId: number,
  pageNumber: number,
  suggestions: StructuredSuggestion[]
): Promise<void> {
  console.log(`Storing ${suggestions.length} suggestions for chunk ${chunkId}...`);

  // First, find the queue page ID
  const { data: chunk, error: chunkError } = await supabase
    .from('kb_chunks')
    .select('source_id')
    .eq('id', chunkId)
    .single();

  if (chunkError || !chunk) {
    console.warn(`Could not find chunk ${chunkId} for suggestions storage`);
    return;
  }

  const { data: queuePage, error: pageError } = await supabase
    .from('queue_pages')
    .select('id')
    .eq('queue_id', chunk.source_id)
    .eq('page_number', pageNumber || 1)
    .single();

  if (pageError || !queuePage) {
    console.warn(`Could not find queue page for suggestions storage`);
    return;
  }

  // Store each suggestion
  for (const suggestion of suggestions) {
    const { error } = await supabase
      .from('page_suggestions')
      .insert({
        page_id: queuePage.id,
        suggestion_type: suggestion.suggestionType,
        target_table: suggestion.targetTable,
        suggested_data: suggestion.suggestedData,
        confidence_score: suggestion.confidenceScore,
        notes: suggestion.rationale
      });

    if (error) {
      console.error('Failed to store suggestion:', error);
    }
  }

  console.log(`Successfully stored ${suggestions.length} suggestions`);
}

async function updateChunkPhase3(
  supabase: any,
  chunkId: number,
  suggestionsCount: number
): Promise<void> {
  console.log(`Updating chunk ${chunkId} with phase 3 completion...`);

  const { error } = await supabase
    .from('kb_chunks')
    .update({
      meta: {
        processing_phase: 'phase3_extraction',
        suggestions_generated: suggestionsCount,
        extraction_completed_at: new Date().toISOString()
      }
    })
    .eq('id', chunkId);

  if (error) {
    console.error('Failed to update chunk phase 3 status:', error);
  }
}

async function updateQueuePagePhase3(
  supabase: any,
  chunkId: number
): Promise<void> {
  const { data: chunk, error: chunkError } = await supabase
    .from('kb_chunks')
    .select('source_id, pages')
    .eq('id', chunkId)
    .single();

  if (chunkError || !chunk) {
    console.warn(`Could not find chunk ${chunkId} for queue page update`);
    return;
  }

  const { error: updateError } = await supabase
    .from('queue_pages')
    .update({
      phase3_completed_at: new Date().toISOString()
    })
    .eq('queue_id', chunk.source_id)
    .eq('page_number', parseInt(chunk.pages) || 1);

  if (updateError) {
    console.warn('Failed to update queue page phase 3 status:', updateError);
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
    console.log('=== EXTRACT STRUCTURED DATA FUNCTION START ===');
    
    const { supabaseUrl, supabaseKey, openaiApiKey } = validateEnvironment();
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const requestBody = await req.json();
    const { chunkId, sourceId, content, pageNumber } = validateInput(requestBody);
    
    console.log(`Processing structured extraction for chunk ${chunkId}, source ${sourceId}`);
    
    // Extract structured data using OpenAI
    const suggestions = await extractStructuredData(content, openaiApiKey);
    
    if (suggestions.length === 0) {
      console.log('No structured data found in content');
      await updateChunkPhase3(supabase, chunkId, 0);
      await updateQueuePagePhase3(supabase, chunkId);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'No structured data found',
        suggestionsCount: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Enhance suggestions with fuzzy matching
    const enhancedSuggestions = await fuzzyMatchExistingRecords(supabase, suggestions);
    
    // Store suggestions in the database
    await storeSuggestions(supabase, chunkId, pageNumber || 1, enhancedSuggestions);
    
    // Update chunk and queue page status
    await updateChunkPhase3(supabase, chunkId, enhancedSuggestions.length);
    await updateQueuePagePhase3(supabase, chunkId);
    
    console.log('=== EXTRACT STRUCTURED DATA FUNCTION COMPLETE ===');
    
    return new Response(JSON.stringify({
      success: true,
      chunkId,
      suggestionsCount: enhancedSuggestions.length,
      suggestions: enhancedSuggestions.map(s => ({
        targetTable: s.targetTable,
        suggestionType: s.suggestionType,
        confidenceScore: s.confidenceScore,
        rationale: s.rationale
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Structured extraction function error:', error);
    
    const statusCode = error instanceof ExtractionError ? error.statusCode : 500;
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