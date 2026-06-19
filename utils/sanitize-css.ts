const BLOCKED: RegExp[] = [
  /@import/i,
  /javascript\s*:/i,
  /expression\s*\(/i,
  /position\s*:\s*fixed/i,
  /position\s*:\s*sticky/i,
  /position\s*:\s*absolute/i,
  /url\s*\(/i,
  /-moz-binding/i,
  /behavior\s*:/i,
  /@font-face/i,
  /z-index\s*:/i,
  /filter\s*:\s*.*url/i,
  /<|>/,
  /\/\*/,
]

export function sanitizeCSS(css: string): string {
  if (css.length > 2000) return ''
  for (const pattern of BLOCKED) {
    if (pattern.test(css)) return ''
  }
  return css.replace(/[{}]/g, '')
}
