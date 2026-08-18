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
  BookOpenIcon,
  BookmarkIcon,
  FlameIcon,
  LayersIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
} from '@/components/Dashboard/DashboardIcons'
import { useAuth } from '@/contexts/AuthContext'
import { routePaths } from '@/utils/paths'

interface InteractiveDemoTerm {
  word: string
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
    cefr: 'B2',
    pos: 'verb',
    meaningVi: 'Biến đổi, chuyển hoá hoàn toàn theo hướng tích cực.',
    meaningEn: 'To change completely in appearance or character, especially so that it is improved.',
    translationVi: 'Trí tuệ nhân tạo đang biến đổi quá trình tiếp thu ngôn ngữ hiện đại.',
    translationEn: 'Artificial intelligence is completely transforming modern language acquisition.',
    exampleEn: 'Technology transforms how students engage with authentic news.',
    exampleVi: 'Công nghệ biến đổi cách học sinh tiếp cận với tin tức thực tế.',
  },
  acquisition: {
    word: 'acquisition',
    cefr: 'C1',
    pos: 'noun',
    meaningVi: 'Sự tiếp thu, thu nhận (kiến thức, ngôn ngữ) một cách tự nhiên.',
    meaningEn: 'The process of getting or learning something, especially knowledge or a skill.',
    translationVi: 'Việc tiếp thu từ vựng đòi hỏi sự lặp lại trong ngữ cảnh phong phú.',
    translationEn: 'Language acquisition requires spaced repetition in rich contexts.',
    exampleEn: 'Natural language acquisition is faster with real articles.',
    exampleVi: 'Việc tiếp thu ngôn ngữ tự nhiên nhanh hơn thông qua bài báo thực tế.',
  },
  contextual: {
    word: 'contextual',
    cefr: 'C2',
    pos: 'adjective',
    meaningVi: 'Thuộc về ngữ cảnh, dựa trên ngữ cảnh cụ thể.',
    meaningEn: 'Relating to or determined by the surrounding context.',
    translationVi: 'Dịch thuật dựa trên ngữ cảnh giúp người học hiểu đúng sắc thái của từ.',
    translationEn: 'Contextual translation helps learners understand exact word nuances.',
    exampleEn: 'Contextual AI definitions prevent misleading generic translations.',
    exampleVi: 'Giải thích AI theo ngữ cảnh ngăn chặn việc dịch từ điển chung chung sai lệch.',
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

function VietnamFlagIcon() {
  return (
    <Box
      component="svg"
      width={22}
      height={15}
      viewBox="0 0 30 20"
      aria-hidden="true"
      focusable="false"
      sx={{ display: 'block', borderRadius: '2px', boxShadow: '0 0 0 1px rgba(23, 55, 43, 0.14)' }}
    >
      <rect width="30" height="20" fill="#DA251D" />
      <path
        d="m15 3.4 1.55 4.77h5.02l-4.06 2.95 1.55 4.78L15 12.95l-4.06 2.95 1.55-4.78-4.06-2.95h5.02z"
        fill="#FFEA00"
      />
    </Box>
  )
}

function UnitedKingdomFlagIcon() {
  return (
    <Box
      component="svg"
      width={22}
      height={15}
      viewBox="0 0 30 20"
      aria-hidden="true"
      focusable="false"
      sx={{ display: 'block', borderRadius: '2px', boxShadow: '0 0 0 1px rgba(23, 55, 43, 0.14)' }}
    >
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0 30 20M30 0 0 20" stroke="#FFFFFF" strokeWidth="5" />
      <path d="M0 0 30 20M30 0 0 20" stroke="#C8102E" strokeWidth="2" />
      <path d="M15 0v20M0 10h30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="3.2" />
    </Box>
  )
}

export function LandingPage() {
  const { t, i18n } = useTranslation('landing')
  const { isAuthenticated } = useAuth()
  const [selectedTermKey, setSelectedTermKey] = useState<string>('acquisition')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [languageAnchorEl, setLanguageAnchorEl] = useState<HTMLElement | null>(null)
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
      {/* Top Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(243, 247, 244, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #D9E4DE',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1 }}>
            {/* Brand Logo */}
            <Typography
              component={RouterLink}
              to={routePaths.home}
              sx={{
                color: 'primary.dark',
                fontFamily: '"Merriweather", serif',
                fontSize: 24,
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Vocab Mate
            </Typography>

            {/* Desktop Navigation Links */}
            <Stack
              direction="row"
              spacing={3}
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}
            >
              <Button
                component="a"
                href="#features"
                sx={{ color: '#5D7068', fontWeight: 600, '&:hover': { color: '#176B4B' } }}
              >
                {t('nav.features')}
              </Button>
              <Button
                component="a"
                href="#demo"
                sx={{ color: '#5D7068', fontWeight: 600, '&:hover': { color: '#176B4B' } }}
              >
                {t('nav.demo')}
              </Button>
              <Button
                component="a"
                href="#how-it-works"
                sx={{ color: '#5D7068', fontWeight: 600, '&:hover': { color: '#176B4B' } }}
              >
                {t('nav.howItWorks')}
              </Button>
              <Button
                component="a"
                href="#faq"
                sx={{ color: '#5D7068', fontWeight: 600, '&:hover': { color: '#176B4B' } }}
              >
                {t('nav.faq')}
              </Button>
            </Stack>

            {/* Right Actions */}
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              {/* Language Switcher */}
              <Button
                id="landing-language-button"
                onClick={(event) => setLanguageAnchorEl(event.currentTarget)}
                aria-controls={languageAnchorEl ? 'landing-language-menu' : undefined}
                aria-expanded={languageAnchorEl ? 'true' : undefined}
                aria-haspopup="menu"
                sx={{
                  border: '1px solid #D9E4DE',
                  borderRadius: 2,
                  bgcolor: '#FFFFFF',
                  color: '#17372B',
                  minWidth: 0,
                  height: 40,
                  px: 1.25,
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
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
                    gap: 0.75,
                  }}
                >
                  {currentLang === 'vi' ? <VietnamFlagIcon /> : <UnitedKingdomFlagIcon />}
                  <Box component="span">{currentLanguageName}</Box>
                  <ChevronDownIcon size={15} />
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
                      minWidth: 142,
                      border: '1px solid #D9E4DE',
                      borderRadius: 2,
                      boxShadow: '0 12px 28px rgba(23, 55, 43, 0.14)',
                    },
                  },
                }}
              >
                <MenuItem
                  onClick={() => changeLanguage(alternateLang)}
                  sx={{ gap: 1, px: 1.5, py: 1, fontSize: 13, fontWeight: 650 }}
                >
                  {alternateLang === 'vi' ? <VietnamFlagIcon /> : <UnitedKingdomFlagIcon />}
                  {alternateLanguageName}
                </MenuItem>
              </Menu>

              {isAuthenticated ? (
                <Button
                  component={RouterLink}
                  to={routePaths.home}
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 750,
                    bgcolor: '#176B4B',
                    color: '#FFFFFF',
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
                      fontWeight: 600,
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
                      borderRadius: 2,
                      fontWeight: 750,
                      px: 2.25,
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
          pt: { xs: 7, md: 11 },
          pb: { xs: 9, md: 13 },
          background:
            'radial-gradient(circle at 12% 8%, rgba(116, 190, 151, 0.25), transparent 45%), #F3F7F4',
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={4} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 840, mx: 'auto' }}>
            {/* Pill Badge */}
            <Chip
              icon={<SparklesIcon size={14} color="#0F5138" />}
              label={t('hero.badge')}
              sx={{
                bgcolor: '#DDF3E8',
                color: '#0F5138',
                border: '1px solid #BCE3D1',
                fontWeight: 700,
                px: 1,
                py: 2,
                borderRadius: 99,
                fontSize: 13,
              }}
            />

            {/* Headline */}
            <Typography
              component="h1"
              sx={{
                fontFamily: '"Merriweather", "Be Vietnam Pro", serif',
                fontSize: { xs: 34, sm: 46, md: 56 },
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                color: '#17372B',
              }}
            >
              {t('hero.title')}
            </Typography>

            {/* Subtitle */}
            <Typography
              sx={{
                fontSize: { xs: 16, sm: 19 },
                color: '#5D7068',
                lineHeight: 1.6,
                maxWidth: 720,
              }}
            >
              {t('hero.subtitle')}
            </Typography>

            {/* CTA Buttons */}
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
                  borderRadius: 2.5,
                  px: 4,
                  py: 1.65,
                  fontSize: 16,
                  fontWeight: 750,
                  bgcolor: '#176B4B',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 24px rgba(23, 107, 75, 0.28)',
                  '&:hover': {
                    bgcolor: '#0F5138',
                    transform: 'translateY(-2px)',
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
                  borderRadius: 2.5,
                  px: 3.5,
                  py: 1.65,
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#17372B',
                  borderColor: '#D9E4DE',
                  bgcolor: '#FFFFFF',
                  '&:hover': {
                    borderColor: '#176B4B',
                    bgcolor: '#DDF3E8',
                  },
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
                p: { xs: 2.5, sm: 3 },
                width: '100%',
                borderRadius: 3.5,
                bgcolor: '#FFFFFF',
                border: '1px solid #D9E4DE',
                boxShadow: '0 12px 32px rgba(21, 55, 43, 0.06)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                divider={<Divider orientation="vertical" flexItem sx={{ borderColor: '#D9E4DE' }} />}
                spacing={{ xs: 2, sm: 4 }}
                sx={{ justifyContent: 'space-around', alignItems: 'center' }}
              >
                <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 24, color: '#176B4B' }}>
                    10,000+
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5D7068', fontSize: 13, fontWeight: 600 }}>
                    {t('hero.statUsers')}
                  </Typography>
                </Stack>

                <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 24, color: '#B66A2C' }}>
                    The Guardian
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5D7068', fontSize: 13, fontWeight: 600 }}>
                    {t('hero.statArticles')}
                  </Typography>
                </Stack>

                <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 24, color: '#0F5138' }}>
                    Spaced Repetition
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5D7068', fontSize: 13, fontWeight: 600 }}>
                    {t('hero.statAccuracy')}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </Box>

      {/* Interactive Demo Section */}
      <Box id="demo" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF', borderTop: '1px solid #D9E4DE', borderBottom: '1px solid #D9E4DE' }}>
        <Container maxWidth="lg">
          <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', mb: 6 }}>
            <Chip
              icon={<BookOpenIcon size={14} color="#176B4B" />}
              label={t('demo.badge')}
              sx={{
                bgcolor: '#DDF3E8',
                color: '#0F5138',
                border: '1px solid #BCE3D1',
                fontWeight: 700,
              }}
            />
            <Typography variant="h2" sx={{ fontSize: { xs: 28, md: 36 }, color: '#17372B' }}>
              {t('demo.title')}
            </Typography>
            <Typography sx={{ color: '#5D7068', maxWidth: 640 }}>
              {t('demo.subtitle')}
            </Typography>
          </Stack>

          {/* Interactive Demo Container */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' },
              gap: 4,
              alignItems: 'start',
            }}
          >
            {/* Article Card Mockup */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 3.5,
                bgcolor: '#F3F7F4',
                border: '1px solid #D9E4DE',
                boxShadow: '0 16px 40px rgba(21, 55, 43, 0.08)',
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                <Chip size="small" label="Technology" color="primary" sx={{ fontWeight: 700, fontSize: 11 }} />
                <Chip size="small" label="CEFR Target: B2-C1" variant="outlined" sx={{ color: '#5D7068', borderColor: '#D9E4DE', fontSize: 11 }} />
              </Stack>

              <Typography variant="h5" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 700, color: '#17372B', mb: 2, lineHeight: 1.3 }}>
                {t('demo.articleTitle')}
              </Typography>

              <Alert severity="info" sx={{ mb: 3, bgcolor: '#DDF3E8', color: '#0F5138', border: '1px solid #BCE3D1' }}>
                {t('demo.hint')}
              </Alert>

              <Typography component="p" sx={{ fontSize: 18, lineHeight: 1.8, color: '#17372B' }}>
                Recent advancements in artificial intelligence are completely{' '}
                <Box
                  component="span"
                  onClick={() => setSelectedTermKey('transforms')}
                  sx={{
                    bgcolor: selectedTermKey === 'transforms' ? '#DDF3E8' : 'rgba(23, 107, 75, 0.12)',
                    color: '#0F5138',
                    borderBottom: '2px solid #176B4B',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
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
                    borderBottom: '2px solid #B66A2C',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
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
                    bgcolor: selectedTermKey === 'contextual' ? '#E2E8F0' : 'rgba(71, 85, 105, 0.12)',
                    color: '#1E293B',
                    borderBottom: '2px solid #475569',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: '#E2E8F0' },
                  }}
                >
                  contextual
                </Box>{' '}
                insights and natural sentence translations, students retain complex words 3x faster than traditional flashcard methods.
              </Typography>
            </Paper>

            {/* AI Insights Inspector Panel - Styled like Auth dark panel */}
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 3.5,
                bgcolor: '#0F5138',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 16px 40px rgba(15, 81, 56, 0.25)',
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <SparklesIcon size={18} color="#DDF3E8" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#DDF3E8' }}>
                    {t('demo.popoverHeader')}
                  </Typography>
                </Stack>
                <Chip label={selectedTerm.cefr} size="small" sx={{ bgcolor: '#DDF3E8', color: '#0F5138', fontWeight: 800 }} />
              </Stack>

              <Typography variant="h4" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 700, color: '#FFFFFF', mb: 0.5 }}>
                {selectedTerm.word}
              </Typography>
              <Typography variant="caption" sx={{ color: '#DDF3E8', fontStyle: 'italic', display: 'block', mb: 2 }}>
                ({selectedTerm.pos})
              </Typography>

              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#DDF3E8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Meaning / Context
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600, mt: 0.5 }}>
                    {currentLang === 'vi' ? selectedTerm.meaningVi : selectedTerm.meaningEn}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#DDF3E8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sentence Translation
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 0.5 }}>
                    "{currentLang === 'vi' ? selectedTerm.translationVi : selectedTerm.translationEn}"
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)', p: 1.75, borderRadius: 2, border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                  <Typography variant="caption" sx={{ color: '#DDF3E8', display: 'block', mb: 0.5 }}>
                    Example Sentence:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#FFFFFF', fontStyle: 'italic' }}>
                    "{selectedTerm.exampleEn}"
                  </Typography>
                </Box>

                <Button
                  onClick={handleSaveDemoTerm}
                  variant="contained"
                  fullWidth
                  startIcon={<BookmarkIcon size={18} />}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 750,
                    mt: 1,
                    bgcolor: '#FFFFFF',
                    color: '#0F5138',
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

      {/* Features Grid Section */}
      <Box id="features" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', mb: 8 }}>
            <Chip
              icon={<SparklesIcon size={14} color="#B66A2C" />}
              label={t('features.badge')}
              sx={{
                bgcolor: '#F8E4D1',
                color: '#864719',
                border: '1px solid #E6C8AD',
                fontWeight: 700,
              }}
            />
            <Typography variant="h2" sx={{ fontSize: { xs: 28, md: 36 }, color: '#17372B' }}>
              {t('features.title')}
            </Typography>
            <Typography sx={{ color: '#5D7068', maxWidth: 640 }}>
              {t('features.subtitle')}
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 3,
            }}
          >
            {/* Feature 1 */}
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 3.5,
                bgcolor: '#FFFFFF',
                border: '1px solid #D9E4DE',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#176B4B',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 28px rgba(23, 107, 75, 0.12)',
                },
              }}
            >
              <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: '#DDF3E8', color: '#176B4B', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <SparklesIcon size={26} color="#176B4B" />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 700, color: '#17372B', mb: 1 }}>
                {t('features.contextTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.6 }}>
                {t('features.contextDesc')}
              </Typography>
            </Paper>

            {/* Feature 2 */}
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 3.5,
                bgcolor: '#FFFFFF',
                border: '1px solid #D9E4DE',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#B66A2C',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 28px rgba(182, 106, 44, 0.12)',
                },
              }}
            >
              <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: '#F8E4D1', color: '#B66A2C', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <TargetIcon size={26} color="#B66A2C" />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 700, color: '#17372B', mb: 1 }}>
                {t('features.cefrTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.6 }}>
                {t('features.cefrDesc')}
              </Typography>
            </Paper>

            {/* Feature 3 */}
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 3.5,
                bgcolor: '#FFFFFF',
                border: '1px solid #D9E4DE',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#B23B3B',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 28px rgba(178, 59, 59, 0.12)',
                },
              }}
            >
              <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: '#FEE2E2', color: '#B23B3B', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <FlameIcon size={26} color="#B23B3B" />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 700, color: '#17372B', mb: 1 }}>
                {t('features.srTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.6 }}>
                {t('features.srDesc')}
              </Typography>
            </Paper>

            {/* Feature 4 */}
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 3.5,
                bgcolor: '#FFFFFF',
                border: '1px solid #D9E4DE',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#0284C7',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 28px rgba(2, 132, 199, 0.12)',
                },
              }}
            >
              <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <LayersIcon size={26} color="#0284C7" />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 700, color: '#17372B', mb: 1 }}>
                {t('features.quizTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.6 }}>
                {t('features.quizDesc')}
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* How it works Section */}
      <Box id="how-it-works" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF', borderTop: '1px solid #D9E4DE', borderBottom: '1px solid #D9E4DE' }}>
        <Container maxWidth="lg">
          <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', mb: 8 }}>
            <Chip
              icon={<TrendingUpIcon size={14} color="#176B4B" />}
              label={t('steps.badge')}
              sx={{
                bgcolor: '#DDF3E8',
                color: '#0F5138',
                border: '1px solid #BCE3D1',
                fontWeight: 700,
              }}
            />
            <Typography variant="h2" sx={{ fontSize: { xs: 28, md: 36 }, color: '#17372B' }}>
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
                p: 4,
                borderRadius: 3.5,
                bgcolor: '#F3F7F4',
                border: '1px solid #D9E4DE',
                position: 'relative',
              }}
            >
              <Typography sx={{ fontFamily: '"Merriweather", serif', fontSize: 40, fontWeight: 700, color: '#176B4B', mb: 1.5 }}>
                01
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 700, color: '#17372B', mb: 1 }}>
                {t('steps.step1Title')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.6 }}>
                {t('steps.step1Desc')}
              </Typography>
            </Paper>

            {/* Step 2 */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3.5,
                bgcolor: '#F3F7F4',
                border: '1px solid #D9E4DE',
                position: 'relative',
              }}
            >
              <Typography sx={{ fontFamily: '"Merriweather", serif', fontSize: 40, fontWeight: 700, color: '#B66A2C', mb: 1.5 }}>
                02
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 700, color: '#17372B', mb: 1 }}>
                {t('steps.step2Title')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.6 }}>
                {t('steps.step2Desc')}
              </Typography>
            </Paper>

            {/* Step 3 */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3.5,
                bgcolor: '#F3F7F4',
                border: '1px solid #D9E4DE',
                position: 'relative',
              }}
            >
              <Typography sx={{ fontFamily: '"Merriweather", serif', fontSize: 40, fontWeight: 700, color: '#0F5138', mb: 1.5 }}>
                03
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: '"Merriweather", serif', fontWeight: 700, color: '#17372B', mb: 1 }}>
                {t('steps.step3Title')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5D7068', lineHeight: 1.6 }}>
                {t('steps.step3Desc')}
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box id="faq" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md">
          <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', mb: 6 }}>
            <Chip
              icon={<SparklesIcon size={14} color="#176B4B" />}
              label={t('faq.badge')}
              sx={{
                bgcolor: '#DDF3E8',
                color: '#0F5138',
                border: '1px solid #BCE3D1',
                fontWeight: 700,
              }}
            />
            <Typography variant="h2" sx={{ fontSize: { xs: 28, md: 36 }, color: '#17372B' }}>
              {t('faq.title')}
            </Typography>
          </Stack>

          <Stack spacing={2}>
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
                  bgcolor: '#FFFFFF',
                  color: '#17372B',
                  borderRadius: '16px !important',
                  border: '1px solid #D9E4DE',
                  '&::before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ChevronDownIcon size={20} color="#5D7068" />}>
                  <Typography sx={{ fontWeight: 700, fontSize: 17, color: '#17372B' }}>
                    {item.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography sx={{ color: '#5D7068', lineHeight: 1.6 }}>
                    {item.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Bottom CTA Banner */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#FFFFFF', borderTop: '1px solid #D9E4DE' }}>
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 6, md: 8 },
              borderRadius: 4,
              bgcolor: '#0F5138',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              textAlign: 'center',
              boxShadow: '0 20px 48px rgba(15, 81, 56, 0.22)',
            }}
          >
            <Typography variant="h2" sx={{ fontFamily: '"Merriweather", serif', fontSize: { xs: 26, sm: 36, md: 44 }, fontWeight: 700, mb: 2, color: '#FFFFFF' }}>
              {t('cta.title')}
            </Typography>
            <Typography sx={{ color: '#DDF3E8', fontSize: { xs: 15, sm: 18 }, maxWidth: 640, mx: 'auto', mb: 4 }}>
              {t('cta.subtitle')}
            </Typography>
            <Button
              component={RouterLink}
              to={isAuthenticated ? routePaths.home : routePaths.register}
              variant="contained"
              size="large"
              endIcon={<ArrowRightIcon size={20} />}
              sx={{
                borderRadius: 2.5,
                px: 4,
                py: 1.75,
                fontSize: 16,
                fontWeight: 800,
                bgcolor: '#FFFFFF',
                color: '#0F5138',
                '&:hover': {
                  bgcolor: '#DDF3E8',
                  color: '#0F5138',
                },
              }}
            >
              {t('cta.button')}
            </Button>
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, bgcolor: '#F3F7F4', borderTop: '1px solid #D9E4DE', textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#5D7068' }}>
          {t('footer.rights')}
        </Typography>
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
