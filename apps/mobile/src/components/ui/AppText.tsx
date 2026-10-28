import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { colours, typography } from '@/constants/theme';

type Variant =
  'body' | 'bodyStrong' | 'caption' | 'eyebrow' | 'title' | 'headline' | 'display' | 'mono';

interface AppTextProps extends TextProps {
  variant?: Variant;
  colour?: string;
}

export function AppText({
  children,
  variant = 'body',
  colour = colours.text,
  style,
  ...props
}: PropsWithChildren<AppTextProps>) {
  return (
    <Text {...props} style={[styles.base, styles[variant], { color: colour }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { fontFamily: typography.ui },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.4 },
  headline: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.8 },
  display: { fontSize: 40, lineHeight: 46, fontWeight: '800', letterSpacing: -1.2 },
  mono: { fontFamily: typography.mono, fontSize: 12, lineHeight: 18 },
});
