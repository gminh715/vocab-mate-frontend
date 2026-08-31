import { createTheme } from '@mui/material/styles'

const componentBorderRadius = 21

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#176B4B',
      dark: '#0F5138',
      light: '#DDF3E8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#B66A2C',
      dark: '#864719',
      light: '#F8E4D1',
    },
    background: {
      default: '#F3F7F4',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#17372B',
      secondary: '#5D7068',
    },
    divider: '#D9E4DE',
    success: {
      main: '#16A34A',
      dark: '#15803D',
      light: '#F0FDF4',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626',
      dark: '#991B1B',
      light: '#FEF2F2',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#D97706',
      dark: '#92400E',
      light: '#FFFBEB',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#2563EB',
      dark: '#1E40AF',
      light: '#EFF6FF',
      contrastText: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily:
      '"Be Vietnam Pro", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontFamily: '"Merriweather", "Be Vietnam Pro", serif',
      fontWeight: 700,
      letterSpacing: '-0.035em',
      lineHeight: 1.08,
    },
    h2: {
      fontFamily: '"Merriweather", "Be Vietnam Pro", serif',
      fontWeight: 700,
      letterSpacing: '-0.025em',
      lineHeight: 1.15,
    },
    button: {
      fontWeight: 750,
      textTransform: 'none',
    },
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          touchAction: 'manipulation',
          '&:focus-visible': {
            outline: '3px solid rgba(23, 107, 75, 0.28)',
            outlineOffset: 3,
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: componentBorderRadius,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: componentBorderRadius,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: componentBorderRadius,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: componentBorderRadius,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
  },
})
