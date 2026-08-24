/**
 * Groq-backed relevance filter for the news ingest pipeline. Same shape as
 * vzla-sismo-feed's factchecker.ts (OpenAI-compatible chat completions,
 * llama-3.3-70b-versatile, JSON-only response) -- proven pattern, swapped
 * from "verify an earthquake news event" to "verify this is actually about
 * the actress Sophie Thatcher, and tag it".
 */

import { NEWS_TAGS } from './news'

export type NewsClassification = {
  status: 'approved' | 'rejected' | 'uncertain'
  tag: string | null
  confidence: number
  reason: string
}

const SYSTEM_PROMPT = `You are a relevance filter for a fan site about Sophie Thatcher, the actress (born 1996, known for Yellowjackets, The Boogeyman, Heretic, MaXXXine). Your only job is deciding whether a news item is genuinely about HER, and if so, tagging it.

REJECT if:
- It is about a different person who happens to share a name (e.g. Margaret Thatcher, a different "Sophie", a different "Thatcher").
- It merely name-drops her in passing (a listicle, a cast-list roundup with no real content about her) rather than being substantively about her or her work.
- It is spam, an ad, or unrelated content that slipped past the keyword filter.

MARK AS UNCERTAIN if it plausibly involves her but the title/description alone can't confirm it.

APPROVE if it is clearly, substantively about Sophie Thatcher the actress: a role, a project, an interview, an appearance, awards recognition, etc.

If approved, assign exactly one tag from this list: ${NEWS_TAGS.join(', ')}.
- new-project: a new film/TV/other project announced, cast, or released
- interview: an interview or profile piece
- red-carpet: premieres, red carpet appearances, event photos
- social-media: something she posted or said on social media
- awards: award nominations, wins, campaigns
- streaming: news about where/when to watch an existing project
- general: doesn't fit the above but is still substantively about her

Respond with ONLY this JSON shape, no other text:
{
  "status": "approved" | "rejected" | "uncertain",
  "tag": "<one of the tags above>" | null,
  "confidence": <0-100>,
  "reason": "<short explanation, max 100 chars>"
}`

export async function classifyNewsItem(
  title: string,
  description: string,
  sourceName: string,
): Promise<NewsClassification> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 200,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `SOURCE: ${sourceName}\nTITLE: ${title}\nDESCRIPTION: ${description?.slice(0, 500) ?? '(none)'}`,
          },
        ],
      }),
    })

    if (!res.ok) throw new Error(`Groq API error: ${res.status}`)

    const data = await res.json()
    const text: string = data.choices?.[0]?.message?.content ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    const status: NewsClassification['status'] =
      parsed.status === 'approved' || parsed.status === 'rejected' ? parsed.status : 'uncertain'

    return {
      status,
      tag: typeof parsed.tag === 'string' ? parsed.tag : null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
      reason: typeof parsed.reason === 'string' ? parsed.reason : 'No reason given',
    }
  } catch (err) {
    console.error('[news-classifier] Error:', err)
    // Fail closed: an unclassifiable item never reaches the public feed.
    return { status: 'uncertain', tag: null, confidence: 0, reason: 'Classification failed' }
  }
}
