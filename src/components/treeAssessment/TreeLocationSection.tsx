import MapPicker from "./MapPicker";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function TreeLocationSection({
  initialLat,
  initialLng,
  onLatLngChange,
}: {
  initialLat?: number | null;
  initialLng?: number | null;
  onLatLngChange: (lat: number, lng: number) => void;
}) {
  // Show fields + map
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);

  useEffect(() => {
    setLat(initialLat ?? null);
    setLng(initialLng ?? null);
  }, [initialLat, initialLng]);

  const handleChange = (la: number, ln: number) => {
    setLat(la);
    setLng(ln);
    onLatLngChange(la, ln);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input 
            id="latitude"
            value={lat?.toFixed(6) ?? ""} 
            readOnly 
            className="bg-muted"
          />
        </div>
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input 
            id="longitude"
            value={lng?.toFixed(6) ?? ""} 
            readOnly 
            className="bg-muted"
          />
        </div>
      </div>
      <MapPicker initialLat={lat} initialLng={lng} onChange={handleChange} />
    </div>
  );
}