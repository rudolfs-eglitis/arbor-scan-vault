import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, BookOpen, FileText, Globe, Award, Edit, Trash2, Upload, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';


const getSourceIcon = (kind: string) => {
  switch (kind) {
    case 'book':
      return <BookOpen className="h-5 w-5" />;
    case 'standard':
      return <Award className="h-5 w-5" />;
    case 'paper':
      return <FileText className="h-5 w-5" />;
    case 'web':
      return <Globe className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
};

const getSourceColor = (kind: string) => {
  switch (kind) {
    case 'book':
      return 'bg-primary text-primary-foreground';
    case 'standard':
      return 'bg-warning text-warning-foreground';
    case 'paper':
      return 'bg-gradient-secondary text-white';
    case 'web':
      return 'bg-accent text-accent-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const SourcesTab = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    kind: '',
    authors: '',
    year: '',
    publisher: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { sources, stats, loading, addSource, deleteSource } = useKnowledgeBase();

  const handleSubmit = async () => {
    if (!formData.title || !formData.kind) return;
    
    setIsSubmitting(true);
    try {
      const sourceData = {
        title: formData.title,
        kind: formData.kind,
        authors: formData.authors ? formData.authors.split(',').map(a => a.trim()) : undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        publisher: formData.publisher || undefined,
        notes: formData.notes || undefined,
        meta: { totalPages: 0, uploadedPages: 0, processedPages: 0, chunksCount: 0 }
      };
      
      await addSource(sourceData);
      setFormData({ title: '', kind: '', authors: '', year: '', publisher: '', notes: '' });
      setIsAddDialogOpen(false);
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this source?')) {
      await deleteSource(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Knowledge Sources</h2>
          <p className="text-muted-foreground">Manage your arboriculture books, standards, and research papers</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-primary-hover shadow-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add New Source
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Source</DialogTitle>
              <DialogDescription>
                Add a book, standard, research paper, or web resource to your knowledge base.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input 
                    id="title" 
                    placeholder="Enter title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kind">Type *</Label>
                  <Select value={formData.kind} onValueChange={(value) => setFormData(prev => ({ ...prev, kind: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="paper">Research Paper</SelectItem>
                      <SelectItem value="web">Web Resource</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="authors">Authors</Label>
                <Input 
                  id="authors" 
                  placeholder="Enter authors (comma separated)"
                  value={formData.authors}
                  onChange={(e) => setFormData(prev => ({ ...prev, authors: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input 
                    id="year" 
                    type="number" 
                    placeholder="2024"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input 
                    id="publisher" 
                    placeholder="Publisher name"
                    value={formData.publisher}
                    onChange={(e) => setFormData(prev => ({ ...prev, publisher: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-gradient-primary"
                  onClick={handleSubmit}
                  disabled={!formData.title || !formData.kind || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Source'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalSources}</p>
                  <p className="text-sm text-muted-foreground">Total Sources</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalPages}</p>
                  <p className="text-sm text-muted-foreground">Total Pages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-success" />
                <div>
                  <p className="text-2xl font-bold">{stats.uploadedPages}</p>
                  <p className="text-sm text-muted-foreground">Pages Uploaded</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-gradient-secondary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalChunks}</p>
                  <p className="text-sm text-muted-foreground">Content Chunks</p>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source) => {
          const progress = source.meta?.totalPages > 0 
            ? Math.round((source.meta.processedPages || 0) / source.meta.totalPages * 100) 
            : 0;
          
          return (
          <Card key={source.id} className="group hover:shadow-card transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${getSourceColor(source.kind || 'book')}`}>
                    {getSourceIcon(source.kind || 'book')}
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {source.kind || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(source.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg leading-tight">{source.title}</CardTitle>
              <CardDescription>
                {source.authors?.join(', ') || 'Unknown Author'} 
                {source.year && ` • ${source.year}`}
                {source.publisher && ` • ${source.publisher}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Pages</p>
                  <p className="font-semibold">{source.meta?.processedPages || 0}/{source.meta?.totalPages || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Chunks</p>
                  <p className="font-semibold">{source.meta?.chunksCount || 0}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SourcesTab;