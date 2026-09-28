export interface NearbyHospital {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  emergencyPhone?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
}

export interface EmergencyNumbers {
  numbers: string[];
  primaryNumber: string;
}

/** Raw OpenStreetMap Overpass API element (node/way with center). */
export interface OsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:suburb'?: string;
    'addr:city'?: string;
    phone?: string;
    'contact:phone'?: string;
    'emergency:phone'?: string;
    amenity?: string;
  };
}
