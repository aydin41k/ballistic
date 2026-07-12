import { forwardRef } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const MotionPressable = forwardRef<React.ElementRef<typeof Pressable>, PressableProps>(
  function MotionPressable({ onPressIn, onPressOut, style, disabled, ...props }, ref) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
      <AnimatedPressable
        {...props}
        ref={ref}
        disabled={disabled}
        onPressIn={(event) => {
          scale.value = withSpring(0.965, { damping: 18, stiffness: 320 });
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.value = withSpring(1, { damping: 18, stiffness: 280 });
          onPressOut?.(event);
        }}
        style={[
          typeof style === 'function' ? style({ pressed: false, hovered: false }) : style,
          animatedStyle,
        ]}
      />
    );
  },
);
