"use client"

import { OCEAN_COLORS } from "@/lib/utils"

export const OCEAN_DIMS = [
  { key: "openness",          label: "O", fullLabel: "Abertura",           color: OCEAN_COLORS.O },
  { key: "conscientiousness", label: "C", fullLabel: "Conscienciosidade",  color: OCEAN_COLORS.C },
  { key: "extraversion",      label: "E", fullLabel: "Extroversão",        color: OCEAN_COLORS.E },
  { key: "agreeableness",     label: "A", fullLabel: "Amabilidade",        color: OCEAN_COLORS.A },
  { key: "neuroticism",       label: "N", fullLabel: "Neuroticismo",       color: OCEAN_COLORS.N },
] as const

export type OceanScores = Record<string, number>

export function normalizeOceanScores(scores: OceanScores): OceanScores {
  const vals = Object.values(scores)
  if (vals.some((v) => v > 1)) {
    return Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, v / 100]))
  }
  return scores
}

interface OceanRadarProps {
  scores: OceanScores
  size?: number
}

export function OceanRadar({ scores, size = 250 }: OceanRadarProps) {
  const s = normalizeOceanScores(scores)
  const cx = size / 2
  const cy = size / 2
  const R = size * 0.352
  const keys = OCEAN_DIMS.map((d) => d.key)
  const angles = keys.map((_, i) => (i * 2 * Math.PI) / 5 - Math.PI / 2)

  const pt = (angle: number, ratio: number) => ({
    x: cx + R * ratio * Math.cos(angle),
    y: cy + R * ratio * Math.sin(angle),
  })

  const scorePoints = keys
    .map((k, i) => {
      const v = Math.max(0, Math.min(1, s[k] ?? 0))
      const p = pt(angles[i], v)
      return `${p.x},${p.y}`
    })
    .join(" ")

  const gradId = `ocean-grad-${size}`

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Gráfico OCEAN">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#3AB0FF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <polygon
          key={ratio}
          points={angles.map((a) => `${pt(a, ratio).x},${pt(a, ratio).y}`).join(" ")}
          fill="none"
          stroke={ratio === 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt(a, 1).x} y2={pt(a, 1).y}
          stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}

      {/* Score polygon */}
      <polygon points={scorePoints} fill={`url(#${gradId})`}
        stroke="#3AB0FF" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Vertex dots — per-dimension color */}
      {keys.map((k, i) => {
        const v = Math.max(0, Math.min(1, s[k] ?? 0))
        const p = pt(angles[i], v)
        return (
          <circle key={k} cx={p.x} cy={p.y} r="4"
            fill={OCEAN_DIMS[i].color} stroke="rgba(11,31,58,0.8)" strokeWidth="1.5" />
        )
      })}

      {/* Axis labels — per-dimension color */}
      {angles.map((a, i) => {
        const p = pt(a, 1.24)
        return (
          <text key={i} x={p.x} y={p.y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="13" fontWeight="800" fill={OCEAN_DIMS[i].color}>
            {OCEAN_DIMS[i].label}
          </text>
        )
      })}
    </svg>
  )
}

interface OceanBarsProps {
  scores: OceanScores
}

export function OceanBars({ scores }: OceanBarsProps) {
  const s = normalizeOceanScores(scores)
  return (
    <div className="w-full space-y-2.5">
      {OCEAN_DIMS.map(({ key, label, fullLabel, color }) => {
        const pct = Math.round((s[key] ?? 0) * 100)
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-4 text-[11px] font-[800] font-data" style={{ color }}>{label}</span>
            <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/6">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="w-7 text-right text-[12px] font-[700] font-data tabular-nums"
              style={{ color }}>{pct}</span>
            <span className="hidden w-32 text-[11px] text-[rgba(200,213,234,0.62)] md:block">
              {fullLabel}
            </span>
          </div>
        )
      })}
    </div>
  )
}
