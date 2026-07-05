import { Storage } from "@plasmohq/storage"

import type { JobsByUrl, JobStatus, SavedJob } from "./types"

const storage = new Storage({ area: "local" })
const JOBS_KEY = "jobsByCanonicalUrl"

type StoredJobRecord = Record<string, Omit<SavedJob, "status"> & { status: JobStatus | "skipped" }>

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

function getLocalTimestamp(date = new Date()): string {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0")
  const offsetMinutes = -date.getTimezoneOffset()
  const offsetSign = offsetMinutes >= 0 ? "+" : "-"
  const absoluteOffsetMinutes = Math.abs(offsetMinutes)
  const offsetHours = pad(Math.floor(absoluteOffsetMinutes / 60))
  const offsetRemainderMinutes = pad(absoluteOffsetMinutes % 60)

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${offsetSign}${offsetHours}:${offsetRemainderMinutes}`
}

function normalizeJobs(jobs: StoredJobRecord): { jobs: JobsByUrl; changed: boolean } {
  let changed = false
  const normalized: JobsByUrl = {}

  for (const [canonicalUrl, job] of Object.entries(jobs)) {
    if (job.status === "skipped") {
      normalized[canonicalUrl] = {
        ...job,
        status: "seen"
      }
      changed = true
      continue
    }

    normalized[canonicalUrl] = {
      ...job,
      status: job.status
    }
  }

  return {
    jobs: normalized,
    changed
  }
}

export async function getJobs(): Promise<JobsByUrl> {
  const storedJobs = (((await storage.get<StoredJobRecord>(JOBS_KEY)) ?? {}) as StoredJobRecord)
  const { jobs, changed } = normalizeJobs(storedJobs)

  if (changed) {
    await storage.set(JOBS_KEY, jobs)
  }

  return jobs
}

export async function upsertJob(job: Omit<SavedJob, "firstSeenAt" | "lastSeenAt">): Promise<SavedJob> {
  const jobs = await getJobs()
  const existing = jobs[job.canonicalUrl]
  const now = getLocalTimestamp()
  const savedJob: SavedJob = {
    ...existing,
    ...job,
    listingDate: job.listingDate ?? existing?.listingDate,
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: now
  }

  jobs[job.canonicalUrl] = savedJob
  await storage.set(JOBS_KEY, jobs)

  return savedJob
}

export async function updateJobStatus(canonicalUrl: string, status: JobStatus): Promise<SavedJob | null> {
  const jobs = await getJobs()
  const existing = jobs[canonicalUrl]

  if (!existing) {
    return null
  }

  const updated = {
    ...existing,
    status,
    lastSeenAt: getLocalTimestamp()
  }

  jobs[canonicalUrl] = updated
  await storage.set(JOBS_KEY, jobs)

  return updated
}

export async function deleteJob(canonicalUrl: string): Promise<void> {
  const jobs = await getJobs()
  delete jobs[canonicalUrl]
  await storage.set(JOBS_KEY, jobs)
}

export async function clearJobs(): Promise<void> {
  await storage.set(JOBS_KEY, {})
}
