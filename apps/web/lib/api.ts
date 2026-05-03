import type { OCEANScores } from "@whyme/shared"

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export type { OCEANScores }

export type ValidateTokenResponse = {
  candidate_id: string
  valid: boolean
}

export type InterviewData = {
  id: string
  candidate_id: string | null
  status: string
  current_step: string | null
  ocean_scores: OCEANScores | null
  accommodations: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type ConvertCandidateData = {
  candidate_id: string
  token: string
  email: string
  password: string
  name: string
}

export type ConvertCandidateResponse = {
  user_id: string
  candidate_id: string
  email: string
  name: string
}

export type UserData = {
  id: string
  email: string
  name: string
  role: string
  company_id?: string
  candidate_id?: string
  created_at: string
}

export type LoginRequest = { email: string; password: string }
export type LoginResponse = {
  access_token: string
  token_type: string
  user: { id: string; email: string; name: string; role: string }
}
export type RegisterRequest = { email: string; password: string; name: string; role: string }
export type RegisterResponse = { id: string; email: string; name: string; role: string }

export type JobData = {
  id: string
  company_id: string
  title: string
  description: string | null
  status: string
  ocean_ideal: OCEANScores | null
  created_at: string
}

export type CandidateProfileData = {
  id: string
  user_id: string
  name: string
  headline: string | null
  location: string | null
  experience_years: number | null
  skills: Record<string, unknown> | null
  ocean_scores: OCEANScores | null
  created_at: string
}

export type CandidateUpdateRequest = {
  name?: string | null
  headline?: string | null
  location?: string | null
  experience_years?: number | null
  skills?: Record<string, unknown> | null
}

export type CandidateMatchData = {
  id: string
  job_id: string
  candidate_id: string
  candidate_name: string
  candidate_headline: string | null
  candidate_experience_years: number | null
  candidate_skills: Record<string, unknown> | null
  candidate_ocean_scores: OCEANScores | null
  score: number
  ocean_breakdown: Record<string, number> | null
  status: string
  created_at: string
}

export type CompanyData = {
  id: string
  user_id: string
  name: string
  description: string | null
  industry: string | null
  culture_vector: string | null
  created_at: string
}

export type CompanyUpdateRequest = {
  name?: string | null
  description?: string | null
  industry?: string | null
  culture_vector?: string | null
}

export type TopCandidateItem = {
  candidate_id: string
  candidate_name: string
  score: number
  job_id: string
  job_title: string
}

export type CompanySummaryData = {
  total_matches: number
  avg_match_score: number
  top_candidates: TopCandidateItem[]
  matches_by_job: Record<string, number>
}

export type NotificationData = {
  id: string
  user_id: string
  match_id: string | null
  type: string
  title: string
  message: string | null
  is_read: boolean
  created_at: string
}

export type MatchDetailItem = {
  id: string
  job_id: string
  job_title: string
  job_description: string | null
  job_ocean_ideal: OCEANScores | null
  company_id: string
  company_name: string
  company_industry: string | null
  candidate_id: string
  score: number
  ocean_breakdown: Record<string, number> | null
  status: string
  created_at: string
}

export type AccommodationsData = {
  visual: boolean
  auditory: boolean
  motor: boolean
  cognitive: boolean
  large_text: boolean
  high_contrast: boolean
  reduced_animations: boolean
  extra_time: boolean
}

export type AccommodationsResponse = {
  candidate_id: string
  accommodations: AccommodationsData | null
}

export type ResumeData = {
  candidate_id: string
  resume_url: string | null
  resume_text: string | null
}

async function apiFetch<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> | undefined),
    },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { detail?: string }).detail ?? `API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function loginUser(data: LoginRequest): Promise<LoginResponse> {
  return apiFetch("/auth/login", { method: "POST", body: JSON.stringify(data) })
}

export function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  return apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) })
}

export function validateToken(token: string): Promise<ValidateTokenResponse> {
  return apiFetch(`/candidates/validate-token?token=${encodeURIComponent(token)}`)
}

export function getCandidateInterview(candidateId: string): Promise<InterviewData> {
  return apiFetch(`/candidates/${encodeURIComponent(candidateId)}/interview`)
}

export function convertCandidate(data: ConvertCandidateData): Promise<ConvertCandidateResponse> {
  return apiFetch("/candidates/convert", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function getCurrentUser(authToken: string): Promise<UserData> {
  return apiFetch("/auth/me", undefined, authToken)
}

export function getCompanyJobs(companyId: string, authToken: string): Promise<JobData[]> {
  return apiFetch(`/jobs/company/${encodeURIComponent(companyId)}`, undefined, authToken)
}

export function getJobMatchDetails(jobId: string, authToken: string): Promise<CandidateMatchData[]> {
  return apiFetch(`/matches/job/${encodeURIComponent(jobId)}/details`, undefined, authToken)
}

export function getCandidateProfile(candidateId: string): Promise<CandidateProfileData> {
  return apiFetch(`/candidates/${encodeURIComponent(candidateId)}`)
}

export function getCandidateMatchDetails(candidateId: string): Promise<MatchDetailItem[]> {
  return apiFetch(`/matches/candidate/${encodeURIComponent(candidateId)}/details`)
}

export function updateCandidateProfile(
  candidateId: string,
  data: CandidateUpdateRequest,
  authToken: string,
): Promise<CandidateProfileData> {
  return apiFetch(
    `/candidates/${encodeURIComponent(candidateId)}`,
    { method: "PATCH", body: JSON.stringify(data) },
    authToken,
  )
}

export function getCompany(companyId: string, authToken: string): Promise<CompanyData> {
  return apiFetch(`/companies/${encodeURIComponent(companyId)}`, undefined, authToken)
}

export function updateCompany(companyId: string, data: CompanyUpdateRequest, authToken: string): Promise<CompanyData> {
  return apiFetch(`/companies/${encodeURIComponent(companyId)}`, { method: "PATCH", body: JSON.stringify(data) }, authToken)
}

export function getCompanySummary(companyId: string, authToken: string): Promise<CompanySummaryData> {
  return apiFetch(`/matches/company/${encodeURIComponent(companyId)}/summary`, undefined, authToken)
}

export function getUserNotifications(userId: string, authToken: string): Promise<NotificationData[]> {
  return apiFetch(`/api/v1/notifications/user/${encodeURIComponent(userId)}`, undefined, authToken)
}

export function updateMatchStatus(
  matchId: string,
  matchStatus: string,
  authToken: string,
): Promise<{ id: string; status: string; message: string }> {
  return apiFetch(
    `/matches/${encodeURIComponent(matchId)}/status`,
    { method: "PATCH", body: JSON.stringify({ status: matchStatus }) },
    authToken,
  )
}

export type JobCreateRequest = {
  company_id: string
  title: string
  description?: string | null
  ocean_ideal?: Record<string, number> | null
}

export type JobUpdateRequest = {
  title?: string
  description?: string | null
  ocean_ideal?: Record<string, number> | null
}

export function createJob(data: JobCreateRequest, authToken: string): Promise<JobData> {
  return apiFetch("/jobs", { method: "POST", body: JSON.stringify(data) }, authToken)
}

export function updateJob(jobId: string, data: JobUpdateRequest, authToken: string): Promise<JobData> {
  return apiFetch(`/jobs/${encodeURIComponent(jobId)}`, { method: "PUT", body: JSON.stringify(data) }, authToken)
}

export function updateJobStatus(jobId: string, jobStatus: string, authToken: string): Promise<JobData> {
  return apiFetch(
    `/jobs/${encodeURIComponent(jobId)}/status`,
    { method: "PATCH", body: JSON.stringify({ status: jobStatus }) },
    authToken,
  )
}

export function getAccommodations(candidateId: string): Promise<AccommodationsResponse> {
  return apiFetch(`/candidates/${encodeURIComponent(candidateId)}/accommodations`)
}

export function updateAccommodations(
  candidateId: string,
  accommodations: AccommodationsData,
): Promise<AccommodationsResponse> {
  return apiFetch(`/candidates/${encodeURIComponent(candidateId)}/accommodations`, {
    method: "PATCH",
    body: JSON.stringify({ accommodations }),
  })
}

// ─── Resume ──────────────────────────────────────────────────────────────────

export async function uploadResume(candidateId: string, file: File): Promise<ResumeData> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_BASE}/candidates/${encodeURIComponent(candidateId)}/resume/upload`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { detail?: string }).detail ?? `API error ${res.status}`)
  }
  return res.json() as Promise<ResumeData>
}

export function getResume(candidateId: string): Promise<ResumeData> {
  return apiFetch(`/candidates/${encodeURIComponent(candidateId)}/resume`)
}

export async function deleteResume(candidateId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/candidates/${encodeURIComponent(candidateId)}/resume`, {
    method: "DELETE",
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { detail?: string }).detail ?? `API error ${res.status}`)
  }
}
