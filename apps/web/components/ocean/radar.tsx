"use client"

export const OCEAN_DIMS = [
  { key: "openness",          label: "O", fullLabel: "Abertura" },
  { key: "conscientiousness", label: "C", fullLabel: "Conscienciosidade" },
  { key: "extraversion",      label: "E", fullLabel: "Extroversão" },
  { key: "agreeableness",     label: "A", fullLabel: "Amabilidade" },
  { key: "neuroticism",       label: "N", fullLabel: "Neuroticismo" },
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

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Gráfico OCEAN">
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <polygon
          key={ratio}
          points={angles.map((a) => `${pt(a, ratio).x},${pt(a, ratio).y}`).join(" ")}
          fill="none"
          stroke={ratio === 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}
          strokeWidth="1"
        />
      ))}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt(a, 1).x} y2={pt(a, 1).y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      ))}
      <polygon points={scorePoints} fill="rgba(139,92,246,0.25)" stroke="#8B5CF6" strokeWidth="2" strokeLinejoin="round" />
      {keys.map((k, i) => {
        const v = Math.max(0, Math.min(1, s[k] ?? 0))
        const p = pt(angles[i], v)
        return <circle key={k} cx={p.x} cy={p.y} r="4" fill="#8B5CF6" stroke="#fff" strokeWidth="1" />
      })}
      {angles.map((a, i) => {
        const p = pt(a, 1.22)
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="700" fill="rgba(255,255,255,0.65)">
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
    <div className="w-full space-y-3">
      {OCEAN_DIMS.map(({ key, label, fullLabel }) => {
        const pct = Math.round((s[key] ?? 0) * 100)
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-4 text-sm font-bold text-zinc-400">{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right text-sm font-semibold tabular-nums text-zinc-300">{pct}</span>
            <span className="hidden w-32 text-xs text-zinc-500 md:block">{fullLabel}</span>
          </div>
        )
      })}
    </div>
  )
}
