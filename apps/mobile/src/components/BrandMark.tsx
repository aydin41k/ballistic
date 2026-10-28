import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colours, radii, shadows, spacing } from '@/constants/theme';

export function BrandMark({
  compact = false,
  inverted = false,
}: {
  compact?: boolean;
  inverted?: boolean;
}) {
  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      <Image
        source={require('@/assets/images/ballistic-icon.png')}
        style={[styles.logo, compact && styles.compactLogo]}
      />
      <View style={styles.copy}>
        <AppText
          variant={compact ? 'title' : 'headline'}
          colour={inverted ? '#FFFFFF' : colours.navy}
        >
          Ballistic
        </AppText>
        {!compact ? (
          <AppText variant="caption" colour={inverted ? '#D8E6F5' : colours.textMuted}>
            The Simplest Bullet Journal
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  compactRow: { gap: spacing.xs },
  logo: { width: 58, height: 58, borderRadius: radii.lg, ...shadows.card },
  compactLogo: { width: 38, height: 38, borderRadius: 12 },
  copy: { gap: 1 },
});
