# Frontend Component Inventory

## Project Structure
```
src/
├── components/
│   ├── ArborQuantApp.tsx          # Main application shell with tabs
│   ├── ProtectedRoute.tsx         # Authentication wrapper
│   ├── UserManagement.tsx         # Admin user management
│   ├── UserProfile.tsx            # User profile settings
│   ├── OCRTest.tsx               # OCR testing interface
│   │
│   ├── tabs/                     # Main application tabs
│   │   ├── TreeAssessmentTab.tsx # Tree assessment interface
│   │   ├── SourcesTab.tsx        # Knowledge base sources
│   │   ├── UploadTab.tsx         # Document upload
│   │   ├── QueueTab.tsx          # Processing queue
│   │   ├── ReviewTab.tsx         # Content review
│   │   └── UsersTab.tsx          # User management
│   │
│   ├── treeAssessment/           # Tree assessment components
│   │   ├── TreeMap.tsx           # Leaflet map integration
│   │   ├── MapPicker.tsx         # Location picker
│   │   ├── TreeForm.tsx          # Assessment form
│   │   └── TreeLocationSection.tsx # Location management
│   │
│   ├── knowledgeBase/            # Knowledge base components
│   │   ├── KnowledgeBaseImport.tsx    # Multi-step import wizard
│   │   ├── AddSourceForm.tsx          # Source registration
│   │   ├── ImageUploadZone.tsx        # Drag-drop upload
│   │   ├── ChunkReviewPanel.tsx       # Text review interface
│   │   └── PageSuggestionsPanel.tsx   # AI suggestions
│   │
│   ├── queue/                    # Processing queue components
│   │   ├── EnhancedProgressBar.tsx    # Progress visualization
│   │   ├── QueueDetailsModal.tsx      # Queue item details
│   │   └── QueueResultsModal.tsx      # Processing results
│   │
│   ├── upload/                   # Upload components
│   │   └── UploadProgress.tsx    # Upload progress tracking
│   │
│   └── ui/                       # Shadcn UI components (50+ files)
│       ├── button.tsx, card.tsx, dialog.tsx, etc.
│       └── ... (complete shadcn/ui component library)
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.tsx              # Authentication management
│   ├── useTreeAssessment.tsx    # Tree/assessment operations
│   ├── useKnowledgeBase.tsx     # KB operations
│   ├── useProcessingQueue.tsx   # Queue management
│   ├── useReviewData.tsx        # Review data fetching
│   ├── useOrphanedRecords.tsx   # Data cleanup
│   ├── use-mobile.tsx           # Mobile detection
│   └── use-toast.ts             # Toast notifications
│
├── pages/                        # Route components
│   ├── Index.tsx                # Landing/dashboard page
│   ├── Auth.tsx                 # Login/signup page
│   └── NotFound.tsx             # 404 page
│
├── integrations/supabase/        # Supabase integration
│   ├── client.ts                # Supabase client configuration
│   └── types.ts                 # Auto-generated database types
│
└── lib/
    └── utils.ts                  # Utility functions (cn helper)
```

## Key Features Implemented

### 1. Authentication System
- **Components**: `Auth.tsx`, `ProtectedRoute.tsx`, `UserProfile.tsx`
- **Hook**: `useAuth.tsx`
- **Features**: Email/password + Google OAuth, role-based access, enhanced debugging

### 2. Tree Assessment Workflow
- **Components**: Tree assessment tab and related components
- **Hook**: `useTreeAssessment.tsx`
- **Features**: QTRA-compliant assessments, interactive mapping, photo documentation

### 3. Knowledge Base Management
- **Components**: Knowledge base components directory
- **Hooks**: `useKnowledgeBase.tsx`, `useProcessingQueue.tsx`, `useReviewData.tsx`
- **Features**: Multi-step import, OCR processing, AI translation, manual review

### 4. Processing Pipeline
- **Components**: Queue components
- **Hook**: `useProcessingQueue.tsx`
- **Features**: Batch processing, progress tracking, error handling, retry mechanisms

### 5. User Management
- **Components**: `UserManagement.tsx`, `UsersTab.tsx`
- **Features**: Role assignment, profile management, audit trails

## Design System

### Theme Configuration
- **File**: `src/index.css`
- **Colors**: ArborQuant forest green theme with HSL values
- **Tokens**: Semantic design tokens for colors, gradients, shadows
- **Dark Mode**: Complete dark theme support

### Component Library
- **Base**: Shadcn/ui components with ArborQuant customizations
- **Styling**: Tailwind CSS with semantic tokens
- **Icons**: Lucide React icons
- **Forms**: React Hook Form with Zod validation

## Dependencies Summary
```json
{
  "core": ["react", "react-dom", "typescript"],
  "routing": ["react-router-dom"],
  "ui": ["@radix-ui/*", "lucide-react", "tailwindcss"],
  "forms": ["react-hook-form", "@hookform/resolvers", "zod"],
  "backend": ["@supabase/supabase-js"],
  "maps": ["leaflet", "react-leaflet"],
  "upload": ["react-dropzone"],
  "ocr": ["tesseract.js"],
  "dev": ["vite", "typescript", "eslint"]
}
```

## State Management
- React hooks for local state
- Supabase real-time for data synchronization
- React Query for caching (if implemented)
- Context API for authentication state

## Critical Implementation Notes

### Authentication
- Session-based with automatic refresh
- Role-based access control (user, arborist, admin)
- Google OAuth integration with popup flow

### File Handling
- React Dropzone for uploads
- Supabase Storage for file persistence
- OCR processing pipeline with queue management

### Map Integration
- Leaflet with OpenStreetMap tiles
- GPS coordinate capture
- Location-based tree management

### Real-time Features
- Processing queue updates
- Upload progress tracking
- Assessment collaboration (potential)

## Mobile Responsiveness
- Mobile-first design approach
- Touch-friendly interfaces
- Progressive Web App capabilities
- Field-optimized assessment forms

## Backup Priority
1. **High**: Authentication, tree assessment, knowledge base core
2. **Medium**: Queue processing, user management
3. **Low**: UI components (can be regenerated)

## Restoration Strategy
1. Start with basic structure (App, routing, auth)
2. Implement core hooks and data management
3. Add UI components and pages
4. Configure design system and theming
5. Test integration with restored database