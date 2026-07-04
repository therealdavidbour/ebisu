import { useEffect, useMemo, useState } from "react"
import { ExternalLink, Search, Sparkles, Trash2 } from "lucide-react"

import { DEFAULT_ATS_SITES } from "./ats"
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Checkbox } from "./components/ui/checkbox"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Textarea } from "./components/ui/textarea"
import { buildGoogleSearchUrl, buildJobSearchQuery } from "./query"
import { deleteJob, getJobs, upsertJob } from "./storage"
import { getActiveTabInfo, openUrl, type ActiveTabInfo } from "./tabs"
import type { JobsByUrl, JobStatus, SavedJob } from "./types"

import "./style.css"

const STATUSES: JobStatus[] = ["seen", "saved", "skipped", "applied"]

const STATUS_LABELS: Record<JobStatus, string> = {
  seen: "Seen",
  saved: "Saved",
  skipped: "Skipped",
  applied: "Applied"
}

const STATUS_CLASSES: Record<JobStatus, string> = {
  seen: "border-amber-300 bg-amber-100 text-amber-950",
  saved: "border-red-200 bg-red-100 text-red-950",
  skipped: "border-stone-300 bg-stone-100 text-stone-700",
  applied: "border-emerald-300 bg-emerald-100 text-emerald-950"
}

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
    <main className="min-w-[410px] max-w-[410px] space-y-3 bg-[radial-gradient(circle_at_top_left,hsl(44_80%_57%_/_0.2),transparent_32%),linear-gradient(180deg,hsl(42_61%_94%),hsl(38_58%_90%))] p-3">
      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-shrine">
        <div className="relative p-4">
          <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-accent/35 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/20 px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Lucky job search engine
              </div>
              <h1 className="text-2xl font-black tracking-tight text-primary">Ebisu</h1>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Build precise Google job searches, then keep the promising catches close.
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-sm">
              恵
            </div>
          </div>
        </div>
      </section>

      <Card className="border-primary/15 bg-card/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-primary" />
            Search forge
          </CardTitle>
          <CardDescription>Shape a focused query for ATS-hosted jobs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="roles">Role keywords</Label>
            <Input
              id="roles"
              placeholder="product manager, product owner"
              value={roles}
              onChange={(event) => setRoles(event.currentTarget.value)}
            />
          </div>

          <div className="grid grid-cols-[1fr_108px] gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
              <Checkbox id="remote" checked={remote} onCheckedChange={(checked) => setRemote(checked === true)} />
              <Label htmlFor="remote" className="cursor-pointer text-sm">
                Remote roles
              </Label>
            </div>
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
          </div>

          <div className="space-y-2">
            <Label>ATS sites</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ATS_SITES.map((site) => {
                const selected = selectedSites.includes(site)

                return (
                  <button
                    className={
                      selected
                        ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition-colors"
                        : "rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    }
                    key={site}
                    type="button"
                    onClick={() => toggleSite(site)}
                  >
                    {site}
                  </button>
                )
              })}
            </div>
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

          {showQuery ? (
            <div className="space-y-1.5">
              <Label htmlFor="query">Generated query</Label>
              <Textarea id="query" readOnly value={query} className="font-mono text-xs leading-5" />
            </div>
          ) : null}

          <div className="grid gap-2">
            <Button className="w-full gap-2" disabled={!query} onClick={search}>
              <Search className="h-4 w-4" />
              Go
            </Button>
            <Button variant="link" size="sm" type="button" onClick={() => setShowQuery((current) => !current)}>
              {showQuery ? "Hide query" : "View query"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/15 bg-card/95">
        <CardHeader>
          <CardTitle className="text-base">Current page</CardTitle>
          <CardDescription>Save this listing and mark where it stands.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeTab ? (
            <>
              <div className="rounded-lg border bg-background p-3">
                <p className="line-clamp-2 text-sm font-semibold leading-5">{activeTab.title}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className={currentJob ? STATUS_CLASSES[currentJob.status] : "bg-secondary"}>
                    {currentJob ? STATUS_LABELS[currentJob.status] : "New"}
                  </Badge>
                  <span className="truncate text-xs text-muted-foreground">{activeTab.source}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((status) => (
                  <Button key={status} variant="secondary" size="sm" onClick={() => markCurrentJob(status)}>
                    Mark {STATUS_LABELS[status]}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <p className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
              Open a regular web page to save it as a job.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/15 bg-card/95">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Saved jobs</CardTitle>
            <CardDescription>{visibleJobs.length} visible catches</CardDescription>
          </div>
          <Select value={filter} onValueChange={(value) => setFilter(value as JobStatus | "all")}>
            <SelectTrigger className="w-[130px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="scrollbar-thin grid max-h-[280px] gap-2 overflow-auto pr-1">
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
        </CardContent>
      </Card>
    </main>
  )
}
