# Edge Functions Backup & Configuration

## Function Overview
ArborQuant uses 3 Supabase Edge Functions for AI-powered document processing:

### 1. process-openai-ocr
**Purpose**: Extracts text from uploaded images using OpenAI Vision API  
**Location**: `supabase/functions/process-openai-ocr/index.ts`  
**Public Access**: Yes (verify_jwt = false)  
**Required Secrets**: OPENAI_API_KEY

### 2. translate-content  
**Purpose**: Translates extracted text while preserving forestry terminology  
**Location**: `supabase/functions/translate-content/index.ts`  
**Public Access**: No (requires authentication)  
**Required Secrets**: OPENAI_API_KEY

### 3. extract-structured-data
**Purpose**: Extracts structured entities (species, defects, fungi) from text  
**Location**: `supabase/functions/extract-structured-data/index.ts`  
**Public Access**: No (requires authentication)  
**Required Secrets**: OPENAI_API_KEY

## Supabase Configuration (config.toml)
```toml
project_id = "iuwxtoznnuuclxseuxoi"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[functions.process-openai-ocr]
verify_jwt = false
```

## Required Secrets
Set these in Supabase Dashboard > Settings > Edge Functions:
- `OPENAI_API_KEY`: Your OpenAI API key for GPT-4 Vision and text processing
- `SUPABASE_URL`: Auto-provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Auto-provided by Supabase

## Function Dependencies
All functions use:
- Supabase client for database operations
- OpenAI API for AI processing
- CORS headers for web app integration
- TypeScript for type safety

## Backup Instructions
1. Copy all files from `supabase/functions/` directory
2. Save the `supabase/config.toml` configuration
3. Document the required secrets (values stored securely in Supabase)
4. Note the function call patterns from the frontend code

## Restoration Steps
1. Create new Supabase project
2. Recreate the functions directory structure
3. Deploy functions using Supabase CLI or Lovable auto-deployment
4. Set up the required secrets in the new project
5. Update config.toml with new project ID
6. Test function calls from the frontend

## Function Call Patterns
Frontend calls these functions using:
```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* parameters */ }
});
```

## CORS Configuration
All functions include CORS headers:
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```