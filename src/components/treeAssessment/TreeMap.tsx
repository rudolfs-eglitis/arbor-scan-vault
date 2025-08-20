import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
  const [isAddingTree, setIsAddingTree] = useState(false);
  const [useAerial, setUseAerial] = useState(true);

  // Calculate center based on trees with coordinates, or use default
  const mapCenter = trees.find(t => t.latitude && t.longitude) 
    ? { lat: trees.find(t => t.latitude && t.longitude)!.latitude!, lng: trees.find(t => t.latitude && t.longitude)!.longitude! }
    : center;

  const mapZoom = trees.some(t => t.latitude && t.longitude) ? 16 : zoom;

  // Leaflet marker icon
  const icon = new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const selectedIcon = new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [35, 55],
    iconAnchor: [17, 55],
  });

  // Custom hook for map click handling
  function MapClickHandler() {
    useMapEvents({
      click: (e: L.LeafletMouseEvent) => {
        if (!isAddingTree || !onLocationSelect) return;
        onLocationSelect(e.latlng.lat, e.latlng.lng);
        setIsAddingTree(false);
      },
    });
    return null;
  }

  const lmTemplate = import.meta.env.VITE_LM_WMTS_URL;
  const lmAttribution = import.meta.env.VITE_LM_ATTRIBUTION || 'Aerial © Lantmäteriet | OSM © OpenStreetMap contributors';
  const esriWorldImagery = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  return (
    <div className="relative h-full bg-secondary/20 rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUseAerial(!useAerial)}
        >
          {useAerial ? "Switch to OSM" : "Switch to Aerial"}
        </Button>
        {showAddButton && (
          <Button
            onClick={() => setIsAddingTree(!isAddingTree)}
            disabled={isAddingTree}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isAddingTree ? "Adding..." : "Add Tree"}
          </Button>
        )}
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
      >
        <MapClickHandler />
        
        {/* Base OSM Layer */}
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Aerial overlay */}
        {useAerial && (
          <TileLayer
            attribution={lmAttribution}
            url={lmTemplate || esriWorldImagery}
            opacity={0.95}
          />
        )}

        {/* Tree Markers */}
        {trees
          .filter(tree => tree.latitude && tree.longitude)
          .map((tree) => (
            <Marker
              key={tree.id}
              position={[tree.latitude!, tree.longitude!]}
              icon={selectedTreeId === tree.id ? selectedIcon : icon}
              eventHandlers={{
                click: () => onTreeSelect(tree),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-medium">
                    {tree.tree_number || `Tree ${tree.id.slice(0, 8)}`}
                  </h3>
                  {tree.species_id && (
                    <p className="text-sm text-muted-foreground">
                      Species: {tree.species_id}
                    </p>
                  )}
                  {tree.dbh_cm && (
                    <p className="text-sm">DBH: {tree.dbh_cm} cm</p>
                  )}
                  {tree.height_m && (
                    <p className="text-sm">Height: {tree.height_m} m</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 bg-background/90 p-2 rounded text-xs text-muted-foreground z-10">
        Trees: {trees.length} | With Coordinates: {trees.filter(t => t.latitude && t.longitude).length}
      </div>

      {/* Adding Tree Instructions */}
      {isAddingTree && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-20">
          <div className="bg-background p-4 rounded-lg shadow-lg">
            <p className="text-sm text-muted-foreground mb-2">Click on the map to place a tree</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsAddingTree(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}