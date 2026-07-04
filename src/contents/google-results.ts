import type { PlasmoCSConfig } from "plasmo"

import { getJobs, upsertJob } from "../storage"
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
      button.addEventListener("click", async (event) => {
        event.preventDefault()
        event.stopPropagation()

        await upsertJob(createSavedJob(target, status))
        await runScan()
      })
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

  if (jobs[target.canonicalUrl]) {
    return
  }

  await upsertJob(createSavedJob(target, "seen"))
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
    attachSeenTracking(target)
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
