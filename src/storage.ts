import { Storage } from "@plasmohq/storage"

import type { JobsByUrl, JobStatus, SavedJob } from "./types"

const storage = new Storage({ area: "local" })
const JOBS_KEY = "jobsByCanonicalUrl"

type StoredJobRecord = Record<string, Omit<SavedJob, "status"> & { status: JobStatus | "skipped" }>

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
  const now = new Date().toISOString()
  const savedJob: SavedJob = {
    ...existing,
    ...job,
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
    lastSeenAt: new Date().toISOString()
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
