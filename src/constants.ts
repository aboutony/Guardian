// constants.ts — Guardian Lebanon — Phase 12: Family Safety Circles
// All static data, category arrays, translations, map config

export type Language = 'en' | 'ar' | 'fr';
export type Theme = 'dark' | 'light';

// ─── Map Config ──────────────────────────────────────────────────────────────
export const LEBANON_CENTER: [number, number] = [33.8547, 35.8623];
export const INITIAL_CENTER = LEBANON_CENTER;
export const DEFAULT_ZOOM = 8;
export const SAFETY_BUFFER_METERS = 500;
export const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';
export const MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const MAP_TILE_URL_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const MAP_TILE_URL_LIGHT = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const LEBANON_BOUNDS: [[number, number], [number, number]] = [[32.8, 34.8], [34.8, 36.7]];

// ─── Marker Type ─────────────────────────────────────────────────────────────
export interface MarkerPoint {
  id: string;
  name: string;
  coordinates: [number, number];
  phone?: string;
  status?: string;
  message?: string;
  hours?: string;
  aidType?: string;
  verified?: boolean;
  verificationCount?: number;
  roadOpen?: boolean;
  // Phase 8: Dynamic Shelter Intelligence
  capacity?: number;
  occupancy?: number;
  lastUpdated?: number;
  // Phase 9: Multi-User Verification
  trustScore?: number;
  disputeCount?: number;
  // Phase 11: Heatmap weight — influences risk intensity (0.0 - 1.0)
  weight?: number;
}

// ─── Phase 12: Family Safety Circles ─────────────────────────────────────────
export interface FamilyMember {
  id: string;
  name: string;
  coordinates: [number, number];
  lastSeen: number;  // timestamp
  status: 'safe' | 'unknown' | 'danger';
  emoji: string;
}

export const MOCK_FAMILY: FamilyMember[] = [
  { id: 'fam1', name: 'Nour', coordinates: [33.892, 35.508], lastSeen: Date.now() - 600000, status: 'safe', emoji: '👩' },
  { id: 'fam2', name: 'Karim', coordinates: [33.855, 35.502], lastSeen: Date.now() - 1800000, status: 'unknown', emoji: '👨' },
  { id: 'fam3', name: 'Teta Layla', coordinates: [33.380, 35.486], lastSeen: Date.now() - 7200000, status: 'unknown', emoji: '👵' },
];

export const PRIVACY_POLICY: Record<Language, string> = {
  en: 'Family location data is stored locally on your device and is never shared with third parties. Circle codes are end-to-end private.',
  ar: 'بيانات موقع العائلة مخزّنة محلياً على جهازك ولا تُشارَك مع أطراف ثالثة. رموز الدائرة مشفّرة بالكامل.',
  fr: "Les données de localisation familiale sont stockées localement sur votre appareil et ne sont jamais partagées avec des tiers. Les codes de cercle sont privés de bout en bout.",
};

// ─── Verification Thresholds ─────────────────────────────────────────────────
export const DISPUTE_THRESHOLD = 5;

// ─── Shelter Status Thresholds ───────────────────────────────────────────────
export const SHELTER_STATUS_THRESHOLDS = {
  open: 0.70, limited: 0.95, full: 1.0,
} as const;

export function getShelterStatus(occupancy: number, capacity: number): { label: string; color: string; percent: number } {
  if (capacity <= 0) return { label: 'unknown', color: '#6b7280', percent: 0 };
  const pct = Math.min(occupancy / capacity, 1);
  if (pct <= SHELTER_STATUS_THRESHOLDS.open) return { label: 'open', color: '#22c55e', percent: pct };
  if (pct <= SHELTER_STATUS_THRESHOLDS.limited) return { label: 'limited', color: '#f97316', percent: pct };
  return { label: 'full', color: '#ef4444', percent: pct };
}

// ─── Browser Language Auto-Detect ────────────────────────────────────────────
export function detectBrowserLanguage(): Language {
  try {
    const nav = navigator.language?.toLowerCase() || '';
    if (nav.startsWith('ar')) return 'ar';
    if (nav.startsWith('fr')) return 'fr';
  } catch {}
  return 'en';
}

// ═══════════════════════════════════════════════════════════════════════════════
//  7 CATEGORY ARRAYS
// ═══════════════════════════════════════════════════════════════════════════════

export const HOSPITALS: MarkerPoint[] = [
  { id: 'h1', name: 'AUH Beirut', coordinates: [33.898, 35.481], phone: '140', status: 'open' },
  { id: 'h2', name: 'Nabatieh Govt Hospital', coordinates: [33.378, 35.484], phone: '140', status: 'limited' },
  { id: 'h3', name: 'Hotel Dieu de France', coordinates: [33.882, 35.518], phone: '140', status: 'open' },
  { id: 'h4', name: 'Rafik Hariri University Hospital', coordinates: [33.831, 35.488], phone: '140', status: 'open' },
  { id: 'h5', name: 'Saint George Hospital', coordinates: [33.895, 35.509], phone: '140', status: 'open' },
  { id: 'h6', name: 'Hammoud Hospital Saida', coordinates: [33.559, 35.376], phone: '140', status: 'open' },
  { id: 'h7', name: 'Nini Hospital Tripoli', coordinates: [34.438, 35.832], phone: '140', status: 'open' },
  { id: 'h8', name: 'Baalbek Governmental Hospital', coordinates: [34.005, 36.198], phone: '140', status: 'limited' },
  { id: 'h9', name: 'Jabal Amel Hospital Tyre', coordinates: [33.275, 35.200], phone: '140', status: 'open' },
  { id: 'h10', name: 'Mount Lebanon Hospital', coordinates: [33.890, 35.545], phone: '140', status: 'open' },
];

// Phase 11: AIRSTRIKES now include `weight` for heatmap intensity
export const AIRSTRIKES: MarkerPoint[] = [
  { id: 'a1', name: 'Haret Hreik Strike', coordinates: [33.848, 35.505], message: 'Confirmed Air Strike - Avoid Area', verified: true, verificationCount: 12, trustScore: 92, disputeCount: 1, weight: 0.95 },
  { id: 'a2', name: 'Tyre Coast Shelling', coordinates: [33.271, 35.196], message: 'Heavy Shelling Reported', verified: true, verificationCount: 8, trustScore: 78, disputeCount: 2, weight: 0.80 },
  { id: 'a3', name: 'Baalbek Center Evacuation', coordinates: [34.006, 36.202], message: 'Immediate Evacuation Order', verified: true, verificationCount: 15, trustScore: 95, disputeCount: 0, weight: 1.0 },
  { id: 'a4', name: 'Dahieh Southern Suburb', coordinates: [33.838, 35.502], message: 'Multiple strikes confirmed', verified: true, verificationCount: 20, trustScore: 98, disputeCount: 0, weight: 1.0 },
  { id: 'a5', name: 'Nabatieh Market Shelling', coordinates: [33.376, 35.480], message: 'Market area shelled', verified: false, verificationCount: 3, trustScore: 35, disputeCount: 4, weight: 0.40 },
];

export const BAKERIES: MarkerPoint[] = [
  { id: 'b1', name: 'Wooden Bakery Saida', coordinates: [33.561, 35.372], status: 'open', hours: '06:00-20:00' },
  { id: 'b2', name: "Sami's Bakery Beirut", coordinates: [33.890, 35.505], status: 'open', hours: '05:00-22:00' },
  { id: 'b3', name: 'Tripoli Traditional Bakery', coordinates: [34.432, 35.840], status: 'open', hours: '06:00-18:00' },
  { id: 'b4', name: 'Jounieh Fresh Bread', coordinates: [33.978, 35.618], status: 'open', hours: '07:00-19:00' },
  { id: 'b5', name: 'Zahle City Bakery', coordinates: [33.845, 35.905], status: 'limited', hours: '08:00-14:00' },
];

export const PHARMACIES: MarkerPoint[] = [
  { id: 'p1', name: 'Mazloum Pharmacy Tripoli', coordinates: [34.436, 35.835], status: 'open', hours: '08:00-23:00' },
  { id: 'p2', name: 'Benta Pharmacy Beirut', coordinates: [33.885, 35.512], status: 'open', hours: '24/7' },
  { id: 'p3', name: 'Abi Rashid Pharmacy Saida', coordinates: [33.558, 35.370], status: 'open', hours: '08:00-22:00' },
  { id: 'p4', name: 'Mounir Pharmacy Jounieh', coordinates: [33.980, 35.620], status: 'open', hours: '09:00-21:00' },
  { id: 'p5', name: 'Akkar Medical Pharmacy', coordinates: [34.540, 36.075], status: 'limited', hours: '10:00-16:00' },
];

export const FUEL_STATIONS: MarkerPoint[] = [
  { id: 'f1', name: 'Medco Jounieh', coordinates: [33.982, 35.621], status: 'open' },
  { id: 'f2', name: 'Total Beirut Cola', coordinates: [33.870, 35.495], status: 'open' },
  { id: 'f3', name: 'IPT Tripoli', coordinates: [34.440, 35.838], status: 'open' },
  { id: 'f4', name: 'Coral Saida Highway', coordinates: [33.555, 35.365], status: 'limited' },
  { id: 'f5', name: 'Medco Zahle', coordinates: [33.850, 35.910], status: 'open' },
];

export const NGOS: MarkerPoint[] = [
  { id: 'lrc1', name: 'LRC Health Center - Baouchriyeh', coordinates: [33.885, 35.552], status: 'open', aidType: 'medical', hours: '24/7', capacity: 120, occupancy: 45, lastUpdated: Date.now() - 900000 },
  { id: 'lrc2', name: 'LRC Health Center - Nabatiyeh', coordinates: [33.375, 35.482], status: 'open', aidType: 'medical', hours: '24/7', capacity: 80, occupancy: 62, lastUpdated: Date.now() - 1800000 },
  { id: 'lrc3', name: 'LRC Health Center - Saida', coordinates: [33.565, 35.375], status: 'open', aidType: 'medical', hours: '24/7', capacity: 100, occupancy: 38, lastUpdated: Date.now() - 600000 },
  { id: 'amel1', name: 'Amel Center - Haret Hreik', coordinates: [33.845, 35.502], status: 'limited', aidType: 'multi', hours: '08:00-16:00', capacity: 200, occupancy: 185, lastUpdated: Date.now() - 300000 },
  { id: 'amel2', name: 'Amel Center - Tyre', coordinates: [33.272, 35.203], status: 'open', aidType: 'multi', hours: '08:00-16:00', capacity: 150, occupancy: 67, lastUpdated: Date.now() - 2400000 },
  { id: 'caritas1', name: 'Caritas Center - Akkar', coordinates: [34.545, 36.078], status: 'open', aidType: 'food', hours: '09:00-17:00', capacity: 60, occupancy: 22, lastUpdated: Date.now() - 3600000 },
  { id: 'caritas2', name: 'Caritas Center - Zahle', coordinates: [33.848, 35.902], status: 'open', aidType: 'shelter', hours: '09:00-17:00', capacity: 180, occupancy: 95, lastUpdated: Date.now() - 1200000 },
  { id: 'unrwa1', name: 'UNRWA Shelter - Siblin', coordinates: [33.625, 35.452], status: 'open', aidType: 'shelter', hours: '24/7', capacity: 300, occupancy: 240, lastUpdated: Date.now() - 500000 },
  { id: 'unrwa2', name: 'UNRWA Shelter - Nahr el-Bared', coordinates: [34.512, 35.965], status: 'limited', aidType: 'shelter', hours: '24/7', capacity: 250, occupancy: 242, lastUpdated: Date.now() - 180000 },
  { id: 'wfp1', name: 'WFP Distribution - Tyre', coordinates: [33.275, 35.205], status: 'open', hours: '08:00-14:00', capacity: 500, occupancy: 180, lastUpdated: Date.now() - 7200000 },
  { id: 'wfp2', name: 'Water Tanker - Dahieh', coordinates: [33.852, 35.508], status: 'open', hours: '07:00-19:00', capacity: 400, occupancy: 310, lastUpdated: Date.now() - 4500000 },
  { id: 'ck1', name: 'Community Kitchen - Tripoli', coordinates: [34.438, 35.838], status: 'open', hours: '12:00-15:00', capacity: 200, occupancy: 130, lastUpdated: Date.now() - 5400000 },
];

export const ROAD_BLOCKS: MarkerPoint[] = [
  { id: 'rc1', name: 'Qasmiyeh Bridge', coordinates: [33.318, 35.265], message: 'Bridge closed - structural damage', verified: true, verificationCount: 9, roadOpen: false, trustScore: 88, disputeCount: 1, weight: 0.70 },
  { id: 'rc2', name: 'Jiyyeh Highway', coordinates: [33.669, 35.408], message: 'Highway blocked - shelling debris', verified: true, verificationCount: 6, roadOpen: false, trustScore: 72, disputeCount: 3, weight: 0.60 },
  { id: 'rc3', name: 'Damour Tunnel', coordinates: [33.733, 35.450], message: 'Tunnel partially collapsed', verified: false, verificationCount: 2, roadOpen: false, trustScore: 28, disputeCount: 7, weight: 0.30 },
  { id: 'rc4', name: 'Litani Bridge', coordinates: [33.352, 35.485], message: 'Bridge closed by ISF', verified: true, verificationCount: 11, roadOpen: false, trustScore: 91, disputeCount: 0, weight: 0.75 },
  { id: 'rc5', name: 'Saida North Road', coordinates: [33.572, 35.381], message: 'Road blocked - use alternate', verified: false, verificationCount: 1, roadOpen: false, trustScore: 15, disputeCount: 6, weight: 0.20 },
];

// ─── Phase 11: Seismic / Historical Risk Data ────────────────────────────────
// Supplementary heatmap points covering known risk corridors not covered by active strikes
export interface SeismicPoint {
  coordinates: [number, number];
  weight: number; // 0.0 - 1.0 intensity
  label: string;
}

export const SEISMIC_DATA: SeismicPoint[] = [
  { coordinates: [33.860, 35.510], weight: 0.85, label: 'Dahieh Corridor' },
  { coordinates: [33.845, 35.498], weight: 0.75, label: 'Southern Suburb Buffer' },
  { coordinates: [33.280, 35.210], weight: 0.65, label: 'Tyre Coast Risk Zone' },
  { coordinates: [33.370, 35.475], weight: 0.55, label: 'Nabatieh Perimeter' },
  { coordinates: [34.010, 36.210], weight: 0.70, label: 'Baalbek Eastern Corridor' },
  { coordinates: [33.680, 35.420], weight: 0.50, label: 'Jiyyeh–Damour Strip' },
  { coordinates: [33.340, 35.280], weight: 0.45, label: 'Qasmiyeh Approach' },
  { coordinates: [33.830, 35.510], weight: 0.90, label: 'Haret Hreik Epicenter' },
  { coordinates: [33.565, 35.385], weight: 0.40, label: 'Saida Buffer' },
  { coordinates: [33.850, 35.495], weight: 0.80, label: 'Dahieh West' },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  UNIFIED DATA ENGINE — keys MUST match FILTER_CATEGORIES ids
// ═══════════════════════════════════════════════════════════════════════════════
export const GUARDIAN_DATA: Record<string, MarkerPoint[]> = {
  airstrikes: AIRSTRIKES, hospitals: HOSPITALS, bakeries: BAKERIES,
  pharmacies: PHARMACIES, fuel: FUEL_STATIONS, ngo: NGOS, roads: ROAD_BLOCKS,
};

export const ALL_MARKERS: MarkerPoint[] = [
  ...HOSPITALS, ...AIRSTRIKES, ...BAKERIES, ...PHARMACIES,
  ...FUEL_STATIONS, ...NGOS, ...ROAD_BLOCKS,
];

// ─── Filter Categories — IDs must match GUARDIAN_DATA keys ───────────────────
export const FILTER_CATEGORIES = [
  { id: 'all',         icon: '📍', en: 'All',         ar: 'الكل',       fr: 'Tout',          markerIcon: 'all' },
  { id: 'airstrikes',  icon: '💥', en: 'Airstrikes',  ar: 'غارات',      fr: 'Frappes',       markerIcon: 'airstrike' },
  { id: 'hospitals',   icon: '🏥', en: 'Hospitals',   ar: 'مستشفيات',   fr: 'Hôpitaux',      markerIcon: 'hospital' },
  { id: 'bakeries',    icon: '🍞', en: 'Bakeries',    ar: 'مخابز',      fr: 'Boulangeries',  markerIcon: 'bakery' },
  { id: 'pharmacies',  icon: '💊', en: 'Pharmacies',  ar: 'صيدليات',    fr: 'Pharmacies',    markerIcon: 'pharmacy' },
  { id: 'fuel',        icon: '⛽', en: 'Fuel',        ar: 'وقود',       fr: 'Carburant',     markerIcon: 'fuel' },
  { id: 'ngo',         icon: '🤝', en: 'NGOs',        ar: 'منظمات',     fr: 'ONGs',          markerIcon: 'ngo' },
  { id: 'roads',       icon: '🚧', en: 'Roads',       ar: 'طرقات',      fr: 'Routes',        markerIcon: 'road_block' },
];

// ─── Icon color mapping per category ─────────────────────────────────────────
export const MARKER_COLORS: Record<string, string> = {
  airstrike: '#dc2626', hospital: '#2563eb', bakery: '#a16207', pharmacy: '#7c3aed',
  fuel: '#059669', ngo: '#0891b2', road_block: '#ea580c', user: '#3b82f6',
  all: '#6b7280', safe_pulse: '#22c55e', family_member: '#8b5cf6',
};

export const MARKER_EMOJI: Record<string, string> = {
  airstrike: '💥', hospital: '🏥', bakery: '🍞', pharmacy: '💊',
  fuel: '⛽', ngo: '🤝', road_block: '🚧', user: '📍',
  all: '📍', safe_pulse: '💚', family_member: '👨‍👩‍👧',
};

// ─── District Coords ─────────────────────────────────────────────────────────
export const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  dahieh: [33.855, 35.505], beirut: [33.890, 35.503], tripoli: [34.433, 35.833],
  saida: [33.559, 35.371], tyre: [33.271, 35.196], nabatieh: [33.378, 35.484],
  baalbek: [34.006, 36.202], jounieh: [33.981, 35.617], byblos: [34.123, 35.652],
  zahle: [33.844, 35.907],
};
export const DISTRICT_COORDS = DISTRICT_COORDINATES;

export const DISTRICT_NAMES: Record<string, { en: string; ar: string; fr: string }> = {
  dahieh: { en: 'Dahieh', ar: 'الضاحية', fr: 'Dahieh' },
  beirut: { en: 'Beirut', ar: 'بيروت', fr: 'Beyrouth' },
  tripoli: { en: 'Tripoli', ar: 'طرابلس', fr: 'Tripoli' },
  saida: { en: 'Saida', ar: 'صيدا', fr: 'Saïda' },
  tyre: { en: 'Tyre', ar: 'صور', fr: 'Tyr' },
  nabatieh: { en: 'Nabatieh', ar: 'النبطية', fr: 'Nabatieh' },
  baalbek: { en: 'Baalbek', ar: 'بعلبك', fr: 'Baalbek' },
  jounieh: { en: 'Jounieh', ar: 'جونية', fr: 'Jounieh' },
  byblos: { en: 'Byblos', ar: 'جبيل', fr: 'Byblos' },
  zahle: { en: 'Zahle', ar: 'زحلة', fr: 'Zahlé' },
};

// ─── Emergency Contacts — Localized names ────────────────────────────────────
export const EMERGENCY_CONTACTS = [
  { number: '140',  icon: '🏥', color: '#2563eb', en: 'Hospitals',     ar: 'مستشفيات',    fr: 'Hôpitaux' },
  { number: '125',  icon: '🚒', color: '#dc2626', en: 'Civil Defense', ar: 'الدفاع المدني', fr: 'Défense civile' },
  { number: '1760', icon: '⛑️', color: '#ef4444', en: 'Red Cross',     ar: 'الصليب الأحمر', fr: 'Croix-Rouge' },
  { number: '112',  icon: '🚔', color: '#3b82f6', en: 'ISF Police',    ar: 'قوى الأمن',    fr: 'Police FSI' },
  { number: '1701', icon: '🪖', color: '#16a34a', en: 'Army',          ar: 'الجيش',        fr: 'Armée' },
  { number: '175',  icon: '🔥', color: '#f97316', en: 'Fire Dept',     ar: 'الإطفاء',      fr: 'Pompiers' },
];

// ─── Danger Types ────────────────────────────────────────────────────────────
export const DANGER_TYPES = [
  { type: 'airstrike',    en: 'Airstrike',   ar: 'غارة جوية',  fr: 'Frappe aérienne', icon: '💥' },
  { type: 'road_closure', en: 'Road Closed',  ar: 'طريق مغلق',  fr: 'Route fermée',    icon: '🚧' },
  { type: 'shelling',     en: 'Shelling',     ar: 'قصف',        fr: 'Bombardement',    icon: '💣' },
  { type: 'sniper',       en: 'Sniper Zone',  ar: 'منطقة قنص',  fr: 'Zone sniper',     icon: '🎯' },
  { type: 'flood',        en: 'Flood',        ar: 'فيضان',      fr: 'Inondation',      icon: '🌊' },
  { type: 'fire',         en: 'Fire',         ar: 'حريق',       fr: 'Incendie',        icon: '🔥' },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  TRANSLATIONS — Phase 11: Predictive Danger Heatmaps
// ═══════════════════════════════════════════════════════════════════════════════
export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // ── Navigation ─────────────────────────────
    appName: 'GUARDIAN',
    searchPlaceholder: 'Search village, city or address...',
    safestPath: 'Safest Path',
    reportDanger: 'Report Danger',
    liveFeed: 'Live Feed',
    emergency: 'EMERGENCY',
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    close: 'Close',
    // ── Status ─────────────────────────────────
    open: '🟢 Open',
    closed: '🔴 Closed',
    blocked: '🔴 Blocked',
    lowBandwidth: 'Low Bandwidth',
    lowBandwidthActive: '📡 Low BW',
    lowPower: 'Low Power',
    // ── Route ──────────────────────────────────
    from: 'From',
    to: 'To',
    calculate: 'Calculate Route',
    calculating: 'Calculating...',
    routeFound: 'Safe path found',
    routeError: '⚠️ Route calculation error',
    dangerAvoided: 'danger zones avoided',
    minutes: 'min',
    // ── Report ─────────────────────────────────
    reportType: 'Report Type',
    details: 'Details',
    submit: 'Submit Report',
    submitted: '✅ Report submitted',
    userReport: 'User Report',
    // ── Social ─────────────────────────────────
    verified: '✅ Verified',
    community: 'Community',
    votes: 'votes',
    shareLocation: 'Your Location',
    shareQR: 'Share Location QR',
    iAmSafe: '✅ I Am Safe',
    markedSafe: '✅ Marked safe!',
    iAmSafeDesc: 'Let your community know you are safe',
    safeIn: 'Safe in',
    safeNow: 'Mark Safe',
    selectDistrict: 'Select District',
    communityPulse: 'Community Pulse',
    recentSafe: 'recent safety check-ins',
    communityTab: 'Community',
    communityCheckIn: 'is SAFE in',
    noCheckIns: 'No community check-ins yet',
    safeLabel: 'safe',
    callNow: 'Call Now',
    sosTitle: 'Emergency Contacts',
    // ── Feed ───────────────────────────────────
    feedAll: 'All',
    feedAirstrikes: 'Strikes',
    feedRoads: 'Roads',
    // ── Shelter (Phase 8) ──────────────────────
    shelterCapacity: 'Current Capacity',
    shelterFull: 'FULL',
    shelterLimited: 'Limited',
    shelterOpen: 'Available',
    reportStatus: 'Report Status',
    occupancy: 'Occupancy',
    lastUpdate: 'Last update',
    stillSpace: 'Still has space',
    almostFull: 'Almost full',
    // ── Verification (Phase 9) ─────────────────
    confirmReport: 'Confirm',
    disputeReport: 'Dispute',
    unverified: '⚠️ UNVERIFIED',
    trustScore: 'Trust Score',
    contributionPoint: '⭐ Contribution Points +1',
    disputeRecorded: '❌ Dispute recorded',
    confirmations: 'confirmations',
    disputes: 'disputes',
    // ── Phase 10 ──────────────────────────────
    autoDetected: 'Language auto-detected',
    // ── Phase 11: Heatmap ─────────────────────
    riskHeatmap: 'Risk Heatmap',
    heatmapActive: '🔥 Heatmap active',
    heatmapOff: 'Heatmap off',
    // ── Phase 12: Family Safety Circles ────────
    familySafety: 'Family',
    familyCircle: 'Family Safety Circle',
    familyMembers: 'Members',
    joinCircle: 'Join Circle',
    createCircle: 'Create Circle',
    circleCode: 'Circle Code',
    enterCode: 'Enter 6-digit code',
    joinSuccess: '✅ Joined family circle!',
    createSuccess: '✅ Circle created!',
    lastSeen: 'Last seen',
    memberSafe: '✅ Safe',
    memberUnknown: '❓ Unknown',
    memberDanger: '🚨 In Danger',
    privacyNote: 'Privacy',
  },
  ar: {
    appName: 'GUARDIAN',
    searchPlaceholder: 'ابحث عن قرية، مدينة أو عنوان...',
    safestPath: 'أسلم طريق',
    reportDanger: 'بلّغ عن خطر',
    liveFeed: 'بث مباشر',
    emergency: 'طوارئ',
    settings: 'الإعدادات',
    language: 'اللغة',
    theme: 'المظهر',
    dark: 'داكن',
    light: 'فاتح',
    close: 'إغلاق',
    open: '🟢 مفتوح',
    closed: '🔴 مغلق',
    blocked: '🔴 مسدود',
    lowBandwidth: 'نطاق ترددي منخفض',
    lowBandwidthActive: '📡 نطاق منخفض',
    lowPower: 'طاقة منخفضة',
    from: 'من',
    to: 'إلى',
    calculate: 'احسب المسار',
    calculating: 'جارٍ الحساب...',
    routeFound: 'تم إيجاد مسار آمن',
    routeError: '⚠️ خطأ في حساب المسار',
    dangerAvoided: 'مناطق خطر تم تجنبها',
    minutes: 'دق',
    reportType: 'نوع البلاغ',
    details: 'تفاصيل',
    submit: 'إرسال البلاغ',
    submitted: '✅ تم الإرسال',
    userReport: 'بلاغ مستخدم',
    verified: '✅ موثّق',
    community: 'مجتمع',
    votes: 'أصوات',
    shareLocation: 'موقعك',
    shareQR: 'مشاركة QR',
    iAmSafe: '✅ أنا بأمان',
    markedSafe: '✅ تم التأشير',
    iAmSafeDesc: 'أخبر مجتمعك أنك بأمان',
    safeIn: 'بأمان في',
    safeNow: 'تأشير آمن',
    selectDistrict: 'اختر المنطقة',
    communityPulse: 'نبض المجتمع',
    recentSafe: 'تأشيرات أمان حديثة',
    communityTab: 'مجتمع',
    communityCheckIn: 'بأمان في',
    noCheckIns: 'لا توجد تأشيرات أمان بعد',
    safeLabel: 'آمن',
    callNow: 'اتصل الآن',
    sosTitle: 'أرقام الطوارئ',
    feedAll: 'الكل',
    feedAirstrikes: 'غارات',
    feedRoads: 'طرق',
    shelterCapacity: 'السعة الحالية',
    shelterFull: 'ممتلئ',
    shelterLimited: 'محدود',
    shelterOpen: 'متاح',
    reportStatus: 'بلّغ عن الحالة',
    occupancy: 'الإشغال',
    lastUpdate: 'آخر تحديث',
    stillSpace: 'لا يزال متاحاً',
    almostFull: 'شبه ممتلئ',
    confirmReport: 'تأكيد',
    disputeReport: 'اعتراض',
    unverified: '⚠️ غير موثّق',
    trustScore: 'مؤشر الثقة',
    contributionPoint: '⭐ نقاط المساهمة +1',
    disputeRecorded: '❌ تم تسجيل الاعتراض',
    confirmations: 'تأكيدات',
    disputes: 'اعتراضات',
    autoDetected: 'تم كشف اللغة تلقائياً',
    riskHeatmap: 'خريطة المخاطر',
    heatmapActive: '🔥 خريطة الحرارة نشطة',
    heatmapOff: 'إيقاف خريطة الحرارة',
    familySafety: 'العائلة',
    familyCircle: 'دائرة أمان العائلة',
    familyMembers: 'الأعضاء',
    joinCircle: 'انضم إلى دائرة',
    createCircle: 'أنشئ دائرة',
    circleCode: 'رمز الدائرة',
    enterCode: 'أدخل الرمز المكون من 6 أرقام',
    joinSuccess: '✅ انضممت إلى دائرة العائلة!',
    createSuccess: '✅ تم إنشاء الدائرة!',
    lastSeen: 'آخر ظهور',
    memberSafe: '✅ بأمان',
    memberUnknown: '❓ غير معروف',
    memberDanger: '🚨 في خطر',
    privacyNote: 'الخصوصية',
  },
  fr: {
    appName: 'GUARDIAN',
    searchPlaceholder: 'Chercher village, ville ou adresse...',
    safestPath: 'Chemin sûr',
    reportDanger: 'Signaler Danger',
    liveFeed: 'Flux en direct',
    emergency: 'URGENCE',
    settings: 'Paramètres',
    language: 'Langue',
    theme: 'Thème',
    dark: 'Sombre',
    light: 'Clair',
    close: 'Fermer',
    open: '🟢 Ouvert',
    closed: '🔴 Fermé',
    blocked: '🔴 Bloqué',
    lowBandwidth: 'Faible débit',
    lowBandwidthActive: '📡 Bas débit',
    lowPower: 'Faible conso',
    from: 'De',
    to: 'À',
    calculate: 'Calculer',
    calculating: 'Calcul...',
    routeFound: 'Chemin sûr trouvé',
    routeError: '⚠️ Erreur de calcul',
    dangerAvoided: 'zones de danger évitées',
    minutes: 'min',
    reportType: 'Type de rapport',
    details: 'Détails',
    submit: 'Envoyer',
    submitted: '✅ Envoyé',
    userReport: 'Rapport utilisateur',
    verified: '✅ Vérifié',
    community: 'Communauté',
    votes: 'votes',
    shareLocation: 'Votre position',
    shareQR: 'Partager QR',
    iAmSafe: '✅ Je suis en sécurité',
    markedSafe: '✅ Marqué!',
    iAmSafeDesc: 'Informez votre communauté que vous êtes en sécurité',
    safeIn: 'En sécurité à',
    safeNow: 'Marquer sûr',
    selectDistrict: 'Choisir district',
    communityPulse: 'Pouls communautaire',
    recentSafe: 'check-ins récents',
    communityTab: 'Communauté',
    communityCheckIn: 'est EN SÉCURITÉ à',
    noCheckIns: 'Aucun check-in communautaire',
    safeLabel: 'sûr',
    callNow: 'Appeler',
    sosTitle: "Contacts d'urgence",
    feedAll: 'Tout',
    feedAirstrikes: 'Frappes',
    feedRoads: 'Routes',
    shelterCapacity: 'Capacité actuelle',
    shelterFull: 'COMPLET',
    shelterLimited: 'Limité',
    shelterOpen: 'Disponible',
    reportStatus: 'Signaler état',
    occupancy: 'Occupation',
    lastUpdate: 'Dernière MAJ',
    stillSpace: 'Encore de la place',
    almostFull: 'Presque plein',
    confirmReport: 'Confirmer',
    disputeReport: 'Contester',
    unverified: '⚠️ NON VÉRIFIÉ',
    trustScore: 'Score de confiance',
    contributionPoint: '⭐ Points de contribution +1',
    disputeRecorded: '❌ Contestation enregistrée',
    confirmations: 'confirmations',
    disputes: 'contestations',
    autoDetected: 'Langue auto-détectée',
    riskHeatmap: 'Carte de risque',
    heatmapActive: '🔥 Carte thermique active',
    heatmapOff: 'Carte thermique désactivée',
    familySafety: 'Famille',
    familyCircle: 'Cercle de sécurité familial',
    familyMembers: 'Membres',
    joinCircle: 'Rejoindre un cercle',
    createCircle: 'Créer un cercle',
    circleCode: 'Code du cercle',
    enterCode: 'Entrez un code à 6 chiffres',
    joinSuccess: '✅ Cercle familial rejoint!',
    createSuccess: '✅ Cercle créé!',
    lastSeen: 'Vu',
    memberSafe: '✅ En sécurité',
    memberUnknown: '❓ Inconnu',
    memberDanger: '🚨 En danger',
    privacyNote: 'Confidentialité',
  },
};
