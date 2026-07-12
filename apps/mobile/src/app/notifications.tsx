import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { MotionPressable } from '@/components/ui/MotionPressable';
import { Screen } from '@/components/ui/Screen';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { colours, radii, spacing } from '@/constants/theme';
import { useNotifications } from '@/hooks/useNotifications';
import { formatTimeAgo } from '@/lib/date';
import type { Notification } from '@/types';

export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = useNotifications(true);
  const unread = notifications.data?.unread_count ?? 0;

  return (
    <Screen safeBottom>
      <SheetHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : 'You are all caught up.'}
        onClose={() => router.back()}
        action={
          unread > 0 ? (
            <AppButton
              label="Read all"
              variant="ghost"
              compact
              onPress={() => notifications.markAllRead.mutate()}
            />
          ) : undefined
        }
      />
      <FlatList
        data={notifications.data?.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={notifications.isRefetching}
            tintColor={colours.blue}
            onRefresh={() => void notifications.refetch()}
          />
        }
        ListHeaderComponent={
          notifications.error ? (
            <ErrorNotice
              message={
                notifications.error instanceof Error
                  ? notifications.error.message
                  : 'Could not load notifications.'
              }
            />
          ) : null
        }
        ListEmptyComponent={
          !notifications.isLoading ? (
            <EmptyState
              icon="bell-check-outline"
              title="All quiet"
              message="Task and connection updates will appear here."
            />
          ) : null
        }
        renderItem={({ item, index }) => (
          <NotificationCard
            notification={item}
            index={index}
            onRead={() => !item.read_at && notifications.markRead.mutate(item.id)}
            onDismiss={() => notifications.dismiss.mutate(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Screen>
  );
}

function NotificationCard({
  notification,
  index,
  onRead,
  onDismiss,
}: {
  notification: Notification;
  index: number;
  onRead: () => void;
  onDismiss: () => void;
}) {
  const rightAction = (_progress: unknown, _translation: unknown, methods: SwipeableMethods) => (
    <MotionPressable
      onPress={() => {
        methods.close();
        onDismiss();
      }}
      style={styles.dismissAction}
    >
      <AppIcon name="trash-can-outline" size={22} colour="#FFFFFF" />
      <AppText variant="caption" colour="#FFFFFF">
        Dismiss
      </AppText>
    </MotionPressable>
  );

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 30)}>
      <ReanimatedSwipeable
        renderRightActions={rightAction}
        overshootFriction={8}
        containerStyle={styles.swipe}
      >
        <MotionPressable
          onPress={onRead}
          style={[styles.card, !notification.read_at && styles.unread]}
        >
          <View style={[styles.icon, !notification.read_at && styles.iconUnread]}>
            <AppIcon
              name="bell-outline"
              size={21}
              colour={!notification.read_at ? colours.blue : colours.textMuted}
            />
          </View>
          <View style={styles.copy}>
            <View style={styles.titleRow}>
              <AppText variant="bodyStrong" style={styles.title}>
                {notification.title}
              </AppText>
              {!notification.read_at ? <View style={styles.unreadDot} /> : null}
            </View>
            <AppText variant="caption" colour={colours.textMuted}>
              {notification.message}
            </AppText>
            <AppText variant="caption" colour={colours.textFaint}>
              {notification.created_at_human ?? formatTimeAgo(notification.created_at)}
            </AppText>
          </View>
        </MotionPressable>
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  swipe: { borderRadius: radii.lg, overflow: 'hidden' },
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colours.border,
    backgroundColor: colours.surface,
    padding: spacing.md,
  },
  unread: { borderColor: '#BFDBFE', backgroundColor: '#F8FBFF' },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.page,
  },
  iconUnread: { backgroundColor: colours.blueSoft },
  copy: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colours.blueBright },
  dismissAction: {
    width: 90,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colours.danger,
  },
  separator: { height: spacing.xs },
});
