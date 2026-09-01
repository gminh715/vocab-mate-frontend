import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState, type MouseEvent, type PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CheckCircleIcon,
  UkFlagIcon,
  VietnamFlagIcon,
} from '@/components/Dashboard/DashboardIcons'
import { routePaths } from '@/utils/paths'

interface AuthPageLayoutProps extends PropsWithChildren {
  alternateAction: string
  alternateHref: string
  alternatePrompt: string
  description: string
  title: string
}

export function AuthPageLayout({
  alternateAction,
  alternateHref,
  alternatePrompt,
  children,
  description,
  title,
}: AuthPageLayoutProps) {
  const { t, i18n } = useTranslation('auth')
  const [langMenuAnchor, setLangMenuAnchor] = useState<null | HTMLElement>(null)
  const isLangMenuOpen = Boolean(langMenuAnchor)

  const currentLang = i18n.language?.startsWith('vi') ? 'vi' : 'en'

  const handleOpenLangMenu = (event: MouseEvent<HTMLElement>) => {
    setLangMenuAnchor(event.currentTarget)
  }

  const handleCloseLangMenu = () => {
    setLangMenuAnchor(null)
  }

  const handleSelectLanguage = (lang: 'vi' | 'en') => {
    void i18n.changeLanguage(lang)
    handleCloseLangMenu()
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        py: { xs: 2.5, sm: 4, md: 6 },
        px: { xs: 1.5, sm: 3 },
        background:
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(23, 107, 75, 0.12), transparent 70%), radial-gradient(circle at 90% 90%, rgba(182, 106, 44, 0.08), transparent 40%), #F4F7F5',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Top Floating Bar: Back to Home & Language Switcher */}
        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          <Button
            component={RouterLink}
            to={routePaths.home}
            startIcon={<ArrowLeftIcon size={18} />}
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.875rem',
              px: 1.5,
              py: 0.75,
              borderRadius: 3,
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 8px rgba(23, 55, 43, 0.04)',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: 'primary.main',
                bgcolor: '#FFFFFF',
                borderColor: 'primary.light',
                transform: 'translateX(-2px)',
              },
            }}
          >
            {t('common.backToHome')}
          </Button>

          {/* Language Switcher Button */}
          <Box>
            <Button
              id="auth-language-switcher-btn"
              onClick={handleOpenLangMenu}
              aria-controls={isLangMenuOpen ? 'auth-language-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={isLangMenuOpen ? 'true' : undefined}
              startIcon={
                currentLang === 'vi' ? (
                  <VietnamFlagIcon size={20} />
                ) : (
                  <UkFlagIcon size={20} />
                )
              }
              sx={{
                color: 'text.primary',
                fontWeight: 650,
                fontSize: '0.85rem',
                px: 1.75,
                py: 0.75,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px rgba(23, 55, 43, 0.05)',
                '&:hover': {
                  bgcolor: '#FFFFFF',
                  borderColor: 'primary.main',
                },
              }}
            >
              {currentLang === 'vi' ? t('common.vietnamese') : t('common.english')}
            </Button>
            <Menu
              id="auth-language-menu"
              anchorEl={langMenuAnchor}
              open={isLangMenuOpen}
              onClose={handleCloseLangMenu}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  elevation: 4,
                  sx: {
                    mt: 1,
                    minWidth: 160,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 12px 32px rgba(23, 55, 43, 0.12)',
                    p: 0.5,
                  },
                },
              }}
            >
              <MenuItem
                selected={currentLang === 'vi'}
                onClick={() => handleSelectLanguage('vi')}
                sx={{
                  gap: 1.5,
                  borderRadius: 2,
                  py: 1,
                  fontWeight: currentLang === 'vi' ? 700 : 500,
                  fontSize: '0.875rem',
                }}
              >
                <VietnamFlagIcon size={22} />
                {t('common.vietnamese')}
                {currentLang === 'vi' ? (
                  <Box sx={{ ml: 'auto', color: 'primary.main', display: 'flex' }}>
                    <CheckCircleIcon size={16} />
                  </Box>
                ) : null}
              </MenuItem>
              <MenuItem
                selected={currentLang === 'en'}
                onClick={() => handleSelectLanguage('en')}
                sx={{
                  gap: 1.5,
                  borderRadius: 2,
                  py: 1,
                  fontWeight: currentLang === 'en' ? 700 : 500,
                  fontSize: '0.875rem',
                }}
              >
                <UkFlagIcon size={22} />
                {t('common.english')}
                {currentLang === 'en' ? (
                  <Box sx={{ ml: 'auto', color: 'primary.main', display: 'flex' }}>
                    <CheckCircleIcon size={16} />
                  </Box>
                ) : null}
              </MenuItem>
            </Menu>
          </Box>
        </Stack>

        {/* Main 2-Column Card */}
        <Paper
          elevation={0}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'minmax(0, 0.9fr) minmax(430px, 1.1fr)',
              lg: 'minmax(0, 0.85fr) minmax(480px, 1.15fr)',
            },
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: { xs: 3.5, md: 5 },
            boxShadow:
              '0 32px 80px -16px rgba(23, 55, 43, 0.12), 0 1px 3px rgba(23, 55, 43, 0.05)',
            bgcolor: 'background.paper',
          }}
        >
          {/* Left Column: Clean Editorial Showcase */}
          <Box
            sx={{
              position: 'relative',
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: { md: 5, lg: 6 },
              color: 'common.white',
              background:
                'linear-gradient(155deg, #093222 0%, #0F4932 45%, #176B4B 100%)',
              overflow: 'hidden',
            }}
          >
            {/* Subtle background ambient patterns */}
            <Box
              sx={{
                position: 'absolute',
                top: '-15%',
                right: '-15%',
                width: 320,
                height: 320,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(116, 190, 151, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: '-10%',
                left: '-10%',
                width: 280,
                height: 280,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(182, 106, 44, 0.18) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Top Logo & Branding */}
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 3.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#A7F3D0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <BookOpenIcon size={22} color="#DDF3E8" />
                </Box>
                <Typography
                  sx={{
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: 'common.white',
                    fontFamily: '"Merriweather", serif',
                  }}
                >
                  {t('brand.name')}
                </Typography>
              </Stack>

              <Typography
                component="h2"
                sx={{
                  fontFamily: '"Merriweather", "Be Vietnam Pro", serif',
                  fontSize: { md: 30, lg: 38 },
                  fontWeight: 700,
                  lineHeight: 1.22,
                  letterSpacing: '-0.025em',
                  color: 'common.white',
                  textWrap: 'balance',
                  mb: 2,
                }}
              >
                {t('brand.tagline')}
              </Typography>

              <Typography
                sx={{
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.85)',
                  maxWidth: 440,
                }}
              >
                {t('brand.subtagline')}
              </Typography>
            </Box>

            {/* Bottom Quote Box */}
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                mt: 6,
                p: 3,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.925rem',
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.92)',
                  mb: 1.25,
                  fontFamily: '"Merriweather", serif',
                }}
              >
                "{t('brand.quote')}"
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 650,
                  color: '#A7F3D0',
                  letterSpacing: '0.02em',
                }}
              >
                — {t('brand.quoteAuthor')}
              </Typography>
            </Box>
          </Box>

          {/* Right Column: Auth Form Area */}
          <Stack
            id="auth-form"
            spacing={3}
            sx={{
              justifyContent: 'center',
              p: { xs: 3, sm: 5, md: 5, lg: 6.5 },
              bgcolor: 'background.paper',
            }}
          >
            {/* Mobile Header with Logo & Brand */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 0.5 }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                  }}
                >
                  <BookOpenIcon size={18} color="#FFFFFF" />
                </Box>
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: 'primary.dark',
                    fontFamily: '"Merriweather", serif',
                  }}
                >
                  {t('brand.name')}
                </Typography>
              </Stack>
            </Box>

            {/* Form Title & Subtitle */}
            <Box>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: 28, sm: 34, md: 36 },
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  color: 'text.primary',
                }}
              >
                {title}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  mt: 1.25,
                  fontSize: { xs: '0.925rem', sm: '1rem' },
                  lineHeight: 1.5,
                }}
              >
                {description}
              </Typography>
            </Box>

            {/* Injected Form / Notifications / Alerts */}
            {children}

            {/* Bottom Alternate Link */}
            <Box
              sx={{
                pt: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
              }}
            >
              <Typography color="text.secondary" sx={{ fontSize: '0.925rem' }}>
                {alternatePrompt}{' '}
                <Link
                  component={RouterLink}
                  to={alternateHref}
                  sx={{
                    fontWeight: 750,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: 'primary.dark',
                    },
                  }}
                >
                  {alternateAction}
                </Link>
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 1.5,
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  lineHeight: 1.4,
                  opacity: 0.8,
                }}
              >
                {t('common.termsNotice')}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
