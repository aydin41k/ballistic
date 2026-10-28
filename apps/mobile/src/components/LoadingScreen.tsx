import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { AppText } from '@/components/ui/AppText';
import { colours, radii, shadows, spacing } from '@/constants/theme';

export function LoadingScreen() {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1250, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [progress]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -5 * progress.value }, { scale: 0.96 + progress.value * 0.04 }],
  }));

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.logoShell, style]}>
        <Image source={require('@/assets/images/ballistic-icon.png')} style={styles.logo} />
      </Animated.View>
      <AppText variant="title" colour={colours.navy}>
        Ballistic
      </AppText>
      <AppText variant="caption" colour={colours.textMuted}>
        Getting your journal ready…
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.page,
    gap: spacing.sm,
  },
  logoShell: {
    width: 88,
    height: 88,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.xs,
    ...shadows.floating,
  },
  logo: { width: '100%', height: '100%' },
});
