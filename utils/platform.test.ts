import assert from 'node:assert/strict'
import { test } from 'node:test'
import { platformOf } from './platform.ts'

test('real sites and their subdomains', () => {
  assert.equal(platformOf('x.com'), 'x')
  assert.equal(platformOf('twitter.com'), 'x')
  assert.equal(platformOf('www.facebook.com'), 'facebook')
  assert.equal(platformOf('old.reddit.com'), 'reddit')
  assert.equal(platformOf('www.tiktok.com'), 'tiktok')
})

test('demo mocks of prd and dev', () => {
  assert.equal(platformOf('meritum-instagram.gburek.app'), 'instagram')
  assert.equal(platformOf('meritum-reddit-dev.gburek.app'), 'reddit')
})

test('anything else is not a platform', () => {
  for (const host of ['meritum.gburek.app', 'google.com', 'x.com.evil.app', 'notreddit.com']) {
    assert.equal(platformOf(host), null)
  }
})
