// ═══════════════════════════════════════════════════════════════
// GUARDIAN i18n — English + Arabic with RTL Support
// ═══════════════════════════════════════════════════════════════

export type Lang = 'en' | 'ar';

export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    // App
    app_name: 'GUARDIAN',
    connected: 'Connected to Emergency Network',
    offline: '📡 Offline Mode Active',

    // Navigation
    tab_map: 'Map',
    tab_alerts: 'Alerts',
    tab_safe: 'I AM SAFE',
    tab_settings: 'Settings',
    safe_confirmed: 'SAFE ✓',

    // Header
    sos: 'SOS',
    sos_sending: 'SENDING...',
    blackout: 'BLACKOUT',

    // Categories
    hospital: 'Hospital',
    bakery: 'Bakery',
    pharmacy: 'Pharmacy',
    ngo: 'NGO',
    shelter: 'Shelter',
    water_point: 'Water Point',
    fuel_station: 'Fuel Station',
    danger: 'Danger Zone',

    // HospitalSheet
    trust_score: 'Trust Score',
    reports: 'reports',
    confirmed: 'confirmed',
    operational_q: 'Is this location operational?',
    vote_operational: '✅ OPERATIONAL',
    vote_out: '❌ OUT OF SERVICE',
    vote_thanks: 'Thank you for your report. Trust score will update shortly.',
    verified: 'VERIFIED',
    distance: 'Distance',
    eta: 'ETA',
    services: 'Available Services',
    call: 'Call',
    start_route: 'Start Safest Route',

    // Alerts
    active_alerts: '⚠️ Active Alerts',
    danger_zones_sorted: 'danger zones — sorted by proximity',
    nearby: 'NEARBY',
    km_away: 'km away',

    // Counter
    resources: 'Resources',
    danger_zones: 'Danger Zones',

    // Settings
    settings_title: 'Settings',
    language: 'Language',
    blackout_mode: 'Blackout Mode',
    blackout_desc: 'Pure black for OLED — zero light emission',
    emergency_contacts: 'Emergency Contacts',
    privacy: 'Privacy & Sharing',
    about: 'About Guardian',
    version: 'Version',

    // Family
    family_circle: 'Family Safety Circle',
    message: 'Message',
    track: 'Track',
  },

  ar: {
    // App
    app_name: 'الحارس',
    connected: 'متصل بشبكة الطوارئ',
    offline: '📡 وضع عدم الاتصال',

    // Navigation
    tab_map: 'الخريطة',
    tab_alerts: 'التنبيهات',
    tab_safe: 'أنا بأمان',
    tab_settings: 'الإعدادات',
    safe_confirmed: 'بأمان ✓',

    // Header
    sos: 'نجدة',
    sos_sending: 'جاري الإرسال...',
    blackout: 'وضع التعتيم',

    // Categories
    hospital: 'مستشفى',
    bakery: 'مخبز',
    pharmacy: 'صيدلية',
    ngo: 'منظمة إنسانية',
    shelter: 'ملجأ',
    water_point: 'نقطة مياه',
    fuel_station: 'محطة وقود',
    danger: 'منطقة خطرة',

    // HospitalSheet
    trust_score: 'نسبة الثقة',
    reports: 'تقارير',
    confirmed: 'تأكيدات',
    operational_q: 'هل هذا الموقع يعمل؟',
    vote_operational: '✅ يعمل',
    vote_out: '❌ خارج الخدمة',
    vote_thanks: 'شكراً لتقريرك. سيتم تحديث نسبة الثقة قريباً.',
    verified: 'موثّق',
    distance: 'المسافة',
    eta: 'الوقت المتوقع',
    services: 'الخدمات المتاحة',
    call: 'اتصال',
    start_route: 'ابدأ الطريق الأكثر أماناً',

    // Alerts
    active_alerts: '⚠️ تنبيهات نشطة',
    danger_zones_sorted: 'مناطق خطرة — مرتبة حسب القرب',
    nearby: 'قريب',
    km_away: 'كم',

    // Counter
    resources: 'موارد',
    danger_zones: 'مناطق خطرة',

    // Settings
    settings_title: 'الإعدادات',
    language: 'اللغة',
    blackout_mode: 'وضع التعتيم',
    blackout_desc: 'أسود خالص لشاشات OLED — صفر إضاءة',
    emergency_contacts: 'جهات الطوارئ',
    privacy: 'الخصوصية والمشاركة',
    about: 'عن الحارس',
    version: 'الإصدار',

    // Family
    family_circle: 'دائرة أمان العائلة',
    message: 'رسالة',
    track: 'تتبع',
  },
};

/**
 * Get a translation string by key
 */
export function t(lang: Lang, key: string): string {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}

/**
 * Apply RTL to document body if Arabic
 */
export function applyDirection(lang: Lang) {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}
