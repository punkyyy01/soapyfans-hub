/**
 * Groq-backed relevance filter for the news ingest pipeline. Same shape as
 * vzla-sismo-feed's factchecker.ts (OpenAI-compatible chat completions,
 * JSON-only response) -- proven pattern, swapped from "verify an earthquake
 * news event" to "verify this is actually about the actress Sophie
 * Thatcher, and tag it".
 */

import { NEWS_TAGS } from './news'

export type NewsClassification = {
  status: 'approved' | 'rejected' | 'uncertain'
  tag: string | null
  confidence: number
  reason: string
}

// Kept short deliberately: it's sent on every single call (no prompt
// caching here), and openai/gpt-oss-120b's free tier is capped at 8,000
// TPM -- a verbose prompt directly shrinks how many items one run can
// classify before hitting a 429.
const SYSTEM_PROMPT = `Relevance filter for a Sophie Thatcher (actress, b.1996, Yellowjackets/The Boogeyman/Heretic/MaXXXine) fan site. Decide if a news item is genuinely about HER.

REJECT: different person sharing a name (e.g. Margaret Thatcher); mere name-drop in a listicle/cast roundup; spam/unrelated.
UNCERTAIN: plausibly her, but title/description alone can't confirm it.
APPROVE: clearly, substantively about her (role, project, interview, appearance, award, etc).

If approved, pick exactly one tag: ${NEWS_TAGS.join(', ')}.

Respond with ONLY this JSON, no other text, no markdown fences:
{"status":"approved"|"rejected"|"uncertain","tag":"<tag or null>","confidence":<0-100>,"reason":"<max 100 chars>"}`

/**
 * Returns null on any failure (HTTP error, rate limit, malformed JSON) --
 * NEVER a fake "uncertain" result. news-ingest/route.ts's dedup check is
 * keyed on source_url, so persisting a placeholder here would permanently
 * block a perfectly good story from ever being reclassified on a later
 * run. A genuine "uncertain" (the model's own judgment call) is a real
 * NewsClassification and still gets stored -- only a failed *attempt* is
 * null, so the caller can skip it and let the next cron tick retry.
 */
export async function classifyNewsItem(
  title: string,
  description: string,
  sourceName: string,
): Promise<NewsClassification | null> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        // llama-3.3-70b-versatile was decommissioned by Groq for
        // free/developer-tier usage in August 2026; openai/gpt-oss-120b is
        // Groq's own recommended replacement. It's a reasoning model that
        // spends completion tokens on hidden reasoning before the answer,
        // which was silently truncating the JSON output at max_tokens:200
        // (confirmed live via "Unexpected end of JSON input" errors) --
        // reasoning_effort:'low' plus a larger budget fixes that.
        model: 'openai/gpt-oss-120b',
        reasoning_effort: 'low',
        max_tokens: 400,
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
    return null
  }
}
