import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function scoreColor(pct: number): string {
  if (pct >= 85) return "#38d391"
  if (pct >= 70) return "#3AB0FF"
  if (pct >= 55) return "#f5b454"
  return "#f06b6b"
}

export const OCEAN_COLORS = {
  O: "#8B5CF6",
  C: "#3B82F6",
  E: "#F59E0B",
  A: "#10B981",
  N: "#EF4444",
} as const

export type OceanDim = keyof typeof OCEAN_COLORS
