import type { PlasmoCSConfig } from "plasmo"

import { DEFAULT_ATS_SITES } from "../ats"
import { getJobs, upsertJob } from "../storage"
import type { JobStatus, SavedJob } from "../types"
import { canonicalizeUrl, getHostname } from "../url"

export const config: PlasmoCSConfig = {
  matches: ["https://www.google.com/search*"]
}

const TOOLBAR_ATTR = "data-ebisu-toolbar"
const CONTAINER_ATTR = "data-ebisu-result"
const STYLE_ID = "ebisu-google-results-style"
const STATUSES: JobStatus[] = ["seen", "saved", "skipped", "applied"]
const STATUS_LABELS: Record<JobStatus, string> = {
  seen: "Seen",
  saved: "Saved",
  skipped: "Skipped",
  applied: "Applied"
}
const STATUS_THEME: Record<JobStatus, string> = {
  seen: "border-color:#b58900;background:rgba(181,137,0,.14);color:#b58900;",
  saved: "border-color:#2aa198;background:rgba(42,161,152,.14);color:#2aa198;",
  skipped: "border-color:#586e75;background:#073642;color:#93a1a1;",
  applied: "border-color:#859900;background:rgba(133,153,0,.14);color:#859900;"
}

type ResultTarget = {
  anchor: HTMLAnchorElement
  container: HTMLElement
  url: string
  canonicalUrl: string
  title: string
  source: string
}

let scanTimer: number | null = null

function isSupportedAtsUrl(url: string): boolean {
  const hostname = getHostname(url)
  return DEFAULT_ATS_SITES.some((site) => hostname === site || hostname.endsWith(`.${site}`))
}

function getResultContainer(anchor: HTMLAnchorElement): HTMLElement | null {
  const selectors = [".MjjYud", ".ezO2md", ".g", "[data-snc]"]

  for (const selector of selectors) {
    const match = anchor.closest<HTMLElement>(selector)

    if (match?.querySelector("h3")) {
      return match
    }
  }

  let current = anchor.parentElement
  for (let depth = 0; current && depth < 6; depth += 1) {
    if (current.querySelector("h3")) {
      return current
    }

    current = current.parentElement
  }

  return null
}

function getResultTitle(anchor: HTMLAnchorElement, container: HTMLElement): string {
  const heading = anchor.querySelector("h3") ?? container.querySelector("h3")
  return heading?.textContent?.trim() || anchor.textContent?.trim() || anchor.href
}

function createSavedJob(target: ResultTarget, status: JobStatus): Omit<SavedJob, "firstSeenAt" | "lastSeenAt"> {
  return {
    id: target.canonicalUrl,
    url: target.url,
    canonicalUrl: target.canonicalUrl,
    title: target.title,
    source: target.source,
    status
  }
}

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) {
    return
  }

  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    [${CONTAINER_ATTR}] {
      position: relative;
      transition: box-shadow 140ms ease, background-color 140ms ease, border-color 140ms ease;
      border-radius: 12px;
    }

    .ebisu-result-highlight {
      box-shadow: inset 3px 0 0 0 currentColor;
    }

    .ebisu-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      padding: 10px 12px;
      border: 1px solid #073642;
      border-radius: 12px;
      background: rgba(0, 43, 54, 0.94);
      color: #93a1a1;
      font-family: "Public Sans", ui-sans-serif, system-ui, sans-serif;
    }

    .ebisu-toolbar__brand {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #2aa198;
      margin-right: 2px;
    }

    .ebisu-toolbar__status {
      display: inline-flex;
      align-items: center;
      border: 1px solid #586e75;
      border-radius: 999px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      color: #93a1a1;
    }

    .ebisu-toolbar__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-left: auto;
    }

    .ebisu-toolbar__button {
      border: 1px solid #586e75;
      border-radius: 999px;
      background: #073642;
      color: #93a1a1;
      cursor: pointer;
      font: inherit;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      padding: 6px 10px;
    }

    .ebisu-toolbar__button:hover {
      border-color: #2aa198;
      color: #fdf6e3;
    }
  `

  document.head.append(style)
}

function applyResultState(container: HTMLElement, job: SavedJob | null) {
  container.classList.toggle("ebisu-result-highlight", Boolean(job))

  if (!job) {
    container.style.backgroundColor = ""
    container.style.color = ""
    return
  }

  const status = job.status
  if (status === "seen") {
    container.style.backgroundColor = "rgba(181, 137, 0, 0.06)"
    container.style.color = "#b58900"
    return
  }

  if (status === "saved") {
    container.style.backgroundColor = "rgba(42, 161, 152, 0.07)"
    container.style.color = "#2aa198"
    return
  }

  if (status === "applied") {
    container.style.backgroundColor = "rgba(133, 153, 0, 0.07)"
    container.style.color = "#859900"
    return
  }

  container.style.backgroundColor = "rgba(88, 110, 117, 0.12)"
  container.style.color = "#93a1a1"
}

function upsertToolbar(target: ResultTarget, jobs: Record<string, SavedJob>) {
  const existing = target.container.querySelector<HTMLElement>(`[${TOOLBAR_ATTR}]`)
  const toolbar = existing ?? document.createElement("div")
  const brand = toolbar.querySelector<HTMLElement>(".ebisu-toolbar__brand") ?? document.createElement("span")
  const statusBadge = toolbar.querySelector<HTMLElement>(".ebisu-toolbar__status") ?? document.createElement("span")
  const actions = toolbar.querySelector<HTMLElement>(".ebisu-toolbar__actions") ?? document.createElement("div")
  const job = jobs[target.canonicalUrl] ?? null

  toolbar.setAttribute(TOOLBAR_ATTR, "true")
  toolbar.className = "ebisu-toolbar"
  brand.className = "ebisu-toolbar__brand"
  brand.textContent = "Ebisu"
  statusBadge.className = "ebisu-toolbar__status"
  statusBadge.textContent = job ? STATUS_LABELS[job.status] : "New"
  statusBadge.style.cssText = job ? STATUS_THEME[job.status] : "border-color:#586e75;color:#93a1a1;"
  actions.className = "ebisu-toolbar__actions"

  for (const status of STATUSES) {
    let button = actions.querySelector<HTMLButtonElement>(`button[data-ebisu-status="${status}"]`)

    if (!button) {
      button = document.createElement("button")
      button.type = "button"
      button.dataset.ebisuStatus = status
      button.className = "ebisu-toolbar__button"
      button.addEventListener("click", async (event) => {
        event.preventDefault()
        event.stopPropagation()

        await upsertJob(createSavedJob(target, status))
        await runScan()
      })
      actions.append(button)
    }

    button.textContent = status === "saved" ? "Save" : STATUS_LABELS[status]
  }

  if (!existing) {
    toolbar.replaceChildren(brand, statusBadge, actions)
    target.container.append(toolbar)
  }

  applyResultState(target.container, job)
}

function getResultTargets(): ResultTarget[] {
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]'))
  const seen = new Set<string>()
  const targets: ResultTarget[] = []

  for (const anchor of anchors) {
    if (anchor.closest(`[${TOOLBAR_ATTR}]`)) {
      continue
    }

    if (!isSupportedAtsUrl(anchor.href)) {
      continue
    }

    const container = getResultContainer(anchor)
    if (!container) {
      continue
    }

    const canonicalUrl = canonicalizeUrl(anchor.href)
    const key = `${canonicalUrl}::${getResultTitle(anchor, container)}`

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    container.setAttribute(CONTAINER_ATTR, "true")
    targets.push({
      anchor,
      container,
      url: anchor.href,
      canonicalUrl,
      title: getResultTitle(anchor, container),
      source: getHostname(anchor.href)
    })
  }

  return targets
}

async function runScan() {
  ensureStyle()

  const jobs = await getJobs()
  const targets = getResultTargets()

  for (const target of targets) {
    upsertToolbar(target, jobs)
  }
}

function scheduleScan() {
  if (scanTimer) {
    window.clearTimeout(scanTimer)
  }

  scanTimer = window.setTimeout(() => {
    void runScan()
  }, 80)
}

void runScan()

const observer = new MutationObserver(() => {
  scheduleScan()
})

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
})

globalThis.chrome?.storage?.onChanged?.addListener(() => {
  scheduleScan()
})
