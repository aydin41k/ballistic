import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colours, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';

export function SyncStatusBanner() {
  const { isAuthenticated } = useAuth();
  const { lastSyncError } = useSync();

  if (!isAuthenticated || !lastSyncError) return null;

  return (
    <View accessibilityRole="alert" style={styles.banner}>
      <AppIcon name="cloud-alert-outline" size={19} colour={colours.danger} />
      <AppText variant="caption" colour={colours.danger} style={styles.copy}>
        Change undone. {lastSyncError}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: colours.dangerSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  copy: { flex: 1 },
});
