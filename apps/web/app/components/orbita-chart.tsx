"use client"

import { useEffect, useRef, useCallback } from "react"
import * as d3 from "d3"

export type OCEANScores = {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
}

const DIMENSION_LABELS: Record<string, string> = {
  openness: "Abertura",
  conscientiousness: "Conscienciosidade",
  extraversion: "Extroversão",
  agreeableness: "Amabilidade",
  neuroticism: "Neuroticismo",
}

const DIMENSIONS = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "neuroticism",
] as const

type Dimension = (typeof DIMENSIONS)[number]

const COLORS = {
  openness: "#8B5CF6",
  conscientiousness: "#3B82F6",
  extraversion: "#F59E0B",
  agreeableness: "#10B981",
  neuroticism: "#EF4444",
}

interface OrbitaChartProps {
  scores: OCEANScores
  size?: number
}

const DEFAULT_SIZE = 400

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  }
}

export default function OrbitaChart({ scores, size = DEFAULT_SIZE }: OrbitaChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  // (State managed via D3 directly in the SVG)

  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.38

  const margin = 60
  const viewSize = size + margin * 2

  const getPoint = useCallback(
    (dim: Dimension, value: number) => {
      const idx = DIMENSIONS.indexOf(dim)
      const angle = (360 / DIMENSIONS.length) * idx
      return polarToCartesian(cx + margin, cy + margin, radius * value, angle)
    },
    [cx, cy, radius, margin]
  )

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    const tooltip = d3.select(tooltipRef.current)
    const innerCx = cx + margin
    const innerCy = cy + margin

    // Clear previous content
    svg.selectAll("*").remove()

    // Defs for gradient
    const defs = svg.append("defs")

    const gradient = defs
      .append("radialGradient")
      .attr("id", "orbita-gradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%")

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#8B5CF6")
      .attr("stop-opacity", 0.6)

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3B82F6")
      .attr("stop-opacity", 0.15)

    // Draw background concentric pentagons (grid)
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0]
    const gridGroup = svg.append("g").attr("class", "grid")

    levels.forEach((level) => {
      const points = DIMENSIONS.map((dim) => {
        const p = getPoint(dim, level)
        return `${p.x},${p.y}`
      }).join(" ")

      gridGroup
        .append("polygon")
        .attr("points", points)
        .attr("fill", "none")
        .attr("stroke", "var(--orbita-grid, rgba(148, 163, 184, 0.2))")
        .attr("stroke-width", level === 1.0 ? 2 : 1)
        .attr("opacity", level === 1.0 ? 0.5 : 0.3)
    })

    // Draw axes
    const axesGroup = svg.append("g").attr("class", "axes")

    DIMENSIONS.forEach((dim) => {
      const outer = getPoint(dim, 1.0)
      axesGroup
        .append("line")
        .attr("x1", innerCx)
        .attr("y1", innerCy)
        .attr("x2", outer.x)
        .attr("y2", outer.y)
        .attr("stroke", "var(--orbita-axis, rgba(148, 163, 184, 0.25))")
        .attr("stroke-width", 1)
    })

    // Draw axis labels
    const labelsGroup = svg.append("g").attr("class", "labels")

    DIMENSIONS.forEach((dim) => {
      const outer = getPoint(dim, 1.1)
      const label = DIMENSION_LABELS[dim]

      labelsGroup
        .append("text")
        .attr("x", outer.x)
        .attr("y", outer.y)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "var(--orbita-label, rgba(148, 163, 184, 0.8))")
        .attr("font-size", "12px")
        .attr("font-family", "system-ui, sans-serif")
        .text(label)
    })

    // Draw data polygon with animation
    const dataPoints = DIMENSIONS.map((dim) => getPoint(dim, scores[dim]))
    const pointsStr = dataPoints.map((p) => `${p.x},${p.y}`).join(" ")

    // Animate from center to final values
    const polygon = svg
      .append("polygon")
      .attr("points", DIMENSIONS.map((dim) => getPoint(dim, 0)).map((p) => `${p.x},${p.y}`).join(" "))
      .attr("fill", "url(#orbita-gradient)")
      .attr("stroke", "url(#orbita-gradient)")
      .attr("stroke-width", 2)
      .attr("opacity", 0)

    const duration = 800
    const delay = 200

    polygon
      .transition()
      .delay(delay)
      .duration(duration)
      .attr("points", pointsStr)
      .attr("opacity", 1)
      .attr("fill-opacity", 0.8)

    // Draw vertex dots with hover
    DIMENSIONS.forEach((dim) => {
      const p = getPoint(dim, scores[dim])

      const dot = svg
        .append("circle")
        .attr("cx", innerCx)
        .attr("cy", innerCy)
        .attr("r", 0)
        .attr("fill", COLORS[dim])
        .attr("stroke", "var(--orbita-dot-stroke, #fff)")
        .attr("stroke-width", 2)
        .attr("opacity", 0)

      dot
        .transition()
        .delay(delay)
        .duration(duration)
        .attr("cx", p.x)
        .attr("cy", p.y)
        .attr("r", 5)
        .attr("opacity", 1)
        .on("end", () => {
          // After animation, add hover interaction
          dot
            .on("mouseenter", (event: MouseEvent) => {
              const score = scores[dim]
              const percentage = Math.round(score * 100)
              tooltip
                .style("opacity", 1)
                .style("left", `${event.pageX + 12}px`)
                .style("top", `${event.pageY - 28}px`)
                .html(
                  `<strong>${DIMENSION_LABELS[dim]}</strong><br/>${percentage}%`
                )

              dot.attr("r", 8).attr("opacity", 1)
            })
            .on("mousemove", (event: MouseEvent) => {
              tooltip
                .style("left", `${event.pageX + 12}px`)
                .style("top", `${event.pageY - 28}px`)
            })
            .on("mouseleave", () => {
              tooltip.style("opacity", 0)
              dot.attr("r", 5)
            })
            .style("cursor", "pointer")
        })
    })

    // Also add hover on the polygon itself
    polygon.on("mouseenter", (event: MouseEvent) => {
      // Show aggregate tooltip on the polygon
      const avgScore =
        DIMENSIONS.reduce((sum, dim) => sum + scores[dim], 0) / DIMENSIONS.length
      const avgPercentage = Math.round(avgScore * 100)
      tooltip
        .style("opacity", 1)
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 28}px`)
        .html(`<strong>Média OCEAN</strong><br/>${avgPercentage}%`)
      polygon.attr("fill-opacity", 0.95)
    })
    polygon.on("mousemove", (event: MouseEvent) => {
      tooltip
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 28}px`)
    })
    polygon.on("mouseleave", () => {
      tooltip.style("opacity", 0)
      polygon.attr("fill-opacity", 0.8)
    })
    polygon.style("cursor", "pointer")

    return () => {
      svg.selectAll("*").interrupt()
    }
  }, [scores, size, cx, cy, radius, margin, getPoint])

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        ref={svgRef}
        width={viewSize}
        height={viewSize}
        className="orbita-chart-svg"
        style={{ overflow: "visible" }}
      />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-50 rounded-lg bg-popover px-3 py-2 text-xs font-medium text-popover-foreground shadow-md backdrop-blur-sm transition-opacity duration-150"
        style={{
          opacity: 0,
          left: 0,
          top: 0,
          border: "1px solid hsl(var(--border))",
        }}
      />
    </div>
  )
}
