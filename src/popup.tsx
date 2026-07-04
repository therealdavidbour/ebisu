import { useEffect, useMemo, useState } from "react"

import { DEFAULT_ATS_SITES } from "./ats"
import { buildGoogleSearchUrl, buildJobSearchQuery } from "./query"
import { deleteJob, getJobs, upsertJob } from "./storage"
import { getActiveTabInfo, openUrl, type ActiveTabInfo } from "./tabs"
import type { JobsByUrl, JobStatus, SavedJob } from "./types"

import "./style.css"

const STATUSES: JobStatus[] = ["seen", "saved", "skipped", "applied"]

function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function createJob(tab: ActiveTabInfo, status: JobStatus): Omit<SavedJob, "firstSeenAt" | "lastSeenAt"> {
  return {
    id: tab.canonicalUrl,
    url: tab.url,
    canonicalUrl: tab.canonicalUrl,
    title: tab.title,
    source: tab.source,
    status
  }
}

export default function Popup() {
  const [roles, setRoles] = useState("")
  const [remote, setRemote] = useState(true)
  const [days, setDays] = useState("14")
  const [selectedSites, setSelectedSites] = useState(DEFAULT_ATS_SITES)
  const [excludedTerms, setExcludedTerms] = useState("")
  const [showQuery, setShowQuery] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTabInfo | null>(null)
  const [jobs, setJobs] = useState<JobsByUrl>({})
  const [filter, setFilter] = useState<JobStatus | "all">("all")

  async function refresh() {
    const [tab, storedJobs] = await Promise.all([getActiveTabInfo(), getJobs()])
    setActiveTab(tab)
    setJobs(storedJobs)
  }

  useEffect(() => {
    refresh()
  }, [])

  const query = useMemo(
    () =>
      buildJobSearchQuery({
        roles: parseCommaList(roles),
        remote,
        days: Number(days),
        atsSites: selectedSites,
        excludedTerms: parseCommaList(excludedTerms)
      }),
    [days, excludedTerms, remote, roles, selectedSites]
  )

  const currentJob = activeTab ? jobs[activeTab.canonicalUrl] : null
  const visibleJobs = Object.values(jobs)
    .filter((job) => filter === "all" || job.status === filter)
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))

  async function search() {
    if (!query) {
      return
    }

    await openUrl(buildGoogleSearchUrl(query))
  }

  async function markCurrentJob(status: JobStatus) {
    if (!activeTab) {
      return
    }

    await upsertJob(createJob(activeTab, status))
    await refresh()
  }

  async function removeJob(canonicalUrl: string) {
    await deleteJob(canonicalUrl)
    await refresh()
  }

  function toggleSite(site: string) {
    setSelectedSites((current) =>
      current.includes(site) ? current.filter((item) => item !== site) : [...current, site]
    )
  }

  return (
    <main className="popup">
      <section className="panel">
        <h1>Superjob</h1>
        <label>
          Role keywords
          <input
            placeholder="product manager, product owner"
            value={roles}
            onChange={(event) => setRoles(event.currentTarget.value)}
          />
        </label>
        <div className="row">
          <label className="checkbox">
            <input checked={remote} type="checkbox" onChange={(event) => setRemote(event.currentTarget.checked)} />
            Remote
          </label>
          <label>
            Days back
            <input min="1" type="number" value={days} onChange={(event) => setDays(event.currentTarget.value)} />
          </label>
        </div>
        <div>
          <span className="label">ATS sites</span>
          <div className="chips">
            {DEFAULT_ATS_SITES.map((site) => (
              <label className="chip" key={site}>
                <input checked={selectedSites.includes(site)} type="checkbox" onChange={() => toggleSite(site)} />
                {site}
              </label>
            ))}
          </div>
        </div>
        <label>
          Excluded terms
          <input
            placeholder="senior, principal, staff"
            value={excludedTerms}
            onChange={(event) => setExcludedTerms(event.currentTarget.value)}
          />
        </label>
        <div className="primary-actions">
          <button className="secondary" type="button" onClick={() => setShowQuery((current) => !current)}>
            {showQuery ? "Hide query" : "View query"}
          </button>
          <button disabled={!query} onClick={search}>
            Go
          </button>
        </div>
        {showQuery ? <textarea readOnly value={query} /> : null}
      </section>

      <section className="panel">
        <h2>Current page</h2>
        {activeTab ? (
          <>
            <p className="muted">{activeTab.title}</p>
            <p>Status: {currentJob?.status ?? "new"}</p>
            <div className="actions">
              {STATUSES.map((status) => (
                <button key={status} onClick={() => markCurrentJob(status)}>
                  Mark {status}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">Open a regular web page to save it as a job.</p>
        )}
      </section>

      <section className="panel">
        <div className="row between">
          <h2>Jobs</h2>
          <select value={filter} onChange={(event) => setFilter(event.currentTarget.value as JobStatus | "all")}>
            <option value="all">All</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="jobs">
          {visibleJobs.length === 0 ? (
            <p className="muted">No jobs yet.</p>
          ) : (
            visibleJobs.map((job) => (
              <article className="job" key={job.canonicalUrl}>
                <strong>{job.title}</strong>
                <span>{job.source}</span>
                <span>{job.status}</span>
                <div className="actions">
                  <button onClick={() => openUrl(job.url)}>Open</button>
                  <button onClick={() => removeJob(job.canonicalUrl)}>Delete</button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
