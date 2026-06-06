const BLOCKED: RegExp[] = [
  /@import/i,
  /javascript\s*:/i,
  /expression\s*\(/i,
  /position\s*:\s*fixed/i,
  /position\s*:\s*sticky/i,
]

export function sanitizeCSS(css: string): string {
  if (css.length > 5000) return ''
  for (const pattern of BLOCKED) {
    if (pattern.test(css)) return ''
  }
  return css
}
