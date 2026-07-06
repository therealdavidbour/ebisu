export type JobStatus = "seen" | "saved" | "applied"

export type SavedJob = {
  id: string
  url: string
  canonicalUrl: string
  title: string
  source: string
  listingDate?: string
  status: JobStatus
  firstSeenAt: string
  lastSeenAt: string
}

export type SearchOptions = {
  roles: string[]
  location?: string
  days?: number
  atsSites: string[]
  excludeAggregatorSites?: boolean
  excludedTerms: string[]
}

export type JobsByUrl = Record<string, SavedJob>
