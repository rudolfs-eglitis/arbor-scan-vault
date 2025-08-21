import { useState, useEffect, useRef, useMemo } from 'react';
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
  const mapRef = useRef<L.Map | null>(null);

  // Calculate center based on trees with coordinates (handle both systems), or use default
  const treeWithCoords = trees.find(t => 
    (t.latitude && t.longitude) || (t.lat && t.lng)
  );
  
  const mapCenter = treeWithCoords 
    ? { 
        lat: treeWithCoords.latitude || treeWithCoords.lat || center.lat, 
        lng: treeWithCoords.longitude || treeWithCoords.lng || center.lng 
      }
    : center;

  const mapZoom = treeWithCoords ? 16 : zoom;

  // Memoized Leaflet icons to prevent recreation
  const icon = useMemo(() => new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }), []);

  const selectedIcon = useMemo(() => new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [35, 55],
    iconAnchor: [17, 55],
  }), []);

  // Custom hook for map click handling
  function MapClickHandler() {
    const map = useMapEvents({
      click: (e: L.LeafletMouseEvent) => {
        if (!isAddingTree || !onLocationSelect) return;
        onLocationSelect(e.latlng.lat, e.latlng.lng);
        setIsAddingTree(false);
      },
    });
    
    useEffect(() => {
      mapRef.current = map;
    }, [map]);
    
    return null;
  }

  // Memoized map configuration to prevent rerenders
  const mapConfig = useMemo(() => ({
    lmTemplate: import.meta.env.VITE_LM_WMTS_URL,
    lmAttribution: import.meta.env.VITE_LM_ATTRIBUTION || 'Aerial © Lantmäteriet | OSM © OpenStreetMap contributors',
    esriWorldImagery: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    center: [mapCenter.lat, mapCenter.lng] as [number, number],
    zoom: mapZoom
  }), [mapCenter.lat, mapCenter.lng, mapZoom]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

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
        key={`map-${mapConfig.center[0]}-${mapConfig.center[1]}`}
        center={mapConfig.center}
        zoom={mapConfig.zoom}
        style={{ height: "100%", width: "100%" }}
        ref={(mapInstance) => {
          if (mapInstance) {
            mapRef.current = mapInstance;
          }
        }}
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
            attribution={mapConfig.lmAttribution}
            url={mapConfig.lmTemplate || mapConfig.esriWorldImagery}
            opacity={0.95}
          />
        )}

        {/* Tree Markers */}
        {trees
          .filter(tree => 
            (tree.latitude && tree.longitude) || (tree.lat && tree.lng)
          )
          .map((tree) => {
            const lat = tree.latitude || tree.lat;
            const lng = tree.longitude || tree.lng;
            return (
              <Marker
                key={tree.id}
                position={[lat!, lng!]}
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
            );
          })}
      </MapContainer>

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 bg-background/90 p-2 rounded text-xs text-muted-foreground z-10">
        Trees: {trees.length} | With Coordinates: {trees.filter(t => (t.latitude && t.longitude) || (t.lat && t.lng)).length}
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