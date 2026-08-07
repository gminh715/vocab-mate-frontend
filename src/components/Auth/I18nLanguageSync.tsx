import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Syncs i18n language with the user's preferredLanguage profile setting.
 * Must be rendered inside AuthProvider so useAuth() is available.
 * Must be rendered inside I18nProvider (i18n initialised) so useTranslation() works.
 */
export function I18nLanguageSync() {
  const { currentUser } = useAuth()
  const { i18n } = useTranslation()

  useEffect(() => {
    const lang = currentUser?.profile.preferredLanguage ?? 'en'
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang)
    }
  }, [currentUser?.profile.preferredLanguage, i18n])

  return null
}
