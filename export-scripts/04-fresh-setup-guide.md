# ArborQuant Fresh Project Setup Guide

## Phase 1: Create New Lovable Project

### 1.1 Initialize Project
1. Go to [lovable.dev](https://lovable.dev)
2. Create new project: "ArborQuant v2" 
3. Choose React + TypeScript template
4. Wait for project initialization

### 1.2 Initial Setup
```bash
# The following will be handled automatically by Lovable:
# - Basic React setup with Vite
# - TypeScript configuration
# - Initial dependencies
```

## Phase 2: Database Restoration

### 2.1 Connect Supabase
1. In Lovable, enable Supabase integration
2. Create new Supabase project or connect existing
3. Note the new project credentials

### 2.2 Run Database Migration
1. Open Supabase SQL Editor in your new project
2. Copy and paste the complete content from `01-database-export.sql`
3. Execute the script (may take 2-3 minutes)
4. Verify all tables, functions, and policies are created

### 2.3 Import Data
Run these queries in Supabase SQL Editor to import your data:

```sql
-- Import knowledge base sources
INSERT INTO public.kb_sources (id, title, authors, year, publisher, lang, kind, notes)
VALUES 
-- [Copy your existing KB sources data here]

-- Import species data  
INSERT INTO public.species (id, scientific_name, common_names, family, genus)
VALUES
-- [Copy your existing species data here]

-- Import knowledge base chunks
INSERT INTO public.kb_chunks (id, source_id, content, content_en, lang, species_ids, defect_ids)
VALUES
-- [Copy your existing chunks data here]

-- Continue for all tables with data...
```

### 2.4 Configure Storage Buckets
In Supabase Dashboard > Storage:
1. Create bucket: `kb-images` (public)
2. Create bucket: `kb-figures` (public) 
3. Create bucket: `tree-photos` (public)
4. Set appropriate RLS policies for each bucket

## Phase 3: Edge Functions Setup

### 3.1 Create Functions Directory Structure
```
supabase/
├── config.toml
└── functions/
    ├── process-openai-ocr/
    │   └── index.ts
    ├── translate-content/
    │   └── index.ts
    └── extract-structured-data/
        └── index.ts
```

### 3.2 Copy Function Code
1. Copy all function files from your backup
2. Update `config.toml` with new project ID:
```toml
project_id = "YOUR_NEW_PROJECT_ID"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[functions.process-openai-ocr]
verify_jwt = false
```

### 3.3 Configure Secrets
In Supabase Dashboard > Settings > Edge Functions:
1. Add `OPENAI_API_KEY` with your OpenAI API key
2. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-generated

## Phase 4: Frontend Implementation

### 4.1 Install Dependencies
Add these dependencies to your Lovable project:
```bash
# Core dependencies (add via Lovable dependency manager)
@supabase/supabase-js
@hookform/resolvers
react-hook-form
zod
leaflet
react-leaflet
@types/leaflet
react-dropzone
tesseract.js
lucide-react
date-fns
```

### 4.2 Configure Design System
1. Replace `src/index.css` with the ArborQuant theme
2. Update `tailwind.config.ts` with semantic tokens
3. Set up the forest green color palette

### 4.3 Implement Core Structure
**Step 1: Authentication System**
```typescript
// 1. Create src/hooks/useAuth.tsx
// 2. Create src/pages/Auth.tsx  
// 3. Create src/components/ProtectedRoute.tsx
// 4. Update src/integrations/supabase/client.ts
```

**Step 2: Main Application Shell**
```typescript
// 1. Create src/components/ArborQuantApp.tsx
// 2. Implement tab-based navigation
// 3. Set up routing in src/App.tsx
```

**Step 3: Core Hooks**
```typescript
// 1. Create src/hooks/useTreeAssessment.tsx
// 2. Create src/hooks/useKnowledgeBase.tsx
// 3. Create src/hooks/useProcessingQueue.tsx
```

### 4.4 Implement Feature Components
**Tree Assessment System:**
1. `src/components/tabs/TreeAssessmentTab.tsx`
2. `src/components/treeAssessment/TreeMap.tsx`
3. `src/components/treeAssessment/TreeForm.tsx`

**Knowledge Base System:**
1. `src/components/knowledgeBase/KnowledgeBaseImport.tsx`
2. `src/components/knowledgeBase/ImageUploadZone.tsx`
3. `src/components/knowledgeBase/ChunkReviewPanel.tsx`

**Processing Queue:**
1. `src/components/queue/EnhancedProgressBar.tsx`
2. `src/components/queue/QueueDetailsModal.tsx`

### 4.5 Add UI Components
Install shadcn/ui components as needed:
```bash
# Use Lovable's built-in component generator
# Add: Button, Card, Dialog, Form, Input, etc.
```

## Phase 5: Configuration & Testing

### 5.1 Environment Setup
Update Supabase client configuration:
```typescript
// src/integrations/supabase/client.ts
const SUPABASE_URL = "https://YOUR_NEW_PROJECT_ID.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_NEW_ANON_KEY";
```

### 5.2 Test Authentication
1. Test user registration
2. Test Google OAuth (configure providers)
3. Test role assignment
4. Verify protected routes

### 5.3 Test Core Features
1. **Tree Assessment**: Create tree, add assessment, test map
2. **Knowledge Base**: Upload document, process with OCR, review chunks
3. **Processing Queue**: Monitor processing status, test error handling
4. **User Management**: Test role assignment, profile updates

### 5.4 Verify Data Integrity
1. Check all imported data displays correctly
2. Test search functionality
3. Verify relationships between tables
4. Test edge function integrations

## Phase 6: Production Setup

### 6.1 Configure Authentication
In Supabase Dashboard > Authentication:
1. Configure email templates
2. Set up Google OAuth credentials
3. Configure redirect URLs
4. Set up custom domains if needed

### 6.2 Security Review
1. Verify all RLS policies are active
2. Test unauthorized access scenarios
3. Review edge function permissions
4. Check storage bucket policies

### 6.3 Performance Optimization
1. Add database indexes for common queries
2. Configure CDN for storage buckets
3. Test with production data volumes
4. Monitor edge function performance

## Troubleshooting Guide

### Common Issues

**Database Connection Errors:**
- Verify Supabase URL and keys in client configuration
- Check if RLS policies are properly configured
- Ensure user has correct roles assigned

**Authentication Issues:**
- Verify auth provider configuration
- Check redirect URLs in Supabase settings
- Test with fresh browser session

**Edge Function Errors:**
- Check function logs in Supabase Dashboard
- Verify OpenAI API key is correctly set
- Test functions individually via dashboard

**Upload/Processing Issues:**
- Check storage bucket permissions
- Verify OCR function is working
- Test with smaller files first

### Migration Checklist
- [ ] Database schema restored
- [ ] All data imported correctly
- [ ] Edge functions deployed and working
- [ ] Authentication system functional
- [ ] Core features working (tree assessment, KB management)
- [ ] UI/UX matches original design
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Production configuration complete

## Success Criteria
✅ Users can log in and create accounts  
✅ Tree assessments can be created and saved  
✅ Documents can be uploaded and processed  
✅ Knowledge base content is searchable  
✅ Processing queue shows real-time progress  
✅ All user roles function correctly  
✅ Map integration works for tree locations  
✅ OCR and AI processing functions work  
✅ Data relationships are preserved  
✅ Original design system is maintained  

## Estimated Timeline
- **Phase 1-2**: 1-2 hours (project setup + database)
- **Phase 3**: 30 minutes (edge functions)
- **Phase 4**: 4-6 hours (frontend implementation)
- **Phase 5**: 2-3 hours (testing and configuration)
- **Phase 6**: 1-2 hours (production setup)

**Total: 8-12 hours** (depending on complexity and testing thoroughness)