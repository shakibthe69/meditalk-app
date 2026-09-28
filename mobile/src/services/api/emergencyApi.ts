import { apiClient } from './apiClient';
import { NearbyHospital, EmergencyNumbers, OsmElement } from '../../types';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

/** Great-circle distance between two coordinates in kilometres. */
export const haversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const buildAddress = (tags: OsmElement['tags']): string | undefined => {
  const parts = [
    tags?.['addr:housenumber'],
    tags?.['addr:street'],
    tags?.['addr:suburb'],
    tags?.['addr:city'],
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : undefined;
};

export const emergencyApi = {
  /** Predefined national emergency numbers from the backend. */
  getEmergencyNumbers: async (): Promise<EmergencyNumbers> => {
    const res = await apiClient.get('/api/emergency/numbers');
    return res.data.data;
  },

  /** Curated hospital directory from the backend (fallback list). */
  getHospitals: async (): Promise<NearbyHospital[]> => {
    const res = await apiClient.get('/api/emergency/hospitals');
    return res.data.data;
  },

  /**
   * Find hospitals near a coordinate using the OpenStreetMap Overpass API.
   * Matches amenity=hospital/clinic and healthcare=hospital/doctor within
   * the given radius, sorted by distance.
   */
  findNearbyHospitals: async (
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000
  ): Promise<NearbyHospital[]> => {
    const query = `[out:json][timeout:20];
(
  node["amenity"~"^(hospital|clinic)$"](around:${radiusMeters},${latitude},${longitude});
  way["amenity"~"^(hospital|clinic)$"](around:${radiusMeters},${latitude},${longitude});
  node["healthcare"="hospital"](around:${radiusMeters},${latitude},${longitude});
  way["healthcare"="hospital"](around:${radiusMeters},${latitude},${longitude});
);
out center 40;`;

    const res = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      throw new Error(`Overpass API error: ${res.status}`);
    }

    const json = (await res.json()) as { elements?: OsmElement[] };
    const elements = json.elements ?? [];

    return elements
      .map((el): NearbyHospital => {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        return {
          id: `${el.type}/${el.id}`,
          name: el.tags?.name || 'Unnamed Medical Facility',
          address: buildAddress(el.tags),
          phone: el.tags?.phone || el.tags?.['contact:phone'],
          emergencyPhone: el.tags?.['emergency:phone'],
          latitude: lat,
          longitude: lon,
          distanceKm:
            lat != null && lon != null
              ? Number(haversineKm(latitude, longitude, lat, lon).toFixed(2))
              : undefined,
        };
      })
      .filter((h) => h.latitude != null && h.longitude != null)
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  },
};
