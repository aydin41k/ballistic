import * as Haptics from 'expo-haptics';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { MotionPressable } from '@/components/ui/MotionPressable';
import { colours, radii, spacing } from '@/constants/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  colour?: string | null;
  icon?: React.ComponentProps<typeof AppIcon>['name'];
  crossedOut?: boolean;
}

export function Chip({
  label,
  selected = false,
  onPress,
  colour,
  icon,
  crossedOut = false,
}: ChipProps) {
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[styles.chip, selected ? styles.selected : styles.unselected]}
    >
      {colour ? (
        <View style={[styles.dot, { backgroundColor: colour }, crossedOut && styles.faded]} />
      ) : null}
      {icon ? (
        <AppIcon name={icon} size={16} colour={selected ? '#FFFFFF' : colours.textMuted} />
      ) : null}
      <AppText
        variant="caption"
        colour={selected ? '#FFFFFF' : crossedOut ? colours.textFaint : colours.text}
        style={crossedOut ? styles.crossedOut : undefined}
      >
        {label}
      </AppText>
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 38,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
  },
  selected: { backgroundColor: colours.blue, borderColor: colours.blue },
  unselected: { backgroundColor: colours.surface, borderColor: colours.border },
  dot: { width: 8, height: 8, borderRadius: 4 },
  faded: { opacity: 0.4 },
  crossedOut: { textDecorationLine: 'line-through' },
});
