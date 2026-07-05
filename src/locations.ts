export type LocationSuggestion = {
  label: string
  value: string
  detail: string
  searchTerms: string[]
  queryValue?: string
}

type IndexedLocationSuggestion = LocationSuggestion & {
  normalizedSearchTerms: string[]
}

const DETAIL_PRIORITY: Record<string, number> = {
  Workplace: 0,
  City: 1,
  State: 2,
  "Federal District": 3
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function createSuggestion(label: string, detail: string, searchTerms: string[] = [], queryValue?: string): LocationSuggestion {
  return {
    label,
    value: label,
    detail,
    searchTerms: [label, ...searchTerms],
    ...(queryValue ? { queryValue } : {})
  }
}

function createStateSuggestion(name: string, abbreviation: string): LocationSuggestion {
  return createSuggestion(name, "State", [abbreviation])
}

function createCitySuggestion(stateCode: string, city: string, aliases: string[] = []): LocationSuggestion {
  return createSuggestion(`${city}, ${stateCode}`, "City", aliases)
}

const WORKPLACE_SUGGESTIONS: LocationSuggestion[] = [
  createSuggestion("Remote", "Workplace", ["work from home", "wfh", "anywhere"]),
  createSuggestion(
    "Remote - United States",
    "Remote region",
    ["remote us", "remote usa", "remote united states", "us remote", "usa remote"],
    '"remote" ("United States" OR USA OR US) -"Canada" -"Europe" -"UK" -"India" -"EMEA" -"APAC" -"LATAM"'
  ),
  createSuggestion(
    "Remote - Canada",
    "Remote region",
    ["remote canada", "canada remote"],
    '"remote" (Canada OR Canadian) -"United States" -USA -US -"Europe" -"EMEA" -"APAC" -"LATAM"'
  ),
  createSuggestion(
    "Remote - Europe",
    "Remote region",
    ["remote europe", "europe remote", "eu remote", "remote eu"],
    '"remote" (Europe OR European OR EU OR "European Union") -"United States" -USA -US -Canada -"APAC" -"LATAM"'
  ),
  createSuggestion(
    "Remote - EMEA",
    "Remote region",
    ["remote emea", "emea remote", "europe middle east africa"],
    '"remote" (EMEA OR Europe OR European OR "Middle East" OR Africa) -"United States" -USA -US -Canada -"APAC" -"LATAM"'
  ),
  createSuggestion(
    "Remote - APAC",
    "Remote region",
    ["remote apac", "apac remote", "asia pacific remote", "remote asia pacific"],
    '"remote" (APAC OR "Asia Pacific" OR Asia OR Australia OR Singapore OR Japan OR India OR Philippines OR Indonesia OR Malaysia OR Thailand OR Vietnam) -"United States" -USA -US -Canada -"Europe" -"EMEA" -"LATAM"'
  ),
  createSuggestion(
    "Remote - LATAM",
    "Remote region",
    ["remote latam", "latam remote", "latin america remote", "remote latin america"],
    '"remote" (LATAM OR "Latin America" OR Mexico OR Brazil OR Argentina OR Colombia OR Chile OR Peru) -"United States" -USA -US -Canada -"Europe" -"EMEA" -"APAC"'
  ),
  createSuggestion("Hybrid", "Workplace", ["hybrid remote"]),
  createSuggestion("On-site", "Workplace", ["onsite", "on site", "in office"])
]

const STATE_SUGGESTIONS: LocationSuggestion[] = [
  createStateSuggestion("Alabama", "al"),
  createStateSuggestion("Alaska", "ak"),
  createStateSuggestion("Arizona", "az"),
  createStateSuggestion("Arkansas", "ar"),
  createStateSuggestion("California", "ca"),
  createStateSuggestion("Colorado", "co"),
  createStateSuggestion("Connecticut", "ct"),
  createStateSuggestion("Delaware", "de"),
  createStateSuggestion("Florida", "fl"),
  createStateSuggestion("Georgia", "ga"),
  createStateSuggestion("Hawaii", "hi"),
  createStateSuggestion("Idaho", "id"),
  createStateSuggestion("Illinois", "il"),
  createStateSuggestion("Indiana", "in"),
  createStateSuggestion("Iowa", "ia"),
  createStateSuggestion("Kansas", "ks"),
  createStateSuggestion("Kentucky", "ky"),
  createStateSuggestion("Louisiana", "la"),
  createStateSuggestion("Maine", "me"),
  createStateSuggestion("Maryland", "md"),
  createStateSuggestion("Massachusetts", "ma"),
  createStateSuggestion("Michigan", "mi"),
  createStateSuggestion("Minnesota", "mn"),
  createStateSuggestion("Mississippi", "ms"),
  createStateSuggestion("Missouri", "mo"),
  createStateSuggestion("Montana", "mt"),
  createStateSuggestion("Nebraska", "ne"),
  createStateSuggestion("Nevada", "nv"),
  createStateSuggestion("New Hampshire", "nh"),
  createStateSuggestion("New Jersey", "nj"),
  createStateSuggestion("New Mexico", "nm"),
  createStateSuggestion("New York", "ny"),
  createStateSuggestion("North Carolina", "nc"),
  createStateSuggestion("North Dakota", "nd"),
  createStateSuggestion("Ohio", "oh"),
  createStateSuggestion("Oklahoma", "ok"),
  createStateSuggestion("Oregon", "or"),
  createStateSuggestion("Pennsylvania", "pa"),
  createStateSuggestion("Rhode Island", "ri"),
  createStateSuggestion("South Carolina", "sc"),
  createStateSuggestion("South Dakota", "sd"),
  createStateSuggestion("Tennessee", "tn"),
  createStateSuggestion("Texas", "tx"),
  createStateSuggestion("Utah", "ut"),
  createStateSuggestion("Vermont", "vt"),
  createStateSuggestion("Virginia", "va"),
  createStateSuggestion("Washington", "wa"),
  createStateSuggestion("West Virginia", "wv"),
  createStateSuggestion("Wisconsin", "wi"),
  createStateSuggestion("Wyoming", "wy"),
  createSuggestion("District of Columbia", "Federal District", ["dc", "washington dc"])
]

const CITY_SUGGESTIONS: LocationSuggestion[] = [
  createCitySuggestion("AL", "Birmingham"),
  createCitySuggestion("AL", "Montgomery"),
  createCitySuggestion("AL", "Huntsville"),
  createCitySuggestion("AL", "Mobile"),
  createCitySuggestion("AL", "Tuscaloosa"),
  createCitySuggestion("AK", "Anchorage"),
  createCitySuggestion("AK", "Fairbanks"),
  createCitySuggestion("AK", "Juneau"),
  createCitySuggestion("AK", "Sitka"),
  createCitySuggestion("AK", "Ketchikan"),
  createCitySuggestion("AZ", "Phoenix"),
  createCitySuggestion("AZ", "Tucson"),
  createCitySuggestion("AZ", "Mesa"),
  createCitySuggestion("AZ", "Chandler"),
  createCitySuggestion("AZ", "Scottsdale"),
  createCitySuggestion("AZ", "Glendale"),
  createCitySuggestion("AZ", "Gilbert"),
  createCitySuggestion("AZ", "Tempe"),
  createCitySuggestion("AR", "Little Rock"),
  createCitySuggestion("AR", "Fayetteville"),
  createCitySuggestion("AR", "Fort Smith"),
  createCitySuggestion("AR", "Springdale"),
  createCitySuggestion("AR", "Jonesboro"),
  createCitySuggestion("CA", "Los Angeles", ["la", "los angeles california"]),
  createCitySuggestion("CA", "San Diego"),
  createCitySuggestion("CA", "San Jose", ["sj", "silicon valley"]),
  createCitySuggestion("CA", "San Francisco", ["sf", "bay area"]),
  createCitySuggestion("CA", "Sacramento"),
  createCitySuggestion("CA", "Fresno"),
  createCitySuggestion("CA", "Long Beach"),
  createCitySuggestion("CA", "Oakland"),
  createCitySuggestion("CA", "Bakersfield"),
  createCitySuggestion("CA", "Anaheim"),
  createCitySuggestion("CA", "Santa Ana"),
  createCitySuggestion("CA", "Riverside"),
  createCitySuggestion("CA", "Stockton"),
  createCitySuggestion("CA", "Irvine"),
  createCitySuggestion("CA", "Chula Vista"),
  createCitySuggestion("CA", "San Bernardino"),
  createCitySuggestion("CA", "Modesto"),
  createCitySuggestion("CA", "Oxnard"),
  createCitySuggestion("CA", "Santa Rosa"),
  createCitySuggestion("CA", "Huntington Beach"),
  createCitySuggestion("CA", "Fontana"),
  createCitySuggestion("CA", "Moreno Valley"),
  createCitySuggestion("CA", "Fremont"),
  createCitySuggestion("CA", "Glendale"),
  createCitySuggestion("CA", "Santa Clarita"),
  createCitySuggestion("CA", "Garden Grove"),
  createCitySuggestion("CA", "Pomona"),
  createCitySuggestion("CO", "Denver"),
  createCitySuggestion("CO", "Colorado Springs"),
  createCitySuggestion("CO", "Aurora"),
  createCitySuggestion("CO", "Fort Collins"),
  createCitySuggestion("CO", "Lakewood"),
  createCitySuggestion("CO", "Thornton"),
  createCitySuggestion("CO", "Boulder"),
  createCitySuggestion("CO", "Arvada"),
  createCitySuggestion("CT", "Bridgeport"),
  createCitySuggestion("CT", "New Haven"),
  createCitySuggestion("CT", "Hartford"),
  createCitySuggestion("CT", "Stamford"),
  createCitySuggestion("CT", "Waterbury"),
  createCitySuggestion("CT", "Norwalk"),
  createCitySuggestion("DE", "Wilmington"),
  createCitySuggestion("DE", "Dover"),
  createCitySuggestion("DE", "Newark"),
  createCitySuggestion("DE", "Middletown"),
  createCitySuggestion("DE", "Smyrna"),
  createCitySuggestion("FL", "Jacksonville"),
  createCitySuggestion("FL", "Miami"),
  createCitySuggestion("FL", "Tampa"),
  createCitySuggestion("FL", "Orlando"),
  createCitySuggestion("FL", "St. Petersburg", ["saint petersburg florida", "st petersburg florida"]),
  createCitySuggestion("FL", "Hialeah"),
  createCitySuggestion("FL", "Tallahassee"),
  createCitySuggestion("FL", "Fort Lauderdale"),
  createCitySuggestion("FL", "Port St. Lucie"),
  createCitySuggestion("FL", "Cape Coral"),
  createCitySuggestion("FL", "Pembroke Pines"),
  createCitySuggestion("GA", "Atlanta"),
  createCitySuggestion("GA", "Augusta"),
  createCitySuggestion("GA", "Columbus"),
  createCitySuggestion("GA", "Macon"),
  createCitySuggestion("GA", "Savannah"),
  createCitySuggestion("GA", "Athens"),
  createCitySuggestion("GA", "Sandy Springs"),
  createCitySuggestion("HI", "Honolulu"),
  createCitySuggestion("HI", "Hilo"),
  createCitySuggestion("HI", "Kailua"),
  createCitySuggestion("HI", "Kapolei"),
  createCitySuggestion("HI", "Kaneohe"),
  createCitySuggestion("ID", "Boise"),
  createCitySuggestion("ID", "Meridian"),
  createCitySuggestion("ID", "Nampa"),
  createCitySuggestion("ID", "Idaho Falls"),
  createCitySuggestion("ID", "Pocatello"),
  createCitySuggestion("IL", "Chicago"),
  createCitySuggestion("IL", "Aurora"),
  createCitySuggestion("IL", "Naperville"),
  createCitySuggestion("IL", "Joliet"),
  createCitySuggestion("IL", "Rockford"),
  createCitySuggestion("IL", "Springfield"),
  createCitySuggestion("IL", "Elgin"),
  createCitySuggestion("IL", "Peoria"),
  createCitySuggestion("IN", "Indianapolis"),
  createCitySuggestion("IN", "Fort Wayne"),
  createCitySuggestion("IN", "Evansville"),
  createCitySuggestion("IN", "South Bend"),
  createCitySuggestion("IN", "Carmel"),
  createCitySuggestion("IN", "Fishers"),
  createCitySuggestion("IA", "Des Moines"),
  createCitySuggestion("IA", "Cedar Rapids"),
  createCitySuggestion("IA", "Davenport"),
  createCitySuggestion("IA", "Sioux City"),
  createCitySuggestion("IA", "Iowa City"),
  createCitySuggestion("KS", "Wichita"),
  createCitySuggestion("KS", "Overland Park"),
  createCitySuggestion("KS", "Kansas City"),
  createCitySuggestion("KS", "Olathe"),
  createCitySuggestion("KS", "Topeka"),
  createCitySuggestion("KS", "Lawrence"),
  createCitySuggestion("KY", "Louisville"),
  createCitySuggestion("KY", "Lexington"),
  createCitySuggestion("KY", "Bowling Green"),
  createCitySuggestion("KY", "Owensboro"),
  createCitySuggestion("KY", "Covington"),
  createCitySuggestion("LA", "New Orleans", ["nola"]),
  createCitySuggestion("LA", "Baton Rouge"),
  createCitySuggestion("LA", "Shreveport"),
  createCitySuggestion("LA", "Lafayette"),
  createCitySuggestion("LA", "Lake Charles"),
  createCitySuggestion("ME", "Portland"),
  createCitySuggestion("ME", "Lewiston"),
  createCitySuggestion("ME", "Bangor"),
  createCitySuggestion("ME", "South Portland"),
  createCitySuggestion("ME", "Auburn"),
  createCitySuggestion("MD", "Baltimore"),
  createCitySuggestion("MD", "Frederick"),
  createCitySuggestion("MD", "Rockville"),
  createCitySuggestion("MD", "Gaithersburg"),
  createCitySuggestion("MD", "Bowie"),
  createCitySuggestion("MA", "Boston"),
  createCitySuggestion("MA", "Worcester"),
  createCitySuggestion("MA", "Springfield"),
  createCitySuggestion("MA", "Cambridge"),
  createCitySuggestion("MA", "Lowell"),
  createCitySuggestion("MA", "Brockton"),
  createCitySuggestion("MI", "Detroit"),
  createCitySuggestion("MI", "Grand Rapids"),
  createCitySuggestion("MI", "Warren"),
  createCitySuggestion("MI", "Sterling Heights"),
  createCitySuggestion("MI", "Ann Arbor"),
  createCitySuggestion("MI", "Lansing"),
  createCitySuggestion("MN", "Minneapolis", ["twin cities"]),
  createCitySuggestion("MN", "Saint Paul", ["st paul"]),
  createCitySuggestion("MN", "Rochester"),
  createCitySuggestion("MN", "Duluth"),
  createCitySuggestion("MN", "Bloomington"),
  createCitySuggestion("MS", "Jackson"),
  createCitySuggestion("MS", "Gulfport"),
  createCitySuggestion("MS", "Southaven"),
  createCitySuggestion("MS", "Biloxi"),
  createCitySuggestion("MS", "Hattiesburg"),
  createCitySuggestion("MO", "Kansas City", ["kc"]),
  createCitySuggestion("MO", "St. Louis", ["saint louis", "st louis missouri"]),
  createCitySuggestion("MO", "Springfield"),
  createCitySuggestion("MO", "Columbia"),
  createCitySuggestion("MO", "Independence"),
  createCitySuggestion("MO", "Lee's Summit"),
  createCitySuggestion("MT", "Billings"),
  createCitySuggestion("MT", "Missoula"),
  createCitySuggestion("MT", "Great Falls"),
  createCitySuggestion("MT", "Bozeman"),
  createCitySuggestion("MT", "Helena"),
  createCitySuggestion("NE", "Omaha"),
  createCitySuggestion("NE", "Lincoln"),
  createCitySuggestion("NE", "Bellevue"),
  createCitySuggestion("NE", "Grand Island"),
  createCitySuggestion("NE", "Kearney"),
  createCitySuggestion("NV", "Las Vegas", ["vegas"]),
  createCitySuggestion("NV", "Henderson"),
  createCitySuggestion("NV", "Reno"),
  createCitySuggestion("NV", "North Las Vegas"),
  createCitySuggestion("NV", "Sparks"),
  createCitySuggestion("NH", "Manchester"),
  createCitySuggestion("NH", "Nashua"),
  createCitySuggestion("NH", "Concord"),
  createCitySuggestion("NH", "Dover"),
  createCitySuggestion("NH", "Rochester"),
  createCitySuggestion("NJ", "Newark"),
  createCitySuggestion("NJ", "Jersey City"),
  createCitySuggestion("NJ", "Paterson"),
  createCitySuggestion("NJ", "Elizabeth"),
  createCitySuggestion("NJ", "Edison"),
  createCitySuggestion("NJ", "Woodbridge"),
  createCitySuggestion("NM", "Albuquerque"),
  createCitySuggestion("NM", "Las Cruces"),
  createCitySuggestion("NM", "Rio Rancho"),
  createCitySuggestion("NM", "Santa Fe"),
  createCitySuggestion("NM", "Roswell"),
  createCitySuggestion("NY", "New York", ["new york city", "nyc", "manhattan", "brooklyn", "queens"]),
  createCitySuggestion("NY", "Buffalo"),
  createCitySuggestion("NY", "Rochester"),
  createCitySuggestion("NY", "Yonkers"),
  createCitySuggestion("NY", "Syracuse"),
  createCitySuggestion("NY", "Albany"),
  createCitySuggestion("NY", "New Rochelle"),
  createCitySuggestion("NY", "Mount Vernon"),
  createCitySuggestion("NC", "Charlotte"),
  createCitySuggestion("NC", "Raleigh"),
  createCitySuggestion("NC", "Greensboro"),
  createCitySuggestion("NC", "Durham"),
  createCitySuggestion("NC", "Winston-Salem"),
  createCitySuggestion("NC", "Fayetteville"),
  createCitySuggestion("NC", "Cary"),
  createCitySuggestion("ND", "Fargo"),
  createCitySuggestion("ND", "Bismarck"),
  createCitySuggestion("ND", "Grand Forks"),
  createCitySuggestion("ND", "Minot"),
  createCitySuggestion("ND", "West Fargo"),
  createCitySuggestion("OH", "Columbus"),
  createCitySuggestion("OH", "Cleveland"),
  createCitySuggestion("OH", "Cincinnati"),
  createCitySuggestion("OH", "Toledo"),
  createCitySuggestion("OH", "Akron"),
  createCitySuggestion("OH", "Dayton"),
  createCitySuggestion("OH", "Parma"),
  createCitySuggestion("OK", "Oklahoma City", ["okc"]),
  createCitySuggestion("OK", "Tulsa"),
  createCitySuggestion("OK", "Norman"),
  createCitySuggestion("OK", "Broken Arrow"),
  createCitySuggestion("OK", "Edmond"),
  createCitySuggestion("OR", "Portland"),
  createCitySuggestion("OR", "Salem"),
  createCitySuggestion("OR", "Eugene"),
  createCitySuggestion("OR", "Gresham"),
  createCitySuggestion("OR", "Hillsboro"),
  createCitySuggestion("OR", "Bend"),
  createCitySuggestion("PA", "Philadelphia", ["philly"]),
  createCitySuggestion("PA", "Pittsburgh"),
  createCitySuggestion("PA", "Allentown"),
  createCitySuggestion("PA", "Erie"),
  createCitySuggestion("PA", "Reading"),
  createCitySuggestion("PA", "Scranton"),
  createCitySuggestion("RI", "Providence"),
  createCitySuggestion("RI", "Warwick"),
  createCitySuggestion("RI", "Cranston"),
  createCitySuggestion("RI", "Pawtucket"),
  createCitySuggestion("RI", "East Providence"),
  createCitySuggestion("SC", "Charleston"),
  createCitySuggestion("SC", "Columbia"),
  createCitySuggestion("SC", "North Charleston"),
  createCitySuggestion("SC", "Mount Pleasant"),
  createCitySuggestion("SC", "Rock Hill"),
  createCitySuggestion("SC", "Greenville"),
  createCitySuggestion("SD", "Sioux Falls"),
  createCitySuggestion("SD", "Rapid City"),
  createCitySuggestion("SD", "Aberdeen"),
  createCitySuggestion("SD", "Brookings"),
  createCitySuggestion("SD", "Watertown"),
  createCitySuggestion("TN", "Nashville"),
  createCitySuggestion("TN", "Memphis"),
  createCitySuggestion("TN", "Knoxville"),
  createCitySuggestion("TN", "Chattanooga"),
  createCitySuggestion("TN", "Clarksville"),
  createCitySuggestion("TN", "Murfreesboro"),
  createCitySuggestion("TX", "Houston"),
  createCitySuggestion("TX", "San Antonio"),
  createCitySuggestion("TX", "Dallas"),
  createCitySuggestion("TX", "Austin", ["atx"]),
  createCitySuggestion("TX", "Fort Worth"),
  createCitySuggestion("TX", "El Paso"),
  createCitySuggestion("TX", "Arlington"),
  createCitySuggestion("TX", "Corpus Christi"),
  createCitySuggestion("TX", "Plano"),
  createCitySuggestion("TX", "Laredo"),
  createCitySuggestion("TX", "Lubbock"),
  createCitySuggestion("TX", "Irving"),
  createCitySuggestion("TX", "Garland"),
  createCitySuggestion("TX", "Frisco"),
  createCitySuggestion("UT", "Salt Lake City", ["slc"]),
  createCitySuggestion("UT", "West Valley City"),
  createCitySuggestion("UT", "Provo"),
  createCitySuggestion("UT", "West Jordan"),
  createCitySuggestion("UT", "Orem"),
  createCitySuggestion("UT", "Sandy"),
  createCitySuggestion("VT", "Burlington"),
  createCitySuggestion("VT", "South Burlington"),
  createCitySuggestion("VT", "Rutland"),
  createCitySuggestion("VT", "Barre"),
  createCitySuggestion("VT", "Montpelier"),
  createCitySuggestion("VA", "Virginia Beach"),
  createCitySuggestion("VA", "Chesapeake"),
  createCitySuggestion("VA", "Norfolk"),
  createCitySuggestion("VA", "Richmond"),
  createCitySuggestion("VA", "Newport News"),
  createCitySuggestion("VA", "Alexandria"),
  createCitySuggestion("VA", "Arlington"),
  createCitySuggestion("WA", "Seattle"),
  createCitySuggestion("WA", "Spokane"),
  createCitySuggestion("WA", "Tacoma"),
  createCitySuggestion("WA", "Vancouver"),
  createCitySuggestion("WA", "Bellevue"),
  createCitySuggestion("WA", "Kent"),
  createCitySuggestion("WA", "Everett"),
  createCitySuggestion("WA", "Renton"),
  createCitySuggestion("WV", "Charleston"),
  createCitySuggestion("WV", "Huntington"),
  createCitySuggestion("WV", "Morgantown"),
  createCitySuggestion("WV", "Parkersburg"),
  createCitySuggestion("WV", "Wheeling"),
  createCitySuggestion("WI", "Milwaukee"),
  createCitySuggestion("WI", "Madison"),
  createCitySuggestion("WI", "Green Bay"),
  createCitySuggestion("WI", "Kenosha"),
  createCitySuggestion("WI", "Racine"),
  createCitySuggestion("WI", "Appleton"),
  createCitySuggestion("WY", "Cheyenne"),
  createCitySuggestion("WY", "Casper"),
  createCitySuggestion("WY", "Laramie"),
  createCitySuggestion("WY", "Gillette"),
  createCitySuggestion("WY", "Rock Springs"),
  createCitySuggestion("DC", "Washington", ["washington dc", "dc"])
]

const LOCATION_SUGGESTIONS: IndexedLocationSuggestion[] = [
  ...WORKPLACE_SUGGESTIONS,
  ...CITY_SUGGESTIONS,
  ...STATE_SUGGESTIONS
].map((suggestion) => ({
  ...suggestion,
  normalizedSearchTerms: suggestion.searchTerms.map(normalize)
}))

export function getLocationSuggestions(query: string, limit = 8): LocationSuggestion[] {
  const normalizedQuery = normalize(query)

  if (!normalizedQuery) {
    return LOCATION_SUGGESTIONS.slice(0, limit)
  }

  const scored = LOCATION_SUGGESTIONS.map((suggestion) => {
    let score = -1

    for (const term of suggestion.normalizedSearchTerms) {
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
    .map(({ suggestion }) => ({
      label: suggestion.label,
      value: suggestion.value,
      detail: suggestion.detail,
      searchTerms: suggestion.searchTerms,
      queryValue: suggestion.queryValue
    }))
}

export function resolveLocationQuery(value: string): string {
  const normalizedValue = normalize(value)
  const suggestion = LOCATION_SUGGESTIONS.find((item) => normalize(item.value) === normalizedValue)

  return suggestion?.queryValue ?? `"${value.trim().replaceAll('"', "").toLowerCase()}"`
}
