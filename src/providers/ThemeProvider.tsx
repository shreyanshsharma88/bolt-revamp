import { CssBaseline, ThemeProvider } from "@mui/material";
import type { FC, PropsWithChildren } from "react";
import { getTheme } from "../theme";

export const AppThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const theme = getTheme();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline>{children}</CssBaseline>
    </ThemeProvider>
  );
};
