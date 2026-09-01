import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import {
  ArrowRightIcon,
  BookmarkIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  FlameIcon,
  LayersIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
  UkFlagIcon,
  VietnamFlagIcon,
  VolumeIcon,
} from '@/components/Dashboard/DashboardIcons'
import { useAuth } from '@/contexts/AuthContext'
import { routePaths } from '@/utils/paths'

interface InteractiveDemoTerm {
  word: string
  phonetic: string
  cefr: 'B2' | 'C1' | 'C2'
  pos: string
  meaningVi: string
  meaningEn: string
  translationVi: string
  translationEn: string
  exampleEn: string
  exampleVi: string
}

const DEMO_TERMS: Record<string, InteractiveDemoTerm> = {
  transforms: {
    word: 'transforms',
    phonetic: '/trænsˈfɔːmz/',
    cefr: 'B2',
    pos: 'verb',
    meaningVi: 'Làm thay đổi căn bản, chuyển biến tích cực theo hướng tối ưu.',
    meaningEn: 'To change completely in appearance or character, especially so that it is improved.',
    translationVi: 'Trí tuệ nhân tạo đang làm thay đổi căn bản cách người học tiếp cận việc tích luỹ từ vựng.',
    translationEn: 'Artificial intelligence is completely transforming how learners approach vocabulary acquisition.',
    exampleEn: 'Technology transforms how students engage with authentic global news.',
    exampleVi: 'Công nghệ làm thay đổi cách học sinh tiếp cận với các nguồn tin tức quốc tế thực tế.',
  },
  acquisition: {
    word: 'acquisition',
    phonetic: '/ˌækwɪˈzɪʃn/',
    cefr: 'C1',
    pos: 'noun',
    meaningVi: 'Quá trình thụ đắc ngôn ngữ, tiếp thu kiến thức một cách tự nhiên.',
    meaningEn: 'The process of getting or learning something, especially knowledge or language skills naturally.',
    translationVi: 'Việc thụ đắc từ vựng diễn ra sâu sắc nhất qua việc tiếp xúc thường xuyên với ngữ cảnh bài đọc thực tế.',
    translationEn: 'Language acquisition thrives through repeated exposure to rich authentic contexts.',
    exampleEn: 'Natural language acquisition is faster with real articles than memorizing word lists.',
    exampleVi: 'Việc thụ đắc ngôn ngữ tự nhiên diễn ra nhanh hơn nhiều qua bài báo thực tế so với việc học vẹt danh sách từ.',
  },
  contextual: {
    word: 'contextual',
    phonetic: '/kənˈtekstʃuəl/',
    cefr: 'C2',
    pos: 'adjective',
    meaningVi: 'Thuộc về ngữ cảnh, gắn liền với văn cảnh bài viết cụ thể.',
    meaningEn: 'Relating to or determined by the surrounding context.',
    translationVi: 'Hiểu nghĩa theo ngữ cảnh giúp người học nắm bắt chuẩn xác sắc thái của từ trong câu.',
    translationEn: 'Contextual understanding helps learners master exact word nuances in sentences.',
    exampleEn: 'Contextual AI definitions prevent generic or misleading dictionary translations.',
    exampleVi: 'Giải thích theo ngữ cảnh giúp người học tránh được những cách dịch chung chung hoặc sai lệch từ điển.',
  },
}

function ChevronDownIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <Box
      component="svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </Box>
  )
}

export function LandingPage() {
  const { t, i18n } = useTranslation('landing')
  const { isAuthenticated } = useAuth()
  const [selectedTermKey, setSelectedTermKey] = useState<string>('acquisition')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [languageAnchorEl, setLanguageAnchorEl] = useState<HTMLElement | null>(null)

  // Interactive AI Tutor Spotlight State
  const [spotlightAnswer, setSpotlightAnswer] = useState<string | null>(null)
  const [spotlightShowHint, setSpotlightShowHint] = useState<boolean>(false)

  const currentLang = i18n.language.startsWith('vi') ? 'vi' : 'en'
  const alternateLang = currentLang === 'vi' ? 'en' : 'vi'
  const currentLanguageName = currentLang === 'vi' ? 'Tiếng Việt' : 'English'
  const alternateLanguageName = alternateLang === 'vi' ? 'Tiếng Việt' : 'English'

  const changeLanguage = (language: 'vi' | 'en') => {
    setLanguageAnchorEl(null)
    if (language === currentLang) return
    void i18n.changeLanguage(language)
  }

  const selectedTerm = DEMO_TERMS[selectedTermKey] ?? DEMO_TERMS.acquisition

  const handleSaveDemoTerm = () => {
    setToastMessage(t('demo.savedSuccess'))
  }

  const handlePlayAudio = () => {
    try {
      const utterance = new SpeechSynthesisUtterance(selectedTerm.word)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      window.speechSynthesis?.speak(utterance)
    } catch {
      // Audio fallback silent
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F3F7F4',
        color: '#17372B',
        fontFamily: '"Be Vietnam Pro", "Inter", system-ui, sans-serif',
        overflowX: 'hidden',
      }}
    >
      {/* Top Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(243, 247, 244, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #D9E4DE',
          zIndex: 1100,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1.25, flexWrap: 'nowrap', gap: { xs: 1.5, md: 2.5 } }}>
            {/* Brand Logo */}
            <Typography
              component={RouterLink}
              to={routePaths.home}
              sx={{
                color: '#0F5138',
                fontFamily: '"Merriweather", serif',
                fontSize: { xs: 21, sm: 24 },
                fontWeight: 800,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Vocab Mate
            </Typography>

            {/* Desktop Navigation Links */}
            <Stack
              direction="row"
              spacing={{ md: 1.5, lg: 2.5 }}
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', flexShrink: 0 }}
            >
              <Button
                component="a"
                href="#features"
                sx={{ color: '#5D7068', fontWeight: 600, fontSize: 14.5, textTransform: 'none', whiteSpace: 'nowrap', minWidth: 'auto', px: 1, '&:hover': { color: '#176B4B', bgcolor: 'transparent' } }}
              >
                {t('nav.features')}
              </Button>
              <Button
                component="a"
                href="#demo"
                sx={{ color: '#5D7068', fontWeight: 600, fontSize: 14.5, textTransform: 'none', whiteSpace: 'nowrap', minWidth: 'auto', px: 1, '&:hover': { color: '#176B4B', bgcolor: 'transparent' } }}
              >
                {t('nav.demo')}
              </Button>
              <Button
                component="a"
                href="#spotlight"
                sx={{ color: '#5D7068', fontWeight: 600, fontSize: 14.5, textTransform: 'none', whiteSpace: 'nowrap', minWidth: 'auto', px: 1, '&:hover': { color: '#176B4B', bgcolor: 'transparent' } }}
              >
                {t('nav.spotlight')}
              </Button>
              <Button
                component="a"
                href="#how-it-works"
                sx={{ color: '#5D7068', fontWeight: 600, fontSize: 14.5, textTransform: 'none', whiteSpace: 'nowrap', minWidth: 'auto', px: 1, '&:hover': { color: '#176B4B', bgcolor: 'transparent' } }}
              >
                {t('nav.howItWorks')}
              </Button>
              <Button
                component="a"
                href="#faq"
                sx={{ color: '#5D7068', fontWeight: 600, fontSize: 14.5, textTransform: 'none', whiteSpace: 'nowrap', minWidth: 'auto', px: 1, '&:hover': { color: '#176B4B', bgcolor: 'transparent' } }}
              >
                {t('nav.faq')}
              </Button>
            </Stack>

            {/* Right Header Actions */}
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
              {/* Language Switcher */}
              <Button
                id="landing-language-button"
                onClick={(event) => setLanguageAnchorEl(event.currentTarget)}
                aria-controls={languageAnchorEl ? 'landing-language-menu' : undefined}
                aria-expanded={languageAnchorEl ? 'true' : undefined}
                aria-haspopup="menu"
                sx={{
                  border: '1px solid #D9E4DE',
                  borderRadius: 2.25,
                  bgcolor: '#FFFFFF',
                  color: '#17372B',
                  minWidth: 0,
                  height: 38,
                  px: 1.5,
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  '&:hover': {
                    borderColor: '#176B4B',
                    bgcolor: '#EAF6F0',
                  },
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.8,
                  }}
                >
                  {currentLang === 'vi' ? <VietnamFlagIcon size={18} /> : <UkFlagIcon size={18} />}
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{currentLanguageName}</Box>
                  <ChevronDownIcon size={14} />
                </Box>
              </Button>
              <Menu
                id="landing-language-menu"
                anchorEl={languageAnchorEl}
                open={Boolean(languageAnchorEl)}
                onClose={() => setLanguageAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                  list: {
                    'aria-labelledby': 'landing-language-button',
                  },
                  paper: {
                    sx: {
                      mt: 0.75,
                      minWidth: 146,
                      border: '1px solid #D9E4DE',
                      borderRadius: 2.5,
                      boxShadow: '0 12px 28px rgba(23, 55, 43, 0.14)',
                    },
                  },
                }}
              >
                <MenuItem
                  onClick={() => changeLanguage(alternateLang)}
                  sx={{ gap: 1.25, px: 2, py: 1.2, fontSize: 13.5, fontWeight: 650 }}
                >
                  {alternateLang === 'vi' ? <VietnamFlagIcon size={18} /> : <UkFlagIcon size={18} />}
                  {alternateLanguageName}
                </MenuItem>
              </Menu>

              {isAuthenticated ? (
                <Button
                  component={RouterLink}
                  to={routePaths.home}
                  variant="contained"
                  sx={{
                    borderRadius: 2.25,
                    fontWeight: 750,
                    fontSize: 14,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    px: 2.25,
                    py: 1,
                    bgcolor: '#176B4B',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(23, 107, 75, 0.22)',
                    '&:hover': { bgcolor: '#0F5138' },
                  }}
                >
                  {t('nav.dashboard')}
                </Button>
              ) : (
                <>
                  <Button
                    component={RouterLink}
                    to={routePaths.login}
                    sx={{
                      color: '#17372B',
                      fontWeight: 650,
                      fontSize: 14,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      display: { xs: 'none', sm: 'inline-flex' },
                      '&:hover': { color: '#176B4B', bgcolor: 'rgba(23, 107, 75, 0.06)' },
                    }}
                  >
                    {t('nav.login')}
                  </Button>
                  <Button
                    component={RouterLink}
                    to={routePaths.register}
                    variant="contained"
                    endIcon={<ArrowRightIcon size={16} />}
                    sx={{
                      borderRadius: 2.25,
                      fontWeight: 750,
                      fontSize: 14,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      px: 2.25,
                      py: 1,
                      bgcolor: '#176B4B',
                      color: '#FFFFFF',
                      boxShadow: '0 4px 14px rgba(23, 107, 75, 0.25)',
                      '&:hover': { bgcolor: '#0F5138' },
                    }}
                  >
                    {t('nav.getStarted')}
                  </Button>
                </>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 6, md: 10 },
          pb: { xs: 8, md: 12 },
          background:
            'radial-gradient(circle at 10% 12%, rgba(116, 190, 151, 0.28), transparent 45%), radial-gradient(circle at 90% 88%, rgba(248, 228, 209, 0.4), transparent 40%), #F3F7F4',
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={3.5} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 880, mx: 'auto' }}>
            {/* Pill Badge */}
            <Chip
              icon={<SparklesIcon size={15} color="#0F5138" />}
              label={t('hero.badge')}
              sx={{
                bgcolor: '#DDF3E8',
                color: '#0F5138',
                border: '1px solid #BCE3D1',
                fontWeight: 700,
                px: 1.25,
                py: 2.2,
                borderRadius: 99,
                fontSize: 13.5,
                boxShadow: '0 2px 8px rgba(15, 81, 56, 0.08)',
              }}
            />

            {/* Headline */}
            <Typography
              component="h1"
              sx={{
                fontFamily: '"Merriweather", "Be Vietnam Pro", serif',
                fontSize: { xs: 32, sm: 44, md: 54 },
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.18,
                color: '#17372B',
              }}
            >
              {t('hero.title')}
            </Typography>

            {/* CTA Action Buttons */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ width: { xs: '100%', sm: 'auto' }, pt: 1 }}
            >
              <Button
                component={RouterLink}
                to={isAuthenticated ? routePaths.home : routePaths.register}
                variant="contained"
                size="large"
                endIcon={<ArrowRightIcon size={20} />}
                sx={{
                  borderRadius: 2.75,
                  px: 4,
                  py: 1.7,
                  fontSize: 16,
                  fontWeight: 750,
                  textTransform: 'none',
                  bgcolor: '#176B4B',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 24px rgba(23, 107, 75, 0.28)',
                  '&:hover': {
                    bgcolor: '#0F5138',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 28px rgba(23, 107, 75, 0.35)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {t('hero.ctaPrimary')}
              </Button>

              <Button
                component={RouterLink}
                to={routePaths.articles}
                variant="outlined"
                size="large"
                startIcon={<BookOpenIcon size={20} color="#176B4B" />}
                sx={{
                  borderRadius: 2.75,
                  px: 3.5,
                  py: 1.7,
                  fontSize: 16,
                  fontWeight: 700,
                  textTransform: 'none',
                  color: '#17372B',
                  borderColor: '#D9E4DE',
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  '&:hover': {
                    borderColor: '#176B4B',
                    bgcolor: '#EAF6F0',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {t('hero.ctaSecondary')}
              </Button>
            </Stack>

            {/* Quick Metrics Bar */}
            <Paper
              elevation={0}
              sx={{
                mt: 4,
                p: { xs: 2.5, sm: 3.25 },
                width: '100%',
                borderRadius: 4,
                bgcolor: '#FFFFFF',
                border: '1px solid #D9E4DE',
                boxShadow: '0 12px 32px rgba(21, 55, 43, 0.07)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                divider={<Divider orientation="vertical" flexItem sx={{ borderColor: '#D9E4DE', display: { xs: 'none', sm: 'block' } }} />}
                spacing={{ xs: 2.5, sm: 3 }}
                sx={{ justifyContent: 'space-around', alignItems: 'stretch' }}
              >
                <Stack spacing={0.5} sx={{ alignItems: 'center', textAlign: 'center', flex: 1, px: { xs: 0, sm: 1.5 } }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <BookOpenIcon size={22} color="#176B4B" />
                    <Typography sx={{ fontWeight: 800, fontSize: { xs: 18, sm: 20 }, color: '#176B4B', whiteSpace: 'nowrap' }}>
                      {t('hero.stat1Title')}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: '#5D7068', fontSize: 13.5, fontWeight: 550 }}>
                    {t('hero.stat1Desc')}
                  </Typography>
                </Stack>

                <Stack spacing={0.5} sx={{ alignItems: 'center', textAlign: 'center', flex: 1, px: { xs: 0, sm: 1.5 } }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <TargetIcon size={22} color="#B66A2C" />
                    <Typography sx={{ fontWeight: 800, fontSize: { xs: 18, sm: 20 }, color: '#B66A2C', whiteSpace: 'nowrap' }}>
                      {t('hero.stat2Title')}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: '#5D7068', fontSize: 13.5, fontWeight: 550 }}>
                    {t('hero.stat2Desc')}
                  </Typography>
                </Stack>

                <Stack spacing={0.5} sx={{ alignItems: 'center', textAlign: 'center', flex: 1, px: { xs: 0, sm: 1.5 } }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <TrendingUpIcon size={22} color="#0F5138" />
                    <Typography sx={{ fontWeight: 800, fontSize: { xs: 18, sm: 20 }, color: '#0F5138', whiteSpace: 'nowrap' }}>
                      {t('hero.stat3Title')}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: '#5D7068', fontSize: 13.5, fontWeight: 550 }}>
                    {t('hero.stat3Desc')}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </Box>

      {/* Features Grid Section (6 Key Capabilities) */}
      <Box
        id="features"
        sx={{
          py: { xs: 8, md: 13 },
          bgcolor: '#FFFFFF',
          borderTop: '1px solid #D9E4DE',
          borderBottom: '1px solid #D9E4DE',
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={2.5} sx={{ alignItems: 'center', textAlign: 'center', mb: 8 }}>
            <Chip
              icon={<SparklesIcon size={14} color="#B66A2C" />}
              label={t('features.badge')}
              sx={{
                bgcolor: '#F8E4D1',
                color: '#864719',
                border: '1px solid #E6C8AD',
                fontWeight: 700,
                fontSize: 13,
              }}
            />
            <Typography variant="h2" sx={{ fontFamily: '"Merriweather", serif', fontSize: { xs: 26, sm: 34, md: 38 }, color: '#17372B', fontWeight: 800 }}>
              {t('features.title')}
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 3.5,
            }}
          >
            {/* Feature 1: Reader & Sentence Translation */}
            <Paper
              elevation={0}
              sx={{
                p: 3.75,
                borderRadius: 4,
                bgcolor: '#F3F7F4',
                border: '1px solid #D9E4DE',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#176B4B',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 36px rgba(23, 107, 75, 0.12)',
                },
              }}
            >
              <Box sx={{ width: 50, height: 50, borderRadius: 3, bgcolor: '#DDF3E8', color: '#176B4B', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <BookOpenIcon size={26} color="#176B4B" />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 750, color: '#17372B', mb: 1.25 }}>
                {t('features.readerTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.65, fontSize: 14.5 }}>
                {t('features.readerDesc')}
              </Typography>
            </Paper>

            {/* Feature 2: CEFR Highlighting */}
            <Paper
              elevation={0}
              sx={{
                p: 3.75,
                borderRadius: 4,
                bgcolor: '#F3F7F4',
                border: '1px solid #D9E4DE',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#B66A2C',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 36px rgba(182, 106, 44, 0.12)',
                },
              }}
            >
              <Box sx={{ width: 50, height: 50, borderRadius: 3, bgcolor: '#F8E4D1', color: '#B66A2C', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <TargetIcon size={26} color="#B66A2C" />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 750, color: '#17372B', mb: 1.25 }}>
                {t('features.cefrTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.65, fontSize: 14.5 }}>
                {t('features.cefrDesc')}
              </Typography>
            </Paper>

            {/* Feature 3: AI Tutor Interactive Sessions */}
            <Paper
              elevation={0}
              sx={{
                p: 3.75,
                borderRadius: 4,
                bgcolor: '#F3F7F4',
                border: '1px solid #D9E4DE',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#7C3AED',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 36px rgba(124, 58, 237, 0.12)',
                },
              }}
            >
              <Box sx={{ width: 50, height: 50, borderRadius: 3, bgcolor: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <SparklesIcon size={26} color="#7C3AED" />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 750, color: '#17372B', mb: 1.25 }}>
                {t('features.tutorTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.65, fontSize: 14.5 }}>
                {t('features.tutorDesc')}
              </Typography>
            </Paper>

            {/* Feature 4: FSRS Spaced Repetition */}
            <Paper
              elevation={0}
              sx={{
                p: 3.75,
                borderRadius: 4,
                bgcolor: '#F3F7F4',
                border: '1px solid #D9E4DE',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#0F5138',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 36px rgba(15, 81, 56, 0.12)',
                },
              }}
            >
              <Box sx={{ width: 50, height: 50, borderRadius: 3, bgcolor: '#DDF3E8', color: '#0F5138', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <ClockIcon size={26} color="#0F5138" />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 750, color: '#17372B', mb: 1.25 }}>
                {t('features.fsrsTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.65, fontSize: 14.5 }}>
                {t('features.fsrsDesc')}
              </Typography>
            </Paper>

            {/* Feature 5: Personal Collections */}
            <Paper
              elevation={0}
              sx={{
                p: 3.75,
                borderRadius: 4,
                bgcolor: '#F3F7F4',
                border: '1px solid #D9E4DE',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#0284C7',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 36px rgba(2, 132, 199, 0.12)',
                },
              }}
            >
              <Box sx={{ width: 50, height: 50, borderRadius: 3, bgcolor: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <LayersIcon size={26} color="#0284C7" />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 750, color: '#17372B', mb: 1.25 }}>
                {t('features.collectionsTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.65, fontSize: 14.5 }}>
                {t('features.collectionsDesc')}
              </Typography>
            </Paper>

            {/* Feature 6: Analytics & Streak */}
            <Paper
              elevation={0}
              sx={{
                p: 3.75,
                borderRadius: 4,
                bgcolor: '#F3F7F4',
                border: '1px solid #D9E4DE',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#EA580C',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 36px rgba(234, 88, 12, 0.12)',
                },
              }}
            >
              <Box sx={{ width: 50, height: 50, borderRadius: 3, bgcolor: '#FFEDD5', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <FlameIcon size={26} color="#EA580C" />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 750, color: '#17372B', mb: 1.25 }}>
                {t('features.analyticsTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.65, fontSize: 14.5 }}>
                {t('features.analyticsDesc')}
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* Interactive Demo Section */}
      <Box
        id="demo"
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: '#F3F7F4',
          borderBottom: '1px solid #D9E4DE',
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={2.5} sx={{ alignItems: 'center', textAlign: 'center', mb: 6 }}>
            <Chip
              icon={<BookOpenIcon size={14} color="#176B4B" />}
              label={t('demo.badge')}
              sx={{
                bgcolor: '#DDF3E8',
                color: '#0F5138',
                border: '1px solid #BCE3D1',
                fontWeight: 700,
                fontSize: 13,
              }}
            />
            <Typography variant="h2" sx={{ fontFamily: '"Merriweather", serif', fontSize: { xs: 26, sm: 34, md: 38 }, color: '#17372B', fontWeight: 800 }}>
              {t('demo.title')}
            </Typography>
          </Stack>

          {/* Interactive Demo Playground */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' },
              gap: 4,
              alignItems: 'start',
            }}
          >
            {/* Left: Article Card Mockup */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4.5 },
                borderRadius: 4,
                bgcolor: '#FFFFFF',
                border: '1px solid #D9E4DE',
                boxShadow: '0 16px 40px rgba(21, 55, 43, 0.08)',
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2.5 }}>
                <Chip size="small" label={t('demo.category')} sx={{ fontWeight: 750, fontSize: 11.5, bgcolor: '#176B4B', color: '#FFFFFF' }} />
                <Chip size="small" label={t('demo.cefrTarget')} variant="outlined" sx={{ color: '#5D7068', borderColor: '#D9E4DE', fontSize: 11.5, fontWeight: 650 }} />
              </Stack>

              <Typography variant="h5" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 800, color: '#17372B', mb: 3, lineHeight: 1.35 }}>
                {t('demo.articleTitle')}
              </Typography>

              <Typography component="p" sx={{ fontSize: { xs: 17, sm: 18.5 }, lineHeight: 1.85, color: '#17372B' }}>
                Recent advancements in artificial intelligence are completely{' '}
                <Box
                  component="span"
                  onClick={() => setSelectedTermKey('transforms')}
                  sx={{
                    bgcolor: selectedTermKey === 'transforms' ? '#DDF3E8' : 'rgba(23, 107, 75, 0.12)',
                    color: '#0F5138',
                    borderBottom: '2.5px solid #176B4B',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1.25,
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedTermKey === 'transforms' ? '0 0 0 2px #176B4B' : 'none',
                    '&:hover': { bgcolor: '#DDF3E8' },
                  }}
                >
                  transforms
                </Box>{' '}
                how learners approach vocabulary{' '}
                <Box
                  component="span"
                  onClick={() => setSelectedTermKey('acquisition')}
                  sx={{
                    bgcolor: selectedTermKey === 'acquisition' ? '#F8E4D1' : 'rgba(182, 106, 44, 0.15)',
                    color: '#864719',
                    borderBottom: '2.5px solid #B66A2C',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1.25,
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedTermKey === 'acquisition' ? '0 0 0 2px #B66A2C' : 'none',
                    '&:hover': { bgcolor: '#F8E4D1' },
                  }}
                >
                  acquisition
                </Box>
                . By delivering instant{' '}
                <Box
                  component="span"
                  onClick={() => setSelectedTermKey('contextual')}
                  sx={{
                    bgcolor: selectedTermKey === 'contextual' ? '#EDE9FE' : 'rgba(124, 58, 237, 0.12)',
                    color: '#5B21B6',
                    borderBottom: '2.5px solid #7C3AED',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1.25,
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedTermKey === 'contextual' ? '0 0 0 2px #7C3AED' : 'none',
                    '&:hover': { bgcolor: '#EDE9FE' },
                  }}
                >
                  contextual
                </Box>{' '}
                insights and natural sentence translations, students retain complex words 3x faster than traditional flashcard methods.
              </Typography>
            </Paper>

            {/* Right: AI Insights Inspector Panel */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 3.75 },
                borderRadius: 4,
                bgcolor: '#0F5138',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 20px 48px rgba(15, 81, 56, 0.28)',
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <SparklesIcon size={18} color="#DDF3E8" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#DDF3E8', letterSpacing: '0.04em' }}>
                    {t('demo.popoverHeader')}
                  </Typography>
                </Stack>
                <Chip
                  label={selectedTerm.cefr}
                  size="small"
                  sx={{
                    bgcolor: '#DDF3E8',
                    color: '#0F5138',
                    fontWeight: 850,
                    fontSize: 12,
                  }}
                />
              </Stack>

              {/* Term Word + Phonetic & Audio */}
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="h4" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 800, color: '#FFFFFF' }}>
                  {selectedTerm.word}
                </Typography>
                <IconButton
                  onClick={handlePlayAudio}
                  size="small"
                  aria-label={t('demo.listenPronunciation')}
                  sx={{
                    color: '#FFFFFF',
                    bgcolor: 'rgba(255, 255, 255, 0.14)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.24)' },
                  }}
                >
                  <VolumeIcon size={18} color="#DDF3E8" />
                </IconButton>
              </Stack>

              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#DDF3E8', fontStyle: 'italic', fontFamily: 'monospace' }}>
                  {selectedTerm.phonetic}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontWeight: 650 }}>
                  ({selectedTerm.pos})
                </Typography>
              </Stack>

              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />

              <Stack spacing={2.25}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#DDF3E8', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.5 }}>
                    {t('demo.meaningLabel')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600, lineHeight: 1.6 }}>
                    {currentLang === 'vi' ? selectedTerm.meaningVi : selectedTerm.meaningEn}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#DDF3E8', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.5 }}>
                    {t('demo.translationLabel')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.92)', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{currentLang === 'vi' ? selectedTerm.translationVi : selectedTerm.translationEn}"
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)', p: 1.75, borderRadius: 2.5, border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                  <Typography variant="caption" sx={{ color: '#DDF3E8', fontWeight: 700, display: 'block', mb: 0.5 }}>
                    {t('demo.exampleLabel')}:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#FFFFFF', fontStyle: 'italic', lineHeight: 1.55 }}>
                    "{selectedTerm.exampleEn}"
                  </Typography>
                  {currentLang === 'vi' && (
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', display: 'block', mt: 0.5 }}>
                      → {selectedTerm.exampleVi}
                    </Typography>
                  )}
                </Box>

                <Button
                  onClick={handleSaveDemoTerm}
                  variant="contained"
                  fullWidth
                  startIcon={<BookmarkIcon size={18} />}
                  sx={{
                    borderRadius: 2.25,
                    fontWeight: 750,
                    fontSize: 14.5,
                    py: 1.25,
                    textTransform: 'none',
                    bgcolor: '#FFFFFF',
                    color: '#0F5138',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    '&:hover': { bgcolor: '#DDF3E8', color: '#0F5138' },
                  }}
                >
                  {t('demo.addToVocab')}
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* Spotlight Section: AI Tutor & FSRS Spaced Repetition */}
      <Box
        id="spotlight"
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: '#FFFFFF',
          borderTop: '1px solid #D9E4DE',
          borderBottom: '1px solid #D9E4DE',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' },
              gap: { xs: 5, lg: 7 },
              alignItems: 'center',
            }}
          >
            {/* Left: Scientific explanation */}
            <Stack spacing={3}>
              <Box>
                <Chip
                  icon={<SparklesIcon size={14} color="#7C3AED" />}
                  label={t('spotlight.badge')}
                  sx={{
                    bgcolor: '#EDE9FE',
                    color: '#6D28D9',
                    border: '1px solid #DDD6FE',
                    fontWeight: 700,
                    fontSize: 13,
                    mb: 2,
                  }}
                />
                <Typography variant="h2" sx={{ fontFamily: '"Merriweather", serif', fontSize: { xs: 26, sm: 34, md: 38 }, color: '#17372B', fontWeight: 800, lineHeight: 1.3 }}>
                  {t('spotlight.title')}
                </Typography>
              </Box>

              <Stack spacing={2.5}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: '#F3F7F4', border: '1px solid #D9E4DE' }}>
                  <Stack direction="row" spacing={1.75} sx={{ alignItems: 'flex-start' }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#DDF3E8', color: '#0F5138', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircleIcon size={20} color="#0F5138" />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 750, fontSize: 16, color: '#17372B', mb: 0.5 }}>
                        {t('spotlight.p1Title')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.6 }}>
                        {t('spotlight.p1Desc')}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: '#F3F7F4', border: '1px solid #D9E4DE' }}>
                  <Stack direction="row" spacing={1.75} sx={{ alignItems: 'flex-start' }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#F8E4D1', color: '#B66A2C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <SparklesIcon size={20} color="#B66A2C" />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 750, fontSize: 16, color: '#17372B', mb: 0.5 }}>
                        {t('spotlight.p2Title')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.6 }}>
                        {t('spotlight.p2Desc')}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: '#F3F7F4', border: '1px solid #D9E4DE' }}>
                  <Stack direction="row" spacing={1.75} sx={{ alignItems: 'flex-start' }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ClockIcon size={20} color="#7C3AED" />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 750, fontSize: 16, color: '#17372B', mb: 0.5 }}>
                        {t('spotlight.p3Title')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.6 }}>
                        {t('spotlight.p3Desc')}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Stack>
            </Stack>

            {/* Right: Interactive AI Tutor Card Simulator */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 4,
                bgcolor: '#FFFFFF',
                border: '2px solid #D9E4DE',
                boxShadow: '0 20px 48px rgba(23, 55, 43, 0.1)',
                position: 'relative',
              }}
            >
              {/* Question Text */}
              <Typography sx={{ fontSize: 17, fontWeight: 650, color: '#17372B', lineHeight: 1.65, mb: 3 }}>
                {t('spotlight.demoCardQuestion')}
              </Typography>

              {/* Options */}
              <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                {[
                  { key: 'transforms', label: t('spotlight.demoCardOption1'), isCorrect: true },
                  { key: 'translates', label: t('spotlight.demoCardOption2'), isCorrect: false },
                  { key: 'transfers', label: t('spotlight.demoCardOption3'), isCorrect: false },
                ].map((opt) => {
                  const isSelected = spotlightAnswer === opt.key
                  let btnBg = '#F3F7F4'
                  let btnBorder = '#D9E4DE'
                  let btnColor = '#17372B'

                  if (isSelected) {
                    if (opt.isCorrect) {
                      btnBg = '#DDF3E8'
                      btnBorder = '#176B4B'
                      btnColor = '#0F5138'
                    } else {
                      btnBg = '#FEE2E2'
                      btnBorder = '#EF4444'
                      btnColor = '#B91C1C'
                    }
                  }

                  return (
                    <Button
                      key={opt.key}
                      onClick={() => setSpotlightAnswer(opt.key)}
                      fullWidth
                      sx={{
                        justifyContent: 'flex-start',
                        py: 1.35,
                        px: 2.25,
                        borderRadius: 2.5,
                        bgcolor: btnBg,
                        border: `1.5px solid ${btnBorder}`,
                        color: btnColor,
                        fontWeight: 700,
                        fontSize: 15,
                        textTransform: 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: isSelected ? btnBg : '#EAF6F0',
                          borderColor: '#176B4B',
                        },
                      }}
                    >
                      <Box component="span" sx={{ mr: 1.5, color: '#5D7068', fontWeight: 800 }}>
                        {opt.key === 'transforms' ? 'A.' : opt.key === 'translates' ? 'B.' : 'C.'}
                      </Box>
                      {opt.label}
                    </Button>
                  )
                })}
              </Stack>

              {/* Hint Trigger */}
              <Box sx={{ mb: 2 }}>
                <Button
                  onClick={() => setSpotlightShowHint(!spotlightShowHint)}
                  size="small"
                  startIcon={<SparklesIcon size={16} color="#B66A2C" />}
                  sx={{
                    color: '#B66A2C',
                    fontWeight: 700,
                    fontSize: 13,
                    textTransform: 'none',
                    p: 0,
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  {spotlightShowHint ? 'Ẩn gợi ý' : t('spotlight.demoCardHintTitle')}
                </Button>
                {spotlightShowHint && (
                  <Alert severity="warning" sx={{ mt: 1, bgcolor: '#F8E4D1', color: '#864719', border: '1px solid #E6C8AD', borderRadius: 2, fontSize: 13 }}>
                    {t('spotlight.demoCardHint')}
                  </Alert>
                )}
              </Box>

              {/* Feedback alert on correct selection */}
              {spotlightAnswer === 'transforms' && (
                <Alert
                  severity="success"
                  icon={<CheckCircleIcon size={20} color="#0F5138" />}
                  sx={{
                    bgcolor: '#DDF3E8',
                    color: '#0F5138',
                    border: '1px solid #BCE3D1',
                    borderRadius: 2.5,
                    fontSize: 13.5,
                    fontWeight: 600,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.25 }}>
                    {t('spotlight.demoCardFeedbackTitle')}
                  </Typography>
                  {t('spotlight.demoCardFeedback')}
                </Alert>
              )}
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* How it works Section (3 Simple Steps) */}
      <Box id="how-it-works" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Stack spacing={2.5} sx={{ alignItems: 'center', textAlign: 'center', mb: 8 }}>
            <Chip
              icon={<TrendingUpIcon size={14} color="#176B4B" />}
              label={t('steps.badge')}
              sx={{
                bgcolor: '#DDF3E8',
                color: '#0F5138',
                border: '1px solid #BCE3D1',
                fontWeight: 700,
                fontSize: 13,
              }}
            />
            <Typography variant="h2" sx={{ fontFamily: '"Merriweather", serif', fontSize: { xs: 26, sm: 34, md: 38 }, color: '#17372B', fontWeight: 800 }}>
              {t('steps.title')}
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 4,
            }}
          >
            {/* Step 1 */}
            <Paper
              elevation={0}
              sx={{
                p: 4.25,
                borderRadius: 4,
                bgcolor: '#FFFFFF',
                border: '1px solid #D9E4DE',
                position: 'relative',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#176B4B',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 36px rgba(23, 107, 75, 0.1)',
                },
              }}
            >
              <Typography sx={{ fontFamily: '"Merriweather", serif', fontSize: 38, fontWeight: 800, color: '#176B4B', mb: 1.5 }}>
                01
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 750, color: '#17372B', mb: 1.25 }}>
                {t('steps.step1Title')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.65, fontSize: 14.5 }}>
                {t('steps.step1Desc')}
              </Typography>
            </Paper>

            {/* Step 2 */}
            <Paper
              elevation={0}
              sx={{
                p: 4.25,
                borderRadius: 4,
                bgcolor: '#FFFFFF',
                border: '1px solid #D9E4DE',
                position: 'relative',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#B66A2C',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 36px rgba(182, 106, 44, 0.1)',
                },
              }}
            >
              <Typography sx={{ fontFamily: '"Merriweather", serif', fontSize: 38, fontWeight: 800, color: '#B66A2C', mb: 1.5 }}>
                02
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 750, color: '#17372B', mb: 1.25 }}>
                {t('steps.step2Title')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.65, fontSize: 14.5 }}>
                {t('steps.step2Desc')}
              </Typography>
            </Paper>

            {/* Step 3 */}
            <Paper
              elevation={0}
              sx={{
                p: 4.25,
                borderRadius: 4,
                bgcolor: '#FFFFFF',
                border: '1px solid #D9E4DE',
                position: 'relative',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#0F5138',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 36px rgba(15, 81, 56, 0.1)',
                },
              }}
            >
              <Typography sx={{ fontFamily: '"Merriweather", serif', fontSize: 38, fontWeight: 800, color: '#0F5138', mb: 1.5 }}>
                03
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 750, color: '#17372B', mb: 1.25 }}>
                {t('steps.step3Title')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.65, fontSize: 14.5 }}>
                {t('steps.step3Desc')}
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box
        id="faq"
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: '#FFFFFF',
          borderTop: '1px solid #D9E4DE',
          borderBottom: '1px solid #D9E4DE',
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={2.5} sx={{ alignItems: 'center', textAlign: 'center', mb: 6 }}>
            <Chip
              icon={<SparklesIcon size={14} color="#176B4B" />}
              label={t('faq.badge')}
              sx={{
                bgcolor: '#DDF3E8',
                color: '#0F5138',
                border: '1px solid #BCE3D1',
                fontWeight: 700,
                fontSize: 13,
              }}
            />
            <Typography variant="h2" sx={{ fontFamily: '"Merriweather", serif', fontSize: { xs: 26, sm: 34, md: 38 }, color: '#17372B', fontWeight: 800 }}>
              {t('faq.title')}
            </Typography>
          </Stack>

          <Stack spacing={2.5}>
            {[
              { q: t('faq.q1'), a: t('faq.a1') },
              { q: t('faq.q2'), a: t('faq.a2') },
              { q: t('faq.q3'), a: t('faq.a3') },
              { q: t('faq.q4'), a: t('faq.a4') },
            ].map((item, index) => (
              <Accordion
                key={index}
                elevation={0}
                sx={{
                  bgcolor: '#F3F7F4',
                  color: '#17372B',
                  borderRadius: '18px !important',
                  border: '1px solid #D9E4DE',
                  '&::before': { display: 'none' },
                  boxShadow: 'none',
                }}
              >
                <AccordionSummary expandIcon={<ChevronDownIcon size={20} color="#5D7068" />} sx={{ px: 3, py: 1 }}>
                  <Typography sx={{ fontWeight: 750, fontSize: 17, color: '#17372B' }}>
                    {item.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                  <Typography sx={{ color: '#5D7068', lineHeight: 1.7, fontSize: 15 }}>
                    {item.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Bottom CTA Banner */}
      <Box sx={{ py: { xs: 8, md: 11 }, bgcolor: '#F3F7F4' }}>
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 6, md: 8 },
              borderRadius: 4.5,
              bgcolor: '#0F5138',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              textAlign: 'center',
              boxShadow: '0 24px 56px rgba(15, 81, 56, 0.26)',
            }}
          >
            <Typography variant="h2" sx={{ fontFamily: '"Merriweather", serif', fontSize: { xs: 26, sm: 36, md: 44 }, fontWeight: 800, mb: 2, color: '#FFFFFF' }}>
              {t('cta.title')}
            </Typography>
            <Typography sx={{ color: '#DDF3E8', fontSize: { xs: 15.5, sm: 18 }, maxWidth: 660, mx: 'auto', mb: 4, lineHeight: 1.6 }}>
              {t('cta.subtitle')}
            </Typography>
            <Button
              component={RouterLink}
              to={isAuthenticated ? routePaths.home : routePaths.register}
              variant="contained"
              size="large"
              endIcon={<ArrowRightIcon size={20} />}
              sx={{
                borderRadius: 2.75,
                px: 4.5,
                py: 1.75,
                fontSize: 16,
                fontWeight: 800,
                textTransform: 'none',
                bgcolor: '#FFFFFF',
                color: '#0F5138',
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                '&:hover': {
                  bgcolor: '#DDF3E8',
                  color: '#0F5138',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {t('cta.button')}
            </Button>
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4.5, bgcolor: '#FFFFFF', borderTop: '1px solid #D9E4DE', textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" sx={{ color: '#5D7068', fontSize: 14 }}>
            {t('footer.rights')}
          </Typography>
        </Container>
      </Box>

      {/* Toast Notification */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
      />
    </Box>
  )
}
