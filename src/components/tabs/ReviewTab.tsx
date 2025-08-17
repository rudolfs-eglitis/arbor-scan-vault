import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Save, Eye, FileText, Image, CheckCircle, AlertTriangle, Users, BookOpen, Lightbulb } from 'lucide-react';
import { useReviewData } from '@/hooks/useReviewData';


const ReviewTab = () => {
  const {
    sources,
    chunks,
    suggestions,
    loading,
    selectedSourceId,
    viewMode,
    setViewMode,
    selectSource,
    getSpeciesAggregations,
    getReviewProgress,
    updateChunkContent
  } = useReviewData();

  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('');

  const currentChunk = chunks[currentChunkIndex];
  const displayText = currentChunk?.content_en || currentChunk?.content || '';
  const originalText = currentChunk?.src_content || currentChunk?.content || '';
  const progress = getReviewProgress();
  const speciesAggregations = getSpeciesAggregations();

  const getPhaseColor = (chunk: any) => {
    const phase = chunk?.meta?.processing_phase || 1;
    if (phase >= 3) return 'text-success';
    if (phase >= 2) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getPhaseIcon = (chunk: any) => {
    const phase = chunk?.meta?.processing_phase || 1;
    if (phase >= 3) return <CheckCircle className="h-4 w-4" />;
    if (phase >= 2) return <AlertTriangle className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getPhaseLabel = (chunk: any) => {
    const phase = chunk?.meta?.processing_phase || 1;
    switch (phase) {
      case 3: return 'Phase 3: AI Analysis';
      case 2: return 'Phase 2: Translation';
      case 1: return 'Phase 1: OCR Extract';
      default: return 'Raw Text';
    }
  };

  const handleTextChange = (newText: string) => {
    // Just update local display, actual save happens on saveChunk
    if (currentChunk) {
      const updatedChunks = chunks.map((chunk, index) => 
        index === currentChunkIndex 
          ? { ...chunk, content_en: newText }
          : chunk
      );
      // This would need to be handled by the hook, but for now we'll just save directly
    }
  };

  const saveChunk = async () => {
    if (currentChunk && displayText !== originalText) {
      await updateChunkContent(currentChunk.id, displayText, displayText);
    }
  };

  const nextChunk = () => {
    if (viewMode === 'page' && currentChunkIndex < chunks.length - 1) {
      setCurrentChunkIndex(currentChunkIndex + 1);
    }
  };

  const prevChunk = () => {
    if (viewMode === 'page' && currentChunkIndex > 0) {
      setCurrentChunkIndex(currentChunkIndex - 1);
    }
  };

  const getCurrentContent = () => {
    if (viewMode === 'species' && selectedSpeciesId) {
      const aggregation = speciesAggregations.find(s => s.species_id === selectedSpeciesId);
      return aggregation?.totalContent || '';
    }
    return displayText;
  };

  const hasEdits = currentChunk && (
    currentChunk.content_en !== currentChunk.content ||
    (currentChunk.meta && currentChunk.meta.reviewed === true)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading review data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Content Review</h2>
          <p className="text-muted-foreground">
            Review Phase 3 content with AI suggestions and cross-page species analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'page' ? 'species' : 'page')}>
            {viewMode === 'page' ? <Users className="h-4 w-4 mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
            {viewMode === 'page' ? 'Species View' : 'Page View'}
          </Button>
          <Button variant="outline" onClick={() => setEditMode(!editMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {editMode ? 'View Mode' : 'Edit Mode'}
          </Button>
          <Button 
            className="bg-gradient-primary hover:bg-primary-hover shadow-primary"
            onClick={saveChunk}
            disabled={!hasEdits}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Source Selection & View Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Source Selection & Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Source</label>
              <Select value={selectedSourceId} onValueChange={selectSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a source to review" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map(source => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.title}
                      {source.year && ` (${source.year})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Review Progress</label>
              <div className="flex items-center gap-2">
                <Progress value={progress.percentage} className="flex-1 h-2" />
                <span className="text-sm text-muted-foreground">{progress.percentage}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {progress.reviewedChunks} of {progress.totalChunks} chunks reviewed
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Suggestions</label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-warning">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  {suggestions.length} pending
                </Badge>
                {viewMode === 'species' && (
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {speciesAggregations.length} species
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSourceId && chunks.length > 0 && (
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'page' | 'species')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="page" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Page View
            </TabsTrigger>
            <TabsTrigger value="species" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Species View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="page" className="space-y-6">
            {currentChunk && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Phase Information & Original */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="h-5 w-5" />
                      Page Content
                    </CardTitle>
                    <CardDescription>
                      Pages {currentChunk.pages || 'N/A'} • {getPhaseLabel(currentChunk)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${getPhaseColor(currentChunk)} border-current`}>
                        {getPhaseIcon(currentChunk)}
                        {getPhaseLabel(currentChunk)}
                      </Badge>
                      {hasEdits && (
                        <Badge variant="secondary">
                          Reviewed
                        </Badge>
                      )}
                      {currentChunk.species_ids && currentChunk.species_ids.length > 0 && (
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {currentChunk.species_ids.length} species
                        </Badge>
                      )}
                    </div>
                    
                    {originalText && originalText !== displayText && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Original Text</label>
                        <div className="max-h-32 p-3 border rounded-lg bg-muted/30 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                            {originalText}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Processed Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Processed Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editMode ? (
                      <Textarea
                        value={getCurrentContent()}
                        onChange={(e) => handleTextChange(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                        placeholder="Edit the content here..."
                      />
                    ) : (
                      <div className="min-h-[400px] p-4 border rounded-lg bg-background">
                        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                          {getCurrentContent()}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="species" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Species List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Species Found
                  </CardTitle>
                  <CardDescription>
                    {speciesAggregations.length} species across multiple pages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {speciesAggregations.map(aggregation => (
                      <div
                        key={aggregation.species_id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedSpeciesId === aggregation.species_id
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedSpeciesId(aggregation.species_id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{aggregation.species_id}</span>
                          <Badge variant="outline" className="text-xs">
                            {aggregation.pages.length} pages
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Pages: {aggregation.pages.join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Species Content */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {selectedSpeciesId ? `Content for ${selectedSpeciesId}` : 'Select a Species'}
                  </CardTitle>
                  {selectedSpeciesId && (
                    <CardDescription>
                      Aggregated content from {speciesAggregations.find(s => s.species_id === selectedSpeciesId)?.pages.length} pages
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedSpeciesId ? (
                    editMode ? (
                      <Textarea
                        value={getCurrentContent()}
                        onChange={(e) => handleTextChange(e.target.value)}
                        className="min-h-[500px] font-mono text-sm"
                        placeholder="Edit the species content here..."
                      />
                    ) : (
                      <div className="min-h-[500px] p-4 border rounded-lg bg-background">
                        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                          {getCurrentContent()}
                        </pre>
                      </div>
                    )
                  ) : (
                    <div className="min-h-[500px] flex items-center justify-center text-muted-foreground">
                      Select a species from the list to view its aggregated content
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Navigation & AI Suggestions */}
      {selectedSourceId && chunks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {viewMode === 'page' ? (
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    onClick={prevChunk}
                    disabled={currentChunkIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Chunk {currentChunkIndex + 1} of {chunks.length}
                    </span>
                    <div className="flex gap-1">
                      {chunks.slice(0, 10).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentChunkIndex(index)}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentChunkIndex 
                              ? 'bg-primary' 
                              : 'bg-muted hover:bg-muted-foreground/50'
                          }`}
                        />
                      ))}
                      {chunks.length > 10 && (
                        <span className="text-xs text-muted-foreground">...</span>
                      )}
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={nextChunk}
                    disabled={currentChunkIndex === chunks.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Species view • {speciesAggregations.length} species found
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suggestions.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {suggestions.slice(0, 3).map(suggestion => (
                    <div key={suggestion.id} className="p-2 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {suggestion.suggestion_type}
                        </Badge>
                        {suggestion.confidence_score && (
                          <span className="text-xs text-muted-foreground">
                            {Math.round(suggestion.confidence_score * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1 text-muted-foreground truncate">
                        {suggestion.target_table} • {suggestion.notes || 'No notes'}
                      </p>
                    </div>
                  ))}
                  {suggestions.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{suggestions.length - 3} more suggestions
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  No AI suggestions available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {(!selectedSourceId || chunks.length === 0) && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {sources.length === 0 ? 'No processed content' : 'Select a source to review'}
                </h3>
                <p className="text-muted-foreground">
                  {sources.length === 0 
                    ? 'Upload and process documents first to begin reviewing'
                    : 'Choose a source from the dropdown above to start reviewing processed content'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewTab;