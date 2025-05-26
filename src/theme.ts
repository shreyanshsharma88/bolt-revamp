import { createTheme } from "@mui/material";

export const getTheme = () => {
  const theme = createTheme({
    palette: {
      primary: {
        main: '#7F5AF0',
      },
      secondary: {
        main: '#00D1FF',
      },
      background: {
        default: '#0F1117',
        paper: '#161A20',
      },
      text: {
        primary: '#F1F1F1',
        secondary: '#B2B2B2',
      },
      error:{
        main: 'rgba(255, 100, 100, 0.8)'
      }
    },
    typography: {
      fontFamily: 'Poppins, sans-serif, Protest Revolution',
      h1: { fontWeight: 600 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 500 },
      body1: { fontWeight: 400 },
      body2: { fontWeight: 300 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 10,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation24: {
            background: 'rgba(22, 26, 32, 0.6)', 
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(8px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            background: 'rgba(22, 26, 32, 0.6)',
            backdropFilter: 'blur(8px) saturate(180%)',
            WebkitBackdropFilter: 'blur(8px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
  });

  return theme;
};
