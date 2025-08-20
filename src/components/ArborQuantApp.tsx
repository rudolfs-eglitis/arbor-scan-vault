import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Clock, CheckCircle, TreePine, BookOpen, FileCheck, List, Users, AlertTriangle, Settings } from 'lucide-react';
import { ProtectedRoute } from './ProtectedRoute';
import { UserProfile } from './UserProfile';
import { useAuth } from '@/hooks/useAuth';
import { TreeAssessmentTab } from './tabs/TreeAssessmentTab';
import { SourcesTab } from './tabs/SourcesTab';
import UploadTab from './tabs/UploadTab';
import QueueTab from './tabs/QueueTab';
import ReviewTab from './tabs/ReviewTab';
import { UsersTab } from './tabs/UsersTab';
import { OCRTest } from './OCRTest';

const ArborQuantApp = () => {
  const [activeTab, setActiveTab] = useState('assessment');
  const { hasRole } = useAuth();

  // Determine which tabs to show based on user roles
  const canManageKnowledgeBase = hasRole('admin'); // Only admins can manage knowledge base
  const isAdmin = hasRole('admin');

  // Tree Assessment is now the primary workflow for all users
  const defaultTab = "assessment";

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
                  <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" defaultValue={defaultTab}>
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-7' : 'grid-cols-1'}`}>
            <TabsTrigger value="assessment" className="flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              Tree Assessment
            </TabsTrigger>
            {canManageKnowledgeBase && (
              <TabsTrigger value="sources" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Knowledge Base
              </TabsTrigger>
            )}
            {canManageKnowledgeBase && (
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
            )}
            {canManageKnowledgeBase && (
              <TabsTrigger value="queue" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Queue
              </TabsTrigger>
            )}
            {canManageKnowledgeBase && (
              <TabsTrigger value="review" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Review
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="test" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Test OCR
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="assessment" className="mt-6">
            <TreeAssessmentTab />
          </TabsContent>

          {canManageKnowledgeBase && (
            <TabsContent value="sources" className="mt-6">
              <SourcesTab />
            </TabsContent>
          )}

          {canManageKnowledgeBase && (
            <TabsContent value="upload" className="mt-6">
              <UploadTab />
            </TabsContent>
          )}

          {canManageKnowledgeBase && (
            <TabsContent value="queue" className="mt-6">
              <QueueTab />
            </TabsContent>
          )}

          {canManageKnowledgeBase && (
            <TabsContent value="review" className="mt-6">
              <ReviewTab />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="users" className="mt-6">
              <UsersTab />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="test" className="mt-6">
              <OCRTest />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
    </ProtectedRoute>
  );
};

export default ArborQuantApp;