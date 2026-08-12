"use client"

/**
 * The day's own track, drawn from its stops, for days that carry no photograph.
 *
 * Most legs have no imagery — the media library is almost entirely Lefkada —
 * so those days fell back to a circle with a number in it, identical on every
 * one. Every leg does have a fix, though, and a day's sequence of fixes is a
 * shape: the run south through the canal looks nothing like the day that
 * crosses to Zakynthos. Plotting it gives each day something of its own
 * without inventing a picture.
 *
 * Deterministic: the same day always draws the same figure.
 */

export interface ChartPoint {
  lat: number
  lon: number
  label?: string
}

const W = 560
const H = 400
const PAD = 64

export function ItineraryDayChart({
  points,
  dayNumber,
  className,
}: {
  points: ChartPoint[]
  dayNumber: number
  className?: string
}) {
  const usable = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))

  /* One stop has no extent to normalise against, so the projection below would
     divide by zero. A single mark, centred, is the honest drawing of it. */
  const lats = usable.map((p) => p.lat)
  const lons = usable.map((p) => p.lon)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)

  // Keep the aspect honest: a degree of longitude is shorter than a degree of
  // latitude at this parallel, and scaling each axis independently would
  // stretch a north-south run into a diagonal.
  const latSpan = Math.max(maxLat - minLat, 0.004)
  const lonSpan = Math.max((maxLon - minLon) * Math.cos((minLat * Math.PI) / 180), 0.004)
  const span = Math.max(latSpan, lonSpan)

  const cx = (minLon + maxLon) / 2
  const cy = (minLat + maxLat) / 2
  const scale = (Math.min(W, H) - PAD * 2) / span

  const round = (n: number) => Math.round(n * 10) / 10

  const project = (p: ChartPoint) => ({
    x: round(W / 2 + (p.lon - cx) * Math.cos((p.lat * Math.PI) / 180) * scale),
    // SVG y grows downward; north must go up.
    y: round(H / 2 - (p.lat - cy) * scale),
  })

  const xy = usable.map(project)
  const path = xy.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role="img"
      aria-label={`Day ${dayNumber} track: ${usable.map((p) => p.label).filter(Boolean).join(", ")}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Chart grid, well back — the same register as the topographic ground
          used elsewhere, not a competing element. */}
      <defs>
        <pattern id={`grid-${dayNumber}`} width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="var(--iyc-ionian-600)" strokeOpacity="0.07" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#grid-${dayNumber})`} />

      {usable.length > 1 && (
        <>
          {/* A soft under-stroke so the track reads over the grid without
              having to be heavy. */}
          <path d={path} fill="none" stroke="var(--iyc-ionian-300)" strokeOpacity="0.35" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d={path} fill="none" stroke="var(--iyc-ionian-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 7" />
        </>
      )}

      {/* A day with one stop has no track to draw. Rather than leave a lone
          dot on an empty grid, mark it the way a chart marks a fix: concentric
          rings and the position spelled out. */}
      {usable.length === 1 && (
        <g>
          {[62, 44, 26].map((r, i) => (
            <circle
              key={r}
              cx={xy[0].x}
              cy={xy[0].y}
              r={r}
              fill="none"
              stroke="var(--iyc-ionian-600)"
              strokeOpacity={0.1 + i * 0.06}
              strokeWidth="1"
              strokeDasharray={i === 0 ? "3 6" : undefined}
            />
          ))}
          <line x1={xy[0].x - 74} y1={xy[0].y} x2={xy[0].x + 74} y2={xy[0].y} stroke="var(--iyc-ionian-600)" strokeOpacity="0.18" strokeWidth="1" />
          <line x1={xy[0].x} y1={xy[0].y - 74} x2={xy[0].x} y2={xy[0].y + 74} stroke="var(--iyc-ionian-600)" strokeOpacity="0.18" strokeWidth="1" />
          <text
            x={xy[0].x}
            y={xy[0].y + 92}
            textAnchor="middle"
            fontSize="13"
            fontFamily="var(--font-mono)"
            fill="var(--iyc-ionian-600)"
            fillOpacity="0.75"
          >
            {`${Math.abs(usable[0].lat).toFixed(4)}°${usable[0].lat >= 0 ? "N" : "S"}  ${Math.abs(usable[0].lon).toFixed(4)}°${usable[0].lon >= 0 ? "E" : "W"}`}
          </text>
        </g>
      )}

      {xy.map((p, i) => {
        const last = i === xy.length - 1
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={last ? 9 : 6} fill="var(--surface-card)" stroke="var(--iyc-ionian-600)" strokeWidth="2" />
            {last && <circle cx={p.x} cy={p.y} r="3.5" fill="var(--action-accent)" />}
          </g>
        )
      })}

      {/* North mark: the drawing is a chart, and a chart without an up is a
          doodle. */}
      <g transform={`translate(${W - 42}, 38)`} opacity="0.5">
        <path d="M0 -14 L5 6 L0 1 L-5 6 Z" fill="var(--iyc-ionian-600)" />
        <text y="20" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--iyc-ionian-600)" fontFamily="var(--font-mono)">
          N
        </text>
      </g>
    </svg>
  )
}
