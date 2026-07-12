import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colours, radii, spacing } from '@/constants/theme';

export function ErrorNotice({ message }: { message: string }) {
  return (
    <View accessibilityRole="alert" style={styles.notice}>
      <AppIcon name="alert-circle-outline" size={19} colour={colours.danger} />
      <AppText style={styles.text} variant="caption" colour={colours.danger}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: colours.dangerSoft,
    padding: spacing.sm,
  },
  text: { flex: 1 },
});
