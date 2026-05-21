import { unstable_cache } from 'next/cache'

const WIKIDATA_SPARQL_URL = 'https://query.wikidata.org/sparql'
const SOPHIE_WIKIDATA_ID = 'Q61996880'
const WIKIDATA_REVALIDATE_SECONDS = 86400

export interface WikidataCredit {
  wikidataId: string
  title: string
  year: string | null
  character: string | null
  mediaType: string | null
  source: 'wikidata'
  posterPath: null
}

interface SparqlValue {
  type: string
  value: string
}

interface SparqlRow {
  work: SparqlValue
  workLabel?: SparqlValue
  date?: SparqlValue
  characterLabel?: SparqlValue
  workTypeLabel?: SparqlValue
  roleType?: SparqlValue
}

interface SparqlResults {
  results: { bindings: SparqlRow[] }
}

const QUERY = `
SELECT ?work ?workLabel ?date ?character ?characterLabel ?workTypeLabel ?roleType
WHERE {
  {
    ?work p:P161 ?stmt.
    ?stmt ps:P161 wd:${SOPHIE_WIKIDATA_ID}.
    OPTIONAL { ?stmt pq:P453 ?character. }
    BIND("cast" AS ?roleType)
  } UNION {
    ?work wdt:P162 wd:${SOPHIE_WIKIDATA_ID}.
    BIND("executive producer" AS ?roleType)
  }
  OPTIONAL { ?work wdt:P577 ?date. }
  OPTIONAL { ?work wdt:P31 ?workType. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 300
`.trim()

function extractQId(uri: string): string {
  return uri.split('/').pop() ?? uri
}

async function fetchSophieWikidataCredits(): Promise<WikidataCredit[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(WIKIDATA_SPARQL_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/sparql-results+json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SoapyFansHub/1.0 (https://github.com/punkyyy01)',
      },
      body: new URLSearchParams({ query: QUERY }).toString(),
      signal: controller.signal,
      next: { revalidate: WIKIDATA_REVALIDATE_SECONDS },
    })
    clearTimeout(timeout)

    if (!res.ok) return []

    const data = (await res.json()) as SparqlResults
    const map = new Map<string, WikidataCredit>()

    for (const row of data.results.bindings) {
      if (!row.work || !row.workLabel) continue

      const id = extractQId(row.work.value)
      const title = row.workLabel.value

      if (!title || /^Q\d+$/.test(title)) continue

      const year = row.date?.value?.slice(0, 4) ?? null
      const character =
        row.characterLabel?.value ??
        (row.roleType?.value === 'executive producer' ? 'Executive Producer' : null)
      const mediaType = row.workTypeLabel?.value ?? null

      const existing = map.get(id)
      if (!existing) {
        map.set(id, { wikidataId: id, title, year, character, mediaType, source: 'wikidata', posterPath: null })
      } else {
        if (year && (!existing.year || year < existing.year)) existing.year = year
        if (!existing.character && character) existing.character = character
        if (!existing.mediaType && mediaType) existing.mediaType = mediaType
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (!a.year && !b.year) return 0
      if (!a.year) return 1
      if (!b.year) return -1
      return b.year.localeCompare(a.year)
    })
  } catch {
    return []
  }
}

export async function getSophieWikidataCredits(): Promise<WikidataCredit[]> {
  return unstable_cache(
    () => fetchSophieWikidataCredits(),
    ['wikidata', 'sophie-thatcher', 'credits'],
    { revalidate: WIKIDATA_REVALIDATE_SECONDS }
  )()
}
