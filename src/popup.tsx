import { useEffect, useMemo, useState, type KeyboardEvent } from "react"
import { ExternalLink, MapPin, Search, Trash2 } from "lucide-react"

import { DEFAULT_ATS_SITES } from "./ats"
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Checkbox } from "./components/ui/checkbox"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Textarea } from "./components/ui/textarea"
import { getLocationSuggestions } from "./locations"
import { buildGoogleSearchUrl, buildJobSearchQuery } from "./query"
import { deleteJob, getJobs, upsertJob } from "./storage"
import { openUrl } from "./tabs"
import type { JobsByUrl, JobStatus, SavedJob } from "./types"

import "./style.css"

const ACTIONABLE_STATUSES: JobStatus[] = ["seen", "saved", "applied"]
const CONTROL_TABS = ["search", "saved", "advanced"] as const

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

export default function Popup() {
  const [roles, setRoles] = useState("")
  const [location, setLocation] = useState("")
  const [locationFocused, setLocationFocused] = useState(false)
  const [highlightedLocationIndex, setHighlightedLocationIndex] = useState(0)
  const [days, setDays] = useState("14")
  const [selectedSites, setSelectedSites] = useState(DEFAULT_ATS_SITES)
  const [excludedTerms, setExcludedTerms] = useState("")
  const [activeTab, setActiveTab] = useState<ControlTab>("search")
  const [showAtsSites, setShowAtsSites] = useState(false)
  const [showQuery, setShowQuery] = useState(false)
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
        excludedTerms: parseCommaList(excludedTerms)
      }),
    [days, excludedTerms, location, roles, selectedSites]
  )

  const selectedSiteCount = selectedSites.length
  const locationSuggestions = useMemo(() => getLocationSuggestions(location), [location])
  const showLocationSuggestions = locationFocused && locationSuggestions.length > 0
  const visibleJobs = Object.values(jobs)
    .filter((job) => filter === "all" || job.status === filter)
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))

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

  return (
    <main className="min-w-[400px] max-w-[400px] space-y-3 bg-[radial-gradient(circle_at_top_left,hsl(175_59%_40%_/_0.18),transparent_34%),linear-gradient(180deg,#002b36,#073642)] p-3">
      <section className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-shrine">
        <div className="relative p-4">
          <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
          <div className="relative">
            <div className="max-w-[320px]">
              <h1 className="text-2xl font-black tracking-tight text-[#fdf6e3]">Ebisu</h1>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Uncovering jobs before they make it to LinkedIn, Dice, Indeed, and other aggregate search engines.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Card className="border-primary/15 bg-card/95">
        <div className="flex border-b border-primary/15 px-2 pt-2">
          {CONTROL_TABS.map((tab) => {
            const isActive = activeTab === tab

            return (
              <button
                key={tab}
                type="button"
                className={`relative rounded-t-xl px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-background text-[#fdf6e3] shadow-sm"
                    : "text-muted-foreground hover:bg-background/60 hover:text-[#fdf6e3]"
                }`}
                onClick={() => {
                  setActiveTab(tab)
                  setLocationFocused(false)
                }}
              >
                {tab === "search" ? "Search" : tab === "saved" ? "History" : "Advanced Settings"}
                {isActive ? <span className="absolute inset-x-0 bottom-0 h-px bg-background" /> : null}
              </button>
            )
          })}
        </div>

        <CardContent className="p-4 pt-4">
          <section className="scrollbar-thin h-[320px] overflow-y-auto pr-1">
            {activeTab === "search" ? (
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
            ) : activeTab === "saved" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold leading-none tracking-tight text-[#fdf6e3]">History</h3>
                    <p className="text-sm text-muted-foreground">{visibleJobs.length} visible catches</p>
                  </div>
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
                          </div>
                          <Badge variant="outline" className={STATUS_CLASSES[job.status]}>
                            {STATUS_LABELS[job.status]}
                          </Badge>
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
            ) : (
              <section className="space-y-3 rounded-xl border bg-background p-3">
                <h3 className="text-sm font-semibold text-[#fdf6e3]">Advanced Settings</h3>

                <div className="space-y-1.5">
                  <Label htmlFor="days">Days back</Label>
                  <Input
                    id="days"
                    min="1"
                    type="number"
                    value={days}
                    onChange={(event) => setDays(event.currentTarget.value)}
                  />
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

                <div className="space-y-1.5">
                  <Label>ATS sites</Label>
                  <div className="relative">
                    <Button
                      className="w-full justify-between"
                      variant="outline"
                      type="button"
                      onClick={() => setShowAtsSites((current) => !current)}
                    >
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
            )}
          </section>
        </CardContent>
      </Card>
    </main>
  )
}
