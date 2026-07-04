import { canonicalizeUrl, getHostname } from "./url"

export type ActiveTabInfo = {
  url: string
  canonicalUrl: string
  title: string
  source: string
}

export async function getActiveTabInfo(): Promise<ActiveTabInfo | null> {
  if (!globalThis.chrome?.tabs?.query) {
    return null
  }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const tab = tabs[0]

  if (!tab?.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
    return null
  }

  return {
    url: tab.url,
    canonicalUrl: canonicalizeUrl(tab.url),
    title: tab.title ?? tab.url,
    source: getHostname(tab.url)
  }
}

export async function openUrl(url: string): Promise<void> {
  if (!globalThis.chrome?.tabs?.create) {
    window.open(url, "_blank", "noopener,noreferrer")
    return
  }

  await chrome.tabs.create({ url })
}
