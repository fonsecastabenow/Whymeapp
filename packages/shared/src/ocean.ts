import { z } from "zod"

export const DIMENSIONS = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "neuroticism",
] as const

export type OCEANDimension = (typeof DIMENSIONS)[number]

export const OCEANScoresSchema = z.object({
  openness: z.number().min(0).max(1),
  conscientiousness: z.number().min(0).max(1),
  extraversion: z.number().min(0).max(1),
  agreeableness: z.number().min(0).max(1),
  neuroticism: z.number().min(0).max(1),
})

export type OCEANScores = z.infer<typeof OCEANScoresSchema>

export const DIMENSION_LABELS: Record<OCEANDimension, string> = {
  openness: "Abertura",
  conscientiousness: "Conscienciosidade",
  extraversion: "Extroversão",
  agreeableness: "Amabilidade",
  neuroticism: "Neuroticismo",
}

export const emptyOCEANScores = (): OCEANScores => ({
  openness: 0,
  conscientiousness: 0,
  extraversion: 0,
  agreeableness: 0,
  neuroticism: 0,
})
