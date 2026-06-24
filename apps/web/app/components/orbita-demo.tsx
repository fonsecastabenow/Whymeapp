"use client"

import { useState } from "react"
import OrbitaChart from "./orbita-chart"
import type { OCEANScores } from "./orbita-chart"

const DIMENSION_CONFIG: {
  key: keyof OCEANScores
  label: string
  color: string
}[] = [
  { key: "openness", label: "Abertura", color: "#8B5CF6" },
  { key: "conscientiousness", label: "Conscienciosidade", color: "#3B82F6" },
  { key: "extraversion", label: "Extroversão", color: "#F59E0B" },
  { key: "agreeableness", label: "Amabilidade", color: "#10B981" },
  { key: "neuroticism", label: "Neuroticismo", color: "#EF4444" },
]

const SAMPLE_SCORES: OCEANScores = {
  openness: 0.85,
  conscientiousness: 0.62,
  extraversion: 0.73,
  agreeableness: 0.91,
  neuroticism: 0.34,
}

export default function OrbitaDemo() {
  const [scores, setScores] = useState<OCEANScores>(SAMPLE_SCORES)
  const [chartSize, setChartSize] = useState(400)

  const handleSliderChange = (dim: keyof OCEANScores, value: number) => {
    setScores((prev) => ({ ...prev, [dim]: value }))
  }

  const handleReset = () => {
    setScores(SAMPLE_SCORES)
  }

  const handleRandomize = () => {
    setScores({
      openness: Math.round(Math.random() * 100) / 100,
      conscientiousness: Math.round(Math.random() * 100) / 100,
      extraversion: Math.round(Math.random() * 100) / 100,
      agreeableness: Math.round(Math.random() * 100) / 100,
      neuroticism: Math.round(Math.random() * 100) / 100,
    })
  }

  return (
    <div className="flex flex-col items-center gap-8 p-6 sm:p-10">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Perfil OCEAN
        </h2>
        <p className="text-sm text-muted-foreground">
          Ajuste os controles abaixo para visualizar o perfil
        </p>
      </div>

      <div className="w-full max-w-md flex items-center justify-center">
        <OrbitaChart scores={scores} size={chartSize} />
      </div>

      <div className="w-full max-w-md space-y-4">
        {DIMENSION_CONFIG.map(({ key, label, color }) => {
          const percentage = Math.round(scores[key] * 100)
          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <label
                  htmlFor={`slider-${key}`}
                  className="flex items-center gap-2 font-medium text-foreground"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </label>
                <span className="tabular-nums text-muted-foreground">
                  {percentage}%
                </span>
              </div>
              <input
                id={`slider-${key}`}
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={scores[key]}
                onChange={(e) =>
                  handleSliderChange(key, parseFloat(e.target.value))
                }
                className="orbita-slider w-full h-2 cursor-pointer appearance-none rounded-full bg-secondary accent-[var(--slider-color)] outline-none transition-all"
                style={
                  {
                    "--slider-color": color,
                    background: `linear-gradient(to right, ${color} ${percentage}%, hsl(var(--secondary)) ${percentage}%)`,
                  } as React.CSSProperties
                }
              />
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Resetar
        </button>
        <button
          onClick={handleRandomize}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Aleatório
        </button>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Dimensões: Abertura, Conscienciosidade, Extroversão, Amabilidade,
          Neuroticismo
        </p>
      </div>
    </div>
  )
}
