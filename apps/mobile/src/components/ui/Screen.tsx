import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colours } from '@/constants/theme';

interface ScreenProps extends ViewProps {
  safeBottom?: boolean;
}

export function Screen({
  children,
  style,
  safeBottom = false,
  ...props
}: PropsWithChildren<ScreenProps>) {
  return (
    <SafeAreaView edges={safeBottom ? ['top', 'bottom'] : ['top']} style={styles.safeArea}>
      <View {...props} style={[styles.content, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colours.page },
  content: { flex: 1, backgroundColor: colours.page },
});
