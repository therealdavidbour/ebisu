import type { PlasmoCSConfig } from "plasmo"

import { deleteJob, getJobs, upsertJob } from "../storage"
import type { SavedJob } from "../types"
import { canonicalizeUrl, getHostname } from "../url"
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_THEME,
  createSavedJob,
  isSupportedAtsUrl,
  type ContentJobTarget
} from "../content-utils"

export const config: PlasmoCSConfig = {
  matches: ["https://www.google.com/search*"]
}

const TOOLBAR_ATTR = "data-ebisu-toolbar"
const CONTAINER_ATTR = "data-ebisu-result"
const STYLE_ID = "ebisu-google-results-style"

type ResultTarget = ContentJobTarget & {
  anchor: HTMLAnchorElement
  container: HTMLElement
}

let scanTimer: number | null = null

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

function formatListingDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date)
}

function getRelativeListingDate(text: string): string | undefined {
  const normalized = text.toLowerCase()

  if (/\btoday\b/.test(normalized)) {
    return formatListingDate(new Date())
  }

  if (/\byesterday\b/.test(normalized)) {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    return formatListingDate(date)
  }

  const relativeMatch = normalized.match(/\b(\d+)\+?\s+(minute|hour|day|week|month|year)s?\s+ago\b/)

  if (!relativeMatch) {
    return undefined
  }

  const amount = Number(relativeMatch[1])
  const unit = relativeMatch[2]
  const date = new Date()

  if (unit === "minute") {
    date.setMinutes(date.getMinutes() - amount)
  } else if (unit === "hour") {
    date.setHours(date.getHours() - amount)
  } else if (unit === "day") {
    date.setDate(date.getDate() - amount)
  } else if (unit === "week") {
    date.setDate(date.getDate() - amount * 7)
  } else if (unit === "month") {
    date.setMonth(date.getMonth() - amount)
  } else if (unit === "year") {
    date.setFullYear(date.getFullYear() - amount)
  }

  return formatListingDate(date)
}

function extractListingDate(container: HTMLElement): string | undefined {
  const visibleText = container.innerText?.replace(/\s+/g, " ").trim()
  const textContent = container.textContent?.replace(/\s+/g, " ").trim()
  const text = visibleText || textContent

  if (!text) {
    return undefined
  }

  const relativeDate = getRelativeListingDate(text)

  if (relativeDate) {
    return relativeDate
  }

  const patterns = [
    /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?\b/i,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)

    if (match) {
      return match[0]
    }
  }

  return undefined
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
      gap: 6px;
      margin-top: 8px;
      padding: 8px 10px;
      position: relative;
      z-index: 2;
      border: 1px solid #073642;
      border-radius: 10px;
      background: rgba(0, 43, 54, 0.9);
      color: #93a1a1;
      font-family: "Public Sans", ui-sans-serif, system-ui, sans-serif;
    }

    .ebisu-toolbar__brand {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #2aa198;
      margin-right: 4px;
    }

    .ebisu-toolbar__status {
      display: inline-flex;
      align-items: center;
      border: 1px solid #586e75;
      border-radius: 999px;
      padding: 4px 7px;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      color: #93a1a1;
    }

    .ebisu-toolbar__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-left: auto;
    }

    .ebisu-toolbar__button {
      border: 1px solid #586e75;
      border-radius: 999px;
      background: #073642;
      color: #93a1a1;
      cursor: pointer;
      position: relative;
      z-index: 3;
      font: inherit;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
      padding: 6px 9px;
    }

    .ebisu-toolbar__button:hover {
      border-color: #2aa198;
      color: #fdf6e3;
    }

    .ebisu-toolbar__button[data-ebisu-active="true"] {
      border-color: #2aa198;
      background: rgba(42, 161, 152, 0.16);
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

  if (job.status === "seen") {
    container.style.backgroundColor = "rgba(181, 137, 0, 0.06)"
    container.style.color = "#b58900"
    return
  }

  if (job.status === "saved") {
    container.style.backgroundColor = "rgba(42, 161, 152, 0.07)"
    container.style.color = "#2aa198"
    return
  }

  if (job.status === "applied") {
    container.style.backgroundColor = "rgba(133, 153, 0, 0.07)"
    container.style.color = "#859900"
    return
  }

  container.style.backgroundColor = "rgba(88, 110, 117, 0.12)"
  container.style.color = "#93a1a1"
}

function stopGoogleResultEvent(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  if (typeof event.stopImmediatePropagation === "function") {
    event.stopImmediatePropagation()
  }
}

async function handleStatusAction(event: Event, target: ResultTarget, status: (typeof CONTENT_STATUSES)[number]) {
  const button = event.currentTarget as HTMLButtonElement | null
  const isActive = button?.dataset.ebisuActive === "true"

  stopGoogleResultEvent(event)

  if (!button || button.dataset.ebisuBusy === "true") {
    return
  }

  button.dataset.ebisuBusy = "true"

  try {
    if (isActive) {
      await deleteJob(target.canonicalUrl)
    } else {
      await upsertJob(createSavedJob(target, status))
    }

    await runScan()
  } finally {
    button.dataset.ebisuBusy = "false"
  }
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
  statusBadge.textContent = job ? CONTENT_STATUS_LABELS[job.status] : "New"
  statusBadge.style.cssText = job ? CONTENT_STATUS_THEME[job.status] : "border-color:#586e75;color:#93a1a1;"
  actions.className = "ebisu-toolbar__actions"

  for (const status of CONTENT_STATUSES) {
    let button = actions.querySelector<HTMLButtonElement>(`button[data-ebisu-status="${status}"]`)

    if (!button) {
      button = document.createElement("button")
      button.type = "button"
      button.dataset.ebisuStatus = status
      button.className = "ebisu-toolbar__button"
      button.addEventListener("pointerdown", (event) => {
        void handleStatusAction(event, target, status)
      })
      button.addEventListener("click", stopGoogleResultEvent)
      actions.append(button)
    }

    button.textContent = status === "saved" ? "Save" : CONTENT_STATUS_LABELS[status]
    button.dataset.ebisuActive = String(job?.status === status)
  }

  toolbar.replaceChildren(brand, statusBadge, actions)

  if (!existing) {
    target.container.append(toolbar)
  }

  applyResultState(target.container, job)
}

function attachSeenTracking(target: ResultTarget) {
  if (target.anchor.dataset.ebisuTrackSeen === "true") {
    return
  }

  target.anchor.dataset.ebisuTrackSeen = "true"

  const handler = () => {
    void markSeen(target)
  }

  target.anchor.addEventListener("click", handler)
  target.anchor.addEventListener("auxclick", handler)
}

async function markSeen(target: ResultTarget) {
  const jobs = await getJobs()
  const existing = jobs[target.canonicalUrl]

  if (existing) {
    if (!existing.listingDate && target.listingDate) {
      await upsertJob({
        ...existing,
        listingDate: target.listingDate
      })
    }

    return
  }

  await upsertJob(createSavedJob(target, "seen"))
}

async function enrichListingDates(targets: ResultTarget[], jobs: Record<string, SavedJob>) {
  const updates = targets
    .map((target) => {
      const existing = jobs[target.canonicalUrl]

      if (!existing || existing.listingDate || !target.listingDate) {
        return null
      }

      return upsertJob({
        ...existing,
        listingDate: target.listingDate
      })
    })
    .filter(Boolean)

  if (updates.length > 0) {
    await Promise.all(updates)
  }
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
      source: getHostname(anchor.href),
      listingDate: extractListingDate(container)
    })
  }

  return targets
}

async function runScan() {
  ensureStyle()

  const targets = getResultTargets()
  const jobs = await getJobs()

  await enrichListingDates(targets, jobs)
  const refreshedJobs = await getJobs()

  for (const target of targets) {
    attachSeenTracking(target)
    upsertToolbar(target, refreshedJobs)
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
