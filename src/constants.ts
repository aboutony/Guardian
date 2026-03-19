// constants.ts — Guardian Lebanon — Single Source of Truth
// All static data: translations, map config, category arrays, emergency contacts

// ─── Types ───────────────────────────────────────────────────────────────────
export type Language = 'en' | 'ar' | 'fr';
export type Theme = 'dark' | 'light';

// ─── Map Defaults ────────────────────────────────────────────────────────────
export const LEBANON_CENTER: [number, number] = [33.8547, 35.8623];
export const INITIAL_CENTER = LEBANON_CENTER;
export const DEFAULT_ZOOM = 8;
export const SAFETY_BUFFER_METERS = 500;
export const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

// ─── Tile URLs ───────────────────────────────────────────────────────────────
export const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MAP_TILE_URL_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const MAP_TILE_URL_LIGHT = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// ─── Bounding Box ────────────────────────────────────────────────────────────
export const LEBANON_BOUNDS: [[number, number], [number, number]] = [
  [32.8, 34.8],
  [34.8, 36.7],
];

// ─── Marker Data Types ───────────────────────────────────────────────────────
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
}

// ═════════════════════════════════════════════════════════════════════════════
//  CATEGORY ARRAYS — one per filter button
// ═════════════════════════════════════════════════════════════════════════════

export const HOSPITALS: MarkerPoint[] = [
  { id: 'h1', name: 'AUH Beirut', coordinates: [33.898, 35.481], phone: '140', status: 'open' },
  { id: 'h2', name: 'Nabatieh Govt Hospital', coordinates: [33.378, 35.484], phone: '140', status: 'limited' },
  { id: 'h3', name: 'Hotel Dieu de France', coordinates: [33.882, 35.518], phone: '140', status: 'open' },
  { id: 'h4', name: 'Rafik Hariri University Hospital', coordinates: [33.831, 35.488], phone: '140', status: 'open' },
  { id: 'h5', name: 'Saint George Hospital Beirut', coordinates: [33.895, 35.509], phone: '140', status: 'open' },
  { id: 'h6', name: 'Hammoud Hospital Saida', coordinates: [33.559, 35.376], phone: '140', status: 'open' },
  { id: 'h7', name: 'Nini Hospital Tripoli', coordinates: [34.438, 35.832], phone: '140', status: 'open' },
  { id: 'h8', name: 'Baalbek Governmental Hospital', coordinates: [34.005, 36.198], phone: '140', status: 'limited' },
  { id: 'h9', name: 'Jabal Amel Hospital Tyre', coordinates: [33.275, 35.200], phone: '140', status: 'open' },
  { id: 'h10', name: 'Mount Lebanon Hospital', coordinates: [33.890, 35.545], phone: '140', status: 'open' },
];

export const AIRSTRIKES: MarkerPoint[] = [
  { id: 'a1', name: 'Haret Hreik Strike', coordinates: [33.848, 35.505], message: 'Confirmed Air Strike - Avoid Area', verified: true, verificationCount: 12 },
  { id: 'a2', name: 'Tyre Coast Shelling', coordinates: [33.271, 35.196], message: 'Heavy Shelling Reported', verified: true, verificationCount: 8 },
  { id: 'a3', name: 'Baalbek Center Evacuation', coordinates: [34.006, 36.202], message: 'Immediate Evacuation Order', verified: true, verificationCount: 15 },
  { id: 'a4', name: 'Dahieh Southern Suburb', coordinates: [33.838, 35.502], message: 'Multiple strikes confirmed', verified: true, verificationCount: 20 },
  { id: 'a5', name: 'Nabatieh Market Shelling', coordinates: [33.376, 35.480], message: 'Market area shelled - stay clear', verified: true, verificationCount: 10 },
];

export const BAKERIES: MarkerPoint[] = [
  { id: 'b1', name: 'Wooden Bakery Saida', coordinates: [33.561, 35.372], status: 'open', hours: '06:00 - 20:00' },
  { id: 'b2', name: "Sami's Bakery Beirut", coordinates: [33.890, 35.505], status: 'open', hours: '05:00 - 22:00' },
  { id: 'b3', name: 'Tripoli Traditional Bakery', coordinates: [34.432, 35.840], status: 'open', hours: '06:00 - 18:00' },
  { id: 'b4', name: 'Jounieh Fresh Bread', coordinates: [33.978, 35.618], status: 'open', hours: '07:00 - 19:00' },
  { id: 'b5', name: 'Zahle City Bakery', coordinates: [33.845, 35.905], status: 'limited', hours: '08:00 - 14:00' },
];

export const PHARMACIES: MarkerPoint[] = [
  { id: 'p1', name: 'Mazloum Pharmacy Tripoli', coordinates: [34.436, 35.835], status: 'open', hours: '08:00 - 23:00' },
  { id: 'p2', name: 'Benta Pharmacy Beirut', coordinates: [33.885, 35.512], status: 'open', hours: '24/7' },
  { id: 'p3', name: 'Abi Rashid Pharmacy Saida', coordinates: [33.558, 35.370], status: 'open', hours: '08:00 - 22:00' },
  { id: 'p4', name: 'Mounir Pharmacy Jounieh', coordinates: [33.980, 35.620], status: 'open', hours: '09:00 - 21:00' },
  { id: 'p5', name: 'Akkar Medical Pharmacy', coordinates: [34.540, 36.075], status: 'limited', hours: '10:00 - 16:00' },
];

export const FUEL_STATIONS: MarkerPoint[] = [
  { id: 'f1', name: 'Medco Jounieh', coordinates: [33.982, 35.621], status: 'open' },
  { id: 'f2', name: 'Total Beirut Cola', coordinates: [33.870, 35.495], status: 'open' },
  { id: 'f3', name: 'IPT Tripoli', coordinates: [34.440, 35.838], status: 'open' },
  { id: 'f4', name: 'Coral Saida Highway', coordinates: [33.555, 35.365], status: 'limited' },
  { id: 'f5', name: 'Medco Zahle', coordinates: [33.850, 35.910], status: 'open' },
];

export const NGOS: MarkerPoint[] = [
  { id: 'lrc1', name: 'LRC Health Center - Baouchriyeh', coordinates: [33.885, 35.552], status: 'open', aidType: 'medical', hours: '24/7' },
  { id: 'lrc2', name: 'LRC Health Center - Nabatiyeh', coordinates: [33.375, 35.482], status: 'open', aidType: 'medical', hours: '24/7' },
  { id: 'lrc3', name: 'LRC Health Center - Saida', coordinates: [33.565, 35.375], status: 'open', aidType: 'medical', hours: '24/7' },
  { id: 'amel1', name: 'Amel Community Center - Haret Hreik', coordinates: [33.845, 35.502], status: 'limited', aidType: 'multi', hours: '08:00 - 16:00' },
  { id: 'amel2', name: 'Amel Community Center - Tyre', coordinates: [33.272, 35.203], status: 'open', aidType: 'multi', hours: '08:00 - 16:00' },
  { id: 'caritas1', name: 'Caritas Center - Akkar', coordinates: [34.545, 36.078], status: 'open', aidType: 'food', hours: '09:00 - 17:00' },
  { id: 'caritas2', name: 'Caritas Center - Zahle', coordinates: [33.848, 35.902], status: 'open', aidType: 'shelter', hours: '09:00 - 17:00' },
  { id: 'unrwa1', name: 'UNRWA Shelter - Siblin', coordinates: [33.625, 35.452], status: 'open', aidType: 'shelter', hours: '24/7' },
  { id: 'unrwa2', name: 'UNRWA Shelter - Nahr el-Bared', coordinates: [34.512, 35.965], status: 'limited', aidType: 'shelter', hours: '24/7' },
  { id: 'wfp1', name: 'WFP Food Distribution - Tyre', coordinates: [33.275, 35.205], status: 'open', hours: '08:00 - 14:00' },
  { id: 'wfp2', name: 'Water Tanker Point - Dahieh', coordinates: [33.852, 35.508], status: 'open', hours: '07:00 - 19:00' },
  { id: 'ck1', name: 'Community Kitchen - Tripoli', coordinates: [34.438, 35.838], status: 'open', hours: '12:00 - 15:00' },
];

export const ROAD_BLOCKS: MarkerPoint[] = [
  { id: 'rc1', name: 'Qasmiyeh Bridge', coordinates: [33.318, 35.265], message: 'Bridge closed due to structural damage - Use coastal road', verified: true, verificationCount: 9, roadOpen: false },
  { id: 'rc2', name: 'Jiyyeh Highway', coordinates: [33.669, 35.408], message: 'Highway blocked - Debris from shelling', verified: true, verificationCount: 6, roadOpen: false },
  { id: 'rc3', name: 'Damour Tunnel', coordinates: [33.733, 35.450], message: 'Tunnel partially collapsed - Emergency crews on site', verified: false, verificationCount: 2, roadOpen: false },
  { id: 'rc4', name: 'Litani Bridge - Nabatieh', coordinates: [33.352, 35.485], message: 'Bridge closed by ISF - Alternative via Marjayoun', verified: true, verificationCount: 11, roadOpen: false },
  { id: 'rc5', name: 'Saida North Road', coordinates: [33.572, 35.381], message: 'Road Blockage - Use Alternate Route', verified: false, verificationCount: 1, roadOpen: false },
];

// ─── Category → Array mapping (for filter logic) ────────────────────────────
export const CATEGORY_DATA: Record<string, MarkerPoint[]> = {
  hospitals: HOSPITALS,
  airstrikes: AIRSTRIKES,
  bakeries: BAKERIES,
  pharmacies: PHARMACIES,
  fuel: FUEL_STATIONS,
  ngo: NGOS,
  road_status: ROAD_BLOCKS,
};

// ─── District Coordinates (routing dropdowns) ────────────────────────────────
export const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  dahieh: [33.855, 35.505],
  beirut: [33.890, 35.503],
  tripoli: [34.433, 35.833],
  saida: [33.559, 35.371],
  tyre: [33.271, 35.196],
  nabatieh: [33.378, 35.484],
  baalbek: [34.006, 36.202],
  jounieh: [33.981, 35.617],
  byblos: [34.123, 35.652],
  zahle: [33.844, 35.907],
};

// ─── Filter Categories (top bar chips) ───────────────────────────────────────
export const FILTER_CATEGORIES = [
  { id: 'all', icon: '📍', en: 'All', ar: 'الكل', fr: 'Tout' },
  { id: 'airstrikes', icon: '💥', en: 'Airstrikes', ar: 'غارات', fr: 'Frappes' },
  { id: 'hospitals', icon: '🏥', en: 'Hospitals', ar: 'مستشفيات', fr: 'Hôpitaux' },
  { id: 'bakeries', icon: '🍞', en: 'Bakeries', ar: 'مخابز', fr: 'Boulangeries' },
  { id: 'pharmacies', icon: '💊', en: 'Pharmacies', ar: 'صيدليات', fr: 'Pharmacies' },
  { id: 'fuel', icon: '⛽', en: 'Fuel', ar: 'وقود', fr: 'Carburant' },
  { id: 'ngo', icon: '🤝', en: 'NGOs', ar: 'منظمات', fr: 'ONGs' },
  { id: 'road_status', icon: '🚧', en: 'Roads', ar: 'طرقات', fr: 'Routes' },
];

// ─── Emergency Contacts ──────────────────────────────────────────────────────
export const EMERGENCY_CONTACTS = [
  { name: 'Hospitals', number: '140', icon: '🏥', color: '#2563eb' },
  { name: 'Civil Defense', number: '125', icon: '🚒', color: '#dc2626' },
  { name: 'Red Cross', number: '1760', icon: '⛑️', color: '#ef4444' },
  { name: 'ISF Police', number: '112', icon: '🚔', color: '#3b82f6' },
  { name: 'Army', number: '1701', icon: '🪖', color: '#16a34a' },
  { name: 'Fire Dept', number: '175', icon: '🔥', color: '#f97316' },
];

// ─── Service Icons mapping ───────────────────────────────────────────────────
export const SERVICE_ICONS: Record<string, string> = {
  hospital: '🏥', bakery: '🍞', pharmacy: '💊', fuel: '⛽',
  ngo: '🤝', tools: '🔧', food_water: '🍲',
};

// ─── Hospital Fallback (legacy compat — points to HOSPITALS) ─────────────────
export const HOSPITAL_FALLBACK = HOSPITALS;

// ─── Danger Types ────────────────────────────────────────────────────────────
export const DANGER_TYPES = [
  { type: 'airstrike', en: 'Airstrike', ar: 'غارة جوية', fr: 'Frappe aérienne', icon: '💥' },
  { type: 'road_closure', en: 'Road Closed', ar: 'طريق مغلق', fr: 'Route fermée', icon: '🚧' },
  { type: 'shelling', en: 'Shelling', ar: 'قصف', fr: 'Bombardement', icon: '💣' },
  { type: 'sniper', en: 'Sniper Zone', ar: 'منطقة قنص', fr: 'Zone sniper', icon: '🎯' },
  { type: 'flood', en: 'Flood', ar: 'فيضان', fr: 'Inondation', icon: '🌊' },
  { type: 'fire', en: 'Fire', ar: 'حريق', fr: 'Incendie', icon: '🔥' },
];

// ═════════════════════════════════════════════════════════════════════════════
//  TRANSLATIONS
// ═════════════════════════════════════════════════════════════════════════════
export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    appName: 'GUARDIAN',
    searchPlaceholder: 'Search village, city or address...',
    safestPath: 'Find Safest Path',
    reportDanger: 'Report Danger',
    liveFeed: 'Live Safety Feed',
    emergency: 'EMERGENCY',
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    lowBandwidth: 'Low Bandwidth',
    lowBandwidthActive: '📡 Low BW',
    lowPower: 'Low Power',
    close: 'Close',
    from: 'From',
    to: 'To',
    calculate: 'Calculate Route',
    calculating: 'Calculating...',
    routeFound: 'Safe path found',
    dangerAvoided: 'danger zones avoided',
    minutes: 'min',
    verified: '✅ Verified',
    community: 'Community',
    votes: 'votes',
    open: '🟢 Open',
    closed: '🔴 Closed',
    blocked: '🔴 Blocked',
    reportType: 'Report Type',
    details: 'Details',
    submit: 'Submit Report',
    submitted: '✅ Report submitted',
    shareLocation: 'Your Location',
    shareQR: 'Share Location QR',
    iAmSafe: '✅ I Am Safe',
    markedSafe: '✅ Marked safe!',
    feedAll: 'All',
    feedAirstrikes: 'Strikes',
    feedRoads: 'Roads',
    callNow: 'Call Now',
    sosTitle: 'Emergency Contacts',
  },
  ar: {
    appName: 'الحارس',
    searchPlaceholder: 'ابحث عن قرية، مدينة أو عنوان...',
    safestPath: 'أوجد أسلم طريق',
    reportDanger: 'بلّغ عن خطر',
    liveFeed: 'بث السلامة',
    emergency: 'طوارئ',
    settings: 'الإعدادات',
    language: 'اللغة',
    theme: 'المظهر',
    dark: 'داكن',
    light: 'فاتح',
    lowBandwidth: 'نطاق ترددي منخفض',
    lowBandwidthActive: '📡 نطاق منخفض',
    lowPower: 'طاقة منخفضة',
    close: 'إغلاق',
    from: 'من',
    to: 'إلى',
    calculate: 'احسب المسار',
    calculating: 'جارٍ الحساب...',
    routeFound: 'تم إيجاد مسار آمن',
    dangerAvoided: 'مناطق خطر تم تجنبها',
    minutes: 'دق',
    verified: '✅ موثّق',
    community: 'مجتمع',
    votes: 'أصوات',
    open: '🟢 مفتوح',
    closed: '🔴 مغلق',
    blocked: '🔴 مسدود',
    reportType: 'نوع البلاغ',
    details: 'تفاصيل',
    submit: 'إرسال البلاغ',
    submitted: '✅ تم الإرسال',
    shareLocation: 'موقعك',
    shareQR: 'مشاركة QR',
    iAmSafe: '✅ أنا بأمان',
    markedSafe: '✅ تم التأشير',
    feedAll: 'الكل',
    feedAirstrikes: 'غارات',
    feedRoads: 'طرق',
    callNow: 'اتصل الآن',
    sosTitle: 'أرقام الطوارئ',
  },
  fr: {
    appName: 'GUARDIAN',
    searchPlaceholder: 'Chercher village, ville ou adresse...',
    safestPath: 'Chemin le plus sûr',
    reportDanger: 'Signaler Danger',
    liveFeed: 'Flux Sécurité',
    emergency: 'URGENCE',
    settings: 'Paramètres',
    language: 'Langue',
    theme: 'Thème',
    dark: 'Sombre',
    light: 'Clair',
    lowBandwidth: 'Faible débit',
    lowBandwidthActive: '📡 Bas débit',
    lowPower: 'Faible conso',
    close: 'Fermer',
    from: 'De',
    to: 'À',
    calculate: 'Calculer',
    calculating: 'Calcul...',
    routeFound: 'Chemin sûr trouvé',
    dangerAvoided: 'zones de danger évitées',
    minutes: 'min',
    verified: '✅ Vérifié',
    community: 'Communauté',
    votes: 'votes',
    open: '🟢 Ouvert',
    closed: '🔴 Fermé',
    blocked: '🔴 Bloqué',
    reportType: 'Type de rapport',
    details: 'Détails',
    submit: 'Envoyer',
    submitted: '✅ Envoyé',
    shareLocation: 'Votre position',
    shareQR: 'Partager QR',
    iAmSafe: '✅ Je suis en sécurité',
    markedSafe: '✅ Marqué!',
    feedAll: 'Tout',
    feedAirstrikes: 'Frappes',
    feedRoads: 'Routes',
    callNow: 'Appeler',
    sosTitle: 'Contacts d\'urgence',
  },
};
