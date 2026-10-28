import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/BrandMark';
import { AppText } from '@/components/ui/AppText';
import { colours, radii, shadows, spacing } from '@/constants/theme';

export function AuthScaffold({
  children,
  title,
  subtitle,
}: PropsWithChildren<{ title: string; subtitle: string }>) {
  return (
    <LinearGradient colors={[colours.navy, '#163F67', colours.blue]} style={styles.background}>
      <View style={[styles.orb, styles.orbOne]} />
      <View style={[styles.orb, styles.orbTwo]} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
            <Animated.View entering={FadeIn.duration(500)} style={styles.brand}>
              <BrandMark inverted />
            </Animated.View>
            <Animated.View
              entering={FadeInDown.delay(100).springify().damping(18)}
              style={styles.card}
            >
              <View style={styles.heading}>
                <AppText variant="headline">{title}</AppText>
                <AppText colour={colours.textMuted}>{subtitle}</AppText>
              </View>
              {children}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.xl },
  brand: { alignSelf: 'center' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadows.floating,
  },
  heading: { gap: spacing.xs },
  orb: {
    position: 'absolute',
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  orbOne: { width: 240, height: 240, top: -90, right: -70 },
  orbTwo: { width: 180, height: 180, bottom: -50, left: -60 },
});
