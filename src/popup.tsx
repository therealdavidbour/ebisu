import { useEffect, useMemo, useState, type KeyboardEvent } from "react"
import { CircleHelp, Download, ExternalLink, MapPin, Search, Trash2 } from "lucide-react"

import { DEFAULT_ATS_SITES } from "./ats"
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Checkbox } from "./components/ui/checkbox"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Textarea } from "./components/ui/textarea"
import { getLocationSuggestions } from "./locations"
import { DEFAULT_AGGREGATOR_EXCLUSION_SITES, buildGoogleSearchUrl, buildJobSearchQuery } from "./query"
import { clearJobs, deleteJob, getJobs, updateJobStatus } from "./storage"
import { openUrl } from "./tabs"
import type { JobsByUrl, JobStatus, SavedJob } from "./types"

import "./style.css"

const ACTIONABLE_STATUSES: JobStatus[] = ["seen", "saved", "applied"]
const CONTROL_TABS = ["search", "saved", "advanced"] as const
const HELP_URL = "https://therealdavidbour.github.io/ebisu"

type ControlTab = (typeof CONTROL_TABS)[number]

const STATUS_LABELS: Record<JobStatus, string> = {
  seen: "Seen",
  saved: "Saved",
  applied: "Applied"
}

const STATUS_CLASSES: Record<JobStatus, string> = {
  seen: "border-[#b58900]/50 bg-[#b58900]/15 text-[#b58900]",
  saved: "border-[#2aa198]/50 bg-[#2aa198]/15 text-[#2aa198]",
  applied: "border-[#859900]/50 bg-[#859900]/15 text-[#859900]"
}

function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatHistoryDate(value: string): string {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsed)
}

function escapeCsvValue(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }

  return value
}

function buildHistoryCsv(jobs: SavedJob[]): string {
  const rows = [
    ["title", "source", "status", "listingDate", "capturedAt", "lastUpdatedAt", "url", "canonicalUrl"],
    ...jobs.map((job) => [
      job.title,
      job.source,
      job.status,
      job.listingDate ?? "",
      job.firstSeenAt,
      job.lastSeenAt,
      job.url,
      job.canonicalUrl
    ])
  ]

  return rows.map((row) => row.map((value) => escapeCsvValue(value)).join(",")).join("\n")
}

function getNextStatus(status: JobStatus): JobStatus {
  const currentIndex = ACTIONABLE_STATUSES.indexOf(status)
  return ACTIONABLE_STATUSES[(currentIndex + 1) % ACTIONABLE_STATUSES.length]
}

export default function Popup() {
  const [roles, setRoles] = useState("")
  const [location, setLocation] = useState("")
  const [locationFocused, setLocationFocused] = useState(false)
  const [highlightedLocationIndex, setHighlightedLocationIndex] = useState(0)
  const [days, setDays] = useState("1")
  const [selectedSites, setSelectedSites] = useState(DEFAULT_ATS_SITES)
  const [excludeAggregatorSites, setExcludeAggregatorSites] = useState(true)
  const [excludedTerms, setExcludedTerms] = useState("")
  const [activeTab, setActiveTab] = useState<ControlTab>("search")
  const [showAtsSites, setShowAtsSites] = useState(false)
  const [showQuery, setShowQuery] = useState(false)
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false)
  const [jobs, setJobs] = useState<JobsByUrl>({})
  const [filter, setFilter] = useState<JobStatus | "all">("all")

  async function refresh() {
    setJobs(await getJobs())
  }

  useEffect(() => {
    refresh()
  }, [])

  const query = useMemo(
    () =>
      buildJobSearchQuery({
        roles: parseCommaList(roles),
        location,
        days: Number(days),
        atsSites: selectedSites,
        excludeAggregatorSites,
        excludedTerms: parseCommaList(excludedTerms)
      }),
    [days, excludeAggregatorSites, excludedTerms, location, roles, selectedSites]
  )

  const allJobs = Object.values(jobs).sort((a, b) => {
    const firstSeenComparison = b.firstSeenAt.localeCompare(a.firstSeenAt)

    if (firstSeenComparison !== 0) {
      return firstSeenComparison
    }

    return b.lastSeenAt.localeCompare(a.lastSeenAt)
  })
  const selectedSiteCount = selectedSites.length
  const hasHistory = allJobs.length > 0
  const locationSuggestions = useMemo(() => getLocationSuggestions(location), [location])
  const showLocationSuggestions = locationFocused && locationSuggestions.length > 0
  const visibleJobs = allJobs
    .filter((job) => filter === "all" || job.status === filter)

  async function search() {
    if (!query) {
      return
    }

    await openUrl(buildGoogleSearchUrl(query))
  }

  async function removeJob(canonicalUrl: string) {
    await deleteJob(canonicalUrl)
    await refresh()
  }

  async function setHistoryStatus(canonicalUrl: string, status: JobStatus) {
    await updateJobStatus(canonicalUrl, status)
    await refresh()
  }

  async function cycleHistoryStatus(job: SavedJob) {
    await setHistoryStatus(job.canonicalUrl, getNextStatus(job.status))
  }

  async function clearHistory() {
    await clearJobs()
    setShowClearHistoryConfirm(false)
    await refresh()
  }

  function exportHistoryCsv() {
    if (allJobs.length === 0) {
      return
    }

    const csv = buildHistoryCsv(allJobs)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const date = new Date().toISOString().slice(0, 10)

    link.href = downloadUrl
    link.download = `ebisu-history-${date}.csv`
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(downloadUrl)
  }

  function toggleSite(site: string) {
    setSelectedSites((current) =>
      current.includes(site) ? current.filter((item) => item !== site) : [...current, site]
    )
  }

  function selectLocationSuggestion(value: string) {
    setLocation(value)
    setLocationFocused(false)
    setHighlightedLocationIndex(0)
  }

  function handleLocationChange(value: string) {
    setLocation(value)
    setLocationFocused(true)
  }

  function handleLocationKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showLocationSuggestions) {
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setHighlightedLocationIndex((current) => (current + 1) % locationSuggestions.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlightedLocationIndex((current) =>
        current === 0 ? locationSuggestions.length - 1 : current - 1
      )
      return
    }

    if (event.key === "Enter") {
      const suggestion = locationSuggestions[highlightedLocationIndex]

      if (!suggestion) {
        return
      }

      event.preventDefault()
      selectLocationSuggestion(suggestion.value)
      return
    }

    if (event.key === "Escape") {
      setLocationFocused(false)
    }
  }

  useEffect(() => {
    setHighlightedLocationIndex(0)
  }, [location])

  function renderTabContent(tab: ControlTab) {
    if (tab === "search") {
      return (
        <div className="space-y-3">
          <div className="relative w-full max-w-full overflow-x-clip">
            <div className="overflow-hidden rounded-[1.4rem] border border-primary/30 bg-background/90 shadow-sm transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/25">
              <div className="flex min-w-0 items-center gap-2 px-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  id="roles"
                  placeholder="Job title, keywords, or company"
                  value={roles}
                  onChange={(event) => setRoles(event.currentTarget.value)}
                  className="min-w-0 h-12 rounded-none border-0 bg-transparent px-0 text-[13px] shadow-none placeholder:text-[13px] focus-visible:ring-0"
                />
              </div>
              <div className="mx-3 h-px bg-border" />
              <div className="flex min-w-0 items-center gap-2 px-3">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="City, state, or remote"
                  value={location}
                  onChange={(event) => handleLocationChange(event.currentTarget.value)}
                  onFocus={() => setLocationFocused(true)}
                  onClick={() => setLocationFocused(true)}
                  onBlur={() => window.setTimeout(() => setLocationFocused(false), 120)}
                  onKeyDown={handleLocationKeyDown}
                  className="min-w-0 h-11 rounded-none border-0 bg-transparent px-0 text-[13px] shadow-none placeholder:text-[13px] focus-visible:ring-0"
                />
              </div>
            </div>

            {showLocationSuggestions ? (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 w-full max-w-full overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-shrine">
                <div className="scrollbar-thin grid max-h-64 gap-px overflow-y-auto bg-border/60 p-px">
                  {locationSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.value}
                      type="button"
                      className={`flex w-full min-w-0 items-center justify-between gap-3 bg-card px-3 py-2.5 text-left transition-colors ${
                        index === highlightedLocationIndex ? "bg-muted" : "hover:bg-muted"
                      }`}
                      onMouseDown={(event) => {
                        event.preventDefault()
                        selectLocationSuggestion(suggestion.value)
                      }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-[#fdf6e3]">{suggestion.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">{suggestion.detail}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Button className="w-full" disabled={!query} onClick={search}>
              Go
            </Button>
          </div>
        </div>
      )
    }

    if (tab === "saved") {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold leading-none tracking-tight text-[#fdf6e3]">History</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => setShowClearHistoryConfirm(true)}
                aria-label="Clear Ebisu history"
                title="Clear Ebisu history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                type="button"
                disabled={allJobs.length === 0}
                onClick={exportHistoryCsv}
                aria-label="Export history as CSV"
                title="Export history as CSV"
              >
                <Download className="h-4 w-4" />
              </Button>
              <select
                className="h-9 w-[130px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={filter}
                onChange={(event) => setFilter(event.currentTarget.value as JobStatus | "all")}
              >
                <option value="all">All</option>
                {ACTIONABLE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="scrollbar-thin grid max-h-[252px] gap-2 overflow-auto pr-1">
            {visibleJobs.length === 0 ? (
              <p className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">No jobs yet.</p>
            ) : (
              visibleJobs.map((job) => (
                <article className="rounded-xl border bg-background p-3" key={job.canonicalUrl}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <strong className="line-clamp-2 text-sm leading-5">{job.title}</strong>
                      <p className="truncate text-xs text-muted-foreground">{job.source}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {job.listingDate ? `Listed: ${job.listingDate}` : `Captured: ${formatHistoryDate(job.firstSeenAt)}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${STATUS_CLASSES[job.status]}`}
                      onClick={() => {
                        void cycleHistoryStatus(job)
                      }}
                      aria-label={`Change status from ${STATUS_LABELS[job.status]}`}
                      title={`Click to change status from ${STATUS_LABELS[job.status]}`}
                    >
                      {STATUS_LABELS[job.status]}
                    </button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button className="gap-1.5" variant="outline" size="sm" onClick={() => openUrl(job.url)}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </Button>
                    <Button className="gap-1.5" variant="ghost" size="sm" onClick={() => removeJob(job.canonicalUrl)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )
    }

    return (
      <section className="space-y-3 rounded-xl border bg-background p-3">
        <h3 className="text-sm font-semibold text-[#fdf6e3]">Advanced Settings</h3>

        <div className="space-y-1.5">
          <Label htmlFor="days">Days back</Label>
          <Input id="days" min="1" type="number" value={days} onChange={(event) => setDays(event.currentTarget.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="excludedTerms">Excluded terms</Label>
          <Input
            id="excludedTerms"
            placeholder="senior, principal, staff"
            value={excludedTerms}
            onChange={(event) => setExcludedTerms(event.currentTarget.value)}
          />
        </div>

        <div className="space-y-2 rounded-lg border border-border/80 bg-card/40 p-2.5">
          <label className="flex cursor-pointer items-start gap-2 text-sm leading-5">
            <Checkbox
              id="excludeAggregatorSites"
              checked={excludeAggregatorSites}
              onCheckedChange={(checked) => setExcludeAggregatorSites(checked === true)}
            />
            <span>
              <span className="block font-medium text-[#fdf6e3]">Exclude job aggregators</span>
              <span className="block text-xs text-muted-foreground">
                Adds -site filters for {DEFAULT_AGGREGATOR_EXCLUSION_SITES.join(", ")}.
              </span>
            </span>
          </label>
        </div>

        <div className="space-y-1.5">
          <Label>ATS sites</Label>
          <div className="relative">
            <Button className="w-full justify-between" variant="outline" type="button" onClick={() => setShowAtsSites((current) => !current)}>
              <span>{selectedSiteCount} selected</span>
              <span className="text-muted-foreground">Select sites</span>
            </Button>

            {showAtsSites ? (
              <div className="mt-2 grid gap-2 rounded-md border bg-card p-2 shadow-shrine">
                {DEFAULT_ATS_SITES.map((site) => (
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted" key={site}>
                    <Checkbox checked={selectedSites.includes(site)} onCheckedChange={() => toggleSite(site)} />
                    {site}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <Button className="w-full" variant="link" size="sm" type="button" onClick={() => setShowQuery((current) => !current)}>
          {showQuery ? "Hide query" : "View query"}
        </Button>

        {showQuery ? (
          <div className="space-y-1.5">
            <Label htmlFor="query">Generated query</Label>
            <Textarea id="query" readOnly value={query} className="min-h-28 font-mono text-xs leading-5" />
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <main className="min-w-[400px] max-w-[400px] space-y-3 bg-[linear-gradient(180deg,#111c24,#15222b)] p-3 text-[#b8bcc0]">
      <section className="overflow-hidden rounded-md border border-[#2e6070] bg-card shadow-[0_10px_30px_-18px_rgba(0,0,0,0.7)]">
        <div className="relative px-4 py-3.5">
          <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#2e6070]/20 blur-2xl" />
          <div className="relative text-center">
            <h1 className="text-[2.55rem] font-black leading-none tracking-[-0.06em] text-[#ff7b57]">Ebisu</h1>
            <p className="mx-auto mt-1 max-w-[340px] text-[13px] leading-5 text-muted-foreground">
              Find jobs at the ATS source before they spread across job aggregators.
            </p>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden rounded-md border border-[#2e6070] bg-card/95 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.7)]">
        <div className="mx-2 mt-2 flex items-end border-b border-[#2e6070]">
          {CONTROL_TABS.map((tab) => {
            const isActive = activeTab === tab

            return (
              <button
                key={tab}
                type="button"
                className={`relative -mb-px border border-b-0 px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-[#2e6070] bg-[#1e4f5d] text-[#cf7a64]"
                    : "border-transparent bg-transparent text-[#2f6b78] hover:border-[#234a56] hover:bg-[#17242c] hover:text-[#7f8f95]"
                }`}
                onClick={() => {
                  setActiveTab(tab)
                  setLocationFocused(false)
                }}
              >
                {tab === "search" ? "Search" : tab === "saved" ? "History" : "Advanced Settings"}
                {isActive ? <span className="absolute inset-x-0 bottom-[-1px] h-px bg-[#1e4f5d]" /> : null}
              </button>
            )
          })}
        </div>

        <CardContent className="relative p-4 pt-4">
          <section className="scrollbar-thin h-[320px] overflow-y-auto pr-1" data-testid="popup-tab-panel">
            <div key={activeTab} className="animate-tab-swipe-in motion-reduce:animate-none">
              {renderTabContent(activeTab)}
            </div>
          </section>
          {showClearHistoryConfirm ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
              <div className="w-full max-w-[320px] rounded-2xl border border-primary/20 bg-card p-4 shadow-shrine" role="dialog" aria-modal="true" aria-labelledby="clear-history-title">
                <h4 id="clear-history-title" className="text-sm font-semibold text-[#fdf6e3]">
                  Clear Ebisu history?
                </h4>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">
                  {hasHistory
                    ? "This will remove all saved jobs from Ebisu history."
                    : "Ebisu history is already empty."}
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setShowClearHistoryConfirm(false)}>
                    {hasHistory ? "Cancel" : "Close"}
                  </Button>
                  {hasHistory ? (
                    <Button
                      type="button"
                      onClick={() => {
                        void clearHistory()
                      }}
                    >
                      Clear Ebisu History
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex">
        <Button
          type="button"
          variant="outline"
          className="h-8 gap-1.5 border-[#2e6070] bg-card/95 px-3 text-sm font-semibold text-[#fdf6e3] hover:border-[#3b7d8f] hover:bg-[#1e4f5d]"
          onClick={() => {
            void openUrl(HELP_URL)
          }}
          aria-label="Open Ebisu help and privacy page"
        >
          <CircleHelp className="h-4 w-4 text-[#4fb7d4]" />
          Help
        </Button>
      </div>
    </main>
  )
}
