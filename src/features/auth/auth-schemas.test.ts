import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from './auth-schemas'

describe('Auth schemas', () => {
  it('normalizes login email without changing the password', () => {
    expect(
      loginSchema.parse({
        email: '  User@Example.COM ',
        password: 'StrongPass@123',
      }),
    ).toEqual({
      email: 'user@example.com',
      password: 'StrongPass@123',
    })
  })

  it('accepts the documented registration contract', () => {
    expect(
      registerSchema.parse({
        email: 'learner@example.com',
        password: 'StrongPass@123',
        displayName: '  Learner  ',
        currentCefrLevel: 'B1',
        learningGoal: '  Learn 10 words per day  ',
        preferredLanguage: '  vi  ',
      }),
    ).toEqual({
      email: 'learner@example.com',
      password: 'StrongPass@123',
      displayName: 'Learner',
      currentCefrLevel: 'B1',
      learningGoal: 'Learn 10 words per day',
      preferredLanguage: 'vi',
    })
  })

  it.each([
    'alllowercase1!',
    'ALLUPPERCASE1!',
    'NoNumber!',
    'NoSpecial123',
  ])('rejects a password that violates the backend policy: %s', (password) => {
    const result = registerSchema.safeParse({
      email: 'learner@example.com',
      password,
      displayName: 'Learner',
      currentCefrLevel: 'B1',
    })

    expect(result.success).toBe(false)
  })

  it('rejects client values outside the backend CEFR enum', () => {
    const result = registerSchema.safeParse({
      email: 'learner@example.com',
      password: 'StrongPass@123',
      displayName: 'Learner',
      currentCefrLevel: 'NATIVE',
    })

    expect(result.success).toBe(false)
  })
})
