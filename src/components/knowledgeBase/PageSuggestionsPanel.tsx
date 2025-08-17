import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Check, X, Eye, AlertTriangle } from 'lucide-react';
import { useProcessingQueue } from '@/hooks/useProcessingQueue';

const PageSuggestionsPanel = () => {
  const { suggestions, loading } = useProcessingQueue();
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case 'species':
        return 'bg-green-100 text-green-800';
      case 'defect':
        return 'bg-red-100 text-red-800';
      case 'fungus':
        return 'bg-orange-100 text-orange-800';
      case 'mitigation':
        return 'bg-blue-100 text-blue-800';
      case 'feature':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatSuggestedData = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading suggestions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Page Suggestions</h2>
          <p className="text-muted-foreground">Review AI-suggested data extractions from processed pages</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Brain className="h-4 w-4 mr-2" />
          {suggestions.length} Pending
        </Badge>
      </div>

      {suggestions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Brain className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No suggestions available</h3>
                <p className="text-muted-foreground">Process some documents to see AI suggestions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({suggestions.length})</TabsTrigger>
            <TabsTrigger value="species">Species ({suggestions.filter(s => s.suggestion_type === 'species').length})</TabsTrigger>
            <TabsTrigger value="defect">Defects ({suggestions.filter(s => s.suggestion_type === 'defect').length})</TabsTrigger>
            <TabsTrigger value="fungus">Fungi ({suggestions.filter(s => s.suggestion_type === 'fungus').length})</TabsTrigger>
            <TabsTrigger value="mitigation">Mitigations ({suggestions.filter(s => s.suggestion_type === 'mitigation').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="group hover:shadow-card transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSuggestionTypeColor(suggestion.suggestion_type)}>
                            {suggestion.suggestion_type}
                          </Badge>
                          {suggestion.confidence_score && (
                            <Badge className={getConfidenceColor(suggestion.confidence_score)}>
                              {(suggestion.confidence_score * 100).toFixed(0)}% confidence
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">
                          Target: {suggestion.target_table}
                        </CardTitle>
                        <CardDescription>
                          Page ID: {suggestion.page_id}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Suggested Data:</h4>
                      <ScrollArea className="h-32 w-full rounded border p-3 bg-muted/50">
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {formatSuggestedData(suggestion.suggested_data)}
                        </pre>
                      </ScrollArea>
                    </div>

                    {suggestion.notes && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Notes:</h4>
                        <p className="text-sm text-muted-foreground">{suggestion.notes}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Created: {new Date(suggestion.created_at).toLocaleString()}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline">
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Individual type tabs would have similar content but filtered */}
          {['species', 'defect', 'fungus', 'mitigation'].map(type => (
            <TabsContent key={type} value={type} className="space-y-4">
              <div className="grid gap-4">
                {suggestions
                  .filter(s => s.suggestion_type === type)
                  .map((suggestion) => (
                    <Card key={suggestion.id} className="group hover:shadow-card transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getSuggestionTypeColor(suggestion.suggestion_type)}>
                                {suggestion.suggestion_type}
                              </Badge>
                              {suggestion.confidence_score && (
                                <Badge className={getConfidenceColor(suggestion.confidence_score)}>
                                  {(suggestion.confidence_score * 100).toFixed(0)}% confidence
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg">
                              Target: {suggestion.target_table}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-32 w-full rounded border p-3 bg-muted/50">
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {formatSuggestedData(suggestion.suggested_data)}
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ))
                }
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default PageSuggestionsPanel;