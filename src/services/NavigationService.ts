// ============================================================================
// Guardian — NavigationService.ts
// Phase 16: Extracted OSRM routing logic (keeps App.tsx under 1,200 lines)
// Generated via Antigravity Editor
// ============================================================================

import {
  OSRM_BASE_URL,
  OSRM_TIMEOUT_MS,
  MAX_ROUTE_WAYPOINTS,
  ROUTE_COLORS,
  type DangerZone,
} from '../constants';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface RouteSegment {
  coordinates: RouteCoordinate[];
  distanceKm: number;
  durationMin: number;
  color: string;
  isSafest: boolean;
}

export interface NavigationResult {
  routes: RouteSegment[];
  selectedIndex: number;
  error?: string;
  timestamp: string;
}

interface OSRMRouteResponse {
  code: string;
  routes: Array<{
    geometry: {
      coordinates: [number, number][];
    };
    distance: number;  // meters
    duration: number;  // seconds
  }>;
}

// ---------------------------------------------------------------------------
// DANGER-ZONE AVOIDANCE SCORING
// ---------------------------------------------------------------------------
function dangerScoreForRoute(
  route: RouteCoordinate[],
  dangerZones: DangerZone[],
): number {
  let score = 0;
  const SEVERITY_WEIGHT: Record<string, number> = {
    critical: 100,
    high: 50,
    moderate: 20,
    low: 5,
  };

  for (const point of route) {
    for (const dz of dangerZones) {
      const dist = haversineQuick(point.lat, point.lng, dz.lat, dz.lng);
      if (dist <= dz.radiusKm) {
        score += SEVERITY_WEIGHT[dz.severity] ?? 10;
      } else if (dist <= dz.radiusKm * 2) {
        // Proximity penalty (within 2x radius)
        score += (SEVERITY_WEIGHT[dz.severity] ?? 10) * 0.3;
      }
    }
  }
  return score;
}

/**
 * Fast haversine (no trigonometric overhead for small distances).
 * Accuracy is sufficient for route-danger scoring.
 */
function haversineQuick(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// OSRM FETCH (with AbortController timeout)
// ---------------------------------------------------------------------------
async function fetchOSRMRoutes(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  waypoints: RouteCoordinate[] = [],
): Promise<OSRMRouteResponse> {
  const allPoints = [origin, ...waypoints.slice(0, MAX_ROUTE_WAYPOINTS - 2), destination];
  const coordString = allPoints
    .map((p) => `${p.lng},${p.lat}`)
    .join(';');

  const url = `${OSRM_BASE_URL}/${coordString}` +
    `?overview=full&geometries=geojson&alternatives=3`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`OSRM HTTP ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as OSRMRouteResponse;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Calculates navigation routes from origin to destination,
 * scoring each against known danger zones and selecting the safest.
 *
 * Returns up to 3 alternative routes with the safest pre-selected.
 */
export async function calculateSafestRoute(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  dangerZones: DangerZone[],
  waypoints: RouteCoordinate[] = [],
): Promise<NavigationResult> {
  try {
    const osrm = await fetchOSRMRoutes(origin, destination, waypoints);

    if (osrm.code !== 'Ok' || !osrm.routes?.length) {
      return {
        routes: [],
        selectedIndex: -1,
        error: `OSRM returned: ${osrm.code}`,
        timestamp: new Date().toISOString(),
      };
    }

    // Convert OSRM geometry → RouteSegment and score against danger zones
    const scored = osrm.routes.map((raw, idx) => {
      const coordinates: RouteCoordinate[] = raw.geometry.coordinates.map(
        ([lng, lat]) => ({ lat, lng }),
      );
      const dangerScore = dangerScoreForRoute(coordinates, dangerZones);

      return {
        segment: {
          coordinates,
          distanceKm: raw.distance / 1000,
          durationMin: Math.ceil(raw.duration / 60),
          color: idx === 0 ? ROUTE_COLORS.safest : ROUTE_COLORS.alternate,
          isSafest: false,     // will be set after sorting
        },
        dangerScore,
      };
    });

    // Sort: lowest danger score = safest
    scored.sort((a, b) => a.dangerScore - b.dangerScore);

    // Mark safest
    scored[0].segment.isSafest = true;
    scored[0].segment.color = ROUTE_COLORS.safest;

    // Mark dangerous alternatives
    for (let i = 1; i < scored.length; i++) {
      if (scored[i].dangerScore > scored[0].dangerScore * 3) {
        scored[i].segment.color = ROUTE_COLORS.dangerous;
      }
    }

    return {
      routes: scored.map((s) => s.segment),
      selectedIndex: 0,
      timestamp: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown routing error';
    console.error('[NavigationService] Route calculation failed:', message);
    return {
      routes: [],
      selectedIndex: -1,
      error: message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Checks whether a coordinate is inside any active danger zone.
 * Used for route validation and user warnings.
 */
export function isInsideDangerZone(
  lat: number,
  lng: number,
  dangerZones: DangerZone[],
): DangerZone | null {
  for (const dz of dangerZones) {
    if (haversineQuick(lat, lng, dz.lat, dz.lng) <= dz.radiusKm) {
      return dz;
    }
  }
  return null;
}

/**
 * Returns all danger zones within `radiusKm` of the given coordinate,
 * sorted by proximity (nearest first).
 */
export function nearbyDangerZones(
  lat: number,
  lng: number,
  dangerZones: DangerZone[],
  radiusKm: number = 5,
): Array<DangerZone & { distanceKm: number }> {
  return dangerZones
    .map((dz) => ({
      ...dz,
      distanceKm: haversineQuick(lat, lng, dz.lat, dz.lng),
    }))
    .filter((dz) => dz.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
