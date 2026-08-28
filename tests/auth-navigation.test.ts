import { describe, expect, it } from 'vitest'
import { postAuthPath, postLoginPath } from '@/utils/paths'
import type { CurrentUser } from '@/types/Auth/auth'

const newLearner: CurrentUser = {
  id: 'user-1',
  email: 'learner@example.com',
  role: 'USER',
  status: 'ACTIVE',
  displayName: 'Learner',
  avatarUrl: null,
  currentCefrLevel: 'A1',
  learningGoal: null,
  preferredLanguage: 'vi',
}

describe('postAuthPath', () => {
  it('preserves a safe internal destination', () => {
    expect(
      postAuthPath('USER', {
        from: '/articles/42?mode=study#sentence-3',
      }),
    ).toBe('/articles/42?mode=study#sentence-3')
  })

  it('preserves a safe reader destination after authentication', () => {
    expect(
      postAuthPath('USER', {
        from: '/read/how-technology-changes-learning',
      }),
    ).toBe('/read/how-technology-changes-learning')
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

  it('requires onboarding before restoring a learner destination', () => {
    expect(postLoginPath(newLearner, { from: '/reading-history' })).toBe(
      '/onboarding',
    )
    expect(
      postLoginPath(
        {
          ...newLearner,
          learningGoal: 'Read English news confidently',
        },
        { from: '/reading-history' },
      ),
    ).toBe('/reading-history')
  })
})
