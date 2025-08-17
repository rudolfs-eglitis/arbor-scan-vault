import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { KnowledgeBaseImport } from "@/components/knowledgeBase/KnowledgeBaseImport";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { BookOpen, Upload, Edit, Trash2 } from "lucide-react";

export const SourcesTab = () => {
  const { sources, loading, deleteSource } = useKnowledgeBase();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this source? This action cannot be undone.')) {
      await deleteSource(id);
    }
  };

  return (
    <Tabs defaultValue="import" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="import" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Import Sources
        </TabsTrigger>
        <TabsTrigger value="manage" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Manage Sources ({sources.length})
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
            {loading ? (
              <p className="text-muted-foreground">Loading sources...</p>
            ) : sources.length === 0 ? (
              <p className="text-muted-foreground">
                No sources found. Import some sources to get started.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Authors</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell className="font-medium">{source.title}</TableCell>
                      <TableCell>
                        {source.authors?.join(', ') || 'Unknown'}
                      </TableCell>
                      <TableCell>{source.year || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{source.kind || 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell>
                        {source.meta?.totalPages ? (
                          <div className="text-sm">
                            <div>{source.meta.uploadedPages || 0}/{source.meta.totalPages} pages</div>
                            <div className="text-muted-foreground">
                              {source.meta.chunksCount || 0} chunks
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(source.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};