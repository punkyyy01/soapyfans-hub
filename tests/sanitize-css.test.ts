import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeCSS } from '../utils/sanitize-css'

describe('sanitizeCSS', () => {
  it('allows safe standard CSS declarations', () => {
    const input = 'background-color: #1a0a2e; color: #f5f0e8; border-radius: 8px;'
    const output = sanitizeCSS(input)
    assert.equal(output, input)
  })

  it('strips curly braces to prevent selector breakout', () => {
    const input = 'body { display: none; } p { color: red; }'
    const output = sanitizeCSS(input)
    assert.equal(output, 'body  display: none;  p  color: red; ')
    assert.equal(output.includes('{'), false)
    assert.equal(output.includes('}'), false)
  })

  it('blocks javascript: pseudo-protocol', () => {
    const input = 'background: javascript:alert(1);'
    assert.equal(sanitizeCSS(input), '')
  })

  it('blocks @import rules', () => {
    const input = '@import url("https://evil.com/style.css");'
    assert.equal(sanitizeCSS(input), '')
  })

  it('blocks @font-face rules', () => {
    const input = '@font-face { font-family: Evil; src: url(...); }'
    assert.equal(sanitizeCSS(input), '')
  })

  it('blocks fixed, sticky, and absolute position exploits', () => {
    assert.equal(sanitizeCSS('position: fixed; top: 0;'), '')
    assert.equal(sanitizeCSS('position: absolute; left: 0;'), '')
    assert.equal(sanitizeCSS('position: sticky; top: 0;'), '')
  })

  it('blocks z-index manipulation', () => {
    assert.equal(sanitizeCSS('z-index: 9999;'), '')
  })

  it('blocks url() functions', () => {
    assert.equal(sanitizeCSS('background-image: url("https://attacker.com/leak");'), '')
  })

  it('blocks HTML tag injection characters < and >', () => {
    assert.equal(sanitizeCSS('</style><script>alert(1)</script>'), '')
    assert.equal(sanitizeCSS('<img src=x onerror=alert(1)>'), '')
  })

  it('blocks CSS comments to avoid comment-based parsing bypasses', () => {
    assert.equal(sanitizeCSS('/* comment */ color: red;'), '')
  })

  it('enforces maximum character length of 2000', () => {
    const longCSS = 'color: red; '.repeat(200)
    assert.ok(longCSS.length > 2000)
    assert.equal(sanitizeCSS(longCSS), '')
  })
})
