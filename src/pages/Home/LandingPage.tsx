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

function GlobeIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Box>
  )
}

export function LandingPage() {
  const { t, i18n } = useTranslation('landing')
  const { isAuthenticated } = useAuth()
  const [selectedTermKey, setSelectedTermKey] = useState<string>('acquisition')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const currentLang = i18n.language.startsWith('vi') ? 'vi' : 'en'

  const toggleLanguage = () => {
    const nextLang = currentLang === 'vi' ? 'en' : 'vi'
    void i18n.changeLanguage(nextLang)
  }

  const selectedTerm = DEMO_TERMS[selectedTermKey] ?? DEMO_TERMS.acquisition

  const handleSaveDemoTerm = () => {
    setToastMessage(t('demo.savedSuccess'))
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#090d16',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflowX: 'hidden',
      }}
    >
      {/* Top Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1 }}>
            {/* Brand Logo */}
            <Stack
              component={RouterLink}
              to={routePaths.home}
              direction="row"
              spacing={1.25}
              sx={{
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                }}
              >
                <SparklesIcon size={22} color="#ffffff" />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: 20,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Vocab Mate
              </Typography>
            </Stack>

            {/* Desktop Navigation Links */}
            <Stack
              direction="row"
              spacing={3}
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}
            >
              <Button
                component="a"
                href="#features"
                sx={{ color: '#94a3b8', fontWeight: 600, '&:hover': { color: '#ffffff' } }}
              >
                {t('nav.features')}
              </Button>
              <Button
                component="a"
                href="#demo"
                sx={{ color: '#94a3b8', fontWeight: 600, '&:hover': { color: '#ffffff' } }}
              >
                {t('nav.demo')}
              </Button>
              <Button
                component="a"
                href="#how-it-works"
                sx={{ color: '#94a3b8', fontWeight: 600, '&:hover': { color: '#ffffff' } }}
              >
                {t('nav.howItWorks')}
              </Button>
              <Button
                component="a"
                href="#faq"
                sx={{ color: '#94a3b8', fontWeight: 600, '&:hover': { color: '#ffffff' } }}
              >
                {t('nav.faq')}
              </Button>
            </Stack>

            {/* Right Actions */}
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              {/* Language Switcher Button */}
              <Button
                onClick={toggleLanguage}
                size="small"
                variant="outlined"
                startIcon={<GlobeIcon size={16} color="#818cf8" />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  borderRadius: 2,
                  px: 1.5,
                  fontWeight: 700,
                  fontSize: 13,
                  '&:hover': {
                    borderColor: '#818cf8',
                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                    color: '#ffffff',
                  },
                }}
              >
                {currentLang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
              </Button>

              {isAuthenticated ? (
                <Button
                  component={RouterLink}
                  to={routePaths.home}
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
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
                      color: '#e2e8f0',
                      fontWeight: 600,
                      display: { xs: 'none', sm: 'inline-flex' },
                      '&:hover': { color: '#ffffff' },
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
                      fontWeight: 700,
                      px: 2.25,
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                      },
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
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 14 },
          background:
            'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.18) 0%, rgba(15, 23, 42, 0) 70%)',
        }}
      >
        {/* Ambient Blur Circle */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: { xs: 300, md: 600 },
            height: { xs: 300, md: 400 },
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0) 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack spacing={4} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 840, mx: 'auto' }}>
            {/* Pill Badge */}
            <Chip
              icon={<SparklesIcon size={14} color="#818cf8" />}
              label={t('hero.badge')}
              sx={{
                bgcolor: 'rgba(99, 102, 241, 0.12)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.3)',
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
                fontSize: { xs: 36, sm: 48, md: 60 },
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 60%, #818cf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('hero.title')}
            </Typography>

            {/* Subtitle */}
            <Typography
              sx={{
                fontSize: { xs: 16, sm: 19 },
                color: '#94a3b8',
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
                  py: 1.75,
                  fontSize: 16,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
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
                startIcon={<BookOpenIcon size={20} color="#cbd5e1" />}
                sx={{
                  borderRadius: 2.5,
                  px: 3.5,
                  py: 1.75,
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#f1f5f9',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  '&:hover': {
                    borderColor: '#818cf8',
                    bgcolor: 'rgba(99, 102, 241, 0.1)',
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
                p: { xs: 2, sm: 3 },
                width: '100%',
                borderRadius: 3,
                bgcolor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />}
                spacing={{ xs: 2, sm: 4 }}
                sx={{ justifyContent: 'space-around', alignItems: 'center' }}
              >
                <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 24, color: '#818cf8' }}>
                    10,000+
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>
                    {t('hero.statUsers')}
                  </Typography>
                </Stack>

                <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 24, color: '#34d399' }}>
                    The Guardian
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>
                    {t('hero.statArticles')}
                  </Typography>
                </Stack>

                <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 24, color: '#f43f5e' }}>
                    Spaced Repetition
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>
                    {t('hero.statAccuracy')}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </Box>

      {/* Interactive Demo Section */}
      <Box id="demo" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#0f172a' }}>
        <Container maxWidth="lg">
          <Stack spacing={4} sx={{ alignItems: 'center', textAlign: 'center', mb: 6 }}>
            <Chip
              icon={<BookOpenIcon size={14} color="#38bdf8" />}
              label={t('demo.badge')}
              sx={{
                bgcolor: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontWeight: 700,
              }}
            />
            <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 38 }, fontWeight: 800 }}>
              {t('demo.title')}
            </Typography>
            <Typography sx={{ color: '#94a3b8', maxWidth: 640 }}>
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
                bgcolor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                <Chip size="small" label="Technology" color="primary" sx={{ fontWeight: 700, fontSize: 11 }} />
                <Chip size="small" label="CEFR Target: B2-C1" variant="outlined" sx={{ color: '#94a3b8', fontSize: 11 }} />
              </Stack>

              <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc', mb: 2, lineHeight: 1.3 }}>
                {t('demo.articleTitle')}
              </Typography>

              <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                {t('demo.hint')}
              </Alert>

              <Typography component="p" sx={{ fontSize: 18, lineHeight: 1.8, color: '#cbd5e1' }}>
                Recent advancements in artificial intelligence are completely{' '}
                <Box
                  component="span"
                  onClick={() => setSelectedTermKey('transforms')}
                  sx={{
                    bgcolor: selectedTermKey === 'transforms' ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.18)',
                    color: '#818cf8',
                    borderBottom: '2px solid #818cf8',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.4)' },
                  }}
                >
                  transforms
                </Box>{' '}
                how learners approach vocabulary{' '}
                <Box
                  component="span"
                  onClick={() => setSelectedTermKey('acquisition')}
                  sx={{
                    bgcolor: selectedTermKey === 'acquisition' ? 'rgba(244, 63, 94, 0.35)' : 'rgba(244, 63, 94, 0.18)',
                    color: '#fb7185',
                    borderBottom: '2px solid #f43f5e',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.4)' },
                  }}
                >
                  acquisition
                </Box>
                . By delivering instant{' '}
                <Box
                  component="span"
                  onClick={() => setSelectedTermKey('contextual')}
                  sx={{
                    bgcolor: selectedTermKey === 'contextual' ? 'rgba(52, 211, 153, 0.35)' : 'rgba(52, 211, 153, 0.18)',
                    color: '#34d399',
                    borderBottom: '2px solid #10b981',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: 'rgba(52, 211, 153, 0.4)' },
                  }}
                >
                  contextual
                </Box>{' '}
                insights and natural sentence translations, students retain complex words 3x faster than traditional flashcard methods.
              </Typography>
            </Paper>

            {/* AI Insights Inspector Panel */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3.5,
                bgcolor: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                boxShadow: '0 12px 32px rgba(99, 102, 241, 0.15)',
                position: 'relative',
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <SparklesIcon size={18} color="#818cf8" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#a5b4fc' }}>
                    {t('demo.popoverHeader')}
                  </Typography>
                </Stack>
                <Chip label={selectedTerm.cefr} size="small" sx={{ bgcolor: '#4c1d95', color: '#ddd6fe', fontWeight: 800 }} />
              </Stack>

              <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff', mb: 0.5 }}>
                {selectedTerm.word}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', display: 'block', mb: 2 }}>
                ({selectedTerm.pos})
              </Typography>

              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Meaning / Context
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#f1f5f9', fontWeight: 600, mt: 0.5 }}>
                    {currentLang === 'vi' ? selectedTerm.meaningVi : selectedTerm.meaningEn}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Sentence Translation
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
                    "{currentLang === 'vi' ? selectedTerm.translationVi : selectedTerm.translationEn}"
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: 'rgba(15, 23, 42, 0.5)', p: 1.75, borderRadius: 2, border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                    Example Sentence:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#e2e8f0', fontStyle: 'italic' }}>
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
                    fontWeight: 700,
                    mt: 1,
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
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
          <Stack spacing={4} sx={{ alignItems: 'center', textAlign: 'center', mb: 8 }}>
            <Chip
              icon={<SparklesIcon size={14} color="#a855f7" />}
              label={t('features.badge')}
              sx={{
                bgcolor: 'rgba(168, 85, 247, 0.12)',
                color: '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                fontWeight: 700,
              }}
            />
            <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 38 }, fontWeight: 800 }}>
              {t('features.title')}
            </Typography>
            <Typography sx={{ color: '#94a3b8', maxWidth: 640 }}>
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
                borderRadius: 3,
                bgcolor: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#818cf8',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(99, 102, 241, 0.15)',
                },
              }}
            >
              <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <SparklesIcon size={26} color="#818cf8" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                {t('features.contextTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                {t('features.contextDesc')}
              </Typography>
            </Paper>

            {/* Feature 2 */}
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 3,
                bgcolor: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#34d399',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(52, 211, 153, 0.15)',
                },
              }}
            >
              <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <TargetIcon size={26} color="#34d399" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                {t('features.cefrTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                {t('features.cefrDesc')}
              </Typography>
            </Paper>

            {/* Feature 3 */}
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 3,
                bgcolor: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#f43f5e',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(244, 63, 94, 0.15)',
                },
              }}
            >
              <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <FlameIcon size={26} color="#f43f5e" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                {t('features.srTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                {t('features.srDesc')}
              </Typography>
            </Paper>

            {/* Feature 4 */}
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 3,
                bgcolor: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#38bdf8',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(56, 189, 248, 0.15)',
                },
              }}
            >
              <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <LayersIcon size={26} color="#38bdf8" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                {t('features.quizTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                {t('features.quizDesc')}
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* How it works Section */}
      <Box id="how-it-works" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#0f172a' }}>
        <Container maxWidth="lg">
          <Stack spacing={4} sx={{ alignItems: 'center', textAlign: 'center', mb: 8 }}>
            <Chip
              icon={<TrendingUpIcon size={14} color="#34d399" />}
              label={t('steps.badge')}
              sx={{
                bgcolor: 'rgba(52, 211, 153, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                fontWeight: 700,
              }}
            />
            <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 38 }, fontWeight: 800 }}>
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
                bgcolor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
              }}
            >
              <Typography sx={{ fontSize: 42, fontWeight: 900, color: '#6366f1', mb: 1.5, opacity: 0.9 }}>
                01
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                {t('steps.step1Title')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                {t('steps.step1Desc')}
              </Typography>
            </Paper>

            {/* Step 2 */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3.5,
                bgcolor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
              }}
            >
              <Typography sx={{ fontSize: 42, fontWeight: 900, color: '#a855f7', mb: 1.5, opacity: 0.9 }}>
                02
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                {t('steps.step2Title')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                {t('steps.step2Desc')}
              </Typography>
            </Paper>

            {/* Step 3 */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3.5,
                bgcolor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
              }}
            >
              <Typography sx={{ fontSize: 42, fontWeight: 900, color: '#34d399', mb: 1.5, opacity: 0.9 }}>
                03
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                {t('steps.step3Title')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                {t('steps.step3Desc')}
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box id="faq" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md">
          <Stack spacing={4} sx={{ alignItems: 'center', textAlign: 'center', mb: 6 }}>
            <Chip
              icon={<SparklesIcon size={14} color="#f43f5e" />}
              label={t('faq.badge')}
              sx={{
                bgcolor: 'rgba(244, 63, 94, 0.12)',
                color: '#fb7185',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                fontWeight: 700,
              }}
            />
            <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 38 }, fontWeight: 800 }}>
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
                  bgcolor: '#0f172a',
                  color: '#f8fafc',
                  borderRadius: '16px !important',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  '&::before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ChevronDownIcon size={20} color="#94a3b8" />}>
                  <Typography sx={{ fontWeight: 700, fontSize: 17 }}>
                    {item.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                    {item.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Bottom CTA Banner */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#0f172a' }}>
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 6, md: 8 },
              borderRadius: 4,
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(49, 46, 129, 0.4)',
            }}
          >
            <Typography variant="h3" sx={{ fontSize: { xs: 26, sm: 36, md: 44 }, fontWeight: 900, mb: 2 }}>
              {t('cta.title')}
            </Typography>
            <Typography sx={{ color: '#cbd5e1', fontSize: { xs: 15, sm: 18 }, maxWidth: 640, mx: 'auto', mb: 4 }}>
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
                bgcolor: '#ffffff',
                color: '#4338ca',
                '&:hover': {
                  bgcolor: '#f8fafc',
                  color: '#3730a3',
                },
              }}
            >
              {t('cta.button')}
            </Button>
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
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
