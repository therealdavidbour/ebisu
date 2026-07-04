export type LocationSuggestion = {
  label: string
  value: string
  detail: string
  searchTerms: string[]
}

const DETAIL_PRIORITY: Record<LocationSuggestion["detail"], number> = {
  Workplace: 0,
  City: 1,
  State: 2,
  "Federal District": 3
}

function createSuggestion(label: string, detail: string, searchTerms: string[] = []): LocationSuggestion {
  return {
    label,
    value: label,
    detail,
    searchTerms: [label, ...searchTerms]
  }
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

const WORKPLACE_SUGGESTIONS: LocationSuggestion[] = [
  createSuggestion("Remote", "Workplace", ["work from home", "wfh", "anywhere"]),
  createSuggestion("Hybrid", "Workplace", ["hybrid remote"]),
  createSuggestion("On-site", "Workplace", ["onsite", "on site", "in office"])
]

const STATE_SUGGESTIONS: LocationSuggestion[] = [
  createSuggestion("Alabama", "State", ["al"]),
  createSuggestion("Alaska", "State", ["ak"]),
  createSuggestion("Arizona", "State", ["az"]),
  createSuggestion("Arkansas", "State", ["ar"]),
  createSuggestion("California", "State", ["ca"]),
  createSuggestion("Colorado", "State", ["co"]),
  createSuggestion("Connecticut", "State", ["ct"]),
  createSuggestion("Delaware", "State", ["de"]),
  createSuggestion("Florida", "State", ["fl"]),
  createSuggestion("Georgia", "State", ["ga"]),
  createSuggestion("Hawaii", "State", ["hi"]),
  createSuggestion("Idaho", "State", ["id"]),
  createSuggestion("Illinois", "State", ["il"]),
  createSuggestion("Indiana", "State", ["in"]),
  createSuggestion("Iowa", "State", ["ia"]),
  createSuggestion("Kansas", "State", ["ks"]),
  createSuggestion("Kentucky", "State", ["ky"]),
  createSuggestion("Louisiana", "State", ["la"]),
  createSuggestion("Maine", "State", ["me"]),
  createSuggestion("Maryland", "State", ["md"]),
  createSuggestion("Massachusetts", "State", ["ma"]),
  createSuggestion("Michigan", "State", ["mi"]),
  createSuggestion("Minnesota", "State", ["mn"]),
  createSuggestion("Mississippi", "State", ["ms"]),
  createSuggestion("Missouri", "State", ["mo"]),
  createSuggestion("Montana", "State", ["mt"]),
  createSuggestion("Nebraska", "State", ["ne"]),
  createSuggestion("Nevada", "State", ["nv"]),
  createSuggestion("New Hampshire", "State", ["nh"]),
  createSuggestion("New Jersey", "State", ["nj"]),
  createSuggestion("New Mexico", "State", ["nm"]),
  createSuggestion("New York", "State", ["ny"]),
  createSuggestion("North Carolina", "State", ["nc"]),
  createSuggestion("North Dakota", "State", ["nd"]),
  createSuggestion("Ohio", "State", ["oh"]),
  createSuggestion("Oklahoma", "State", ["ok"]),
  createSuggestion("Oregon", "State", ["or"]),
  createSuggestion("Pennsylvania", "State", ["pa"]),
  createSuggestion("Rhode Island", "State", ["ri"]),
  createSuggestion("South Carolina", "State", ["sc"]),
  createSuggestion("South Dakota", "State", ["sd"]),
  createSuggestion("Tennessee", "State", ["tn"]),
  createSuggestion("Texas", "State", ["tx"]),
  createSuggestion("Utah", "State", ["ut"]),
  createSuggestion("Vermont", "State", ["vt"]),
  createSuggestion("Virginia", "State", ["va"]),
  createSuggestion("Washington", "State", ["wa"]),
  createSuggestion("West Virginia", "State", ["wv"]),
  createSuggestion("Wisconsin", "State", ["wi"]),
  createSuggestion("Wyoming", "State", ["wy"]),
  createSuggestion("District of Columbia", "Federal District", ["dc", "washington dc"])
]

const CITY_SUGGESTIONS: LocationSuggestion[] = [
  createSuggestion("New York, NY", "City", ["new york city", "nyc", "manhattan", "brooklyn", "queens"]),
  createSuggestion("Los Angeles, CA", "City", ["la", "los angeles california"]),
  createSuggestion("Chicago, IL", "City", ["chicago illinois"]),
  createSuggestion("Houston, TX", "City", ["houston texas"]),
  createSuggestion("Phoenix, AZ", "City", ["phoenix arizona"]),
  createSuggestion("Philadelphia, PA", "City", ["philly", "philadelphia pennsylvania"]),
  createSuggestion("San Antonio, TX", "City", ["san antonio texas"]),
  createSuggestion("San Diego, CA", "City", ["san diego california"]),
  createSuggestion("Dallas, TX", "City", ["dallas texas"]),
  createSuggestion("Austin, TX", "City", ["atx", "austin texas"]),
  createSuggestion("Jacksonville, FL", "City", ["jacksonville florida"]),
  createSuggestion("San Jose, CA", "City", ["sj", "san jose california", "silicon valley"]),
  createSuggestion("Fort Worth, TX", "City", ["fort worth texas"]),
  createSuggestion("Columbus, OH", "City", ["columbus ohio"]),
  createSuggestion("Charlotte, NC", "City", ["charlotte north carolina"]),
  createSuggestion("Indianapolis, IN", "City", ["indianapolis indiana"]),
  createSuggestion("San Francisco, CA", "City", ["sf", "san francisco california", "bay area"]),
  createSuggestion("Seattle, WA", "City", ["seattle washington"]),
  createSuggestion("Denver, CO", "City", ["denver colorado"]),
  createSuggestion("Washington, DC", "City", ["washington dc", "dc"]),
  createSuggestion("Boston, MA", "City", ["boston massachusetts"]),
  createSuggestion("El Paso, TX", "City", ["el paso texas"]),
  createSuggestion("Nashville, TN", "City", ["nashville tennessee"]),
  createSuggestion("Detroit, MI", "City", ["detroit michigan"]),
  createSuggestion("Oklahoma City, OK", "City", ["okc", "oklahoma city oklahoma"]),
  createSuggestion("Portland, OR", "City", ["portland oregon"]),
  createSuggestion("Las Vegas, NV", "City", ["vegas", "las vegas nevada"]),
  createSuggestion("Memphis, TN", "City", ["memphis tennessee"]),
  createSuggestion("Louisville, KY", "City", ["louisville kentucky"]),
  createSuggestion("Baltimore, MD", "City", ["baltimore maryland"]),
  createSuggestion("Milwaukee, WI", "City", ["milwaukee wisconsin"]),
  createSuggestion("Albuquerque, NM", "City", ["albuquerque new mexico"]),
  createSuggestion("Tucson, AZ", "City", ["tucson arizona"]),
  createSuggestion("Fresno, CA", "City", ["fresno california"]),
  createSuggestion("Sacramento, CA", "City", ["sacramento california"]),
  createSuggestion("Mesa, AZ", "City", ["mesa arizona"]),
  createSuggestion("Kansas City, MO", "City", ["kc", "kansas city missouri"]),
  createSuggestion("Atlanta, GA", "City", ["atlanta georgia"]),
  createSuggestion("Long Beach, CA", "City", ["long beach california"]),
  createSuggestion("Colorado Springs, CO", "City", ["colorado springs colorado"]),
  createSuggestion("Raleigh, NC", "City", ["raleigh north carolina"]),
  createSuggestion("Miami, FL", "City", ["miami florida"]),
  createSuggestion("Virginia Beach, VA", "City", ["virginia beach virginia"]),
  createSuggestion("Omaha, NE", "City", ["omaha nebraska"]),
  createSuggestion("Oakland, CA", "City", ["oakland california"]),
  createSuggestion("Minneapolis, MN", "City", ["minneapolis minnesota", "twin cities"]),
  createSuggestion("Tulsa, OK", "City", ["tulsa oklahoma"]),
  createSuggestion("Arlington, TX", "City", ["arlington texas"]),
  createSuggestion("Tampa, FL", "City", ["tampa florida"]),
  createSuggestion("New Orleans, LA", "City", ["nola", "new orleans louisiana"]),
  createSuggestion("Wichita, KS", "City", ["wichita kansas"]),
  createSuggestion("Cleveland, OH", "City", ["cleveland ohio"]),
  createSuggestion("Bakersfield, CA", "City", ["bakersfield california"]),
  createSuggestion("Aurora, CO", "City", ["aurora colorado"]),
  createSuggestion("Anaheim, CA", "City", ["anaheim california"]),
  createSuggestion("Honolulu, HI", "City", ["honolulu hawaii"]),
  createSuggestion("Santa Ana, CA", "City", ["santa ana california"]),
  createSuggestion("Riverside, CA", "City", ["riverside california"]),
  createSuggestion("Corpus Christi, TX", "City", ["corpus christi texas"]),
  createSuggestion("Lexington, KY", "City", ["lexington kentucky"]),
  createSuggestion("Henderson, NV", "City", ["henderson nevada"]),
  createSuggestion("Stockton, CA", "City", ["stockton california"]),
  createSuggestion("Saint Paul, MN", "City", ["st paul", "saint paul minnesota"]),
  createSuggestion("Cincinnati, OH", "City", ["cincinnati ohio"]),
  createSuggestion("St. Louis, MO", "City", ["saint louis", "st louis missouri"]),
  createSuggestion("Pittsburgh, PA", "City", ["pittsburgh pennsylvania"]),
  createSuggestion("Greensboro, NC", "City", ["greensboro north carolina"]),
  createSuggestion("Jersey City, NJ", "City", ["jersey city new jersey"]),
  createSuggestion("Anchorage, AK", "City", ["anchorage alaska"]),
  createSuggestion("Lincoln, NE", "City", ["lincoln nebraska"]),
  createSuggestion("Plano, TX", "City", ["plano texas"]),
  createSuggestion("Orlando, FL", "City", ["orlando florida"]),
  createSuggestion("Irvine, CA", "City", ["irvine california"]),
  createSuggestion("Newark, NJ", "City", ["newark new jersey"]),
  createSuggestion("Durham, NC", "City", ["durham north carolina"]),
  createSuggestion("Chula Vista, CA", "City", ["chula vista california"]),
  createSuggestion("Toledo, OH", "City", ["toledo ohio"]),
  createSuggestion("Fort Wayne, IN", "City", ["fort wayne indiana"]),
  createSuggestion("St. Petersburg, FL", "City", ["saint petersburg florida", "st petersburg florida"]),
  createSuggestion("Laredo, TX", "City", ["laredo texas"]),
  createSuggestion("Chandler, AZ", "City", ["chandler arizona"]),
  createSuggestion("Madison, WI", "City", ["madison wisconsin"]),
  createSuggestion("Lubbock, TX", "City", ["lubbock texas"]),
  createSuggestion("Scottsdale, AZ", "City", ["scottsdale arizona"]),
  createSuggestion("Reno, NV", "City", ["reno nevada"]),
  createSuggestion("Buffalo, NY", "City", ["buffalo new york"]),
  createSuggestion("Gilbert, AZ", "City", ["gilbert arizona"]),
  createSuggestion("Glendale, AZ", "City", ["glendale arizona"]),
  createSuggestion("North Las Vegas, NV", "City", ["north las vegas nevada"]),
  createSuggestion("Winston-Salem, NC", "City", ["winston salem north carolina"]),
  createSuggestion("Chesapeake, VA", "City", ["chesapeake virginia"]),
  createSuggestion("Boise, ID", "City", ["boise idaho"]),
  createSuggestion("Salt Lake City, UT", "City", ["slc", "salt lake city utah"])
]

const LOCATION_SUGGESTIONS = [...WORKPLACE_SUGGESTIONS, ...CITY_SUGGESTIONS, ...STATE_SUGGESTIONS]

export function getLocationSuggestions(query: string, limit = 8): LocationSuggestion[] {
  const normalizedQuery = normalize(query)

  if (!normalizedQuery) {
    return LOCATION_SUGGESTIONS.slice(0, limit)
  }

  const scored = LOCATION_SUGGESTIONS.map((suggestion) => {
    const terms = suggestion.searchTerms.map(normalize)
    let score = -1

    for (const term of terms) {
      if (term === normalizedQuery) {
        score = Math.max(score, 5)
      } else if (term.startsWith(normalizedQuery)) {
        score = Math.max(score, 4)
      } else if (term.split(" ").some((part) => part.startsWith(normalizedQuery))) {
        score = Math.max(score, 3)
      } else if (term.includes(normalizedQuery)) {
        score = Math.max(score, 2)
      }
    }

    return { suggestion, score }
  })

  return scored
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      const leftPriority = DETAIL_PRIORITY[left.suggestion.detail] ?? 99
      const rightPriority = DETAIL_PRIORITY[right.suggestion.detail] ?? 99

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority
      }

      return left.suggestion.label.localeCompare(right.suggestion.label)
    })
    .slice(0, limit)
    .map((item) => item.suggestion)
}
