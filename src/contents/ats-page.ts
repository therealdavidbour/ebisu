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
  matches: [
    "https://greenhouse.io/*",
    "https://*.greenhouse.io/*",
    "https://jobs.lever.co/*",
    "https://ashbyhq.com/*",
    "https://*.ashbyhq.com/*",
    "https://myworkdayjobs.com/*",
    "https://*.myworkdayjobs.com/*"
  ]
}

const ROOT_ID = "ebisu-ats-toolbar"
const STYLE_ID = "ebisu-ats-toolbar-style"

function getPageTarget(): ContentJobTarget | null {
  const url = globalThis.location?.href

  if (!url || !isSupportedAtsUrl(url)) {
    return null
  }

  return {
    url,
    canonicalUrl: canonicalizeUrl(url),
    title: document.title?.trim() || url,
    source: getHostname(url)
  }
}

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) {
    return
  }

  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    #${ROOT_ID} {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 2147483647;
      width: min(360px, calc(100vw - 32px));
      border: 1px solid #073642;
      border-radius: 14px;
      background: rgba(0, 43, 54, 0.96);
      color: #93a1a1;
      box-shadow: 0 20px 48px -24px rgba(42, 161, 152, 0.45);
      font-family: "Public Sans", ui-sans-serif, system-ui, sans-serif;
    }

    .ebisu-ats-toolbar__inner {
      display: grid;
      gap: 10px;
      padding: 12px;
    }

    .ebisu-ats-toolbar__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .ebisu-ats-toolbar__brand {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.02em;
      color: #2aa198;
    }

    .ebisu-ats-toolbar__status {
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

    .ebisu-ats-toolbar__title {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.4;
      color: #fdf6e3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .ebisu-ats-toolbar__meta {
      font-size: 11px;
      color: #93a1a1;
    }

    .ebisu-ats-toolbar__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .ebisu-ats-toolbar__button {
      border: 1px solid #586e75;
      border-radius: 999px;
      background: #073642;
      color: #93a1a1;
      cursor: pointer;
      font: inherit;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      padding: 7px 10px;
    }

    .ebisu-ats-toolbar__button:hover {
      border-color: #2aa198;
      color: #fdf6e3;
    }

    .ebisu-ats-toolbar__button[data-ebisu-active="true"] {
      border-color: #2aa198;
      background: rgba(42, 161, 152, 0.16);
      color: #fdf6e3;
    }
  `

  document.head.append(style)
}

function renderToolbar(target: ContentJobTarget, jobs: Record<string, SavedJob>) {
  let root = document.getElementById(ROOT_ID)
  const job = jobs[target.canonicalUrl] ?? null

  if (!root) {
    root = document.createElement("div")
    root.id = ROOT_ID
    document.body.append(root)
  }

  const statusText = job ? CONTENT_STATUS_LABELS[job.status] : "New"
  const statusStyle = job ? CONTENT_STATUS_THEME[job.status] : "border-color:#586e75;color:#93a1a1;"

  root.innerHTML = `
    <div class="ebisu-ats-toolbar__inner">
      <div class="ebisu-ats-toolbar__header">
        <span class="ebisu-ats-toolbar__brand">Ebisu</span>
        <span class="ebisu-ats-toolbar__status" style="${statusStyle}">${statusText}</span>
      </div>
      <p class="ebisu-ats-toolbar__title">${escapeHtml(target.title)}</p>
      <div class="ebisu-ats-toolbar__meta">${escapeHtml(target.source)}</div>
      <div class="ebisu-ats-toolbar__actions"></div>
    </div>
  `

  const actions = root.querySelector<HTMLElement>(".ebisu-ats-toolbar__actions")

  if (!actions) {
    return
  }

  for (const status of CONTENT_STATUSES) {
    const button = document.createElement("button")
    button.type = "button"
    button.className = "ebisu-ats-toolbar__button"
    button.dataset.ebisuActive = String(job?.status === status)
    button.textContent = status === "saved" ? "Save" : CONTENT_STATUS_LABELS[status]
    button.addEventListener("click", async () => {
      if (job?.status === status) {
        await deleteJob(target.canonicalUrl)
      } else {
        await upsertJob(createSavedJob(target, status))
      }

      await refreshToolbar()
    })
    actions.append(button)
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

async function refreshToolbar() {
  const target = getPageTarget()

  if (!target) {
    document.getElementById(ROOT_ID)?.remove()
    return
  }

  ensureStyle()
  const jobs = await getJobs()
  renderToolbar(target, jobs)
}

void refreshToolbar()

globalThis.chrome?.storage?.onChanged?.addListener(() => {
  void refreshToolbar()
})
