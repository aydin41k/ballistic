import * as Haptics from 'expo-haptics';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { MotionPressable } from '@/components/ui/MotionPressable';
import { colours, radii } from '@/constants/theme';

interface IconButtonProps {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  label: string;
  onPress: () => void;
  badge?: number;
  active?: boolean;
  disabled?: boolean;
}

export function IconButton({
  icon,
  label,
  onPress,
  badge = 0,
  active = false,
  disabled = false,
}: IconButtonProps) {
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[styles.button, active && styles.active, disabled && styles.disabled]}
    >
      <AppIcon name={icon} size={21} colour={active ? '#FFFFFF' : colours.navy} />
      {badge > 0 ? (
        <View style={styles.badge}>
          <AppText style={styles.badgeText} colour="#FFFFFF">
            {badge > 99 ? '99+' : badge}
          </AppText>
        </View>
      ) : null}
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
  },
  active: { backgroundColor: colours.blue, borderColor: colours.blue },
  disabled: { opacity: 0.45 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: colours.danger,
    borderColor: colours.page,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, lineHeight: 11, fontWeight: '800' },
});
