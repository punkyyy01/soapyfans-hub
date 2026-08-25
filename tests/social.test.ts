import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { extractMentions, notificationMessage } from '../utils/social'

describe('extractMentions (mirrors the @mention regex in submit_review_reply())', () => {
  it('extracts a single mention', () => {
    assert.deepEqual(extractMentions('Great take, @sophiefan!'), ['sophiefan'])
  })

  it('extracts multiple mentions', () => {
    assert.deepEqual(extractMentions('@alice and @bob_2 should see this'), ['alice', 'bob_2'])
  })

  it('returns an empty array when there are no mentions', () => {
    assert.deepEqual(extractMentions('No mentions here.'), [])
  })

  it('ignores a mention shorter than the 3-char username minimum', () => {
    assert.deepEqual(extractMentions('cc @ab'), [])
  })

  it('caps a mention at the 30-char username maximum', () => {
    const longName = 'a'.repeat(35)
    assert.deepEqual(extractMentions(`@${longName}`), ['a'.repeat(30)])
  })

  it('only matches the username charset [a-zA-Z0-9_]', () => {
    assert.deepEqual(extractMentions('email me at user@example.com'), ['example'])
  })
})

describe('notificationMessage', () => {
  it('formats a follow notification', () => {
    assert.equal(notificationMessage('follow', 'Alex'), 'Alex started following you')
  })

  it('formats a like notification', () => {
    assert.equal(notificationMessage('like', 'Alex'), 'Alex liked your review')
  })

  it('formats a reply notification', () => {
    assert.equal(notificationMessage('reply', 'Alex'), 'Alex replied to your review')
  })

  it('formats a mention notification', () => {
    assert.equal(notificationMessage('mention', 'Alex'), 'Alex mentioned you in a reply')
  })

  it('falls back for an unrecognized type instead of throwing', () => {
    assert.equal(notificationMessage('unknown', 'Alex'), 'Alex interacted with your activity')
  })
})
