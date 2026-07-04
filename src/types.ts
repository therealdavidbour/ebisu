export type JobStatus = "seen" | "saved" | "applied"

export type SavedJob = {
  id: string
  url: string
  canonicalUrl: string
  title: string
  source: string
  status: JobStatus
  firstSeenAt: string
  lastSeenAt: string
}

export type SearchOptions = {
  roles: string[]
  remote: boolean
  days?: number
  atsSites: string[]
  excludedTerms: string[]
}

export type JobsByUrl = Record<string, SavedJob>
