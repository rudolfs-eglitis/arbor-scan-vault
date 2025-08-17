import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeBaseImport } from "@/components/knowledgeBase/KnowledgeBaseImport";
import { BookOpen, Upload } from "lucide-react";

export const SourcesTab = () => {
  return (
    <Tabs defaultValue="import" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="import" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Import Sources
        </TabsTrigger>
        <TabsTrigger value="manage" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Manage Sources
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="import">
        <KnowledgeBaseImport />
      </TabsContent>
      
      <TabsContent value="manage">
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Manage and review existing knowledge base sources and references.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};