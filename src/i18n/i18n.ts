import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enHome from './locales/en/home.json'
import viHome from './locales/vi/home.json'
import enProfile from './locales/en/profile.json'
import viProfile from './locales/vi/profile.json'
import enArticles from './locales/en/articles.json'
import viArticles from './locales/vi/articles.json'
import enVocabulary from './locales/en/vocabulary.json'
import viVocabulary from './locales/vi/vocabulary.json'
import enLanding from './locales/en/landing.json'
import viLanding from './locales/vi/landing.json'
import enOnboarding from './locales/en/onboarding.json'
import viOnboarding from './locales/vi/onboarding.json'
import enTutor from './locales/en/tutor.json'
import viTutor from './locales/vi/tutor.json'
import enAuth from './locales/en/auth.json'
import viAuth from './locales/vi/auth.json'

void i18n.use(initReactI18next).init({
  lng: 'vi',
  fallbackLng: 'vi',
  ns: ['home', 'profile', 'articles', 'vocabulary', 'landing', 'onboarding', 'tutor', 'auth'],
  defaultNS: 'home',
  resources: {
    en: { home: enHome, profile: enProfile, articles: enArticles, vocabulary: enVocabulary, landing: enLanding, onboarding: enOnboarding, tutor: enTutor, auth: enAuth },
    vi: { home: viHome, profile: viProfile, articles: viArticles, vocabulary: viVocabulary, landing: viLanding, onboarding: viOnboarding, tutor: viTutor, auth: viAuth },
  },
  interpolation: {
    escapeValue: false, // React already escapes values
  },
})

export default i18n
