import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Save, Eye, FileText, Image, CheckCircle, AlertTriangle } from 'lucide-react';

const mockChunks = [
  {
    id: '1',
    sourceTitle: 'Tree Biology and Arboriculture',
    pageNumber: 1,
    confidence: 0.95,
    originalText: `CHAPTER 1: INTRODUCTION TO ARBORICULTURE

Arboriculture is the cultivation, management, and study of individual trees, shrubs, vines, and other perennial woody plants. It encompasses the care of these plants for human benefit and environmental health. The practice involves understanding the biology, physiology, and ecology of trees to provide appropriate care throughout their lifecycle.

The field of arboriculture has evolved significantly over the past century, transitioning from basic tree care to a sophisticated science that integrates multiple disciplines including botany, ecology, pathology, and urban planning.`,
    editedText: '',
    filePath: '/uploads/tree-biology-p1.jpg',
    hasEdits: false,
  },
  {
    id: '2',
    sourceTitle: 'Tree Biology and Arboriculture',
    pageNumber: 2,
    confidence: 0.87,
    originalText: `TREE STRUCTURE AND FUNCTION

Trees are complex organisms with specialized structures that enable them to survive and thrive in various environments. The main components include:

1. Root System - Anchors the tree and absorbs water and nutrients
2. Trunk - Provides structural support and transports materials
3. Crown - Contains leaves for photosynthesis and reproduction
4. Branches - Support foliage and distribute weight

Understanding these components is essential for proper tree management and care practices.`,
    editedText: '',
    filePath: '/uploads/tree-biology-p2.jpg',
    hasEdits: false,
  },
];

const ReviewTab = () => {
  const [selectedSource, setSelectedSource] = useState('');
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [chunks, setChunks] = useState(mockChunks);
  const [editMode, setEditMode] = useState(false);

  const currentChunk = chunks[currentChunkIndex];
  const displayText = currentChunk?.editedText || currentChunk?.originalText || '';

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-success';
    if (confidence >= 0.7) return 'text-warning';
    return 'text-destructive';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.9) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 0.7) return <AlertTriangle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const handleTextChange = (newText: string) => {
    setChunks(prev => prev.map((chunk, index) => 
      index === currentChunkIndex 
        ? { ...chunk, editedText: newText, hasEdits: newText !== chunk.originalText }
        : chunk
    ));
  };

  const saveChunk = () => {
    // Save logic would go here
    console.log('Saving chunk:', currentChunk);
  };

  const nextChunk = () => {
    if (currentChunkIndex < chunks.length - 1) {
      setCurrentChunkIndex(currentChunkIndex + 1);
    }
  };

  const prevChunk = () => {
    if (currentChunkIndex > 0) {
      setCurrentChunkIndex(currentChunkIndex - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Content Review</h2>
          <p className="text-muted-foreground">Review and edit OCR extracted text</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditMode(!editMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {editMode ? 'View Mode' : 'Edit Mode'}
          </Button>
          <Button 
            className="bg-gradient-primary hover:bg-primary-hover shadow-primary"
            onClick={saveChunk}
            disabled={!currentChunk?.hasEdits}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Source Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Source</label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a source to review" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="source1">Tree Biology and Arboriculture</SelectItem>
                  <SelectItem value="source2">ISA Arborist Certification Study Guide</SelectItem>
                  <SelectItem value="source3">Urban Tree Growth Response to Climate Change</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Review Progress</label>
              <div className="flex items-center gap-2">
                <Progress value={75} className="flex-1 h-2" />
                <span className="text-sm text-muted-foreground">75%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentChunk && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Original Page
              </CardTitle>
              <CardDescription>
                Page {currentChunk.pageNumber} from {currentChunk.sourceTitle}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Page image would display here</p>
                  <p className="text-xs text-muted-foreground">{currentChunk.filePath}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extracted Text */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Extracted Text
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`${getConfidenceColor(currentChunk.confidence)} border-current`}
                  >
                    {getConfidenceIcon(currentChunk.confidence)}
                    {Math.round(currentChunk.confidence * 100)}% confidence
                  </Badge>
                  {currentChunk.hasEdits && (
                    <Badge variant="secondary">
                      Edited
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <Textarea
                  value={displayText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Edit the extracted text here..."
                />
              ) : (
                <div className="min-h-[400px] p-4 border rounded-lg bg-muted/50">
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {displayText}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
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
                Page {currentChunkIndex + 1} of {chunks.length}
              </span>
              <div className="flex gap-1">
                {chunks.map((_, index) => (
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
        </CardContent>
      </Card>

      {!currentChunk && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No content to review</h3>
                <p className="text-muted-foreground">Select a source with processed content to start reviewing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewTab;