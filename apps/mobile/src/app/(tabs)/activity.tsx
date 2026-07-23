import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { MotionPressable } from '@/components/ui/MotionPressable';
import { Screen } from '@/components/ui/Screen';
import { colours, radii, spacing } from '@/constants/theme';
import { useSync } from '@/contexts/SyncContext';
import { formatDateTime } from '@/lib/date';
import { offlineStore } from '@/lib/offline-store';
import { statusMeta } from '@/lib/status';
import type { ActivityLogItem } from '@/types';

export default function ActivityScreen() {
  const sync = useSync();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const activity = useInfiniteQuery({
    queryKey: ['activity'],
    queryFn: () => offlineStore.getActivity(),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.meta.next_cursor ?? undefined,
    staleTime: Infinity,
    networkMode: 'always',
  });
  const items = activity.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            tintColor={colours.blue}
            onRefresh={() => {
              setPullRefreshing(true);
              void sync
                .syncNow()
                .then(() => activity.refetch())
                .finally(() => setPullRefreshing(false));
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <View style={styles.header}>
              <View style={styles.headingIcon}>
                <AppIcon name="history" size={25} colour={colours.blue} />
              </View>
              <View style={styles.headingCopy}>
                <AppText variant="headline">Activity</AppText>
                <AppText colour={colours.textMuted}>
                  The satisfying trail of finished and skipped work.
                </AppText>
              </View>
            </View>
            {activity.error ? (
              <ErrorNotice
                message={
                  activity.error instanceof Error
                    ? activity.error.message
                    : 'Could not load activity.'
                }
              />
            ) : null}
            {!activity.isLoading && items.length === 0 ? (
              <EmptyState
                icon="history"
                title="No activity yet"
                message="Completed and skipped tasks will collect here."
              />
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => <ActivityCard item={item} index={index} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          activity.hasNextPage ? (
            <MotionPressable
              disabled={activity.isFetchingNextPage}
              onPress={() => void activity.fetchNextPage()}
              style={styles.loadMore}
            >
              {activity.isFetchingNextPage ? (
                <ActivityIndicator color={colours.blue} />
              ) : (
                <AppText variant="bodyStrong" colour={colours.blue}>
                  Load more
                </AppText>
              )}
            </MotionPressable>
          ) : (
            <View style={styles.footerSpace} />
          )
        }
      />
    </Screen>
  );
}

function ActivityCard({ item, index }: { item: ActivityLogItem; index: number }) {
  const meta = statusMeta[item.status];
  const assignment =
    item.is_assigned_to_me && item.owner
      ? `Assigned by ${item.owner.name}`
      : item.is_delegated && item.assignee
        ? `Assigned to ${item.assignee.name}`
        : null;
  const action = item.status === 'done' ? 'Marked done' : "Marked won't do";
  const timestamp = item.activity_at || item.completed_at || item.updated_at;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 18)
        .duration(180)
        .withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] })}
      style={styles.card}
    >
      <View style={[styles.statusIcon, { backgroundColor: meta.background }]}>
        <AppText variant="bodyStrong" colour={meta.colour}>
          {meta.symbol}
        </AppText>
      </View>
      <View style={styles.cardCopy}>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {item.title}
        </AppText>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: meta.background }]}>
            <AppText variant="caption" colour={meta.colour}>
              {meta.label}
            </AppText>
          </View>
          {item.project ? (
            <View style={styles.project}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: item.project.color ?? colours.borderStrong },
                ]}
              />
              <AppText variant="caption" colour={colours.textMuted}>
                {item.project.name}
              </AppText>
            </View>
          ) : null}
        </View>
        {assignment ? (
          <AppText variant="caption" colour={colours.textMuted}>
            {assignment}
          </AppText>
        ) : null}
        <AppText variant="caption" colour={colours.textMuted}>
          {item.completed_by?.name ? `${action} by ${item.completed_by.name}` : action}
        </AppText>
        <AppText variant="caption" colour={colours.textFaint}>
          {formatDateTime(timestamp)}
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 140 },
  headerArea: { gap: spacing.md, paddingBottom: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xs },
  headingIcon: {
    width: 50,
    height: 50,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.blueSoft,
  },
  headingCopy: { flex: 1, gap: 2 },
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
  },
  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: { flex: 1, gap: 5 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  badge: { borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2 },
  project: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  separator: { height: spacing.xs },
  loadMore: { minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  footerSpace: { height: spacing.xl },
});
