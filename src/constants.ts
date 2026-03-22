// ============================================================================
// Guardian — constants.ts
// Phase 16: Ultra-Low Power Mode (Zero-Fail Injection)
// Generated via Antigravity Editor
// ============================================================================

// ---------------------------------------------------------------------------
// 1. GPS & POWER INTERVALS
// ---------------------------------------------------------------------------
export const GPS_INTERVAL_NORMAL = 15_000;       // 15 s  — standard tracking
export const GPS_INTERVAL_LOW_POWER = 300_000;   // 5 min — ultra-low power

export const MAP_TILE_CACHE_TTL = 86_400_000;    // 24 h offline tile cache
export const ALERT_POLL_INTERVAL = 30_000;       // 30 s  — live alerts
export const ALERT_POLL_LOW_POWER = 600_000;     // 10 min — low-power alerts

// ---------------------------------------------------------------------------
// 2. OLED-OPTIMIZED COLOR PALETTE
// ---------------------------------------------------------------------------
export const OLED_COLORS = {
  bg:          '#000000',
  text:        '#00FF00',
  textDim:     '#009900',
  accent:      '#00CC66',
  border:      '#1A1A1A',
  danger:      '#FF3333',
  warning:     '#FFB300',
  safe:        '#00FF00',
  headerBg:    '#0A0A0A',
  cardBg:      '#0D0D0D',
  cardHover:   '#141414',
} as const;

// ---------------------------------------------------------------------------
// 3. STANDARD UI PALETTE (normal mode)
// ---------------------------------------------------------------------------
export const THEME = {
  primary:     '#2563EB',
  primaryDark: '#1E40AF',
  surface:     '#1E293B',
  surfaceAlt:  '#0F172A',
  background:  '#0F172A',
  text:        '#F1F5F9',
  textMuted:   '#94A3B8',
  danger:      '#EF4444',
  warning:     '#F59E0B',
  success:     '#22C55E',
  border:      '#334155',
} as const;

// ---------------------------------------------------------------------------
// 4. SYSTEM FONT STACK (zero web-font loads in low-power)
// ---------------------------------------------------------------------------
export const SYSTEM_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, ' +
  'Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Arial, sans-serif';

// ---------------------------------------------------------------------------
// 5. RESOURCE CATEGORIES
// ---------------------------------------------------------------------------
export type ResourceCategory =
  | 'hospital'
  | 'bakery'
  | 'pharmacy'
  | 'ngo'
  | 'shelter'
  | 'water'
  | 'fuel';

export const CATEGORY_ICONS: Record<ResourceCategory, string> = {
  hospital:  '🏥',
  bakery:    '🍞',
  pharmacy:  '💊',
  ngo:       '🤝',
  shelter:   '🏠',
  water:     '💧',
  fuel:      '⛽',
};

export const CATEGORY_LABELS: Record<ResourceCategory, Record<string, string>> = {
  hospital:  { en: 'Hospital',    ar: 'مستشفى',    fr: 'Hôpital' },
  bakery:    { en: 'Bakery',      ar: 'مخبز',      fr: 'Boulangerie' },
  pharmacy:  { en: 'Pharmacy',    ar: 'صيدلية',    fr: 'Pharmacie' },
  ngo:       { en: 'NGO Center',  ar: 'مركز إغاثة', fr: 'Centre ONG' },
  shelter:   { en: 'Shelter',     ar: 'مأوى',      fr: 'Abri' },
  water:     { en: 'Water Point', ar: 'نقطة مياه',  fr: "Point d'eau" },
  fuel:      { en: 'Fuel Station', ar: 'محطة وقود', fr: 'Station essence' },
};

// ---------------------------------------------------------------------------
// 6. CARDINAL DIRECTIONS (used in low-power list view)
// ---------------------------------------------------------------------------
export type CardinalDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export const DIRECTION_LABELS: Record<CardinalDirection, Record<string, string>> = {
  N:  { en: 'North',      ar: 'شمال',       fr: 'Nord' },
  NE: { en: 'Northeast',  ar: 'شمال شرق',   fr: 'Nord-est' },
  E:  { en: 'East',       ar: 'شرق',        fr: 'Est' },
  SE: { en: 'Southeast',  ar: 'جنوب شرق',   fr: 'Sud-est' },
  S:  { en: 'South',      ar: 'جنوب',       fr: 'Sud' },
  SW: { en: 'Southwest',  ar: 'جنوب غرب',   fr: 'Sud-ouest' },
  W:  { en: 'West',       ar: 'غرب',        fr: 'Ouest' },
  NW: { en: 'Northwest',  ar: 'شمال غرب',   fr: 'Nord-ouest' },
};

// ---------------------------------------------------------------------------
// 7. DANGER ZONE SEVERITY
// ---------------------------------------------------------------------------
export type SeverityLevel = 'critical' | 'high' | 'moderate' | 'low';

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  critical: '#FF0000',
  high:     '#FF6600',
  moderate: '#FFB300',
  low:      '#FFFF00',
};

// ---------------------------------------------------------------------------
// 8. GUARDIAN_DATA — MASTER RESOURCE REGISTRY
//    Single source of truth for all humanitarian resource points.
//    Coordinates are [lat, lng] in WGS-84.
// ---------------------------------------------------------------------------
export interface GuardianResource {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  category: ResourceCategory;
  lat: number;
  lng: number;
  phone?: string;
  operatingHours?: string;
  verifiedBy?: string;          // LRC | Amel | Caritas | UNRWA
  isOperational: boolean;
  lastVerified: string;         // ISO-8601
}

export interface DangerZone {
  id: string;
  lat: number;
  lng: number;
  radiusKm: number;
  severity: SeverityLevel;
  description: string;
  reportedAt: string;           // ISO-8601
  expiresAt?: string;
}

export interface GuardianDataStore {
  resources: GuardianResource[];
  dangerZones: DangerZone[];
  lastSync: string;
  version: string;
}

export const GUARDIAN_DATA: GuardianDataStore = {
  version: '16.0.0',
  lastSync: new Date().toISOString(),
  resources: [
    // ── Hospitals ──────────────────────────────────────────────────────
    {
      id: 'hosp-001',
      name: 'Rafik Hariri University Hospital',
      nameAr: 'مستشفى رفيق الحريري الجامعي',
      nameFr: 'Hôpital Universitaire Rafik Hariri',
      category: 'hospital',
      lat: 33.8382,
      lng: 35.5370,
      phone: '+961-1-830000',
      operatingHours: '24/7',
      verifiedBy: 'LRC',
      isOperational: true,
      lastVerified: '2026-03-22T10:00:00Z',
    },
    {
      id: 'hosp-002',
      name: 'Hotel Dieu de France',
      nameAr: 'مستشفى اوتيل ديو دو فرانس',
      nameFr: 'Hôtel-Dieu de France',
      category: 'hospital',
      lat: 33.8950,
      lng: 35.5128,
      phone: '+961-1-615300',
      operatingHours: '24/7',
      verifiedBy: 'Caritas',
      isOperational: true,
      lastVerified: '2026-03-21T14:30:00Z',
    },
    {
      id: 'hosp-003',
      name: 'Tripoli Governmental Hospital',
      nameAr: 'مستشفى طرابلس الحكومي',
      nameFr: 'Hôpital Gouvernemental de Tripoli',
      category: 'hospital',
      lat: 34.4367,
      lng: 35.8497,
      phone: '+961-6-381581',
      operatingHours: '24/7',
      verifiedBy: 'LRC',
      isOperational: true,
      lastVerified: '2026-03-20T08:00:00Z',
    },
    // ── Bakeries ───────────────────────────────────────────────────────
    {
      id: 'bake-001',
      name: 'Wooden Bakery - Hamra',
      nameAr: 'فرن الخشب - الحمرا',
      nameFr: 'Boulangerie Wooden - Hamra',
      category: 'bakery',
      lat: 33.8963,
      lng: 35.4848,
      operatingHours: '06:00-22:00',
      isOperational: true,
      lastVerified: '2026-03-22T07:00:00Z',
    },
    {
      id: 'bake-002',
      name: 'Al-Safa Bakery - Saida',
      nameAr: 'مخبز الصفاء - صيدا',
      nameFr: 'Boulangerie Al-Safa - Saïda',
      category: 'bakery',
      lat: 33.5617,
      lng: 35.3733,
      operatingHours: '05:00-21:00',
      isOperational: true,
      lastVerified: '2026-03-21T11:00:00Z',
    },
    // ── Pharmacies ─────────────────────────────────────────────────────
    {
      id: 'pharma-001',
      name: 'Benta Pharmacy - Verdun',
      nameAr: 'صيدلية بنتا - فردان',
      nameFr: 'Pharmacie Benta - Verdun',
      category: 'pharmacy',
      lat: 33.8774,
      lng: 35.4878,
      phone: '+961-1-803030',
      operatingHours: '08:00-00:00',
      isOperational: true,
      lastVerified: '2026-03-22T09:00:00Z',
    },
    {
      id: 'pharma-002',
      name: 'Mazen Pharmacy - Jounieh',
      nameAr: 'صيدلية مازن - جونيه',
      nameFr: 'Pharmacie Mazen - Jounieh',
      category: 'pharmacy',
      lat: 33.9808,
      lng: 35.6178,
      phone: '+961-9-918000',
      operatingHours: '08:00-22:00',
      isOperational: true,
      lastVerified: '2026-03-20T16:00:00Z',
    },
    // ── NGO / Aid Centers ──────────────────────────────────────────────
    {
      id: 'ngo-001',
      name: 'Lebanese Red Cross - HQ',
      nameAr: 'الصليب الأحمر اللبناني - المركز',
      nameFr: 'Croix-Rouge Libanaise - Siège',
      category: 'ngo',
      lat: 33.8869,
      lng: 35.5131,
      phone: '+961-1-372802',
      operatingHours: '24/7',
      verifiedBy: 'LRC',
      isOperational: true,
      lastVerified: '2026-03-22T06:00:00Z',
    },
    {
      id: 'ngo-002',
      name: 'Amel Association - Beirut',
      nameAr: 'جمعية أمل - بيروت',
      nameFr: "Association Amel - Beyrouth",
      category: 'ngo',
      lat: 33.8773,
      lng: 35.5099,
      phone: '+961-1-741851',
      operatingHours: '08:00-17:00',
      verifiedBy: 'Amel',
      isOperational: true,
      lastVerified: '2026-03-21T12:00:00Z',
    },
    {
      id: 'ngo-003',
      name: 'UNRWA - Shatila Camp',
      nameAr: 'الأونروا - مخيم شاتيلا',
      nameFr: 'UNRWA - Camp de Chatila',
      category: 'ngo',
      lat: 33.8603,
      lng: 35.4967,
      phone: '+961-1-840490',
      operatingHours: '08:00-16:00',
      verifiedBy: 'UNRWA',
      isOperational: true,
      lastVerified: '2026-03-22T08:00:00Z',
    },
    {
      id: 'ngo-004',
      name: 'Caritas Lebanon - Jbeil',
      nameAr: 'كاريتاس لبنان - جبيل',
      nameFr: 'Caritas Liban - Byblos',
      category: 'ngo',
      lat: 34.1209,
      lng: 35.6517,
      phone: '+961-9-544700',
      operatingHours: '08:00-16:00',
      verifiedBy: 'Caritas',
      isOperational: true,
      lastVerified: '2026-03-20T10:00:00Z',
    },
    // ── Shelters ───────────────────────────────────────────────────────
    {
      id: 'shlt-001',
      name: 'UNESCO Palace Shelter',
      nameAr: 'مأوى قصر اليونسكو',
      nameFr: 'Abri Palais UNESCO',
      category: 'shelter',
      lat: 33.8815,
      lng: 35.5125,
      operatingHours: '24/7',
      verifiedBy: 'LRC',
      isOperational: true,
      lastVerified: '2026-03-22T05:00:00Z',
    },
    // ── Water Points ───────────────────────────────────────────────────
    {
      id: 'water-001',
      name: 'UNICEF Water Station - Bourj Hammoud',
      nameAr: 'محطة يونيسيف للمياه - برج حمود',
      nameFr: "Station d'eau UNICEF - Bourj Hammoud",
      category: 'water',
      lat: 33.8942,
      lng: 35.5400,
      operatingHours: '06:00-20:00',
      isOperational: true,
      lastVerified: '2026-03-21T15:00:00Z',
    },
    // ── Fuel Stations ──────────────────────────────────────────────────
    {
      id: 'fuel-001',
      name: 'IPT Station - Dora',
      nameAr: 'محطة IPT - الدورة',
      nameFr: 'Station IPT - Dora',
      category: 'fuel',
      lat: 33.8960,
      lng: 35.5560,
      operatingHours: '06:00-22:00',
      isOperational: true,
      lastVerified: '2026-03-22T11:00:00Z',
    },
  ],
  dangerZones: [
    {
      id: 'dz-001',
      lat: 33.8580,
      lng: 35.5100,
      radiusKm: 0.5,
      severity: 'critical',
      description: 'Active shelling reported — Dahieh sector',
      reportedAt: '2026-03-22T22:10:00Z',
    },
    {
      id: 'dz-002',
      lat: 34.4370,
      lng: 35.8320,
      radiusKm: 1.2,
      severity: 'high',
      description: 'Unexploded ordnance — northern Tripoli corridor',
      reportedAt: '2026-03-22T18:45:00Z',
    },
    {
      id: 'dz-003',
      lat: 33.2700,
      lng: 35.2040,
      radiusKm: 0.8,
      severity: 'moderate',
      description: 'Road collapse — Tyre coastal road',
      reportedAt: '2026-03-22T14:20:00Z',
    },
  ],
};

// ---------------------------------------------------------------------------
// 9. OSRM / ROUTING CONSTANTS
// ---------------------------------------------------------------------------
export const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';
export const OSRM_TIMEOUT_MS = 10_000;
export const MAX_ROUTE_WAYPOINTS = 25;
export const ROUTE_COLORS = {
  safest:     '#22C55E',
  alternate:  '#3B82F6',
  dangerous:  '#EF4444',
} as const;

// ---------------------------------------------------------------------------
// 10. APP META
// ---------------------------------------------------------------------------
export const APP_VERSION = '16.0.0';
export const APP_CODENAME = 'Ultra-Low Power';
export const PHASE = 16;
