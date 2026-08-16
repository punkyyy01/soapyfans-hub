import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { detectImageFormat } from '../utils/image-validation'

describe('Image Binary Magic-Bytes Validation', () => {
  it('correctly detects genuine JPEG image (FF D8 FF)', () => {
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
    const res = detectImageFormat(jpegBytes)
    assert.deepEqual(res, { mime: 'image/jpeg', ext: 'jpg' })
  })

  it('correctly detects genuine PNG image (89 50 4E 47)', () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
    const res = detectImageFormat(pngBytes)
    assert.deepEqual(res, { mime: 'image/png', ext: 'png' })
  })

  it('correctly detects genuine GIF87a image', () => {
    const gif87Bytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00])
    const res = detectImageFormat(gif87Bytes)
    assert.deepEqual(res, { mime: 'image/gif', ext: 'gif' })
  })

  it('correctly detects genuine GIF89a image', () => {
    const gif89Bytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x64, 0x00, 0x64, 0x00, 0xf7, 0x00])
    const res = detectImageFormat(gif89Bytes)
    assert.deepEqual(res, { mime: 'image/gif', ext: 'gif' })
  })

  it('correctly detects genuine WebP image (RIFF ... WEBP)', () => {
    const webpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00, // size
      0x57, 0x45, 0x42, 0x50, // WEBP
    ])
    const res = detectImageFormat(webpBytes)
    assert.deepEqual(res, { mime: 'image/webp', ext: 'webp' })
  })

  it('rejects truncated buffer (< 12 bytes)', () => {
    const shortBytes = new Uint8Array([0xff, 0xd8, 0xff])
    assert.equal(detectImageFormat(shortBytes), null)
  })

  it('rejects text or executable files masquerading as images (MIME spoofing)', () => {
    const fakeHtmlBytes = new TextEncoder().encode('<html><body>not an image</body></html>')
    assert.equal(detectImageFormat(fakeHtmlBytes), null)

    const fakeExeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00])
    assert.equal(detectImageFormat(fakeExeBytes), null)
  })

  it('rejects corrupted RIFF headers (missing WEBP marker)', () => {
    const riffAvi = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x41, 0x56, 0x49, 0x20, // AVI (not WEBP)
    ])
    assert.equal(detectImageFormat(riffAvi), null)
  })
})

describe('Accent Color Validation', () => {
  const HEX_RE = /^#[0-9a-fA-F]{6}$/
  const FALLBACK_ACCENT = '#e8890c'

  it('accepts standard 6-digit hex color codes', () => {
    assert.ok(HEX_RE.test('#e8890c'))
    assert.ok(HEX_RE.test('#FFB700'))
    assert.ok(HEX_RE.test('#2a5c3f'))
    assert.ok(HEX_RE.test('#8B263E'))
    assert.ok(HEX_RE.test('#000000'))
    assert.ok(HEX_RE.test('#ffffff'))
  })

  it('rejects 3-digit shorthand hex codes', () => {
    assert.ok(!HEX_RE.test('#fff'))
    assert.ok(!HEX_RE.test('#e88'))
  })

  it('rejects CSS injections and color names', () => {
    assert.ok(!HEX_RE.test('red'))
    assert.ok(!HEX_RE.test('url(javascript:alert(1))'))
    assert.ok(!HEX_RE.test('#e8890c; background: red'))
    assert.ok(!HEX_RE.test('rgb(255,0,0)'))
    assert.ok(!HEX_RE.test(''))
  })

  it('falls back to default brand amber when value is missing or invalid', () => {
    const sanitizeColor = (val: string | null) => (val && HEX_RE.test(val) ? val : FALLBACK_ACCENT)
    assert.equal(sanitizeColor(null), '#e8890c')
    assert.equal(sanitizeColor('invalid'), '#e8890c')
    assert.equal(sanitizeColor('#2a5c3f'), '#2a5c3f')
  })
})
