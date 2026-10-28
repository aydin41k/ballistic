import { StyleSheet, Switch, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colours, radii, spacing } from '@/constants/theme';

interface FeatureToggleProps {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function FeatureToggle({
  icon,
  title,
  description,
  value,
  onChange,
  disabled = false,
}: FeatureToggleProps) {
  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <View style={styles.icon}>
        <AppIcon name={icon} size={21} colour={colours.blue} />
      </View>
      <View style={styles.copy}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" colour={colours.textMuted}>
          {description}
        </AppText>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: colours.borderStrong, true: colours.blueBright }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
    padding: spacing.sm,
  },
  disabled: { opacity: 0.5 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.blueSoft,
  },
  copy: { flex: 1, gap: 2 },
});
