import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enHome from './locales/en/home.json'
import viHome from './locales/vi/home.json'
import enAnalytics from './locales/en/analytics.json'
import viAnalytics from './locales/vi/analytics.json'
import enProfile from './locales/en/profile.json'
import viProfile from './locales/vi/profile.json'
import enArticles from './locales/en/articles.json'
import viArticles from './locales/vi/articles.json'
import enVocabulary from './locales/en/vocabulary.json'
import viVocabulary from './locales/vi/vocabulary.json'

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['home', 'analytics', 'profile', 'articles', 'vocabulary'],
  defaultNS: 'home',
  resources: {
    en: { home: enHome, analytics: enAnalytics, profile: enProfile, articles: enArticles, vocabulary: enVocabulary },
    vi: { home: viHome, analytics: viAnalytics, profile: viProfile, articles: viArticles, vocabulary: viVocabulary },
  },
  interpolation: {
    escapeValue: false, // React already escapes values
  },
})


export default i18n
