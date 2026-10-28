import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colours, radii, spacing } from '@/constants/theme';

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof AppIcon>['name'];
  title: string;
  message: string;
}

export function EmptyState({
  icon = 'checkbox-marked-circle-outline',
  title,
  message,
}: EmptyStateProps) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.container}>
      <View style={styles.icon}>
        <AppIcon name={icon} size={34} colour={colours.blue} />
      </View>
      <AppText variant="title" style={styles.centre}>
        {title}
      </AppText>
      <AppText colour={colours.textMuted} style={styles.centre}>
        {message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.huge,
    gap: spacing.sm,
  },
  icon: {
    width: 68,
    height: 68,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.blueSoft,
  },
  centre: { textAlign: 'center' },
});
