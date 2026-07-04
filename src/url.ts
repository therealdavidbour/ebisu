const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gh_src",
  "lever-source",
  "source",
  "ref"
])

export function canonicalizeUrl(value: string): string {
  const url = new URL(value)
  url.hash = ""
  url.hostname = url.hostname.toLowerCase()

  for (const param of Array.from(url.searchParams.keys())) {
    if (TRACKING_PARAMS.has(param.toLowerCase())) {
      url.searchParams.delete(param)
    }
  }

  const withoutTrailingSlash = url.toString().replace(/\/$/, "")
  return withoutTrailingSlash
}

export function getHostname(value: string): string {
  return new URL(value).hostname.toLowerCase()
}
