import { describe, expect, it } from 'vitest'
import { postAuthPath } from '../src/utils/paths'

describe('postAuthPath', () => {
  it('preserves a safe internal destination', () => {
    expect(
      postAuthPath('USER', {
        from: '/articles/42?mode=study#sentence-3',
      }),
    ).toBe('/articles/42?mode=study#sentence-3')
  })

  it.each([
    'https://malicious.example',
    '//malicious.example',
    '/\\malicious.example',
    'javascript:alert(1)',
  ])('rejects an unsafe redirect destination: %s', (from) => {
    expect(postAuthPath('USER', { from })).toBe('/')
  })

  it('uses the role default when no destination is available', () => {
    expect(postAuthPath('USER', null)).toBe('/')
    expect(postAuthPath('ADMIN', null)).toBe('/admin')
  })
})
