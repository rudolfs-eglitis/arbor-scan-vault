import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Clock, CheckCircle, TreePine, BookOpen, FileCheck, List } from 'lucide-react';
import { ProtectedRoute } from './ProtectedRoute';
import { UserProfile } from './UserProfile';
import SourcesTab from './tabs/SourcesTab';
import UploadTab from './tabs/UploadTab';
import QueueTab from './tabs/QueueTab';
import ReviewTab from './tabs/ReviewTab';

const ArborQuantApp = () => {
  const [activeTab, setActiveTab] = useState('sources');

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TreePine className="h-8 w-8 text-primary" />
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

          <TabsContent value="sources" className="mt-6">
            <SourcesTab />
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <UploadTab />
          </TabsContent>

          <TabsContent value="queue" className="mt-6">
            <QueueTab />
          </TabsContent>

          <TabsContent value="review" className="mt-6">
            <ReviewTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </ProtectedRoute>
  );
};

export default ArborQuantApp;