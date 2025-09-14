import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Clock, CheckCircle, TreePine, BookOpen, FileCheck, List, Users, AlertTriangle, Settings } from 'lucide-react';
import { ProtectedRoute } from './ProtectedRoute';
import { UserProfile } from './UserProfile';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { TreeAssessmentTab } from './tabs/TreeAssessmentTab';
import { SourcesTab } from './tabs/SourcesTab';
import UploadTab from './tabs/UploadTab';
import QueueTab from './tabs/QueueTab';
import ReviewTab from './tabs/ReviewTab';
import { UsersTab } from './tabs/UsersTab';
import { CreditsTab } from './tabs/CreditsTab';
import { OCRTest } from './OCRTest';

const ArborQuantApp = () => {
  const { hasRole, loading, profile } = useAuth();
  
  // Initialize with 'assessment' as default for all users
  const [activeMainTab, setActiveMainTab] = useState('assessment');
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState('sources');
  const isMobile = useIsMobile();

  // Update active tab once authentication and role loading is complete
  useEffect(() => {
    if (!loading && profile) {
      // Always default to assessment tab for cleaner UX
      setActiveMainTab('assessment');
    }
  }, [loading, profile]);

  // Determine which tabs to show based on user roles
  const isAdmin = hasRole('admin');
  const hasCreditsAccess = hasRole('pro_user') || hasRole('qtra_arborist') || hasRole('traq_arborist') || hasRole('admin');

  const renderMobileLayout = () => (
    <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full" defaultValue="assessment">
      {/* Main Navigation */}
      <TabsList className={`grid w-full ${isAdmin && hasCreditsAccess ? 'grid-cols-4' : hasCreditsAccess ? 'grid-cols-2' : isAdmin ? 'grid-cols-3' : 'grid-cols-1'}`}>
        <TabsTrigger value="assessment" className="flex items-center gap-2">
          <TreePine className="h-4 w-4" />
          <span className="hidden sm:inline">Tree Assessment</span>
          <span className="sm:hidden">Trees</span>
        </TabsTrigger>
        {hasCreditsAccess && (
          <TabsTrigger value="credits" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Credits</span>
            <span className="sm:hidden">Credits</span>
          </TabsTrigger>
        )}
        {isAdmin && (
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Knowledge Base</span>
            <span className="sm:hidden">Knowledge</span>
          </TabsTrigger>
        )}
        {isAdmin && (
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
        )}
      </TabsList>

      {/* Tree Assessment Tab */}
      <TabsContent value="assessment" className="mt-6">
        <TreeAssessmentTab />
      </TabsContent>

      {/* Credits Tab */}
      {hasCreditsAccess && (
        <TabsContent value="credits" className="mt-6">
          <CreditsTab />
        </TabsContent>
      )}

      {/* Knowledge Base Tab with Sub-tabs */}
      {isAdmin && (
        <TabsContent value="knowledge" className="mt-6">
          <Tabs value={activeKnowledgeTab} onValueChange={setActiveKnowledgeTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sources" className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span className="text-xs">Sources</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-1">
                <Upload className="h-3 w-3" />
                <span className="text-xs">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="queue" className="flex items-center gap-1">
                <List className="h-3 w-3" />
                <span className="text-xs">Queue</span>
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-1">
                <FileCheck className="h-3 w-3" />
                <span className="text-xs">Review</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sources" className="mt-4">
              <SourcesTab />
            </TabsContent>
            <TabsContent value="upload" className="mt-4">
              <UploadTab />
            </TabsContent>
            <TabsContent value="queue" className="mt-4">
              <QueueTab />
            </TabsContent>
            <TabsContent value="review" className="mt-4">
              <ReviewTab />
            </TabsContent>
          </Tabs>
        </TabsContent>
      )}

      {/* Users Tab */}
      {isAdmin && (
        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>
      )}
    </Tabs>
  );

  const renderDesktopLayout = () => (
    <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full" defaultValue="assessment">
      <TabsList className={`grid w-full ${isAdmin && hasCreditsAccess ? 'grid-cols-4' : hasCreditsAccess ? 'grid-cols-2' : isAdmin ? 'grid-cols-3' : 'grid-cols-1'}`}>
        <TabsTrigger value="assessment" className="flex items-center gap-2">
          <TreePine className="h-4 w-4" />
          Tree Assessment
        </TabsTrigger>
        {hasCreditsAccess && (
          <TabsTrigger value="credits" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Credits
          </TabsTrigger>
        )}
        {isAdmin && (
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Knowledge Base
          </TabsTrigger>
        )}
        {isAdmin && (
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="assessment" className="mt-6">
        <TreeAssessmentTab />
      </TabsContent>

      {hasCreditsAccess && (
        <TabsContent value="credits" className="mt-6">
          <CreditsTab />
        </TabsContent>
      )}

      {isAdmin && (
        <TabsContent value="knowledge" className="mt-6">
          <Tabs value={activeKnowledgeTab} onValueChange={setActiveKnowledgeTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sources" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Sources
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="queue" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Queue
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Review
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sources" className="mt-4">
              <SourcesTab />
            </TabsContent>
            <TabsContent value="upload" className="mt-4">
              <UploadTab />
            </TabsContent>
            <TabsContent value="queue" className="mt-4">
              <QueueTab />
            </TabsContent>
            <TabsContent value="review" className="mt-4">
              <ReviewTab />
            </TabsContent>
          </Tabs>
        </TabsContent>
      )}

      {isAdmin && (
        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>
      )}
    </Tabs>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/lovable-uploads/faca9ea3-cd95-435c-8240-f9e5fa9d2729.png" alt="ArborQuant Logo" className="h-8 w-8" />
                <div>
                <h1 className="text-2xl font-bold text-primary">
                  ArborQuant
                </h1>
                  <p className="text-sm text-muted-foreground">Tree Assessment & Knowledge Management</p>
                </div>
              </div>
              <UserProfile />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {isMobile ? renderMobileLayout() : renderDesktopLayout()}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ArborQuantApp;