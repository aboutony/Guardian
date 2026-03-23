// ============================================================================
// Guardian — LowPowerListView.tsx
// Phase 16: OLED-optimized resource list (replaces Map in low-power mode)
// Generated via Antigravity Editor
// ============================================================================

import { useMemo } from 'react';
import {
  GuardianResource,
  DangerZone,
  OLED_COLORS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  DIRECTION_LABELS,
  SEVERITY_COLORS,
  SYSTEM_FONT_STACK,
  type CardinalDirection,
  type SeverityLevel,
} from '../constants';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
interface LowPowerListViewProps {
  resources: GuardianResource[];
  dangerZones: DangerZone[];
  userLat: number;
  userLng: number;
  lang: string;                // 'en' | 'ar' | 'fr'
  onSelectResource?: (resource: GuardianResource) => void;
}

interface ResourceWithDistance extends GuardianResource {
  distanceKm: number;
  direction: CardinalDirection;
}

// ---------------------------------------------------------------------------
// GEO UTILITIES (zero-dependency, pure math)
// ---------------------------------------------------------------------------
function haversineKm(
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

function bearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): CardinalDirection {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.cos(dLng);
  let deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

  if (deg >= 337.5 || deg < 22.5)  return 'N';
  if (deg < 67.5)                   return 'NE';
  if (deg < 112.5)                  return 'E';
  if (deg < 157.5)                  return 'SE';
  if (deg < 202.5)                  return 'S';
  if (deg < 247.5)                  return 'SW';
  if (deg < 292.5)                  return 'W';
  return 'NW';
}

function formatDistance(km: number): string {
  return km < 1
    ? `${Math.round(km * 1000)}m`
    : `${km.toFixed(1)}km`;
}

// ---------------------------------------------------------------------------
// STYLES (inline — no CSS file loads, zero network, OLED-pure)
// ---------------------------------------------------------------------------
const styles = {
  container: {
    backgroundColor: OLED_COLORS.bg,
    color: OLED_COLORS.text,
    fontFamily: SYSTEM_FONT_STACK,
    minHeight: '100vh',
    padding: '0',
    margin: '0',
    overflowY: 'auto' as const,
    WebkitOverflowScrolling: 'touch' as const,
  },
  sectionHeader: {
    backgroundColor: OLED_COLORS.headerBg,
    color: OLED_COLORS.text,
    fontFamily: SYSTEM_FONT_STACK,
    fontSize: '11px',
    fontWeight: 700 as const,
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    padding: '10px 16px',
    borderBottom: `1px solid ${OLED_COLORS.border}`,
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderBottom: `1px solid ${OLED_COLORS.border}`,
    cursor: 'pointer',
    transition: 'none',        // no animations in low-power
  },
  icon: {
    fontSize: '22px',
    flexShrink: 0,
    width: '32px',
    textAlign: 'center' as const,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: SYSTEM_FONT_STACK,
    fontSize: '15px',
    fontWeight: 600 as const,
    color: OLED_COLORS.text,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  },
  meta: {
    fontFamily: SYSTEM_FONT_STACK,
    fontSize: '12px',
    color: OLED_COLORS.textDim,
    marginTop: '2px',
  },
  distance: {
    fontFamily: SYSTEM_FONT_STACK,
    fontSize: '14px',
    fontWeight: 700 as const,
    color: OLED_COLORS.accent,
    flexShrink: 0,
    textAlign: 'right' as const,
    minWidth: '72px',
  },
  dangerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderBottom: `1px solid ${OLED_COLORS.border}`,
    borderLeft: '3px solid',
  },
  dangerIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  dangerText: {
    fontFamily: SYSTEM_FONT_STACK,
    fontSize: '13px',
    color: OLED_COLORS.text,
    flex: 1,
  },
  emptyState: {
    fontFamily: SYSTEM_FONT_STACK,
    textAlign: 'center' as const,
    padding: '48px 24px',
    color: OLED_COLORS.textDim,
    fontSize: '14px',
  },
  statusBadge: {
    fontFamily: SYSTEM_FONT_STACK,
    fontSize: '9px',
    fontWeight: 700 as const,
    letterSpacing: '0.5px',
    padding: '2px 6px',
    borderRadius: '3px',
    display: 'inline-block',
    marginLeft: '8px',
  },
} as const;

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------
export default function LowPowerListView({
  resources,
  dangerZones,
  userLat,
  userLng,
  lang,
  onSelectResource,
}: LowPowerListViewProps) {
  // Enrich resources with distance & direction, sorted nearest-first
  const enriched = useMemo<ResourceWithDistance[]>(() => {
    return resources
      .filter((r) => r.isOperational)
      .map((r) => ({
        ...r,
        distanceKm: haversineKm(userLat, userLng, r.lat, r.lng),
        direction: bearing(userLat, userLng, r.lat, r.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [resources, userLat, userLng]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, ResourceWithDistance[]>();
    for (const r of enriched) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return map;
  }, [enriched]);

  // Sort danger zones by severity
  const sortedDangers = useMemo(() => {
    const order: Record<SeverityLevel, number> = {
      critical: 0,
      high: 1,
      moderate: 2,
      low: 3,
    };
    return [...dangerZones].sort(
      (a, b) => order[a.severity] - order[b.severity],
    );
  }, [dangerZones]);

  const getLabel = (
    labels: Record<string, Record<string, string>>,
    key: string,
  ) => labels[key]?.[lang] ?? labels[key]?.en ?? key;

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={styles.container} role="main" aria-label="Low Power Resource List">
      {/* ── DANGER ALERTS ─────────────────────────────────────────── */}
      {sortedDangers.length > 0 && (
        <>
          <div style={styles.sectionHeader}>
            ⚠️&nbsp; ACTIVE ALERTS ({sortedDangers.length})
          </div>
          {sortedDangers.map((dz) => {
            const dist = haversineKm(userLat, userLng, dz.lat, dz.lng);
            return (
              <div
                key={dz.id}
                style={{
                  ...styles.dangerCard,
                  borderLeftColor: SEVERITY_COLORS[dz.severity],
                }}
                role="alert"
              >
                <span style={styles.dangerIcon}>🔴</span>
                <div style={styles.dangerText}>
                  <strong>{dz.description}</strong>
                  <br />
                  <span style={{ color: OLED_COLORS.textDim, fontSize: '11px' }}>
                    {formatDistance(dist)} away · Radius: {dz.radiusKm}km ·{' '}
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: SEVERITY_COLORS[dz.severity],
                        color: '#000',
                      }}
                    >
                      {dz.severity.toUpperCase()}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── RESOURCE GROUPS ───────────────────────────────────────── */}
      {Array.from(grouped.entries()).map(([category, items]) => (
        <div key={category}>
          <div style={styles.sectionHeader}>
            {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}&nbsp;{' '}
            {getLabel(CATEGORY_LABELS, category)} ({items.length})
          </div>
          {items.map((r) => (
            <div
              key={r.id}
              style={styles.card}
              onClick={() => onSelectResource?.(r)}
              role="button"
              tabIndex={0}
              aria-label={`${r.name}, ${formatDistance(r.distanceKm)} ${getLabel(DIRECTION_LABELS, r.direction)}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectResource?.(r);
              }}
            >
              <span style={styles.icon}>
                {CATEGORY_ICONS[r.category]}
              </span>
              <div style={styles.info}>
                <div style={styles.name}>
                  {lang === 'ar' && r.nameAr
                    ? r.nameAr
                    : lang === 'fr' && r.nameFr
                      ? r.nameFr
                      : r.name}
                </div>
                <div style={styles.meta}>
                  {r.operatingHours && <span>{r.operatingHours}</span>}
                  {r.verifiedBy && (
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: OLED_COLORS.accent,
                        color: '#000',
                      }}
                    >
                      ✓ {r.verifiedBy}
                    </span>
                  )}
                </div>
              </div>
              <div style={styles.distance}>
                {formatDistance(r.distanceKm)}
                <div style={{ fontSize: '10px', color: OLED_COLORS.textDim, fontWeight: 400 }}>
                  {getLabel(DIRECTION_LABELS, r.direction)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {enriched.length === 0 && (
        <div style={styles.emptyState}>
          No operational resources in range.
          <br />
          GPS will refresh in 5 minutes.
        </div>
      )}
    </div>
  );
}
