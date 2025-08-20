import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";

type Props = {
  initialLat?: number | null;
  initialLng?: number | null;
  onChange: (lat: number, lng: number) => void;
};

// Simple WMTS URL template builder for Lantmäteriet (EPSG:3857/WebMercator tiles)
function lantmaterietTileUrlTemplate(): string | null {
  const url = import.meta.env.VITE_LM_WMTS_URL; // full template URL recommended
  // Example WMTS template (you will replace with the exact URL from LM):
  // "https://{s}.example.lm.se/wmts/{LAYER}/default/GoogleMapsCompatible/{z}/{y}/{x}.jpeg?token=YOUR_TOKEN"
  return url || null;
}

const DEFAULT_CENTER: [number, number] = [62.0, 15.0]; // Sweden-ish
const DEFAULT_ZOOM = 5;
const TREE_ZOOM = 19;

const icon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({ initialLat, initialLng, onChange }: Props) {
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [useAerial, setUseAerial] = useState<boolean>(true);

  const center = useMemo<[number, number]>(() => {
    if (lat != null && lng != null) return [lat, lng];
    return DEFAULT_CENTER;
  }, [lat, lng]);

  const z = lat != null && lng != null ? TREE_ZOOM : DEFAULT_ZOOM;

  const lmTemplate = lantmaterietTileUrlTemplate();
  const lmAttribution =
    import.meta.env.VITE_LM_ATTRIBUTION ||
    'Aerial © Lantmäteriet | OSM © OpenStreetMap contributors';

  const esriWorldImagery =
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  const onMapClick = (la: number, ln: number) => {
    setLat(la);
    setLng(ln);
    onChange(la, ln);
  };

  // Optional: "locate me"
  const mapRef = useRef<L.Map | null>(null);
  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const la = pos.coords.latitude;
      const ln = pos.coords.longitude;
      setLat(la);
      setLng(ln);
      onChange(la, ln);
      if (mapRef.current) mapRef.current.setView([la, ln], TREE_ZOOM);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setUseAerial((v) => !v)}
          title="Toggle aerial overlay"
        >
          {useAerial ? "Switch to OSM" : "Switch to Aerial"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={locateMe}
        >
          Locate me
        </Button>
        <div className="text-sm text-muted-foreground">
          {lat != null && lng != null
            ? `Selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
            : "Click on the map to set coordinates"}
        </div>
      </div>

      <MapContainer
        ref={mapRef}
        center={center}
        zoom={z}
        style={{ height: 420, width: "100%", borderRadius: 12 }}
        preferCanvas
      >
        {/* Base OSM */}
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Aerial overlay (LM if configured, else ESRI) */}
        {useAerial && (
          <TileLayer
            attribution={lmAttribution}
            url={lmTemplate || esriWorldImagery}
            opacity={0.95}
          />
        )}

        <ClickHandler onClick={onMapClick} />

        {lat != null && lng != null && <Marker position={[lat, lng]} icon={icon} />}
      </MapContainer>

      <div className="text-xs text-muted-foreground">
        Tip: Zoom to ~19 to clearly see crowns. Drag the map and click to refine the exact stem
        position.
      </div>
    </div>
  );
}