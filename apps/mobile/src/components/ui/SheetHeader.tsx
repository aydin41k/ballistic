import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { colours, spacing } from '@/constants/theme';

interface SheetHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  action?: React.ReactNode;
}

export function SheetHeader({ title, subtitle, onClose, action }: SheetHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" colour={colours.textMuted}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action}
      <IconButton icon="close" label="Close" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  copy: { flex: 1, gap: 2 },
});
