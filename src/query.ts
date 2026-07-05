import { getAfterDate } from "./date"
import { resolveLocationQuery } from "./locations"
import type { SearchOptions } from "./types"

const EXCLUDED_AGGREGATOR_SITES = [
  "indeed.com",
  "linkedin.com",
  "dice.com",
  "ziprecruiter.com",
  "glassdoor.com",
  "monster.com"
]

function quote(value: string): string {
  return `"${value.trim().replaceAll('"', "").toLowerCase()}"`
}

function groupOr(parts: string[]): string {
  if (parts.length === 0) {
    return ""
  }

  if (parts.length === 1) {
    return parts[0]
  }

  return `(${parts.join(" OR ")})`
}

export function buildJobSearchQuery(options: SearchOptions): string {
  const atsQuery = groupOr(
    options.atsSites.map((site) => site.trim()).filter(Boolean).map((site) => `site:${site}`)
  )
  const roleQuery = groupOr(options.roles.map(quote).filter((role) => role !== '""'))
  const locationQuery = options.location?.trim() ? resolveLocationQuery(options.location) : ""
  const afterQuery = options.days && options.days > 0 ? `after:${getAfterDate(options.days)}` : ""
  const aggregatorExclusionQuery = EXCLUDED_AGGREGATOR_SITES.map((site) => `-site:${site}`).join(" ")
  const excludedQuery = options.excludedTerms
    .map((term) => term.trim())
    .filter(Boolean)
    .map((term) => `-${quote(term)}`)
    .join(" ")

  return [atsQuery, roleQuery, locationQuery, afterQuery, aggregatorExclusionQuery, excludedQuery].filter(Boolean).join(" ")
}

export function buildGoogleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}
