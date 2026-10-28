import { Platform } from 'react-native';

export const colours = {
  navy: '#0A2540',
  navySoft: '#123A5A',
  blue: '#1E40AF',
  blueBright: '#2563EB',
  blueSoft: '#EAF0FF',
  page: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceRaised: '#FBFCFE',
  text: '#0B1324',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  success: '#059669',
  successSoft: '#ECFDF5',
  warning: '#D97706',
  warningSoft: '#FFFBEB',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  violet: '#7C3AED',
  violetSoft: '#F5F3FF',
  sky: '#0284C7',
  skySoft: '#F0F9FF',
  overlay: 'rgba(10, 37, 64, 0.48)',
  transparent: 'transparent',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 48,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  ui: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  reading: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: colours.navy,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.07,
      shadowRadius: 14,
    },
    android: { elevation: 2 },
    default: {},
  }),
  floating: Platform.select({
    ios: {
      shadowColor: colours.navy,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
    },
    android: { elevation: 10 },
    default: {},
  }),
} as const;

export const hitSlop = 10;
