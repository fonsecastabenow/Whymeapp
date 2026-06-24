import { cn } from "@/lib/utils"

export type OceanScores = {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
}

const DIMS = [
  { key: "openness" as const, label: "Abertura", short: "O" },
  { key: "conscientiousness" as const, label: "Consciência", short: "C" },
  { key: "extraversion" as const, label: "Extroversão", short: "E" },
  { key: "agreeableness" as const, label: "Amabilidade", short: "A" },
  { key: "neuroticism" as const, label: "Neuroticismo", short: "N" },
]

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function pointsToPath(pts: { x: number; y: number }[]): string {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") + " Z"
}

interface OceanRadarProps {
  scores: OceanScores
  size?: number
  className?: string
  showLabels?: boolean
}

export function OceanRadar({ scores, size = 220, className, showLabels = true }: OceanRadarProps) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.38
  const levels = [0.25, 0.5, 0.75, 1]
  const angleStep = 360 / 5

  const gridPaths = levels.map((l) => {
    const pts = DIMS.map((_, i) => polar(cx, cy, maxR * l, i * angleStep))
    return pointsToPath(pts)
  })

  const dataPoints = DIMS.map((d, i) => polar(cx, cy, maxR * Math.min(scores[d.key], 1), i * angleStep))
  const dataPath = pointsToPath(dataPoints)

  const axisLines = DIMS.map((_, i) => ({
    end: polar(cx, cy, maxR, i * angleStep),
  }))

  const labelPositions = DIMS.map((d, i) => {
    const pt = polar(cx, cy, maxR + 22, i * angleStep)
    return { ...pt, label: d.label, short: d.short, value: Math.round(scores[d.key] * 100) }
  })

  return (
    <div className={cn("inline-block", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridPaths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#3f3f46" strokeWidth="1" />
        ))}

        {axisLines.map((l, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={l.end.x.toFixed(2)}
            y2={l.end.y.toFixed(2)}
            stroke="#3f3f46"
            strokeWidth="1"
          />
        ))}

        <path d={dataPath} fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth="2" />

        {dataPoints.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#3b82f6" />
        ))}

        {showLabels &&
          labelPositions.map((lp, i) => (
            <text
              key={i}
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-zinc-400"
              fontSize="11"
              fontFamily="Inter, sans-serif"
            >
              {lp.short} {lp.value}%
            </text>
          ))}
      </svg>
    </div>
  )
}
