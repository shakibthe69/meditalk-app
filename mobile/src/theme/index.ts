export * from './colors';
export * from './typography';
export * from './spacing';

import { lightTheme, darkTheme, palette } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows } from './spacing';

export const theme = {
  light: {
    colors: lightTheme,
    palette,
    typography,
    spacing,
    borderRadius,
    shadows,
  },
  dark: {
    colors: darkTheme,
    palette,
    typography,
    spacing,
    borderRadius,
    shadows,
  },
};
