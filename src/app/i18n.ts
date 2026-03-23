// ═══════════════════════════════════════════════════════════════
// GUARDIAN i18n — Full Tactical Arabic Sync
// BRAND LOCK: "GUARDIAN" is NEVER translated.
// ═══════════════════════════════════════════════════════════════

export type Lang = 'en' | 'ar';

export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    // ── Navigation ──
    tab_map: 'Map',
    tab_alerts: 'Alerts',
    tab_safe: 'I AM SAFE',
    tab_settings: 'Settings',
    safe_confirmed: 'SAFE ✓',

    // ── Header ──
    sos: 'SOS',
    sos_sending: 'SENDING...',

    // ── Categories ──
    hospital: 'Hospital',
    bakery: 'Bakery',
    pharmacy: 'Pharmacy',
    ngo: 'NGO',
    shelter: 'Shelter',
    water_point: 'Water Point',
    fuel_station: 'Fuel Station',
    danger: 'Danger Zone',
    airstrike: 'Airstrike',
    roadblock: 'Roadblock',

    // ── HospitalSheet ──
    trust_score: 'Trust Score',
    reports: 'reports',
    confirmed: 'confirmed',
    operational_q: 'Is this location operational?',
    vote_operational: '✅ OPERATIONAL',
    vote_out: '❌ OUT OF SERVICE',
    vote_thanks: 'Thank you for your report.',
    verified: 'VERIFIED',
    distance: 'Distance',
    eta: 'ETA',
    services: 'Available Services',
    call: 'Call',
    start_route: 'Start Safest Route',
    status_open: 'Open',
    status_closed: 'Closed',
    status_limited: 'Limited',

    // ── Alerts ──
    active_alerts: '⚠️ Active Alerts',
    danger_zones_sorted: 'danger zones — sorted by proximity',
    nearby: 'NEARBY',
    km_away: 'km away',
    danger_zone: 'DANGER ZONE',

    // ── Counter ──
    resources: 'Resources',
    danger_zones: 'Danger Zones',

    // ── Settings ──
    settings_title: 'Settings',
    language: 'Language',
    blackout_mode: 'Blackout Mode',
    blackout_desc: 'Pure black for OLED — zero light emission',
    emergency_contacts: 'Emergency Contacts',
    privacy: 'Privacy & Sharing',
    about: 'About Guardian',
    version: 'Version',

    // ── Family ──
    family_circle: 'Family Safety Circle',
    message: 'Message',
    track: 'Track',
    min_ago: 'min ago',
    battery: 'Battery',

    // ── Network ──
    connected: 'Connected to Emergency Network',
    offline: '📡 Offline Mode Active',

    // ── General ──
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    your_location: 'Your Location',
  },

  ar: {
    // ── التنقل ──
    tab_map: 'الخريطة',
    tab_alerts: 'التنبيهات',
    tab_safe: 'أنا بخير',
    tab_settings: 'الإعدادات',
    safe_confirmed: 'بأمان ✓',

    // ── الشريط العلوي ──
    sos: 'استغاثة',
    sos_sending: 'جاري الإرسال...',

    // ── التصنيفات ──
    hospital: 'مستشفى',
    bakery: 'مخبز',
    pharmacy: 'صيدلية',
    ngo: 'منظمة إنسانية',
    shelter: 'ملجأ',
    water_point: 'نقطة مياه',
    fuel_station: 'محطة وقود',
    danger: 'منطقة خطرة',
    airstrike: 'غارة جوية',
    roadblock: 'حاجز طريق',

    // ── بطاقة الموقع ──
    trust_score: 'مؤشر الثقة',
    reports: 'تقارير',
    confirmed: 'تأكيدات',
    operational_q: 'هل هذا الموقع يعمل حالياً؟',
    vote_operational: '✅ يعمل',
    vote_out: '❌ خارج الخدمة',
    vote_thanks: 'شكراً لتقريرك.',
    verified: 'موثّق',
    distance: 'المسافة',
    eta: 'الوقت المتوقع',
    services: 'الخدمات المتاحة',
    call: 'اتصال',
    start_route: 'ابدأ أأمن مسار',
    status_open: 'مفتوح',
    status_closed: 'مغلق',
    status_limited: 'محدود',

    // ── التنبيهات ──
    active_alerts: '⚠️ تنبيهات نشطة',
    danger_zones_sorted: 'مناطق خطرة — مرتبة حسب القرب',
    nearby: 'قريب',
    km_away: 'كم',
    danger_zone: 'منطقة خطرة',

    // ── العدّاد ──
    resources: 'موارد',
    danger_zones: 'مناطق خطرة',

    // ── الإعدادات ──
    settings_title: 'الإعدادات',
    language: 'اللغة',
    blackout_mode: 'وضع التعتيم',
    blackout_desc: 'أسود خالص — صفر إضاءة',
    emergency_contacts: 'جهات الطوارئ',
    privacy: 'الخصوصية',
    about: 'عن Guardian',
    version: 'الإصدار',

    // ── الدائرة المقربة ──
    family_circle: 'الدائرة المقربة',
    message: 'رسالة',
    track: 'تتبع',
    min_ago: 'دقيقة',
    battery: 'البطارية',

    // ── الشبكة ──
    connected: 'متصل بشبكة الطوارئ',
    offline: '📡 وضع عدم الاتصال',

    // ── عام ──
    close: 'إغلاق',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    your_location: 'موقعك',
  },
};

export function t(lang: Lang, key: string): string {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}

export function applyDirection(lang: Lang) {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  // Apply Cairo font for Arabic legibility
  if (lang === 'ar') {
    document.body.style.fontFamily = "'Cairo', 'Inter', sans-serif";
  } else {
    document.body.style.fontFamily = "'Inter', sans-serif";
  }
}
