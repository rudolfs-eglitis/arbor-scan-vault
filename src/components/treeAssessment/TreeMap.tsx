import { useState, useEffect, useRef } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tree } from '@/hooks/useTreeAssessment';

interface TreeMapProps {
  trees: Tree[];
  selectedTreeId?: string;
  onTreeSelect: (tree: Tree) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  showAddButton?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export function TreeMap({ 
  trees, 
  selectedTreeId, 
  onTreeSelect, 
  onLocationSelect,
  showAddButton = false,
  center = { lat: 59.3293, lng: 18.0686 }, // Stockholm default
  zoom = 13
}: TreeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isAddingTree, setIsAddingTree] = useState(false);

  // This is a simple map placeholder - in production you'd use a proper map library
  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingTree || !onLocationSelect) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    // Convert click coordinates to lat/lng (simplified calculation)
    const lat = center.lat + (0.5 - y) * 0.02;
    const lng = center.lng + (x - 0.5) * 0.02;
    
    onLocationSelect(lat, lng);
    setIsAddingTree(false);
  };

  return (
    <div className="relative h-full bg-secondary/20 rounded-lg overflow-hidden">
      {/* Map Container */}
      <div 
        ref={mapRef}
        className={`w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/20 dark:to-emerald-800/20 relative ${
          isAddingTree ? 'cursor-crosshair' : 'cursor-default'
        }`}
        onClick={handleMapClick}
      >
        {/* Map Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Trees on Map */}
        {trees.map((tree, index) => {
          // Simple positioning based on array index for demo
          const x = 20 + (index % 8) * 80;
          const y = 20 + Math.floor(index / 8) * 80;
          
          return (
            <button
              key={tree.id}
              className={`absolute w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                selectedTreeId === tree.id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700'
              }`}
              style={{ left: `${x}px`, top: `${y}px` }}
              onClick={(e) => {
                e.stopPropagation();
                onTreeSelect(tree);
              }}
              title={`Tree ${tree.tree_number || tree.id.slice(0, 8)}`}
            >
              <MapPin className="w-4 h-4" />
            </button>
          );
        })}
        
        {/* Add Tree Instructions */}
        {isAddingTree && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <div className="bg-background p-4 rounded-lg shadow-lg">
              <p className="text-sm text-muted-foreground">Click on the map to add a tree</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setIsAddingTree(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Add Tree Button */}
      {showAddButton && (
        <Button
          className="absolute top-4 right-4"
          onClick={() => setIsAddingTree(true)}
          disabled={isAddingTree}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tree
        </Button>
      )}
      
      {/* Map Info */}
      <div className="absolute bottom-4 left-4 bg-background/90 p-2 rounded text-xs text-muted-foreground">
        Trees: {trees.length} | Zoom: {zoom}
      </div>
    </div>
  );
}