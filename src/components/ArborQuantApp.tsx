import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Clock, CheckCircle, TreePine, BookOpen, FileCheck, List, Users, AlertTriangle } from 'lucide-react';
import { ProtectedRoute } from './ProtectedRoute';
import { UserProfile } from './UserProfile';
import { useAuth } from '@/hooks/useAuth';
import { SourcesTab } from './tabs/SourcesTab';
import UploadTab from './tabs/UploadTab';
import QueueTab from './tabs/QueueTab';
import ReviewTab from './tabs/ReviewTab';
import { UsersTab } from './tabs/UsersTab';

const ArborQuantApp = () => {
  const [activeTab, setActiveTab] = useState('sources');
  const { hasRole } = useAuth();

  // Determine which tabs to show based on user roles
  const canManageKnowledgeBase = hasRole('admin'); // Only admins can manage knowledge base for now
  const isAdmin = hasRole('admin');

  // Show different default tab based on permissions
  const defaultTab = canManageKnowledgeBase ? "sources" : "review";

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
                  <p className="text-sm text-muted-foreground">Knowledge Base Management</p>
                </div>
              </div>
              <UserProfile />
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Show access message for non-admin users */}
        {!canManageKnowledgeBase && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">Limited Access</p>
                <p className="text-xs text-amber-700">
                  You can review existing knowledge base content. Only admins can upload and manage sources.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" defaultValue={defaultTab}>
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : canManageKnowledgeBase ? 'grid-cols-4' : 'grid-cols-2'}`}>
            {canManageKnowledgeBase && (
              <TabsTrigger value="sources" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Sources
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
            <TabsTrigger value="review" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Review
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            )}
          </TabsList>

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

          <TabsContent value="review" className="mt-6">
            <ReviewTab />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users" className="mt-6">
              <UsersTab />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
    </ProtectedRoute>
  );
};

export default ArborQuantApp;