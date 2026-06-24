"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// ─── Types ──────────────────────────────────────────────────────────────────

export type NeuralNode = {
  id: string
  type: "sun" | "planet" | "satellite"
  name?: string
  title?: string
  sub?: string
  score?: number
  dept?: string
  level?: string
  color: string
  rgb: [number, number, number]
  size: number
  x: number
  y: number
  bx: number
  by: number
  orbitA?: number
  orbitR?: number
  orbitS?: number
  pulsePh?: number
  planetId?: string
  trail?: { x: number; y: number }[]
  skills?: string[]
  experience?: number
}

export type NeuralSunData = {
  id: string
  name: string
  sub?: string
  desc?: string
  city?: string
}

export type NeuralPlanetData = {
  id: string
  title: string
  sub?: string
  dept?: string
  level?: string
}

export type NeuralSatelliteData = {
  id: string
  name: string
  score: number
  planetId: string
  skills?: string[]
  experience?: number
}

type NeuralTalentMapProps = {
  sun: NeuralSunData
  planets: NeuralPlanetData[]
  satellites: NeuralSatelliteData[]
  onSelectSatellite?: (sat: NeuralSatelliteData) => void
  width?: number
  height?: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const C_CORP: [number, number, number] = [91, 163, 220]
const C_CORP_HEX = "#5BA3DC"
const C_HIGH = "#8CC63F"
const C_MID = "#F4A236"
const C_LOW = "#E05252"

function scoreColor(s: number): string {
  return s >= 80 ? C_HIGH : s >= 65 ? C_MID : C_LOW
}
function scoreRGB(s: number): [number, number, number] {
  if (s >= 80) return [140, 198, 63]
  if (s >= 65) return [244, 162, 54]
  return [224, 82, 82]
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}
const AVATAR_COLORS = [
  "#8B5CF6", "#3AB0FF", "#F59E0B", "#10B981",
  "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6",
]

// ─── Component ──────────────────────────────────────────────────────────────

export default function NeuralTalentMap({
  sun,
  planets: planetData,
  satellites: satelliteData,
  onSelectSatellite,
  width: propW,
  height: propH,
}: NeuralTalentMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Mutable state stored in refs for perf (no React re-renders)
  const sceneRef = useRef<{
    sunNode: NeuralNode | null
    planets: NeuralNode[]
    satellites: NeuralNode[]
    bgDots: { x: number; y: number; r: number; a: number; vx: number; vy: number }[]
    pulses: any[]
    T: number
    timeScale: number
    targetTimeScale: number
    W: number
    H: number
    mouse: { x: number; y: number }
    hovered: NeuralNode | null
    selected: NeuralNode | null
    focusPlanetId: string | null
    mDown: boolean
    mDX: number
    mDY: number
    mDragging: boolean
    mDragRot: number
    cam: { rot: number; px: number; py: number }
    lastClickMs: number
    lastClickNode: NeuralNode | null
    canvas: HTMLCanvasElement | null
    ctx: CanvasRenderingContext2D | null
  }>({
    sunNode: null,
    planets: [],
    satellites: [],
    bgDots: [],
    pulses: [],
    T: 0,
    timeScale: 1,
    targetTimeScale: 1,
    W: 0,
    H: 0,
    mouse: { x: -9999, y: -9999 },
    hovered: null,
    selected: null,
    focusPlanetId: null,
    mDown: false,
    mDX: 0,
    mDY: 0,
    mDragging: false,
    mDragRot: 0,
    cam: { rot: 0, px: 0, py: 0 },
    lastClickMs: 0,
    lastClickNode: null,
    canvas: null,
    ctx: null,
  })

  const tooltipContentRef = useRef<React.ReactNode | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: -999, y: -999 })
  const [tooltipVisible, setTooltipVisible] = useState(false)

  // ── Helpers ──────────────────────────────────────────────────────────────
  const screenToWorld = useCallback((sx: number, sy: number, s: any) => {
    const c = Math.cos(-s.cam.rot), sn = Math.sin(-s.cam.rot)
    const dx = sx - s.cam.px, dy = sy - s.cam.py
    return { x: s.cam.px + dx * c - dy * sn, y: s.cam.py + dx * sn + dy * c }
  }, [])

  const worldToScreen = useCallback((wx: number, wy: number, s: any) => {
    const c = Math.cos(s.cam.rot), sn = Math.sin(s.cam.rot)
    const dx = wx - s.cam.px, dy = wy - s.cam.py
    return { x: s.cam.px + dx * c - dy * sn, y: s.cam.py + dx * sn + dy * c }
  }, [])

  const isVisible = useCallback((node: NeuralNode, s: any) => {
    if (!s.focusPlanetId) return true
    if (node.type === "sun") return true
    if (node.type === "planet") return node.id === s.focusPlanetId
    if (node.type === "satellite") return node.planetId === s.focusPlanetId
    return false
  }, [])

  const nodeAlpha = useCallback((node: NeuralNode, s: any) => {
    if (!s.focusPlanetId) return 1
    if (node.type === "sun") return 0.25
    return isVisible(node, s) ? 1 : 0
  }, [isVisible])

  // ── Build Scene ──────────────────────────────────────────────────────────
  const buildScene = useCallback(() => {
    const s = sceneRef.current
    const canvas = canvasRef.current
    if (!canvas) return
    s.canvas = canvas
    s.ctx = canvas.getContext("2d")
    const ctx = s.ctx
    if (!ctx) return

    const W = propW || canvas.parentElement?.clientWidth || 800
    const H = propH || canvas.parentElement?.clientHeight || 680
    canvas.width = W
    canvas.height = H
    s.W = W
    s.H = H

    s.cam.rot = 0
    s.focusPlanetId = null
    s.selected = null
    s.timeScale = 1
    s.targetTimeScale = 1
    s.T = 0

    const cx = W / 2
    const cy = H / 2
    const sc = Math.min(W, H) / 900

    // Sun
    s.sunNode = {
      id: sun.id,
      type: "sun" as const,
      name: sun.name,
      sub: sun.sub,
      x: cx,
      y: cy,
      bx: cx,
      by: cy,
      pulsePh: 0,
      size: clamp(52 * sc, 34, 80),
      color: C_CORP_HEX,
      rgb: C_CORP,
    }
    s.cam.px = cx
    s.cam.py = cy

    // Planets (jobs)
    const orbitRadii = planetData.map((_, i) => (160 + i * 72) * sc)
    s.planets = planetData.map((job, i) => {
      const orbitR = orbitRadii[i] || orbitRadii[orbitRadii.length - 1]
      const orbitA = (i / planetData.length) * Math.PI * 2 - Math.PI / 2 + Math.random() * 0.3
      const orbitS = (0.0004 + Math.random() * 0.0003) * (i % 2 === 0 ? 1 : -1)
      return {
        id: job.id,
        type: "planet" as const,
        title: job.title,
        dept: job.dept,
        level: job.level,
        sub: job.sub,
        x: cx + Math.cos(orbitA) * orbitR,
        y: cy + Math.sin(orbitA) * orbitR,
        bx: cx + Math.cos(orbitA) * orbitR,
        by: cy + Math.sin(orbitA) * orbitR,
        orbitA,
        orbitR,
        orbitS,
        pulsePh: Math.random() * Math.PI * 2,
        color: C_CORP_HEX,
        rgb: C_CORP,
        size: clamp(13 * sc, 9, 18),
      }
    })

    // Satellites (candidates)
    s.satellites = satelliteData.map((cand, i) => {
      const planetIndex = s.planets.findIndex((p) => p.id === cand.planetId)
      const planet = planetIndex >= 0 ? s.planets[planetIndex] : s.planets[0]
      if (!planet) return null

      const satCount = s.satellites.filter((x) => x.planetId === planet.id).length
      const orbitR = clamp((44 + satCount * 16) * sc, 30, 100)
      const orbitA = Math.random() * Math.PI * 2
      const orbitS = (0.0014 + Math.random() * 0.001) * (cand.score > 80 ? 1.15 : 1) * (Math.random() > 0.5 ? 1 : -1)
      const color = scoreColor(cand.score)

      return {
        id: cand.id,
        type: "satellite" as const,
        name: cand.name,
        score: cand.score,
        skills: cand.skills,
        experience: cand.experience,
        planetId: planet.id,
        color,
        rgb: scoreRGB(cand.score),
        x: planet.x + Math.cos(orbitA) * orbitR,
        y: planet.y + Math.sin(orbitA) * orbitR,
        bx: planet.x + Math.cos(orbitA) * orbitR,
        by: planet.y + Math.sin(orbitA) * orbitR,
        orbitA,
        orbitR,
        orbitS,
        trail: [],
        size: clamp((4.5 + Math.min((cand.experience || 3) / 5, 3.5)) * sc, 3.5, 9),
      }
    }).filter(Boolean) as NeuralNode[]

    // Background stars
    s.bgDots = Array.from({ length: 240 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.1,
      a: Math.random() * 0.4 + 0.05,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
    }))
    s.pulses = []
  }, [sun, planetData, satelliteData, propW, propH])

  // ── Drawing ──────────────────────────────────────────────────────────────
  const glow = useCallback(
    (x: number, y: number, r: number, rgb: [number, number, number], a: number, ctx: CanvasRenderingContext2D) => {
      if (r <= 0) return
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`)
      g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    },
    [],
  )

  const draw = useCallback(() => {
    const s = sceneRef.current
    const ctx = s.ctx
    if (!ctx) return
    const { W, H, cam, sunNode, planets, satellites, bgDots, pulses, T } = s

    // Background
    ctx.fillStyle = "#03060F"
    ctx.fillRect(0, 0, W, H)

    // Center fog
    const fog = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6)
    fog.addColorStop(0, "rgba(91,163,220,0.03)")
    fog.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = fog
    ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = "rgba(91,163,220,0.02)"
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 70) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let y = 0; y < H; y += 70) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }

    // Background stars
    bgDots.forEach((d) => {
      ctx.fillStyle = `rgba(91,163,220,${d.a * 0.25})`
      ctx.beginPath()
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
      ctx.fill()
    })

    // Camera transform
    ctx.save()
    ctx.translate(cam.px, cam.py)
    ctx.rotate(cam.rot)
    ctx.translate(-cam.px, -cam.py)

    // Planet orbit rings
    planets.forEach((p) => {
      const da = nodeAlpha(p, s)
      if (!da) return
      ctx.strokeStyle = `rgba(91,163,220,${0.06 * da})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(sunNode!.x, sunNode!.y, p.orbitR!, 0, Math.PI * 2)
      ctx.stroke()
    })

    // Satellite orbit rings
    planets.forEach((planet) => {
      const pda = nodeAlpha(planet, s)
      if (!pda) return
      const radii = new Set<number>()
      satellites
        .filter((sat) => sat.planetId === planet.id && isVisible(sat, s))
        .forEach((sat) => radii.add(Math.round((sat.orbitR || 44) / 8) * 8))
      radii.forEach((r) => {
        ctx.strokeStyle = `rgba(91,163,220,${0.07 * pda})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(planet.x, planet.y, r, 0, Math.PI * 2)
        ctx.stroke()
      })
    })

    // Connections satellite → planet
    satellites.forEach((sat) => {
      const da = nodeAlpha(sat, s)
      if (!da) return
      const planet = planets.find((p) => p.id === sat.planetId)
      if (!planet || !isVisible(planet, s)) return
      const hov = s.hovered === sat || s.hovered === planet
      const base = ((sat.score || 50) / 100) * 0.28
      ctx.strokeStyle = `rgba(${sat.rgb[0]},${sat.rgb[1]},${sat.rgb[2]},${hov ? base * 4.5 : base * da})`
      ctx.lineWidth = hov ? 1.3 : 0.7
      ctx.beginPath()
      ctx.moveTo(sat.x, sat.y)
      ctx.lineTo(planet.x, planet.y)
      ctx.stroke()
    })

    // Connections planet → sun
    planets.forEach((p) => {
      const da = nodeAlpha(p, s)
      if (!da) return
      const hov = s.hovered === p || s.hovered === sunNode
      ctx.strokeStyle = `rgba(91,163,220,${hov ? 0.3 : 0.08 * da})`
      ctx.lineWidth = hov ? 1.5 : 0.8
      ctx.setLineDash([5, 10])
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(sunNode!.x, sunNode!.y)
      ctx.stroke()
      ctx.setLineDash([])
    })

    // Satellite trails
    satellites.forEach((sat) => {
      const da = nodeAlpha(sat, s)
      if (!da || !sat.trail || sat.trail.length < 2) return
      for (let i = 1; i < sat.trail.length; i++) {
        const f = i / sat.trail.length
        ctx.strokeStyle = `rgba(${sat.rgb[0]},${sat.rgb[1]},${sat.rgb[2]},${f * 0.22 * da})`
        ctx.lineWidth = f * sat.size * 0.9
        ctx.beginPath()
        ctx.moveTo(sat.trail[i - 1].x, sat.trail[i - 1].y)
        ctx.lineTo(sat.trail[i].x, sat.trail[i].y)
        ctx.stroke()
      }
    })

    // Pulses
    pulses.forEach((p: any) => {
      glow(p.x, p.y, p.sz * 4, p.rgb, 0.45, ctx)
      ctx.fillStyle = `rgba(${p.rgb[0]},${p.rgb[1]},${p.rgb[2]},0.9)`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2)
      ctx.fill()
    })

    // ── SUN ──
    if (sunNode) {
      const da = s.focusPlanetId ? 0.25 : 1
      const pulse = Math.sin(sunNode.pulsePh || 0) * 0.5 + 0.5
      const isHov = s.hovered === sunNode
      const isSel = s.selected === sunNode

      ctx.globalAlpha = da
      glow(sunNode.x, sunNode.y, sunNode.size * (10 + pulse * 5), C_CORP, 0.06, ctx)
      glow(sunNode.x, sunNode.y, sunNode.size * 5, C_CORP, 0.12, ctx)
      glow(sunNode.x, sunNode.y, sunNode.size * 3, C_CORP, isSel ? 0.55 : isHov ? 0.45 : 0.28, ctx)

      // Corona rings
      for (let ri = 0; ri < 4; ri++) {
        ctx.save()
        ctx.translate(sunNode.x, sunNode.y)
        ctx.rotate(T * (0.002 + ri * 0.0015) * (ri % 2 ? 1 : -1))
        ctx.strokeStyle = `rgba(${C_CORP[0]},${C_CORP[1]},${C_CORP[2]},${(0.22 - ri * 0.05 + pulse * 0.07) * da})`
        ctx.lineWidth = 1
        ctx.setLineDash(ri === 0 ? [] : [5, 9 + ri * 3])
        ctx.beginPath()
        ctx.arc(0, 0, sunNode.size * (2.0 + ri * 0.7), 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      }

      // Body
      const bg = ctx.createRadialGradient(sunNode.x - sunNode.size * 0.3, sunNode.y - sunNode.size * 0.3, 0, sunNode.x, sunNode.y, sunNode.size)
      bg.addColorStop(0, "#ffffff")
      bg.addColorStop(0.2, "#d4eaff")
      bg.addColorStop(0.5, C_CORP_HEX)
      bg.addColorStop(0.85, `rgba(${C_CORP[0]},${C_CORP[1]},${C_CORP[2]},0.7)`)
      bg.addColorStop(1, `rgba(${C_CORP[0]},${C_CORP[1]},${C_CORP[2]},0.3)`)
      ctx.fillStyle = bg
      ctx.beginPath()
      ctx.arc(sunNode.x, sunNode.y, sunNode.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1

      // Label
      ctx.globalAlpha = da * (isHov || isSel ? 1 : 0.85)
      ctx.fillStyle = "#fff"
      ctx.font = `bold ${Math.round(13 * (sunNode.size / 52))}px "Segoe UI",system-ui,sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.shadowColor = C_CORP_HEX
      ctx.shadowBlur = isHov || isSel ? 20 : 12
      ctx.fillText(sunNode.name || "", sunNode.x, sunNode.y + sunNode.size + 11)
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }

    // ── PLANETS ──
    planets.forEach((p) => {
      const da = nodeAlpha(p, s)
      if (!da) return
      const pulse = Math.sin(p.pulsePh || 0) * 0.5 + 0.5
      const isHov = s.hovered === p
      const isSel = s.selected === p

      ctx.globalAlpha = da
      glow(p.x, p.y, p.size * (6 + pulse * 2.5), C_CORP, isHov || isSel ? 0.5 : 0.16, ctx)
      glow(p.x, p.y, p.size * 2.2, C_CORP, isHov || isSel ? 0.7 : 0.3, ctx)

      // Rotating dashed ring
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(-T * 0.004)
      ctx.strokeStyle = `rgba(${C_CORP[0]},${C_CORP[1]},${C_CORP[2]},${(0.25 + pulse * 0.1) * da})`
      ctx.lineWidth = 1
      ctx.setLineDash([3, 7])
      ctx.beginPath()
      ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      // Body
      const bg = ctx.createRadialGradient(p.x - p.size * 0.28, p.y - p.size * 0.28, 0, p.x, p.y, p.size)
      bg.addColorStop(0, "#fff")
      bg.addColorStop(0.3, C_CORP_HEX)
      bg.addColorStop(1, `rgba(${C_CORP[0]},${C_CORP[1]},${C_CORP[2]},0.45)`)
      ctx.fillStyle = bg
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1

      if (isHov || isSel) {
        ctx.globalAlpha = da
        ctx.fillStyle = "#fff"
        ctx.font = 'bold 10px "Segoe UI",system-ui,sans-serif'
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.shadowColor = C_CORP_HEX
        ctx.shadowBlur = 12
        ctx.fillText(p.title || "", p.x, p.y + p.size + 7)
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }
    })

    // ── SATELLITES ──
    satellites.forEach((sat) => {
      const da = nodeAlpha(sat, s)
      if (!da) return
      const isHov = s.hovered === sat
      const isParentHov = s.hovered && s.hovered.id === sat.planetId
      const pulse = Math.sin(T * 0.07 + (sat.orbitA || 0) * 2) * 0.5 + 0.5

      ctx.globalAlpha = da
      glow(sat.x, sat.y, sat.size * (isHov ? 5.5 : isParentHov ? 4.5 : 3 + pulse), sat.rgb, isHov ? 0.8 : isParentHov ? 0.55 : 0.3, ctx)
      ctx.fillStyle = isHov ? "#fff" : sat.color
      ctx.beginPath()
      ctx.arc(sat.x, sat.y, sat.size * (isHov ? 1.8 : 1), 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1

      if (isHov) {
        ctx.fillStyle = "#fff"
        ctx.font = 'bold 11px "Segoe UI",system-ui,sans-serif'
        ctx.textAlign = "center"
        ctx.textBaseline = "bottom"
        ctx.shadowColor = sat.color
        ctx.shadowBlur = 14
        ctx.fillText(sat.name || "", sat.x, sat.y - sat.size - 5)
        ctx.fillStyle = sat.color
        ctx.font = '10px "Segoe UI",system-ui,sans-serif'
        ctx.shadowBlur = 0
        ctx.fillText((sat.score || 0) + "%", sat.x, sat.y - sat.size - 19)
        ctx.shadowBlur = 0
      }
    })

    ctx.restore() // end camera

    // Selection ring (screen space)
    if (s.selected && isVisible(s.selected, s)) {
      const sp = worldToScreen(s.selected.x, s.selected.y, s)
      const r = s.selected.size + (s.selected.type === "sun" ? 26 : s.selected.type === "planet" ? 18 : 13)
      const ringColor = s.selected.type === "satellite" ? s.selected.color : C_CORP_HEX
      ctx.strokeStyle = ringColor + "99"
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 8])
      ctx.beginPath()
      ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = ringColor + "50"
      ctx.beginPath()
      ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [glow, isVisible, nodeAlpha, worldToScreen])

  // ── Update ──────────────────────────────────────────────────────────────
  const update = useCallback(() => {
    const s = sceneRef.current
    s.T++

    s.timeScale = lerp(s.timeScale, s.targetTimeScale, 0.06)

    if (s.sunNode) s.sunNode.pulsePh = (s.sunNode.pulsePh || 0) + 0.014

    s.planets.forEach((p) => {
      p.orbitA = (p.orbitA || 0) + (p.orbitS || 0) * s.timeScale
      p.pulsePh = (p.pulsePh || 0) + 0.01
      p.x = s.sunNode!.x + Math.cos(p.orbitA) * p.orbitR!
      p.y = s.sunNode!.y + Math.sin(p.orbitA) * p.orbitR!
    })

    s.satellites.forEach((sat) => {
      const planet = s.planets.find((p) => p.id === sat.planetId)
      if (!planet) return
      sat.orbitA = (sat.orbitA || 0) + (sat.orbitS || 0) * s.timeScale
      const nx = planet.x + Math.cos(sat.orbitA) * sat.orbitR!
      const ny = planet.y + Math.sin(sat.orbitA) * sat.orbitR!
      if (!sat.trail) sat.trail = []
      sat.trail.push({ x: sat.x, y: sat.y })
      if (sat.trail.length > 14) sat.trail.shift()
      sat.x = nx
      sat.y = ny
    })

    s.bgDots.forEach((d) => {
      d.x = (d.x + d.vx + s.W) % s.W
      d.y = (d.y + d.vy + s.H) % s.H
    })

    // Camera follow
    if (s.selected && !s.mDragging && isVisible(s.selected, s)) {
      const sp = worldToScreen(s.selected.x, s.selected.y, s)
      s.cam.px = lerp(s.cam.px, sp.x, 0.04)
      s.cam.py = lerp(s.cam.py, sp.y, 0.04)
    }

    // Random pulses: satellite → planet
    if (Math.random() < 0.035) {
      const sat = s.satellites[Math.floor(Math.random() * s.satellites.length)]
      if (sat && isVisible(sat, s)) {
        const pl = s.planets.find((p) => p.id === sat.planetId)
        if (pl) {
          s.pulses.push({
            sx: sat.x,
            sy: sat.y,
            ex: pl.x,
            ey: pl.y,
            x: sat.x,
            y: sat.y,
            prog: 0,
            spd: 0.018 + Math.random() * 0.022,
            rgb: sat.rgb,
            sz: 1.8 + Math.random() * 1.8,
          })
        }
      }
    }
    // Random pulses: planet → sun
    if (Math.random() < 0.018) {
      const pl = s.planets[Math.floor(Math.random() * s.planets.length)]
      if (pl && isVisible(pl, s)) {
        s.pulses.push({
          sx: pl.x,
          sy: pl.y,
          ex: s.sunNode!.x,
          ey: s.sunNode!.y,
          x: pl.x,
          y: pl.y,
          prog: 0,
          spd: 0.012 + Math.random() * 0.012,
          rgb: C_CORP,
          sz: 2.8 + Math.random() * 2,
        })
      }
    }

    s.pulses = s.pulses.filter((p: any) => {
      p.prog += p.spd * s.timeScale
      p.x = lerp(p.sx, p.ex, p.prog)
      p.y = lerp(p.sy, p.ey, p.prog)
      return p.prog < 1
    })
  }, [isVisible, worldToScreen])

  // ── Hit Test ────────────────────────────────────────────────────────────
  const hitTest = useCallback(() => {
    const s = sceneRef.current
    const w = screenToWorld(s.mouse.x, s.mouse.y, s)
    // Sun first
    if (s.sunNode && Math.hypot(s.sunNode.x - w.x, s.sunNode.y - w.y) < s.sunNode.size + 24) return s.sunNode
    let best: NeuralNode | null = null
    let bd = Infinity
    for (const n of s.planets) {
      if (!isVisible(n, s)) continue
      const d = Math.hypot(n.x - w.x, n.y - w.y)
      if (d < n.size + 20 && d < bd) {
        bd = d
        best = n
      }
    }
    if (!best) {
      for (const n of s.satellites) {
        if (!isVisible(n, s)) continue
        const d = Math.hypot(n.x - w.x, n.y - w.y)
        if (d < n.size + 14 && d < bd) {
          bd = d
          best = n
        }
      }
    }
    return best
  }, [screenToWorld, isVisible])

  // ── Tooltip Rendering ───────────────────────────────────────────────────
  const renderTooltip = useCallback(
    (node: NeuralNode) => {
      const s = sceneRef.current
      if (node.type === "sun") {
        const allSats = s.satellites
        const avg = allSats.reduce((a, s) => a + (s.score || 0), 0) / (allSats.length || 1)
        const hi = allSats.filter((s) => (s.score || 0) >= 80).length
        const md = allSats.filter((s) => (s.score || 0) >= 65 && (s.score || 0) < 80).length
        const lo = allSats.filter((s) => (s.score || 0) < 65).length
        tooltipContentRef.current = (
          <div>
            <div className="tt-name" style={{ color: C_CORP_HEX }}>
              {node.name}
            </div>
            <div className="tt-sub" style={{ color: C_CORP_HEX }}>
              {node.sub || "Sol"} · Sol
            </div>
            <div className="tt-desc">{node.sub}</div>
            <div className="tt-row">
              <span className="tt-row-l">Vagas abertas</span>
              <span className="tt-row-r" style={{ color: C_CORP_HEX }}>
                {s.planets.length}
              </span>
            </div>
            <div className="tt-row">
              <span className="tt-row-l">Candidatos</span>
              <span className="tt-row-r">{allSats.length}</span>
            </div>
            <div className="tt-row">
              <span className="tt-row-l">Match médio</span>
              <span className="tt-row-r" style={{ color: scoreColor(avg) }}>
                {Math.round(avg)}%
              </span>
            </div>
            <div className="mpills">
              <span className="phi">● {hi} alto</span>
              <span className="pmd">● {md} médio</span>
              <span className="plo">● {lo} parcial</span>
            </div>
          </div>
        )
      } else if (node.type === "planet") {
        const myCands = s.satellites.filter((sat) => sat.planetId === node.id)
        const avg = myCands.reduce((a, s) => a + (s.score || 0), 0) / (myCands.length || 1)
        const hi = myCands.filter((s) => (s.score || 0) >= 80).length
        const md = myCands.filter((s) => (s.score || 0) >= 65 && (s.score || 0) < 80).length
        const lo = myCands.filter((s) => (s.score || 0) < 65).length
        tooltipContentRef.current = (
          <div>
            <div className="tt-name" style={{ color: C_CORP_HEX }}>
              {node.title}
            </div>
            <div className="tt-sub" style={{ color: C_CORP_HEX }}>
              {node.dept || node.sub} · Nível {node.level || "—"}
            </div>
            <div className="tt-row">
              <span className="tt-row-l">Candidatos em órbita</span>
              <span className="tt-row-r">{myCands.length}</span>
            </div>
            <div className="tt-row">
              <span className="tt-row-l">Match médio</span>
              <span className="tt-row-r" style={{ color: scoreColor(avg) }}>
                {Math.round(avg)}%
              </span>
            </div>
            <div className="mpills">
              <span className="phi">● {hi} alto</span>
              <span className="pmd">● {md} médio</span>
              <span className="plo">● {lo} parcial</span>
            </div>
            <hr className="tt-divider" />
            {myCands.map((s) => (
              <div key={s.id} className="scrow">
                <span className="sclbl">{s.name}</span>
                <div className="sctrk">
                  <div className="scfil" style={{ width: `${s.score}%`, background: s.color }} />
                </div>
                <span className="scpct" style={{ color: s.color }}>
                  {s.score}%
                </span>
              </div>
            ))}
            <div className="tt-hint">2× clique → ver só esta vaga</div>
          </div>
        )
      } else {
        const planet = s.planets.find((p) => p.id === node.planetId)
        tooltipContentRef.current = (
          <div>
            <div className="tt-name" style={{ color: node.color }}>
              {node.name}
            </div>
            <div className="tt-sub" style={{ color: node.color }}>
              Candidato · {node.score && node.score >= 80 ? "Match Alto" : node.score && node.score >= 65 ? "Bom Candidato" : "Match Parcial"}
            </div>
            <div className="scrow">
              <span className="sclbl">{planet ? planet.title : "Match"}</span>
              <div className="sctrk">
                <div className="scfil" style={{ width: `${node.score}%`, background: node.color }} />
              </div>
              <span className="scpct" style={{ color: node.color }}>
                {node.score}%
              </span>
            </div>
            {node.skills && node.skills.length > 0 && (
              <div className="tags-wrap">
                <div className="tags-t">Competências</div>
                {node.skills.slice(0, 5).map((c, i) => (
                  <span key={i} className="tag">
                    {c}
                  </span>
                ))}
              </div>
            )}
            {node.experience !== undefined && (
              <div className="tt-exp">{node.experience} anos de experiência</div>
            )}
          </div>
        )
      }
      setTooltipVisible(true)
    },
    [],
  )

  // ── Loop ────────────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    update()
    draw()
    animRef.current = requestAnimationFrame(loop)
  }, [update, draw])

  // ── Init scene + loop ───────────────────────────────────────────────────
  useEffect(() => {
    buildScene()
    animRef.current = requestAnimationFrame(loop)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [buildScene, loop])

  // ── Rebuild on data change ──────────────────────────────────────────────
  useEffect(() => {
    buildScene()
  }, [sun.id, planetData.length, satelliteData.length, buildScene])

  // ── Event handlers ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s = sceneRef.current

    const onMouseDown = (e: MouseEvent) => {
      s.mDown = true
      s.mDX = e.clientX
      s.mDY = e.clientY
      s.mDragging = false
      s.mDragRot = s.cam.rot
      e.preventDefault()
    }

    const onMouseMove = (e: MouseEvent) => {
      s.mouse.x = e.clientX
      s.mouse.y = e.clientY
      if (s.mDown) {
        if (!s.mDragging && Math.hypot(e.clientX - s.mDX, e.clientY - s.mDY) > 5) s.mDragging = true
        if (s.mDragging) {
          const sa = Math.atan2(s.mDY - s.cam.py, s.mDX - s.cam.px)
          const ca = Math.atan2(e.clientY - s.cam.py, e.clientX - s.cam.px)
          s.cam.rot = s.mDragRot + (ca - sa)
        }
      }
      const prev = s.hovered
      s.hovered = hitTest()
      if (s.hovered !== prev) {
        if (s.hovered) {
          canvas.style.cursor = "pointer"
          renderTooltip(s.hovered)
        } else {
          canvas.style.cursor = s.mDragging ? "grabbing" : "crosshair"
          setTooltipVisible(false)
        }
      }
      if (s.hovered) {
        const tw = 250
        const th = 280
        let tx = e.clientX + 24
        let ty = e.clientY - th / 2
        if (tx + tw > s.W - 14) tx = e.clientX - tw - 24
        ty = clamp(ty, 14, s.H - th - 14)
        setTooltipPos({ x: tx, y: ty })
      }
    }

    const onMouseUp = (e: MouseEvent) => {
      if (!s.mDragging) {
        s.mouse.x = e.clientX
        s.mouse.y = e.clientY
        const now = Date.now()
        const target = hitTest()
        const dbl = now - s.lastClickMs < 320 && target === s.lastClickNode && target !== null
        if (dbl) {
          if (target.type === "planet") {
            s.focusPlanetId = target.id
            s.selected = target
            s.targetTimeScale = 0.06
          } else if (target.type === "sun") {
            s.focusPlanetId = null
            s.selected = null
            s.targetTimeScale = 1
          } else {
            s.selected = target
            s.targetTimeScale = 0.06
            if (onSelectSatellite && target.type === "satellite") {
              const satData = satelliteData.find((d) => d.id === target.id)
              if (satData) onSelectSatellite(satData)
            }
          }
        } else {
          if (target) {
            s.selected = target
            s.targetTimeScale = 0.06
          } else {
            s.selected = null
            s.targetTimeScale = 1
          }
        }
        s.lastClickMs = now
        s.lastClickNode = target
      }
      s.mDown = false
      s.mDragging = false
      canvas.style.cursor = s.hovered ? "pointer" : "crosshair"
    }

    const onMouseLeave = () => {
      s.mouse.x = -9999
      s.mouse.y = -9999
      s.hovered = null
      setTooltipVisible(false)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        s.focusPlanetId = null
        s.selected = null
        s.targetTimeScale = 1
      }
    }

    canvas.addEventListener("mousedown", onMouseDown)
    canvas.addEventListener("mousemove", onMouseMove)
    canvas.addEventListener("mouseup", onMouseUp)
    canvas.addEventListener("mouseleave", onMouseLeave)
    document.addEventListener("keydown", onKeyDown)

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown)
      canvas.removeEventListener("mousemove", onMouseMove)
      canvas.removeEventListener("mouseup", onMouseUp)
      canvas.removeEventListener("mouseleave", onMouseLeave)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [hitTest, renderTooltip, satelliteData, onSelectSatellite])

  return (
    <div ref={containerRef} className="relative" style={{ width: propW || "100%", height: propH || 680 }}>
      <canvas ref={canvasRef} className="block" style={{ cursor: "crosshair" }} />

      {/* Stats overlay */}
      <div
        className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between px-7 pb-4 pt-[18px]"
        style={{
          background: "linear-gradient(to bottom,rgba(3,6,15,.92) 0%,transparent 100%)",
          pointerEvents: "none",
        }}
      >
        <div>
          <div className="text-[22px] font-black tracking-wider">
            Wh<span style={{ color: "#8CC63F" }}>?</span>Me
          </div>
          <div className="mt-[3px] text-[9px] uppercase tracking-[3px]" style={{ color: "rgba(255,255,255,.25)" }}>
            Neural Talent Map · Contrate quem vai ficar
          </div>
        </div>
        <StatBox label="Vagas" value={planetData.length} color={C_CORP_HEX} />
        <StatBox label="Candidatos" value={satelliteData.length} color="#fff" />
        <StatBox label="Match Alto" value={satelliteData.filter((s) => s.score >= 80).length} color={C_HIGH} />
        <StatBox label="Match Médio" value={satelliteData.filter((s) => s.score >= 65 && s.score < 80).length} color={C_MID} />
        <StatBox label="Match Parcial" value={satelliteData.filter((s) => s.score < 65).length} color={C_LOW} />
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-50" style={{ pointerEvents: "none" }}>
        <div className="leg-t">Legenda</div>
        <div className="leg-r">
          <span className="leg-d" style={{ background: C_CORP_HEX, width: 16, height: 16, borderRadius: "50%", boxShadow: `0 0 8px ${C_CORP_HEX}50` }} />
          Empresa (Sol)
        </div>
        <div className="leg-r">
          <span className="leg-d" style={{ background: C_CORP_HEX, width: 11, height: 11, boxShadow: `0 0 5px ${C_CORP_HEX}40` }} />
          Vaga (Planeta)
        </div>
        <div className="leg-r">
          <span className="leg-d" style={{ background: C_HIGH, boxShadow: `0 0 5px ${C_HIGH}50` }} />
          Match Alto ≥80%
        </div>
        <div className="leg-r">
          <span className="leg-d" style={{ background: C_MID, boxShadow: `0 0 5px ${C_MID}50` }} />
          Bom 65–79%
        </div>
        <div className="leg-r">
          <span className="leg-d" style={{ background: C_LOW, boxShadow: `0 0 5px ${C_LOW}50` }} />
          Parcial &lt;65%
        </div>
      </div>

      {/* Hints */}
      <div
        className="absolute bottom-6 right-6 z-50 text-right text-[9px] leading-[2.2]"
        style={{ color: "rgba(255,255,255,.16)", pointerEvents: "none" }}
      >
        <b>Hover</b> → detalhes · <b>Clique</b> → selecionar<br />
        <b>Arrastar</b> → girar universo<br />
        <b>2× Planeta</b> → ver só seus candidatos<br />
        <kbd>ESC</kbd> → visão completa
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[200]"
        style={{
          left: tooltipPos.x,
          top: tooltipPos.y,
          opacity: tooltipVisible ? 1 : 0,
          transform: tooltipVisible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.97)",
          transition: "opacity .2s,transform .2s",
          width: 250,
          pointerEvents: "none",
        }}
      >
        <div
          className="rounded-xl bg-[rgba(3,6,15,.97)] px-5 py-[18px] backdrop-blur-[28px]"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.07)" }}
        >
          {tooltipVisible && tooltipContentRef.current}
        </div>
      </div>

      {/* Tooltip styles */}
      <style>{`
        .tt-name{font-size:14px;font-weight:700;margin-bottom:3px}
        .tt-sub{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;opacity:.6}
        .tt-desc{font-size:10px;color:rgba(255,255,255,.35);margin-bottom:12px;line-height:1.6}
        .tt-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;font-size:11px}
        .tt-row-l{color:rgba(255,255,255,.38)}.tt-row-r{font-weight:700}
        .scrow{display:flex;align-items:center;gap:7px;margin-bottom:7px}
        .sclbl{font-size:10px;color:rgba(255,255,255,.35);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .sctrk{width:64px;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}
        .scfil{height:100%;border-radius:2px}
        .scpct{font-size:12px;font-weight:700;width:30px;text-align:right}
        .tags-wrap{margin-top:10px}
        .tags-t{font-size:8px;color:rgba(255,255,255,.22);letter-spacing:2px;text-transform:uppercase;margin-bottom:5px}
        .tag{display:inline-block;padding:2px 7px;border-radius:20px;font-size:9px;margin:2px;background:rgba(91,163,220,.12);border:1px solid rgba(91,163,220,.25);color:#5BA3DC}
        .mpills{display:flex;gap:10px;margin-top:10px;font-size:9px}
        .phi{color:#8CC63F}.pmd{color:#F4A236}.plo{color:#E05252}
        .tt-divider{border:none;border-top:1px solid rgba(255,255,255,.07);margin:10px 0}
        .tt-hint{margin-top:9px;font-size:9px;color:rgba(255,255,255,.2)}
        .tt-exp{margin-top:9px;font-size:9px;color:rgba(255,255,255,.25)}
        .leg-t{font-size:8px;color:rgba(255,255,255,.2);letter-spacing:2px;text-transform:uppercase;margin-bottom:9px}
        .leg-r{display:flex;align-items:center;gap:9px;margin-bottom:7px;font-size:10px;color:rgba(255,255,255,.45)}
        .leg-d{width:9px;height:9px;border-radius:50%;flex-shrink:0}
        kbd{background:rgba(255,255,255,.07);padding:1px 5px;border-radius:3px;font-size:8px}
      `}</style>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-right" style={{ pointerEvents: "none" }}>
      <div className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,.28)" }}>
        {label}
      </div>
      <div className="mt-[2px] text-xl font-bold leading-tight" style={{ color }}>
        {value}
      </div>
    </div>
  )
}
