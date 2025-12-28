import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Incident, IncidentType, IncidentSeverity } from '@/types/emergency';
import { Map, Circle as CircleIcon, Eye, MapPin, Clock, ThumbsUp } from 'lucide-react';
import { getTimeAgo } from '@/data/mockData';

interface IncidentMapProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
}

const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

const TYPE_COLORS: Record<IncidentType, string> = {
  ACCIDENT: '#f59e0b',
  MEDICAL: '#3b82f6',
  FIRE: '#ef4444',
  INFRASTRUCTURE: '#8b5cf6',
  CRIME: '#ec4899',
};

// Create custom icon based on severity
const createCustomIcon = (severity: IncidentSeverity, isSelected: boolean) => {
  const color = SEVERITY_COLORS[severity] || '#94a3b8';
  const size = isSelected ? 48 : 36; // Larger size for pin

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
        <svg viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3" fill="white"></circle>
        </svg>
        ${severity === 'CRITICAL' ? `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 50%; opacity: 0; animation: pulse 1.5s infinite; background: ${color}; z-index: -1;"></div>` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size], // Anchor at bottom center for pin
    popupAnchor: [0, -size],
  });
};

// Component to handle map view updates when selected incident changes
const MapUpdater: React.FC<{ selectedIncident: Incident | null }> = ({ selectedIncident }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedIncident?.location?.lat && selectedIncident?.location?.lng) {
      map.flyTo(
        [selectedIncident.location.lat, selectedIncident.location.lng],
        14,
        { duration: 1 }
      );
    }
  }, [selectedIncident, map]);

  return null;
};

// Helper to calculate jittered position
const getJitteredPosition = (incident: Incident, allIncidents: Incident[]): [number, number] => {
  const sameLocIncidents = allIncidents.filter(
    i => Math.abs((i.location?.lat || 0) - (incident.location?.lat || 0)) < 0.0001 &&
      Math.abs((i.location?.lng || 0) - (incident.location?.lng || 0)) < 0.0001
  );

  let pos: [number, number] = [incident.location?.lat || 0, incident.location?.lng || 0];

  if (sameLocIncidents.length > 1) {
    const idx = sameLocIncidents.findIndex(i => i.id === incident.id);
    const angle = (idx / sameLocIncidents.length) * 2 * Math.PI;
    const radius = 0.0003; // ~30 meters jitter
    pos = [
      pos[0] + radius * Math.cos(angle),
      pos[1] + radius * Math.sin(angle)
    ];
  }
  return pos;
};

const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
}) => {
  const [showProximity, setShowProximity] = React.useState(true);
  const [proximityRadius, setProximityRadius] = React.useState(5000); // meters

  // Calculate center based on incidents or default to Bangalore
  const center = useMemo(() => {
    if (selectedIncident?.location?.lat && selectedIncident?.location?.lng) {
      return [selectedIncident.location.lat, selectedIncident.location.lng] as [number, number];
    }
    if (incidents.length > 0) {
      const validIncidents = incidents.filter(i => i.location && typeof i.location.lat === 'number' && typeof i.location.lng === 'number' && (i.location.lat !== 0 || i.location.lng !== 0));
      if (validIncidents.length > 0) {
        const avgLat = validIncidents.reduce((sum, i) => sum + i.location.lat, 0) / validIncidents.length;
        const avgLng = validIncidents.reduce((sum, i) => sum + i.location.lng, 0) / validIncidents.length;
        return [avgLat, avgLng] as [number, number];
      }
    }
    return [12.9716, 77.5946] as [number, number]; // Default to Bangalore
  }, [incidents, selectedIncident]);

  const severityVariants: Record<IncidentSeverity, 'critical' | 'high' | 'medium' | 'low'> = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
  };

  return (
    <Card className="bg-card border-border shadow-sm relative z-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Live Incident Map
          </CardTitle>
          {/*<div className="flex items-center gap-4">
             Proximity Toggle
            <div className="flex items-center gap-2">
              <Switch
                id="proximity"
                checked={showProximity}
                onCheckedChange={setShowProximity}
              />
              <Label htmlFor="proximity" className="text-xs text-muted-foreground flex items-center gap-1">
                <CircleIcon className="h-3 w-3" />
                {proximityRadius / 1000}km Radius
              </Label>
            </div>
          </div> */}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {Object.entries(SEVERITY_COLORS).map(([severity, color]) => (
            <div key={severity} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground capitalize">
                {severity.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] rounded-b-lg overflow-hidden relative z-0">
          <MapContainer
            center={center}
            zoom={12}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapUpdater selectedIncident={selectedIncident} />

            {/* Proximity circle for selected incident */}
            {selectedIncident && showProximity && (
              <Circle
                center={[selectedIncident.location.lat, selectedIncident.location.lng]}
                radius={proximityRadius}
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '5, 5',
                }}
              />
            )}

            {/* Incident markers with Jitter */}
            {incidents.map((incident) => (
              <Marker
                key={incident.id}
                position={getJitteredPosition(incident, incidents)}
                icon={createCustomIcon(incident.severity, selectedIncident?.id === incident.id)}
                eventHandlers={{
                  click: () => onSelectIncident(incident),
                }}
              >
                <Popup className="incident-popup" maxWidth={320}>
                  <div className="p-2">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground text-sm">{incident.title}</h3>
                      <Badge variant={severityVariants[incident.severity]} className="text-[10px] shrink-0">
                        {incident.severity}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {incident.description}
                    </p>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{incident.location.area}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeAgo(incident.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{incident.upvotes} upvotes</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                        {incident.type.toLowerCase()}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {incident.status.replace('_', ' ')}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      className="w-full mt-3 gap-1"
                      onClick={() => onSelectIncident(incident)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Full Details
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </CardContent>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
          }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .leaflet-popup-content {
          margin: 0;
          min-width: 250px;
        }
        .leaflet-popup-close-button {
          top: 8px !important;
          right: 8px !important;
        }
      `}</style>
    </Card>
  );
};

export default IncidentMap;