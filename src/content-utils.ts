import { DEFAULT_ATS_SITES } from "./ats"
import type { JobStatus, SavedJob } from "./types"
import { getHostname } from "./url"

export const CONTENT_STATUSES: JobStatus[] = ["seen", "saved", "applied"]

export const CONTENT_STATUS_LABELS: Record<JobStatus, string> = {
  seen: "Seen",
  saved: "Saved",
  applied: "Applied"
}

export const CONTENT_STATUS_THEME: Record<JobStatus, string> = {
  seen: "border-color:#b58900;background:rgba(181,137,0,.14);color:#b58900;",
  saved: "border-color:#2aa198;background:rgba(42,161,152,.14);color:#2aa198;",
  applied: "border-color:#859900;background:rgba(133,153,0,.14);color:#859900;"
}

export type ContentJobTarget = {
  url: string
  canonicalUrl: string
  title: string
  source: string
  listingDate?: string
}

export function isSupportedAtsUrl(url: string): boolean {
  const hostname = getHostname(url)
  return DEFAULT_ATS_SITES.some((site) => hostname === site || hostname.endsWith(`.${site}`))
}

export function createSavedJob(target: ContentJobTarget, status: JobStatus): Omit<SavedJob, "firstSeenAt" | "lastSeenAt"> {
  return {
    id: target.canonicalUrl,
    url: target.url,
    canonicalUrl: target.canonicalUrl,
    title: target.title,
    source: target.source,
    ...(target.listingDate ? { listingDate: target.listingDate } : {}),
    status
  }
}
