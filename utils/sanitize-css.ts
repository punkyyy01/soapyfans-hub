const BLOCKED: RegExp[] = [
  /@import/i,
  /javascript\s*:/i,
  /expression\s*\(/i,
  /position\s*:\s*fixed/i,
  /position\s*:\s*sticky/i,
  /position\s*:\s*absolute/i,
  /url\s*\(/i,
  /-moz-binding/i,
  /-moz-element/i,
  /behavior\s*:/i,
  /@font-face/i,
  /z-index\s*:/i,
  /filter\s*:\s*.*url/i,
  /<|>/,
  /\/\*/,
  /\\/,
]

// Zero-width / bidi-control characters (ZWSP, ZWNJ, ZWJ, LRM/RLM, bidi
// embedding/override controls, word joiner, BOM) that can split a blocked
// keyword into two halves invisible to both the regex and a human reviewer.
const INVISIBLE_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g

export function sanitizeCSS(css: string): string {
  if (css.length > 2000) return ''

  // Strip structural/invisible characters BEFORE blacklisting, not after.
  // Checking the raw input first is unsound: inputs like "u{}rl(" match none
  // of the patterns below, but collapse into "url(" once braces and
  // zero-width characters are removed -- reconstructing a blocked keyword
  // from a payload the filter already approved.
  const collapsed = css.replace(/[{}]/g, '').replace(INVISIBLE_CHARS, '')

  for (const pattern of BLOCKED) {
    if (pattern.test(collapsed)) return ''
  }
  return collapsed
}
