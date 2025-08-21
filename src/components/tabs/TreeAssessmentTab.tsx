import { useState } from 'react';
import { Plus, Search, Filter, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TreeMap } from '@/components/treeAssessment/TreeMap';
import { TreeForm } from '@/components/treeAssessment/TreeForm';
import { useTreeAssessment, Tree } from '@/hooks/useTreeAssessment';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function TreeAssessmentTab() {
  const { trees, assessments, loading, createTree, updateTree, deleteTree } = useTreeAssessment();
  const { toast } = useToast();
  
  console.log('TreeAssessmentTab rendering, loading:', loading, 'trees:', trees.length);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [showTreeForm, setShowTreeForm] = useState(false);
  const [editingTree, setEditingTree] = useState<Tree | null>(null);
  const [newTreeLocation, setNewTreeLocation] = useState<{ lat: number; lng: number } | null>(null);

  const filteredTrees = trees.filter(tree => 
    tree.tree_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tree.species?.scientific_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tree.location_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTree = () => {
    setEditingTree(null);
    setNewTreeLocation(null);
    setShowTreeForm(true);
  };

  const handleEditTree = (tree: Tree) => {
    setEditingTree(tree);
    setNewTreeLocation(null);
    setShowTreeForm(true);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setNewTreeLocation({ lat, lng });
    setEditingTree(null);
    setShowTreeForm(true);
  };

  const handleTreeSubmit = async (data: any) => {
    try {
      if (editingTree) {
        await updateTree(editingTree.id, data);
        toast({ title: 'Tree updated successfully' });
      } else {
        await createTree(data);
        toast({ title: 'Tree added successfully' });
      }
      setShowTreeForm(false);
      setEditingTree(null);
      setNewTreeLocation(null);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to save tree', 
        variant: 'destructive' 
      });
    }
  };

  const handleTreeSelect = (tree: Tree) => {
    setSelectedTree(tree);
  };

  const getTreeAssessments = (treeId: string) => {
    return assessments.filter(assessment => assessment.tree_id === treeId);
  };

  const getRiskBadgeColor = (risk?: string) => {
    switch (risk) {
      case 'very_high': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'moderate': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      case 'very_low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading trees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search trees by number, species, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button onClick={handleAddTree}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tree
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Tree Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] lg:h-[500px]">
            <ErrorBoundary 
              componentName="TreeMap"
              fallback={
                <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg">
                  <div className="text-center p-4">
                    <p className="text-muted-foreground">Map temporarily unavailable</p>
                    <p className="text-sm text-muted-foreground mt-1">Tree list below shows all trees</p>
                  </div>
                </div>
              }
            >
              <TreeMap
                trees={filteredTrees}
                selectedTreeId={selectedTree?.id}
                onTreeSelect={handleTreeSelect}
                onLocationSelect={handleLocationSelect}
                showAddButton={true}
              />
            </ErrorBoundary>
          </CardContent>
        </Card>

        {/* Tree Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedTree ? 'Tree Details' : 'Select a Tree'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTree ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">
                    {selectedTree.tree_number || `Tree ${selectedTree.id.slice(0, 8)}`}
                  </h3>
                  {selectedTree.species && (
                    <p className="text-sm text-muted-foreground">
                      {selectedTree.species.scientific_name}
                    </p>
                  )}
                </div>

                {/* Tree Measurements */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedTree.dbh_cm && (
                    <div>
                      <span className="text-muted-foreground">DBH:</span>
                      <span className="ml-1 font-medium">{selectedTree.dbh_cm} cm</span>
                    </div>
                  )}
                  {selectedTree.height_m && (
                    <div>
                      <span className="text-muted-foreground">Height:</span>
                      <span className="ml-1 font-medium">{selectedTree.height_m} m</span>
                    </div>
                  )}
                </div>

                {selectedTree.location_description && (
                  <div>
                    <span className="text-muted-foreground text-sm">Location:</span>
                    <p className="text-sm">{selectedTree.location_description}</p>
                  </div>
                )}

                {selectedTree.protected_status && (
                  <Badge variant="secondary">Protected Status</Badge>
                )}

                {/* Recent Assessments */}
                <div>
                  <h4 className="font-medium mb-2">Recent Assessments</h4>
                  {getTreeAssessments(selectedTree.id).slice(0, 3).map((assessment) => (
                    <div key={assessment.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="text-sm">{assessment.assessment_date}</p>
                        <p className="text-xs text-muted-foreground">{assessment.assessment_method}</p>
                      </div>
                      {assessment.risk_rating && (
                        <Badge className={getRiskBadgeColor(assessment.risk_rating)}>
                          {assessment.risk_rating.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {getTreeAssessments(selectedTree.id).length === 0 && (
                    <p className="text-sm text-muted-foreground">No assessments yet</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => handleEditTree(selectedTree)}>
                    Edit Tree
                  </Button>
                  <Button size="sm" variant="outline">
                    New Assessment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select a tree from the map to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tree Form Dialog */}
      <Dialog open={showTreeForm} onOpenChange={setShowTreeForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTree ? 'Edit Tree' : 'Add New Tree'}
            </DialogTitle>
          </DialogHeader>
          <TreeForm
            tree={editingTree || undefined}
            defaultLocation={newTreeLocation || undefined}
            onSubmit={handleTreeSubmit}
            onCancel={() => setShowTreeForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}