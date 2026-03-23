// ============================================================================
// Guardian — constants.ts
// Phase 16.1 → Restoration Phase 01: Universal Resource Injection
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
// 1b. MAP DEFAULTS
// ---------------------------------------------------------------------------
export const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const LIGHT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const MAP_DEFAULT_CENTER: [number, number] = [33.8938, 35.5018];  // Beirut
export const MAP_DEFAULT_ZOOM = 13;

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

export const LIGHT_THEME = {
  primary:     '#2563EB',
  primaryDark: '#1D4ED8',
  surface:     '#F1F5F9',
  surfaceAlt:  '#E2E8F0',
  background:  '#FFFFFF',
  text:        '#0F172A',
  textMuted:   '#64748B',
  danger:      '#DC2626',
  warning:     '#D97706',
  success:     '#16A34A',
  border:      '#CBD5E1',
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
//    Universal Resource Injection: 15–20+ per category
//    Coordinates: WGS-84 [lat, lng] — Lebanon + Riyadh coverage
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
  verifiedBy?: string;
  isOperational: boolean;
  lastVerified: string;
  /** Max people capacity (shelters/NGOs) */
  capacity?: number;
  /** Current occupancy count */
  occupancy?: number;
}

export interface DangerZone {
  id: string;
  lat: number;
  lng: number;
  radiusKm: number;
  severity: SeverityLevel;
  description: string;
  reportedAt: string;
  expiresAt?: string;
}

export interface GuardianDataStore {
  resources: GuardianResource[];
  dangerZones: DangerZone[];
  lastSync: string;
  version: string;
}

export const GUARDIAN_DATA: GuardianDataStore = {
  version: '16.1.1',
  lastSync: new Date().toISOString(),
  resources: [
    // ══════════════════════════════════════════════════════════════════
    // HOSPITALS (20)
    // ══════════════════════════════════════════════════════════════════
    { id: 'hosp-001', name: 'Rafik Hariri University Hospital', nameAr: 'مستشفى رفيق الحريري الجامعي', nameFr: 'Hôpital Universitaire Rafik Hariri', category: 'hospital', lat: 33.8382, lng: 35.5370, phone: '+961-1-830000', operatingHours: '24/7', verifiedBy: 'LRC', isOperational: true, lastVerified: '2026-03-23T10:00:00Z' },
    { id: 'hosp-002', name: 'Hotel Dieu de France', nameAr: 'مستشفى اوتيل ديو دو فرانس', nameFr: 'Hôtel-Dieu de France', category: 'hospital', lat: 33.8950, lng: 35.5128, phone: '+961-1-615300', operatingHours: '24/7', verifiedBy: 'Caritas', isOperational: true, lastVerified: '2026-03-23T08:00:00Z' },
    { id: 'hosp-003', name: 'Tripoli Governmental Hospital', nameAr: 'مستشفى طرابلس الحكومي', nameFr: 'Hôpital Gouvernemental de Tripoli', category: 'hospital', lat: 34.4367, lng: 35.8497, phone: '+961-6-381581', operatingHours: '24/7', verifiedBy: 'LRC', isOperational: true, lastVerified: '2026-03-23T06:00:00Z' },
    { id: 'hosp-004', name: 'AUB Medical Center', nameAr: 'المركز الطبي للجامعة الأمريكية', nameFr: 'Centre Médical AUB', category: 'hospital', lat: 33.9000, lng: 35.4803, phone: '+961-1-350000', operatingHours: '24/7', verifiedBy: 'LRC', isOperational: true, lastVerified: '2026-03-23T09:00:00Z' },
    { id: 'hosp-005', name: 'Hammoud Hospital - Saida', nameAr: 'مستشفى حمود - صيدا', nameFr: 'Hôpital Hammoud - Saïda', category: 'hospital', lat: 33.5580, lng: 35.3750, phone: '+961-7-723111', operatingHours: '24/7', verifiedBy: 'Amel', isOperational: true, lastVerified: '2026-03-22T14:00:00Z' },
    { id: 'hosp-006', name: 'Nabatieh Governmental Hospital', nameAr: 'مستشفى النبطية الحكومي', nameFr: 'Hôpital Gouvernemental de Nabatieh', category: 'hospital', lat: 33.3789, lng: 35.4839, phone: '+961-7-760692', operatingHours: '24/7', verifiedBy: 'LRC', isOperational: true, lastVerified: '2026-03-22T12:00:00Z' },
    { id: 'hosp-007', name: 'Baalbek Hospital', nameAr: 'مستشفى بعلبك', nameFr: 'Hôpital de Baalbek', category: 'hospital', lat: 34.0061, lng: 36.2021, phone: '+961-8-370052', operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T10:00:00Z' },
    { id: 'hosp-008', name: 'Notre Dame des Secours - Byblos', nameAr: 'مستشفى سيدة المعونات - جبيل', category: 'hospital', lat: 34.1209, lng: 35.6517, phone: '+961-9-547254', operatingHours: '24/7', verifiedBy: 'Caritas', isOperational: true, lastVerified: '2026-03-23T07:00:00Z' },
    { id: 'hosp-009', name: 'Jounieh Hospital', nameAr: 'مستشفى جونيه', category: 'hospital', lat: 33.9808, lng: 35.6178, phone: '+961-9-930000', operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T16:00:00Z' },
    { id: 'hosp-010', name: 'Zahle Governmental Hospital', nameAr: 'مستشفى زحلة الحكومي', category: 'hospital', lat: 33.8460, lng: 35.9048, phone: '+961-8-803356', operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T11:00:00Z' },
    { id: 'hosp-011', name: 'Tyre Governmental Hospital', nameAr: 'مستشفى صور الحكومي', category: 'hospital', lat: 33.2708, lng: 35.1962, phone: '+961-7-741640', operatingHours: '24/7', verifiedBy: 'UNRWA', isOperational: true, lastVerified: '2026-03-22T09:00:00Z' },
    { id: 'hosp-012', name: 'Akkar Hospital', nameAr: 'مستشفى عكار', category: 'hospital', lat: 34.5493, lng: 36.0786, phone: '+961-6-690360', operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-21T14:00:00Z' },
    { id: 'hosp-013', name: 'Lebanese Canadian Hospital', nameAr: 'المستشفى اللبناني الكندي', category: 'hospital', lat: 33.9190, lng: 35.5950, phone: '+961-4-445666', operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-23T05:00:00Z' },
    { id: 'hosp-014', name: 'Keserwan Medical Center', nameAr: 'مركز كسروان الطبي', category: 'hospital', lat: 33.9730, lng: 35.6340, phone: '+961-9-855333', operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T15:00:00Z' },
    // Riyadh Hospitals
    { id: 'hosp-r01', name: 'King Faisal Specialist Hospital', nameAr: 'مستشفى الملك فيصل التخصصي', category: 'hospital', lat: 24.6710, lng: 46.6780, phone: '+966-11-464-7272', operatingHours: '24/7', verifiedBy: 'MOH', isOperational: true, lastVerified: '2026-03-23T10:00:00Z' },
    { id: 'hosp-r02', name: 'King Abdulaziz Medical City', nameAr: 'مدينة الملك عبدالعزيز الطبية', category: 'hospital', lat: 24.7136, lng: 46.6460, phone: '+966-11-801-1111', operatingHours: '24/7', verifiedBy: 'MOH', isOperational: true, lastVerified: '2026-03-23T09:00:00Z' },
    { id: 'hosp-r03', name: 'King Khalid University Hospital', nameAr: 'مستشفى الملك خالد الجامعي', category: 'hospital', lat: 24.7229, lng: 46.6196, phone: '+966-11-467-0000', operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-23T08:00:00Z' },
    { id: 'hosp-r04', name: 'King Salman Hospital', nameAr: 'مستشفى الملك سلمان', category: 'hospital', lat: 24.7800, lng: 46.7100, phone: '+966-11-231-5000', operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T18:00:00Z' },
    { id: 'hosp-r05', name: 'Prince Sultan Military Hospital', nameAr: 'مستشفى الأمير سلطان العسكري', category: 'hospital', lat: 24.6130, lng: 46.6910, phone: '+966-11-478-0000', operatingHours: '24/7', verifiedBy: 'MOH', isOperational: true, lastVerified: '2026-03-22T12:00:00Z' },
    { id: 'hosp-r06', name: 'Al Iman General Hospital', nameAr: 'مستشفى الإيمان العام', category: 'hospital', lat: 24.6510, lng: 46.7310, phone: '+966-11-447-3900', operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T14:00:00Z' },

    // ══════════════════════════════════════════════════════════════════
    // BAKERIES (15)
    // ══════════════════════════════════════════════════════════════════
    { id: 'bake-001', name: 'Wooden Bakery - Hamra', nameAr: 'فرن الخشب - الحمرا', nameFr: 'Boulangerie Wooden - Hamra', category: 'bakery', lat: 33.8963, lng: 35.4848, operatingHours: '06:00-22:00', isOperational: true, lastVerified: '2026-03-23T07:00:00Z' },
    { id: 'bake-002', name: 'Al-Safa Bakery - Saida', nameAr: 'مخبز الصفاء - صيدا', nameFr: 'Boulangerie Al-Safa - Saïda', category: 'bakery', lat: 33.5617, lng: 35.3733, operatingHours: '05:00-21:00', isOperational: true, lastVerified: '2026-03-22T11:00:00Z' },
    { id: 'bake-003', name: 'Furn El-Sabaya - Tripoli', nameAr: 'فرن الصبايا - طرابلس', category: 'bakery', lat: 34.4350, lng: 35.8460, operatingHours: '05:00-23:00', isOperational: true, lastVerified: '2026-03-23T06:00:00Z' },
    { id: 'bake-004', name: 'Pain d\'Or - Jounieh', nameAr: 'بان دور - جونيه', category: 'bakery', lat: 33.9780, lng: 35.6150, operatingHours: '06:00-22:00', isOperational: true, lastVerified: '2026-03-22T15:00:00Z' },
    { id: 'bake-005', name: 'Abo Arab Bakery - Nabatieh', nameAr: 'مخبز أبو عرب - النبطية', category: 'bakery', lat: 33.3800, lng: 35.4850, operatingHours: '05:30-20:00', isOperational: true, lastVerified: '2026-03-22T10:00:00Z' },
    { id: 'bake-006', name: 'Furn Al-Dayaa - Baalbek', nameAr: 'فرن الضيعة - بعلبك', category: 'bakery', lat: 34.0050, lng: 36.2000, operatingHours: '05:00-19:00', isOperational: true, lastVerified: '2026-03-21T16:00:00Z' },
    { id: 'bake-007', name: 'Furn Al-Balad - Zahle', nameAr: 'فرن البلد - زحلة', category: 'bakery', lat: 33.8440, lng: 35.9050, operatingHours: '05:00-21:00', isOperational: true, lastVerified: '2026-03-22T08:00:00Z' },
    { id: 'bake-008', name: 'Furn Achour - Tyre', nameAr: 'فرن عاشور - صور', category: 'bakery', lat: 33.2720, lng: 35.1950, operatingHours: '05:00-20:00', isOperational: true, lastVerified: '2026-03-22T09:00:00Z' },
    { id: 'bake-009', name: 'Chez Paul - Byblos', nameAr: 'شيه بول - جبيل', category: 'bakery', lat: 34.1200, lng: 35.6510, operatingHours: '06:00-22:00', isOperational: true, lastVerified: '2026-03-23T05:00:00Z' },
    { id: 'bake-010', name: 'Al-Manara Bakery - Batroun', nameAr: 'مخبز المنارة - البترون', category: 'bakery', lat: 34.2550, lng: 35.6580, operatingHours: '05:30-20:00', isOperational: true, lastVerified: '2026-03-21T12:00:00Z' },
    // Riyadh Bakeries
    { id: 'bake-r01', name: 'Tamimi Bakery - Olaya', nameAr: 'مخبز التميمي - العليا', category: 'bakery', lat: 24.6900, lng: 46.6850, operatingHours: '06:00-00:00', isOperational: true, lastVerified: '2026-03-23T07:00:00Z' },
    { id: 'bake-r02', name: 'Paul Bakery - Kingdom Tower', nameAr: 'مخبز بول - برج المملكة', category: 'bakery', lat: 24.7110, lng: 46.6740, operatingHours: '07:00-23:00', isOperational: true, lastVerified: '2026-03-23T08:00:00Z' },
    { id: 'bake-r03', name: 'Saadeddin Pastry - Malaz', nameAr: 'حلويات سعد الدين - الملز', category: 'bakery', lat: 24.6600, lng: 46.7200, operatingHours: '06:00-01:00', isOperational: true, lastVerified: '2026-03-22T20:00:00Z' },
    { id: 'bake-r04', name: 'Alyasmin Bakery', nameAr: 'مخبز الياسمين', category: 'bakery', lat: 24.8100, lng: 46.6300, operatingHours: '05:00-22:00', isOperational: true, lastVerified: '2026-03-22T18:00:00Z' },
    { id: 'bake-r05', name: 'Furn Al-Hara - Exit 5', nameAr: 'فرن الحارة - مخرج ٥', category: 'bakery', lat: 24.6350, lng: 46.7050, operatingHours: '05:00-23:00', isOperational: true, lastVerified: '2026-03-22T16:00:00Z' },

    // ══════════════════════════════════════════════════════════════════
    // PHARMACIES (15)
    // ══════════════════════════════════════════════════════════════════
    { id: 'pharma-001', name: 'Benta Pharmacy - Verdun', nameAr: 'صيدلية بنتا - فردان', nameFr: 'Pharmacie Benta - Verdun', category: 'pharmacy', lat: 33.8774, lng: 35.4878, phone: '+961-1-803030', operatingHours: '08:00-00:00', isOperational: true, lastVerified: '2026-03-23T09:00:00Z' },
    { id: 'pharma-002', name: 'Mazen Pharmacy - Jounieh', nameAr: 'صيدلية مازن - جونيه', nameFr: 'Pharmacie Mazen - Jounieh', category: 'pharmacy', lat: 33.9808, lng: 35.6178, phone: '+961-9-918000', operatingHours: '08:00-22:00', isOperational: true, lastVerified: '2026-03-22T16:00:00Z' },
    { id: 'pharma-003', name: 'Pharmacie de la Place - Tripoli', nameAr: 'صيدلية الساحة - طرابلس', category: 'pharmacy', lat: 34.4400, lng: 35.8350, phone: '+961-6-432100', operatingHours: '08:00-22:00', isOperational: true, lastVerified: '2026-03-23T06:00:00Z' },
    { id: 'pharma-004', name: 'Al-Hayat Pharmacy - Saida', nameAr: 'صيدلية الحياة - صيدا', category: 'pharmacy', lat: 33.5600, lng: 35.3700, phone: '+961-7-722100', operatingHours: '08:00-21:00', isOperational: true, lastVerified: '2026-03-22T12:00:00Z' },
    { id: 'pharma-005', name: 'Beirut Pharmacy - Achrafieh', nameAr: 'صيدلية بيروت - الأشرفية', category: 'pharmacy', lat: 33.8900, lng: 35.5200, phone: '+961-1-335678', operatingHours: '24/7', verifiedBy: 'LRC', isOperational: true, lastVerified: '2026-03-23T08:00:00Z' },
    { id: 'pharma-006', name: 'Al-Shifa Pharmacy - Nabatieh', nameAr: 'صيدلية الشفاء - النبطية', category: 'pharmacy', lat: 33.3770, lng: 35.4820, operatingHours: '08:00-20:00', isOperational: true, lastVerified: '2026-03-22T10:00:00Z' },
    { id: 'pharma-007', name: 'Byblos Pharmacy', nameAr: 'صيدلية جبيل', category: 'pharmacy', lat: 34.1220, lng: 35.6530, operatingHours: '08:00-22:00', isOperational: true, lastVerified: '2026-03-22T14:00:00Z' },
    { id: 'pharma-008', name: 'Zahle Night Pharmacy', nameAr: 'صيدلية زحلة الليلية', category: 'pharmacy', lat: 33.8450, lng: 35.9060, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T15:00:00Z' },
    { id: 'pharma-009', name: 'Batroun Pharmacy', nameAr: 'صيدلية البترون', category: 'pharmacy', lat: 34.2560, lng: 35.6590, operatingHours: '08:00-20:00', isOperational: true, lastVerified: '2026-03-21T11:00:00Z' },
    { id: 'pharma-010', name: 'Tyre Central Pharmacy', nameAr: 'الصيدلية المركزية - صور', category: 'pharmacy', lat: 33.2730, lng: 35.1980, phone: '+961-7-740200', operatingHours: '08:00-21:00', isOperational: true, lastVerified: '2026-03-22T09:00:00Z' },
    // Riyadh Pharmacies
    { id: 'pharma-r01', name: 'Nahdi Pharmacy - Olaya', nameAr: 'صيدلية النهدي - العليا', category: 'pharmacy', lat: 24.6920, lng: 46.6870, phone: '+966-920-004-007', operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-23T10:00:00Z' },
    { id: 'pharma-r02', name: 'Al-Dawaa Pharmacy - Malaz', nameAr: 'صيدلية الدواء - الملز', category: 'pharmacy', lat: 24.6580, lng: 46.7180, phone: '+966-920-003-993', operatingHours: '08:00-00:00', isOperational: true, lastVerified: '2026-03-23T09:00:00Z' },
    { id: 'pharma-r03', name: 'Whites Pharmacy - Exit 10', nameAr: 'صيدلية وايتس - مخرج ١٠', category: 'pharmacy', lat: 24.7350, lng: 46.6550, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T18:00:00Z' },
    { id: 'pharma-r04', name: 'Nahdi Pharmacy - Al Nakheel', nameAr: 'صيدلية النهدي - النخيل', category: 'pharmacy', lat: 24.7700, lng: 46.6400, operatingHours: '08:00-01:00', isOperational: true, lastVerified: '2026-03-22T16:00:00Z' },
    { id: 'pharma-r05', name: 'Al-Dawaa Pharmacy - DQ', nameAr: 'صيدلية الدواء - الحي الدبلوماسي', category: 'pharmacy', lat: 24.6400, lng: 46.6500, operatingHours: '08:00-23:00', isOperational: true, lastVerified: '2026-03-22T14:00:00Z' },

    // ══════════════════════════════════════════════════════════════════
    // NGO / AID CENTERS (18)
    // ══════════════════════════════════════════════════════════════════
    { id: 'ngo-001', name: 'Lebanese Red Cross - HQ', nameAr: 'الصليب الأحمر اللبناني - المركز', nameFr: 'Croix-Rouge Libanaise - Siège', category: 'ngo', lat: 33.8869, lng: 35.5131, phone: '+961-1-372802', operatingHours: '24/7', verifiedBy: 'LRC', isOperational: true, lastVerified: '2026-03-23T06:00:00Z', capacity: 200, occupancy: 85 },
    { id: 'ngo-002', name: 'Amel Association - Beirut', nameAr: 'جمعية أمل - بيروت', nameFr: 'Association Amel - Beyrouth', category: 'ngo', lat: 33.8773, lng: 35.5099, phone: '+961-1-741851', operatingHours: '08:00-17:00', verifiedBy: 'Amel', isOperational: true, lastVerified: '2026-03-23T08:00:00Z', capacity: 150, occupancy: 140 },
    { id: 'ngo-003', name: 'UNRWA - Shatila Camp', nameAr: 'الأونروا - مخيم شاتيلا', nameFr: 'UNRWA - Camp de Chatila', category: 'ngo', lat: 33.8603, lng: 35.4967, phone: '+961-1-840490', operatingHours: '08:00-16:00', verifiedBy: 'UNRWA', isOperational: true, lastVerified: '2026-03-23T07:00:00Z', capacity: 500, occupancy: 480 },
    { id: 'ngo-004', name: 'Caritas Lebanon - Jbeil', nameAr: 'كاريتاس لبنان - جبيل', nameFr: 'Caritas Liban - Byblos', category: 'ngo', lat: 34.1209, lng: 35.6517, phone: '+961-9-544700', operatingHours: '08:00-16:00', verifiedBy: 'Caritas', isOperational: true, lastVerified: '2026-03-22T10:00:00Z', capacity: 120, occupancy: 45 },
    { id: 'ngo-005', name: 'LRC Health Center - Baouchrieh', nameAr: 'مركز الصليب الأحمر - البوشرية', category: 'ngo', lat: 33.8850, lng: 35.5520, operatingHours: '24/7', verifiedBy: 'LRC', isOperational: true, lastVerified: '2026-03-23T05:00:00Z', capacity: 100, occupancy: 72 },
    { id: 'ngo-006', name: 'LRC Health Center - Nabatieh', nameAr: 'مركز الصليب الأحمر - النبطية', category: 'ngo', lat: 33.3750, lng: 35.4820, operatingHours: '24/7', verifiedBy: 'LRC', isOperational: true, lastVerified: '2026-03-22T14:00:00Z', capacity: 80, occupancy: 78 },
    { id: 'ngo-007', name: 'Amel Community Center - Tyre', nameAr: 'مركز أمل المجتمعي - صور', category: 'ngo', lat: 33.2720, lng: 35.2030, operatingHours: '08:00-16:00', verifiedBy: 'Amel', isOperational: true, lastVerified: '2026-03-22T12:00:00Z', capacity: 90, occupancy: 30 },
    { id: 'ngo-008', name: 'Caritas Center - Akkar', nameAr: 'مركز كاريتاس - عكار', category: 'ngo', lat: 34.5450, lng: 36.0780, operatingHours: '09:00-17:00', verifiedBy: 'Caritas', isOperational: true, lastVerified: '2026-03-22T10:00:00Z', capacity: 60, occupancy: 55 },
    { id: 'ngo-009', name: 'Caritas Center - Zahle', nameAr: 'مركز كاريتاس - زحلة', category: 'ngo', lat: 33.8480, lng: 35.9020, operatingHours: '09:00-17:00', verifiedBy: 'Caritas', isOperational: true, lastVerified: '2026-03-21T15:00:00Z', capacity: 75, occupancy: 20 },
    { id: 'ngo-010', name: 'UNRWA - Nahr el-Bared', nameAr: 'الأونروا - نهر البارد', category: 'ngo', lat: 34.5120, lng: 35.9650, operatingHours: '24/7', verifiedBy: 'UNRWA', isOperational: true, lastVerified: '2026-03-22T08:00:00Z', capacity: 400, occupancy: 390 },
    { id: 'ngo-011', name: 'Amel - Haret Hreik Center', nameAr: 'أمل - مركز حارة حريك', category: 'ngo', lat: 33.8450, lng: 35.5020, operatingHours: '08:00-16:00', verifiedBy: 'Amel', isOperational: true, lastVerified: '2026-03-22T09:00:00Z', capacity: 110, occupancy: 95 },
    { id: 'ngo-012', name: 'UNRWA - Siblin Camp', nameAr: 'الأونروا - مخيم سبلين', category: 'ngo', lat: 33.6250, lng: 35.4520, operatingHours: '24/7', verifiedBy: 'UNRWA', isOperational: true, lastVerified: '2026-03-22T11:00:00Z', capacity: 300, occupancy: 180 },
    { id: 'ngo-013', name: 'LRC - Tripoli Station', nameAr: 'الصليب الأحمر - محطة طرابلس', category: 'ngo', lat: 34.4330, lng: 35.8380, operatingHours: '24/7', verifiedBy: 'LRC', isOperational: true, lastVerified: '2026-03-23T04:00:00Z', capacity: 130, occupancy: 65 },
    // Riyadh NGOs
    { id: 'ngo-r01', name: 'Saudi Red Crescent - Riyadh HQ', nameAr: 'الهلال الأحمر السعودي - الرياض', category: 'ngo', lat: 24.7016, lng: 46.7140, phone: '+966-11-201-1111', operatingHours: '24/7', verifiedBy: 'SRCA', isOperational: true, lastVerified: '2026-03-23T10:00:00Z', capacity: 250, occupancy: 60 },
    { id: 'ngo-r02', name: 'King Salman Humanitarian Aid', nameAr: 'مركز الملك سلمان للإغاثة', category: 'ngo', lat: 24.6950, lng: 46.6850, operatingHours: '08:00-17:00', isOperational: true, lastVerified: '2026-03-23T09:00:00Z', capacity: 180, occupancy: 40 },
    { id: 'ngo-r03', name: 'UNHCR Riyadh Office', nameAr: 'مكتب المفوضية السامية - الرياض', category: 'ngo', lat: 24.6800, lng: 46.6900, operatingHours: '08:00-16:00', isOperational: true, lastVerified: '2026-03-22T12:00:00Z', capacity: 100, occupancy: 25 },
    { id: 'ngo-r04', name: 'Islamic Relief - Riyadh', nameAr: 'الإغاثة الإسلامية - الرياض', category: 'ngo', lat: 24.7500, lng: 46.6500, operatingHours: '09:00-17:00', isOperational: true, lastVerified: '2026-03-22T14:00:00Z', capacity: 150, occupancy: 35 },
    { id: 'ngo-r05', name: 'Al-Nahda Philanthropic Society', nameAr: 'جمعية النهضة النسائية', category: 'ngo', lat: 24.6700, lng: 46.7000, operatingHours: '08:00-15:00', isOperational: true, lastVerified: '2026-03-22T10:00:00Z', capacity: 80, occupancy: 50 },

    // ══════════════════════════════════════════════════════════════════
    // SHELTERS (15)
    // ══════════════════════════════════════════════════════════════════
    { id: 'shlt-001', name: 'UNESCO Palace Shelter', nameAr: 'مأوى قصر اليونسكو', nameFr: 'Abri Palais UNESCO', category: 'shelter', lat: 33.8815, lng: 35.5125, operatingHours: '24/7', verifiedBy: 'LRC', isOperational: true, lastVerified: '2026-03-23T05:00:00Z', capacity: 300, occupancy: 120 },
    { id: 'shlt-002', name: 'BIEL Emergency Shelter', nameAr: 'مأوى بيال الطارئ', category: 'shelter', lat: 33.8990, lng: 35.5210, operatingHours: '24/7', verifiedBy: 'LRC', isOperational: true, lastVerified: '2026-03-23T06:00:00Z', capacity: 500, occupancy: 480 },
    { id: 'shlt-003', name: 'Tripoli Community Shelter', nameAr: 'مأوى طرابلس المجتمعي', category: 'shelter', lat: 34.4380, lng: 35.8400, operatingHours: '24/7', verifiedBy: 'LRC', isOperational: true, lastVerified: '2026-03-22T14:00:00Z', capacity: 200, occupancy: 150 },
    { id: 'shlt-004', name: 'Saida Municipal Shelter', nameAr: 'مأوى بلدية صيدا', category: 'shelter', lat: 33.5630, lng: 35.3700, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T12:00:00Z', capacity: 180, occupancy: 60 },
    { id: 'shlt-005', name: 'Nabatieh Public Shelter', nameAr: 'مأوى النبطية العام', category: 'shelter', lat: 33.3810, lng: 35.4860, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T10:00:00Z', capacity: 120, occupancy: 118 },
    { id: 'shlt-006', name: 'Baalbek School Shelter', nameAr: 'مأوى مدرسة بعلبك', category: 'shelter', lat: 34.0080, lng: 36.2050, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-21T16:00:00Z', capacity: 100, occupancy: 90 },
    { id: 'shlt-007', name: 'Jounieh Relief Center', nameAr: 'مركز إغاثة جونيه', category: 'shelter', lat: 33.9790, lng: 35.6200, operatingHours: '24/7', verifiedBy: 'Caritas', isOperational: true, lastVerified: '2026-03-22T15:00:00Z', capacity: 150, occupancy: 45 },
    { id: 'shlt-008', name: 'Zahle Community Hall', nameAr: 'قاعة زحلة المجتمعية', category: 'shelter', lat: 33.8470, lng: 35.9070, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T11:00:00Z', capacity: 160, occupancy: 80 },
    { id: 'shlt-009', name: 'Tyre Port Shelter', nameAr: 'مأوى مرفأ صور', category: 'shelter', lat: 33.2690, lng: 35.1940, operatingHours: '24/7', verifiedBy: 'UNRWA', isOperational: true, lastVerified: '2026-03-22T08:00:00Z', capacity: 220, occupancy: 210 },
    { id: 'shlt-010', name: 'Byblos Civic Center', nameAr: 'المركز المدني - جبيل', category: 'shelter', lat: 34.1230, lng: 35.6500, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-21T14:00:00Z', capacity: 100, occupancy: 30 },
    // Riyadh Shelters
    { id: 'shlt-r01', name: 'Civil Defense Shelter - Olaya', nameAr: 'مأوى الدفاع المدني - العليا', category: 'shelter', lat: 24.6880, lng: 46.6900, operatingHours: '24/7', verifiedBy: 'SRCA', isOperational: true, lastVerified: '2026-03-23T10:00:00Z', capacity: 400, occupancy: 80 },
    { id: 'shlt-r02', name: 'Red Crescent Emergency Shelter', nameAr: 'مأوى الهلال الأحمر الطارئ', category: 'shelter', lat: 24.7050, lng: 46.7200, operatingHours: '24/7', verifiedBy: 'SRCA', isOperational: true, lastVerified: '2026-03-23T08:00:00Z', capacity: 350, occupancy: 100 },
    { id: 'shlt-r03', name: 'Al Malaz Community Shelter', nameAr: 'مأوى الملز المجتمعي', category: 'shelter', lat: 24.6550, lng: 46.7100, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T16:00:00Z', capacity: 200, occupancy: 55 },
    { id: 'shlt-r04', name: 'King Fahd Stadium Shelter', nameAr: 'مأوى استاد الملك فهد', category: 'shelter', lat: 24.7900, lng: 46.8300, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T14:00:00Z', capacity: 1000, occupancy: 200 },
    { id: 'shlt-r05', name: 'DQ Emergency Shelter', nameAr: 'مأوى الحي الدبلوماسي', category: 'shelter', lat: 24.6300, lng: 46.6450, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T12:00:00Z', capacity: 250, occupancy: 70 },

    // ══════════════════════════════════════════════════════════════════
    // WATER POINTS (15)
    // ══════════════════════════════════════════════════════════════════
    { id: 'water-001', name: 'UNICEF Water Station - Bourj Hammoud', nameAr: 'محطة يونيسيف للمياه - برج حمود', category: 'water', lat: 33.8942, lng: 35.5400, operatingHours: '06:00-20:00', isOperational: true, lastVerified: '2026-03-23T08:00:00Z' },
    { id: 'water-002', name: 'WFP Water Tanker - Dahieh', nameAr: 'صهريج مياه البرنامج - الضاحية', category: 'water', lat: 33.8520, lng: 35.5080, operatingHours: '07:00-19:00', isOperational: true, lastVerified: '2026-03-23T07:00:00Z' },
    { id: 'water-003', name: 'Municipal Well - Tripoli', nameAr: 'بئر البلدية - طرابلس', category: 'water', lat: 34.4310, lng: 35.8450, operatingHours: '06:00-18:00', isOperational: true, lastVerified: '2026-03-22T12:00:00Z' },
    { id: 'water-004', name: 'UNICEF Water Point - Saida', nameAr: 'نقطة يونيسيف للمياه - صيدا', category: 'water', lat: 33.5580, lng: 35.3720, operatingHours: '06:00-18:00', isOperational: true, lastVerified: '2026-03-22T10:00:00Z' },
    { id: 'water-005', name: 'Spring Water Station - Byblos', nameAr: 'محطة مياه النبع - جبيل', category: 'water', lat: 34.1190, lng: 35.6480, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T14:00:00Z' },
    { id: 'water-006', name: 'UNICEF Tanker - Nabatieh', nameAr: 'صهريج يونيسيف - النبطية', category: 'water', lat: 33.3800, lng: 35.4870, operatingHours: '07:00-17:00', isOperational: true, lastVerified: '2026-03-22T09:00:00Z' },
    { id: 'water-007', name: 'Community Well - Tyre', nameAr: 'بئر المجتمع - صور', category: 'water', lat: 33.2740, lng: 35.1990, operatingHours: '06:00-18:00', isOperational: true, lastVerified: '2026-03-22T11:00:00Z' },
    { id: 'water-008', name: 'Baalbek Distribution Point', nameAr: 'نقطة توزيع مياه بعلبك', category: 'water', lat: 34.0040, lng: 36.1990, operatingHours: '07:00-16:00', isOperational: true, lastVerified: '2026-03-21T15:00:00Z' },
    { id: 'water-009', name: 'Zahle River Station', nameAr: 'محطة مياه نهر زحلة', category: 'water', lat: 33.8430, lng: 35.9030, operatingHours: '06:00-20:00', isOperational: true, lastVerified: '2026-03-22T13:00:00Z' },
    { id: 'water-010', name: 'Akkar Water Tank', nameAr: 'خزان مياه عكار', category: 'water', lat: 34.5500, lng: 36.0800, operatingHours: '06:00-17:00', isOperational: true, lastVerified: '2026-03-21T08:00:00Z' },
    // Riyadh Water Points
    { id: 'water-r01', name: 'NWC Station - Olaya', nameAr: 'محطة المياه الوطنية - العليا', category: 'water', lat: 24.6960, lng: 46.6880, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-23T10:00:00Z' },
    { id: 'water-r02', name: 'Desalination Point - Exit 14', nameAr: 'نقطة تحلية - مخرج ١٤', category: 'water', lat: 24.7400, lng: 46.6600, operatingHours: '06:00-22:00', isOperational: true, lastVerified: '2026-03-23T08:00:00Z' },
    { id: 'water-r03', name: 'Civil Defense Water - Malaz', nameAr: 'مياه الدفاع المدني - الملز', category: 'water', lat: 24.6550, lng: 46.7150, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T18:00:00Z' },
    { id: 'water-r04', name: 'SRCA Water Distribution', nameAr: 'توزيع مياه الهلال الأحمر', category: 'water', lat: 24.7700, lng: 46.7300, operatingHours: '07:00-19:00', isOperational: true, lastVerified: '2026-03-22T16:00:00Z' },
    { id: 'water-r05', name: 'DQ Water Point', nameAr: 'نقطة مياه الحي الدبلوماسي', category: 'water', lat: 24.6350, lng: 46.6480, operatingHours: '06:00-20:00', isOperational: true, lastVerified: '2026-03-22T12:00:00Z' },

    // ══════════════════════════════════════════════════════════════════
    // FUEL STATIONS (15)
    // ══════════════════════════════════════════════════════════════════
    { id: 'fuel-001', name: 'IPT Station - Dora', nameAr: 'محطة IPT - الدورة', nameFr: 'Station IPT - Dora', category: 'fuel', lat: 33.8960, lng: 35.5560, operatingHours: '06:00-22:00', isOperational: true, lastVerified: '2026-03-23T08:00:00Z' },
    { id: 'fuel-002', name: 'Total Energies - Hamra', nameAr: 'توتال إنرجي - الحمرا', category: 'fuel', lat: 33.8970, lng: 35.4870, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-23T07:00:00Z' },
    { id: 'fuel-003', name: 'Medco - Jounieh', nameAr: 'ميدكو - جونيه', category: 'fuel', lat: 33.9820, lng: 35.6210, operatingHours: '06:00-22:00', isOperational: true, lastVerified: '2026-03-22T16:00:00Z' },
    { id: 'fuel-004', name: 'Coral - Tripoli', nameAr: 'كورال - طرابلس', category: 'fuel', lat: 34.4340, lng: 35.8500, operatingHours: '06:00-22:00', isOperational: true, lastVerified: '2026-03-22T14:00:00Z' },
    { id: 'fuel-005', name: 'IPT Station - Saida', nameAr: 'محطة IPT - صيدا', category: 'fuel', lat: 33.5560, lng: 35.3690, operatingHours: '06:00-21:00', isOperational: true, lastVerified: '2026-03-22T12:00:00Z' },
    { id: 'fuel-006', name: 'Total - Byblos Highway', nameAr: 'توتال - أوتوستراد جبيل', category: 'fuel', lat: 34.1180, lng: 35.6450, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T10:00:00Z' },
    { id: 'fuel-007', name: 'Medco - Zahle', nameAr: 'ميدكو - زحلة', category: 'fuel', lat: 33.8480, lng: 35.9100, operatingHours: '06:00-22:00', isOperational: true, lastVerified: '2026-03-22T09:00:00Z' },
    { id: 'fuel-008', name: 'Coral - Nabatieh', nameAr: 'كورال - النبطية', category: 'fuel', lat: 33.3820, lng: 35.4900, operatingHours: '06:00-20:00', isOperational: true, lastVerified: '2026-03-22T08:00:00Z' },
    { id: 'fuel-009', name: 'Hypco - Batroun', nameAr: 'هايبكو - البترون', category: 'fuel', lat: 34.2530, lng: 35.6550, operatingHours: '06:00-21:00', isOperational: true, lastVerified: '2026-03-21T14:00:00Z' },
    { id: 'fuel-010', name: 'IPT - Tyre Coastal', nameAr: 'IPT - صور الساحلية', category: 'fuel', lat: 33.2750, lng: 35.2000, operatingHours: '06:00-20:00', isOperational: true, lastVerified: '2026-03-22T11:00:00Z' },
    // Riyadh Fuel Stations
    { id: 'fuel-r01', name: 'Aramco Station - Olaya', nameAr: 'محطة أرامكو - العليا', category: 'fuel', lat: 24.6940, lng: 46.6920, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-23T10:00:00Z' },
    { id: 'fuel-r02', name: 'SASCO - King Fahd Road', nameAr: 'ساسكو - طريق الملك فهد', category: 'fuel', lat: 24.7200, lng: 46.6700, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-23T09:00:00Z' },
    { id: 'fuel-r03', name: 'Naft Station - Exit 5', nameAr: 'محطة نفط - مخرج ٥', category: 'fuel', lat: 24.6400, lng: 46.7100, operatingHours: '06:00-00:00', isOperational: true, lastVerified: '2026-03-22T18:00:00Z' },
    { id: 'fuel-r04', name: 'SASCO - Northern Ring', nameAr: 'ساسكو - الدائري الشمالي', category: 'fuel', lat: 24.8000, lng: 46.7500, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T16:00:00Z' },
    { id: 'fuel-r05', name: 'Aramco Station - DQ Area', nameAr: 'محطة أرامكو - الحي الدبلوماسي', category: 'fuel', lat: 24.6250, lng: 46.6500, operatingHours: '24/7', isOperational: true, lastVerified: '2026-03-22T14:00:00Z' },
  ],

  // ══════════════════════════════════════════════════════════════════
  // DANGER ZONES
  // ══════════════════════════════════════════════════════════════════
  dangerZones: [
    { id: 'dz-001', lat: 33.8580, lng: 35.5100, radiusKm: 0.5, severity: 'critical', description: 'Active shelling reported — Dahieh sector', reportedAt: '2026-03-23T12:10:00Z' },
    { id: 'dz-002', lat: 34.4370, lng: 35.8320, radiusKm: 1.2, severity: 'high', description: 'Unexploded ordnance — northern Tripoli corridor', reportedAt: '2026-03-23T08:45:00Z' },
    { id: 'dz-003', lat: 33.2700, lng: 35.2040, radiusKm: 0.8, severity: 'moderate', description: 'Road collapse — Tyre coastal road', reportedAt: '2026-03-23T04:20:00Z' },
    { id: 'dz-004', lat: 33.3789, lng: 35.4839, radiusKm: 0.6, severity: 'high', description: 'Heavy shelling — Nabatieh center', reportedAt: '2026-03-23T10:30:00Z' },
    { id: 'dz-005', lat: 34.0061, lng: 36.2021, radiusKm: 1.0, severity: 'critical', description: 'Active hostilities — Baalbek perimeter', reportedAt: '2026-03-23T11:00:00Z' },
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
export const APP_VERSION = '16.4.0';
export const APP_CODENAME = 'Offline Mesh & PWA';
export const PHASE = 16.4;

// ---------------------------------------------------------------------------
// 11. CAPACITY STATUS THRESHOLDS
// ---------------------------------------------------------------------------
export const CAPACITY_STATUS = {
  /** <70% = Green (Open) */
  OPEN_THRESHOLD: 0.7,
  /** 70-95% = Orange (Limited) */
  LIMITED_THRESHOLD: 0.95,
  /** >95% = Red (Full) */
} as const;

export function getCapacityStatus(capacity?: number, occupancy?: number): 'open' | 'limited' | 'full' | 'unknown' {
  if (capacity == null || occupancy == null || capacity === 0) return 'unknown';
  const ratio = occupancy / capacity;
  if (ratio >= CAPACITY_STATUS.LIMITED_THRESHOLD) return 'full';
  if (ratio >= CAPACITY_STATUS.OPEN_THRESHOLD) return 'limited';
  return 'open';
}

export const CAPACITY_RING_COLORS: Record<string, string> = {
  open: '#22C55E',
  limited: '#F59E0B',
  full: '#EF4444',
  unknown: '#6B7280',
};

// ---------------------------------------------------------------------------
// 12. TRANSLATION DICTIONARY — EN / AR / FR
// ---------------------------------------------------------------------------
export type TranslationKey =
  | 'appName' | 'map' | 'alerts' | 'safe' | 'settings'
  | 'hospital' | 'bakery' | 'pharmacy' | 'ngo' | 'shelter' | 'water' | 'fuel'
  | 'confirm' | 'dispute' | 'iAmSafe' | 'sos' | 'navigate' | 'call'
  | 'liveAlerts' | 'dangerZone' | 'batterySaver' | 'language' | 'theme'
  | 'darkMode' | 'lightMode' | 'gpsTracking' | 'loadedResources'
  | 'activeDangerZones' | 'communityCheckIns' | 'resourceBreakdown'
  | 'open' | 'limited' | 'full' | 'unknown' | 'disputed' | 'verifiedBy'
  | 'yourLocation' | 'accuracy' | 'cancel' | 'safestRoute'
  | 'dangerBanner' | 'checkInSent' | 'operatingHours';

export const TRANSLATIONS: Record<string, Record<TranslationKey, string>> = {
  en: {
    appName: 'GUARDIAN',
    map: 'Map', alerts: 'Alerts', safe: 'SAFE', settings: 'Settings',
    hospital: 'Hospital', bakery: 'Bakery', pharmacy: 'Pharmacy',
    ngo: 'NGO Center', shelter: 'Shelter', water: 'Water Point', fuel: 'Fuel Station',
    confirm: 'Confirm', dispute: 'Dispute', iAmSafe: 'I AM SAFE', sos: 'SOS',
    navigate: 'Navigate', call: 'Call',
    liveAlerts: 'Live Alerts', dangerZone: 'DANGER ZONE',
    batterySaver: 'Battery Saver Mode', language: 'Language', theme: 'Theme',
    darkMode: 'Dark Mode', lightMode: 'Light Mode',
    gpsTracking: 'GPS Tracking', loadedResources: 'Loaded Resources',
    activeDangerZones: 'Active Danger Zones', communityCheckIns: 'Community Check-ins',
    resourceBreakdown: 'Resource Breakdown',
    open: 'Open', limited: 'Limited', full: 'Full', unknown: 'Unknown',
    disputed: 'Disputed', verifiedBy: 'Verified by',
    yourLocation: 'Your Location', accuracy: 'Accuracy',
    cancel: 'Cancel', safestRoute: 'Safest Route',
    dangerBanner: 'DANGER — You are inside an active zone!',
    checkInSent: 'Check-in sent! Stay safe.',
    operatingHours: 'Hours',
  },
  ar: {
    appName: 'الحارس',
    map: 'خريطة', alerts: 'تنبيهات', safe: 'آمن', settings: 'إعدادات',
    hospital: 'مستشفى', bakery: 'مخبز', pharmacy: 'صيدلية',
    ngo: 'مركز إغاثة', shelter: 'مأوى', water: 'نقطة مياه', fuel: 'محطة وقود',
    confirm: 'تأكيد', dispute: 'اعتراض', iAmSafe: 'أنا بأمان', sos: 'طوارئ',
    navigate: 'اتجاهات', call: 'اتصل',
    liveAlerts: 'تنبيهات مباشرة', dangerZone: 'منطقة خطرة',
    batterySaver: 'وضع توفير الطاقة', language: 'اللغة', theme: 'المظهر',
    darkMode: 'الوضع الداكن', lightMode: 'الوضع الفاتح',
    gpsTracking: 'تتبع GPS', loadedResources: 'الموارد المحملة',
    activeDangerZones: 'مناطق الخطر النشطة', communityCheckIns: 'تسجيلات المجتمع',
    resourceBreakdown: 'تفاصيل الموارد',
    open: 'مفتوح', limited: 'محدود', full: 'ممتلئ', unknown: 'غير معروف',
    disputed: 'متنازع عليه', verifiedBy: 'تم التحقق من',
    yourLocation: 'موقعك', accuracy: 'الدقة',
    cancel: 'إلغاء', safestRoute: 'أسلم طريق',
    dangerBanner: 'خطر — أنت داخل منطقة نشطة!',
    checkInSent: 'تم تسجيل الوصول! ابقَ آمناً.',
    operatingHours: 'الأوقات',
  },
  fr: {
    appName: 'GUARDIAN',
    map: 'Carte', alerts: 'Alertes', safe: 'SÛR', settings: 'Paramètres',
    hospital: 'Hôpital', bakery: 'Boulangerie', pharmacy: 'Pharmacie',
    ngo: 'Centre ONG', shelter: 'Abri', water: "Point d'eau", fuel: 'Station essence',
    confirm: 'Confirmer', dispute: 'Contester', iAmSafe: 'JE SUIS EN SÉCURITÉ', sos: 'SOS',
    navigate: 'Naviguer', call: 'Appeler',
    liveAlerts: 'Alertes en direct', dangerZone: 'ZONE DANGEREUSE',
    batterySaver: 'Mode économie', language: 'Langue', theme: 'Thème',
    darkMode: 'Mode sombre', lightMode: 'Mode clair',
    gpsTracking: 'Suivi GPS', loadedResources: 'Ressources chargées',
    activeDangerZones: 'Zones de danger actives', communityCheckIns: 'Signalements communautaires',
    resourceBreakdown: 'Répartition des ressources',
    open: 'Ouvert', limited: 'Limité', full: 'Complet', unknown: 'Inconnu',
    disputed: 'Contesté', verifiedBy: 'Vérifié par',
    yourLocation: 'Votre position', accuracy: 'Précision',
    cancel: 'Annuler', safestRoute: 'Itinéraire le plus sûr',
    dangerBanner: 'DANGER — Vous êtes dans une zone active !',
    checkInSent: 'Signalement envoyé ! Restez en sécurité.',
    operatingHours: 'Horaires',
  },
};
