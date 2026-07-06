import { Storage } from "@plasmohq/storage"

import type { JobsByUrl, JobStatus, SavedJob } from "./types"

const storage = new Storage({ area: "local" })
const LEGACY_JOBS_KEY = "jobsByCanonicalUrl"
const JOB_KEY_PREFIX = "job:"

type StoredJobRecord = Record<string, Omit<SavedJob, "status"> & { status: JobStatus | "skipped" }>
type StoredJob = Omit<SavedJob, "status"> & { status: JobStatus | "skipped" }

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

function getJobKey(canonicalUrl: string): string {
  return `${JOB_KEY_PREFIX}${canonicalUrl}`
}

function isJobKey(key: string): boolean {
  return key.startsWith(JOB_KEY_PREFIX)
}

function parseStoredJob(value: unknown): StoredJob | undefined {
  if (!value) {
    return undefined
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as StoredJob
    } catch {
      return undefined
    }
  }

  return value as StoredJob
}

function normalizeJob(job: StoredJob): { job: SavedJob; changed: boolean } {
  return {
    job: {
      ...job,
      status: job.status === "skipped" ? "seen" : job.status
    },
    changed: job.status === "skipped"
  }
}

async function migrateLegacyJobs(): Promise<void> {
  const legacyJobs = await storage.get<StoredJobRecord>(LEGACY_JOBS_KEY)

  if (!legacyJobs) {
    return
  }

  const { jobs } = normalizeJobs(legacyJobs)
  const entries = Object.fromEntries(Object.values(jobs).map((job) => [getJobKey(job.canonicalUrl), job]))

  if (Object.keys(entries).length > 0) {
    await storage.setMany(entries)
  }

  await storage.remove(LEGACY_JOBS_KEY)
}

async function getStoredJob(canonicalUrl: string): Promise<SavedJob | undefined> {
  const storedJob = await storage.get<StoredJob>(getJobKey(canonicalUrl))

  if (!storedJob) {
    return undefined
  }

  const { job, changed } = normalizeJob(storedJob)

  if (changed) {
    await storage.set(getJobKey(canonicalUrl), job)
  }

  return job
}

export async function getJobs(): Promise<JobsByUrl> {
  await migrateLegacyJobs()

  const storedItems = await storage.getAll()
  const jobs: JobsByUrl = {}

  for (const [key, value] of Object.entries(storedItems)) {
    if (!isJobKey(key)) {
      continue
    }

    const storedJob = parseStoredJob(value)

    if (!storedJob) {
      continue
    }

    const { job, changed } = normalizeJob(storedJob)
    jobs[job.canonicalUrl] = job

    if (changed) {
      await storage.set(key, job)
    }
  }

  return jobs
}

export async function upsertJob(job: Omit<SavedJob, "firstSeenAt" | "lastSeenAt">): Promise<SavedJob> {
  await migrateLegacyJobs()

  const existing = await getStoredJob(job.canonicalUrl)
  const now = getLocalTimestamp()
  const savedJob: SavedJob = {
    ...existing,
    ...job,
    listingDate: job.listingDate ?? existing?.listingDate,
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: now
  }

  await storage.set(getJobKey(job.canonicalUrl), savedJob)

  return savedJob
}

export async function updateJobStatus(canonicalUrl: string, status: JobStatus): Promise<SavedJob | null> {
  await migrateLegacyJobs()

  const existing = await getStoredJob(canonicalUrl)

  if (!existing) {
    return null
  }

  const updated = {
    ...existing,
    status,
    lastSeenAt: getLocalTimestamp()
  }

  await storage.set(getJobKey(canonicalUrl), updated)

  return updated
}

export async function deleteJob(canonicalUrl: string): Promise<void> {
  await migrateLegacyJobs()
  await storage.remove(getJobKey(canonicalUrl))
}

export async function clearJobs(): Promise<void> {
  const storedItems = await storage.getAll()
  const jobKeys = Object.keys(storedItems).filter(isJobKey)

  if (jobKeys.length > 0) {
    await storage.removeMany(jobKeys)
  }

  await storage.remove(LEGACY_JOBS_KEY)
}
