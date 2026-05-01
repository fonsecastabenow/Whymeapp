import { z } from "zod"
export * from "./ocean"

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["admin", "recruiter", "candidate"]),
  createdAt: z.coerce.date(),
})

export type User = z.infer<typeof UserSchema>

export const CompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  createdAt: z.coerce.date(),
})

export type Company = z.infer<typeof CompanySchema>

export const CandidateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  bio: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  resumeUrl: z.string().url().optional(),
  createdAt: z.coerce.date(),
})

export type Candidate = z.infer<typeof CandidateSchema>

export const JobSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  remote: z.boolean().default(false),
  status: z.enum(["draft", "open", "closed"]).default("draft"),
  createdAt: z.coerce.date(),
})

export type Job = z.infer<typeof JobSchema>

export const MatchSchema = z.object({
  id: z.string().uuid(),
  candidateId: z.string().uuid(),
  jobId: z.string().uuid(),
  score: z.number().min(0).max(1),
  breakdown: z.record(z.string(), z.number()).optional(),
  createdAt: z.coerce.date(),
})

export type Match = z.infer<typeof MatchSchema>
