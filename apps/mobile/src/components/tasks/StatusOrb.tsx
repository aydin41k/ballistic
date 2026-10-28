import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { MotionPressable } from '@/components/ui/MotionPressable';
import { cycleStatus, statusMeta } from '@/lib/status';
import type { Status } from '@/types';

export function StatusOrb({
  status,
  onChange,
  size = 38,
}: {
  status: Status;
  onChange: (status: Status) => void;
  size?: number;
}) {
  const pulse = useSharedValue(1);
  const meta = statusMeta[status];
  const terminal = status === 'done' || status === 'wontdo';

  useEffect(() => {
    pulse.value = withSequence(withSpring(1.22, { damping: 10 }), withSpring(1, { damping: 12 }));
  }, [pulse, status]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={`Status: ${meta.label}. Tap for next status.`}
        onPress={(event) => {
          event.stopPropagation();
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange(cycleStatus(status));
        }}
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: status === 'todo' || status === 'doing' ? '#FFFFFF' : meta.colour,
            borderColor: meta.colour,
          },
        ]}
      >
        {status === 'doing' ? (
          <View
            pointerEvents="none"
            style={[styles.halfFill, { width: size / 2, backgroundColor: meta.colour }]}
          />
        ) : null}
        {terminal ? (
          <AppText style={[styles.symbol, { fontSize: size * 0.54 }]} colour="#FFFFFF">
            {meta.symbol}
          </AppText>
        ) : null}
      </MotionPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center' },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  halfFill: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  symbol: { lineHeight: 24, fontWeight: '800' },
});
