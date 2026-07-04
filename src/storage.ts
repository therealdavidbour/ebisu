import { Storage } from "@plasmohq/storage"

import type { JobsByUrl, JobStatus, SavedJob } from "./types"

const storage = new Storage({ area: "local" })
const JOBS_KEY = "jobsByCanonicalUrl"

export async function getJobs(): Promise<JobsByUrl> {
  return (await storage.get<JobsByUrl>(JOBS_KEY)) ?? {}
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
