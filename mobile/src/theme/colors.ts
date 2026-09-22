export const palette = {
  // Primary Teal & Emerald (Healthcare, Trust, Wellness)
  teal50: '#F0FDFA',
  teal100: '#CCFBF1',
  teal200: '#99F6E4',
  teal300: '#5EEAD4',
  teal400: '#2DD4BF',
  teal500: '#14B8A6',
  teal600: '#0D9488', // Primary Brand
  teal700: '#0F766E',
  teal800: '#115E59',
  teal900: '#134E4A',

  // Secondary Blue (Medical tech, Calm)
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',

  // Status & Feedback
  success50: '#F0FDF4',
  success100: '#DCFCE7',
  success500: '#22C55E',
  success600: '#16A34A',
  success700: '#15803D',

  warning50: '#FFFBEB',
  warning100: '#FEF3C7',
  warning200: '#FDE68A',
  warning300: '#FCD34D',
  warning500: '#F59E0B',
  warning600: '#D97706',
  warning700: '#B45309',
  warning800: '#92400E',
  warning900: '#78350F',

  danger50: '#FEF2F2',
  danger100: '#FEE2E2',
  danger200: '#FECACA',
  danger300: '#FCA5A5',
  danger500: '#EF4444',
  danger600: '#DC2626',
  danger700: '#B91C1C',
  danger800: '#991B1B',
  danger900: '#7F1D1D',

  // Specialty & Accents
  purple50: '#FAF5FF',
  purple100: '#F3E8FF',
  purple600: '#9333EA',
  purple700: '#7E22CE',

  amber500: '#F59E0B',
  amber600: '#D97706',
  amber700: '#B45309',

  coral50: '#FFF1F2',
  coral500: '#F43F5E',
  coral600: '#E11D48',
  coral700: '#BE123C',

  // Neutrals (Slate)
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
  slate950: '#020617',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const lightTheme = {
  background: {
    primary: palette.slate50,
    secondary: palette.white,
    tertiary: palette.slate100,
    card: palette.white,
    glass: 'rgba(255, 255, 255, 0.85)',
    modal: palette.white,
  },
  text: {
    primary: palette.slate900,
    secondary: palette.slate600,
    muted: palette.slate400,
    inverse: palette.white,
    teal: palette.teal600,
  },
  brand: {
    primary: palette.teal600,
    primaryLight: palette.teal50,
    primaryHover: palette.teal700,
    secondary: palette.blue600,
    accent: palette.teal500,
  },
  border: {
    subtle: palette.slate200,
    default: palette.slate300,
    focused: palette.teal600,
  },
  status: {
    taken: {
      bg: palette.success50,
      text: palette.success600,
      border: palette.success100,
    },
    upcoming: {
      bg: palette.blue50,
      text: palette.blue600,
      border: palette.blue100,
    },
    missed: {
      bg: palette.danger50,
      text: palette.danger600,
      border: palette.danger100,
    },
    skipped: {
      bg: palette.warning50,
      text: palette.warning600,
      border: palette.warning100,
    },
  },
};

export const darkTheme = {
  background: {
    primary: palette.slate950,
    secondary: palette.slate900,
    tertiary: palette.slate800,
    card: palette.slate900,
    glass: 'rgba(15, 23, 42, 0.85)',
    modal: palette.slate900,
  },
  text: {
    primary: palette.slate50,
    secondary: palette.slate300,
    muted: palette.slate500,
    inverse: palette.slate950,
    teal: palette.teal400,
  },
  brand: {
    primary: palette.teal500,
    primaryLight: 'rgba(20, 184, 166, 0.15)',
    primaryHover: palette.teal400,
    secondary: palette.blue500,
    accent: palette.teal400,
  },
  border: {
    subtle: palette.slate800,
    default: palette.slate700,
    focused: palette.teal400,
  },
  status: {
    taken: {
      bg: 'rgba(34, 197, 94, 0.15)',
      text: palette.success500,
      border: 'rgba(34, 197, 94, 0.3)',
    },
    upcoming: {
      bg: 'rgba(59, 130, 246, 0.15)',
      text: palette.blue500,
      border: 'rgba(59, 130, 246, 0.3)',
    },
    missed: {
      bg: 'rgba(239, 68, 68, 0.15)',
      text: palette.danger500,
      border: 'rgba(239, 68, 68, 0.3)',
    },
    skipped: {
      bg: 'rgba(245, 158, 11, 0.15)',
      text: palette.warning500,
      border: 'rgba(245, 158, 11, 0.3)',
    },
  },
};

export type ThemeColors = typeof lightTheme;
