import * as Haptics from 'expo-haptics';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { MotionPressable } from '@/components/ui/MotionPressable';
import { colours, radii, spacing } from '@/constants/theme';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: React.ComponentProps<typeof AppIcon>['name'];
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  compact = false,
}: AppButtonProps) {
  const palette = palettes[variant];
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[
        styles.button,
        compact ? styles.compact : styles.regular,
        { backgroundColor: palette.background, borderColor: palette.border },
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.foreground} />
      ) : (
        <View style={styles.content}>
          {icon ? <AppIcon name={icon} size={19} colour={palette.foreground} /> : null}
          <AppText variant="bodyStrong" colour={palette.foreground}>
            {label}
          </AppText>
        </View>
      )}
    </MotionPressable>
  );
}

const palettes = {
  primary: { background: colours.blue, foreground: '#FFFFFF', border: colours.blue },
  secondary: {
    background: colours.surface,
    foreground: colours.navy,
    border: colours.borderStrong,
  },
  ghost: { background: colours.transparent, foreground: colours.blue, border: colours.transparent },
  danger: { background: colours.dangerSoft, foreground: colours.danger, border: '#FECACA' },
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  regular: { minHeight: 52 },
  compact: { minHeight: 42 },
  disabled: { opacity: 0.5 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
