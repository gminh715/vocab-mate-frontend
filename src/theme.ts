import { createTheme } from '@mui/material/styles'

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
    error: {
      main: '#B23B3B',
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
          borderRadius: 12,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          '&:focus-visible': {
            outline: '3px solid rgba(23, 107, 75, 0.28)',
            outlineOffset: 3,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        size: 'medium',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
        },
      },
    },
  },
})
