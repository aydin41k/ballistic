import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, View } from 'react-native';
import DraggableFlatList, { type DragEndParams } from 'react-native-draggable-flatlist';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BrandMark } from '@/components/BrandMark';
import { TaskCard } from '@/components/tasks/TaskCard';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { IconButton } from '@/components/ui/IconButton';
import { MotionPressable } from '@/components/ui/MotionPressable';
import { Screen } from '@/components/ui/Screen';
import { colours, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { noProjectFilterId, useJournalPreferences } from '@/contexts/JournalPreferencesContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useJournal, useJournalActions } from '@/hooks/useJournal';
import { useNotifications } from '@/hooks/useNotifications';
import { sortByUrgency } from '@/lib/date';
import type { Item, ItemScope, Status } from '@/types';

type JournalSection = 'mine' | 'assigned' | 'delegated';
type DeparturePhase = 'holding' | 'fading';

interface DepartingItem {
  item: Item;
  scope: ItemScope;
  section: JournalSection;
  index: number;
  phase: DeparturePhase;
}

interface DepartureTimers {
  fade: ReturnType<typeof setTimeout>;
  remove: ReturnType<typeof setTimeout>;
}

const departureHoldMs = 4000;
const departureFadeMs = 1200;

function getDepartureKey(scope: ItemScope, section: JournalSection, itemId: string): string {
  return `${scope}:${section}:${itemId}`;
}

function insertDepartures(items: Item[], departures: DepartingItem[]): Item[] {
  const next = [...items];
  [...departures]
    .sort((left, right) => left.index - right.index)
    .forEach((departure) => {
      next.splice(Math.min(departure.index, next.length), 0, departure.item);
    });
  return next;
}

export default function JournalScreen() {
  const router = useRouter();
  const client = useQueryClient();
  const { user } = useAuth();
  const { dates, delegation } = useFeatureFlags();
  const { scope, setScope, excludedProjectIds, activeFilterCount } = useJournalPreferences();
  const journal = useJournal(scope, delegation);
  const actions = useJournalActions(user);
  const notifications = useNotifications(delegation);
  const [departures, setDepartures] = useState<Record<string, DepartingItem>>({});
  const departureTimers = useRef(new Map<string, DepartureTimers>());

  const clearDepartureTimers = useCallback((key: string) => {
    const timers = departureTimers.current.get(key);
    if (!timers) return;
    clearTimeout(timers.fade);
    clearTimeout(timers.remove);
    departureTimers.current.delete(key);
  }, []);

  const removeDeparture = useCallback(
    (key: string) => {
      clearDepartureTimers(key);
      setDepartures((current) => {
        if (!current[key]) return current;
        const next = { ...current };
        delete next[key];
        return next;
      });
    },
    [clearDepartureTimers],
  );

  const holdDeparture = useCallback(
    (item: Item, status: Status, section: JournalSection, index: number) => {
      const key = getDepartureKey(scope, section, item.id);
      clearDepartureTimers(key);

      const now = new Date().toISOString();
      setDepartures((current) => ({
        ...current,
        [key]: {
          item: { ...item, status, completed_at: now, updated_at: now },
          scope,
          section,
          index,
          phase: 'holding',
        },
      }));

      const fade = setTimeout(() => {
        setDepartures((current) => {
          const departure = current[key];
          if (!departure) return current;
          return { ...current, [key]: { ...departure, phase: 'fading' } };
        });
      }, departureHoldMs);

      const remove = setTimeout(
        () => {
          setDepartures((current) => {
            if (!current[key]) return current;
            const next = { ...current };
            delete next[key];
            return next;
          });
          departureTimers.current.delete(key);
        },
        departureHoldMs + departureFadeMs + 100,
      );

      departureTimers.current.set(key, { fade, remove });
    },
    [clearDepartureTimers, scope],
  );

  useEffect(
    () => () => {
      departureTimers.current.forEach(({ fade, remove }) => {
        clearTimeout(fade);
        clearTimeout(remove);
      });
      departureTimers.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (!dates && scope !== 'active') setScope('active');
  }, [dates, scope, setScope]);

  const filter = useCallback(
    (items: Item[]) =>
      items.filter((item) => {
        if (item.project_id) return !excludedProjectIds.has(item.project_id);
        return !excludedProjectIds.has(noProjectFilterId);
      }),
    [excludedProjectIds],
  );

  const departuresBySection = useMemo(() => {
    const grouped: Record<JournalSection, DepartingItem[]> = {
      mine: [],
      assigned: [],
      delegated: [],
    };
    Object.values(departures).forEach((departure) => {
      if (departure.scope === scope) grouped[departure.section].push(departure);
    });
    return grouped;
  }, [departures, scope]);

  const mine = useMemo(() => {
    const sectionDepartures = departuresBySection.mine;
    const departingIds = new Set(sectionDepartures.map(({ item }) => item.id));
    const tasks = filter((journal.data?.mine ?? []).filter((item) => !departingIds.has(item.id)));
    const ordered = dates
      ? sortByUrgency(tasks)
      : [...tasks].sort((left, right) => left.position - right.position);
    return insertDepartures(ordered, sectionDepartures);
  }, [dates, departuresBySection.mine, filter, journal.data?.mine]);

  const assigned = useMemo(() => {
    const sectionDepartures = departuresBySection.assigned;
    const departingIds = new Set(sectionDepartures.map(({ item }) => item.id));
    const items = filter(
      (journal.data?.assigned ?? []).filter((item) => !departingIds.has(item.id)),
    );
    return insertDepartures(items, sectionDepartures);
  }, [departuresBySection.assigned, filter, journal.data?.assigned]);

  const delegated = useMemo(() => {
    const sectionDepartures = departuresBySection.delegated;
    const departingIds = new Set(sectionDepartures.map(({ item }) => item.id));
    const items = filter(
      (journal.data?.delegated ?? []).filter((item) => !departingIds.has(item.id)),
    );
    return insertDepartures(items, sectionDepartures);
  }, [departuresBySection.delegated, filter, journal.data?.delegated]);
  const empty = mine.length === 0 && assigned.length === 0 && delegated.length === 0;

  function updateStatus(item: Item, status: Status, section: JournalSection, index: number) {
    const key = getDepartureKey(scope, section, item.id);
    if (status === 'done' || status === 'wontdo') {
      holdDeparture(item, status, section, index);
    } else {
      removeDeparture(key);
    }

    actions.queueStatusUpdate(item.id, status, { onError: () => removeDeparture(key) });
  }

  function confirmDelete(item: Item) {
    Alert.alert('Delete task?', `“${item.title}” will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => actions.removeTask.mutate(item.id) },
    ]);
  }

  function confirmDecline(item: Item) {
    Alert.alert('Decline task?', `This will return “${item.title}” to its owner.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => actions.declineTask.mutate(item.id) },
    ]);
  }

  function moveToTop(item: Item) {
    const full = journal.data?.mine ?? [];
    const next = [item, ...full.filter((candidate) => candidate.id !== item.id)];
    actions.reorderTasks.mutate(next);
  }

  function handleDragEnd({ data }: DragEndParams<Item>) {
    const departingIds = new Set(departuresBySection.mine.map(({ item }) => item.id));
    const full = (journal.data?.mine ?? []).filter((item) => !departingIds.has(item.id));
    const orderedVisible = data.filter((item) => !departingIds.has(item.id));
    const visibleIds = new Set(orderedVisible.map((item) => item.id));
    const merged = full.map((item) => (visibleIds.has(item.id) ? orderedVisible.shift()! : item));
    actions.reorderTasks.mutate(merged.map((item, position) => ({ ...item, position })));
  }

  const staticCard = (item: Item, index: number, section: 'assigned' | 'delegated') => {
    const departure = departures[getDepartureKey(scope, section, item.id)];
    return (
      <TaskCard
        key={item.id}
        item={item}
        index={index}
        dates={dates}
        delegation={delegation}
        onEdit={() => router.push({ pathname: '/task', params: { id: item.id } })}
        onStatus={(status) => updateStatus(item, status, section, index)}
        onDecline={section === 'assigned' ? () => confirmDecline(item) : undefined}
        onDelete={item.user_id === user?.id ? () => confirmDelete(item) : undefined}
        isDeparting={Boolean(departure)}
        isFading={departure?.phase === 'fading'}
      />
    );
  };

  const refreshing = journal.isRefetching && !journal.isLoading;

  return (
    <Screen>
      <DraggableFlatList
        data={mine}
        keyExtractor={(item) => item.id}
        onDragEnd={handleDragEnd}
        activationDistance={8}
        autoscrollThreshold={90}
        autoscrollSpeed={180}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colours.blue}
            onRefresh={() => {
              void Haptics.selectionAsync();
              void client.invalidateQueries({ queryKey: ['journal'] });
              if (delegation) void client.invalidateQueries({ queryKey: ['notifications'] });
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <View style={styles.header}>
              <BrandMark compact />
              <View style={styles.headerActions}>
                <IconButton
                  icon="filter-variant"
                  label="Filters"
                  badge={activeFilterCount}
                  active={activeFilterCount > 0}
                  onPress={() => router.push('/filters')}
                />
                {delegation ? (
                  <IconButton
                    icon="bell-outline"
                    label="Notifications"
                    badge={notifications.data?.unread_count ?? 0}
                    onPress={() => router.push('/notifications')}
                  />
                ) : null}
              </View>
            </View>
            {dates && scope === 'planned' ? (
              <Animated.View entering={FadeIn} style={styles.banner}>
                <AppIcon name="calendar-clock" size={18} colour={colours.sky} />
                <AppText variant="caption" colour={colours.sky} style={styles.bannerCopy}>
                  Showing future scheduled tasks.
                </AppText>
                <MotionPressable onPress={() => setScope('active')}>
                  <AppText variant="caption" colour={colours.blue}>
                    Active
                  </AppText>
                </MotionPressable>
              </Animated.View>
            ) : null}
            {journal.error ? (
              <ErrorNotice
                message={
                  journal.error instanceof Error
                    ? journal.error.message
                    : 'Could not load your journal.'
                }
              />
            ) : null}
            {delegation && assigned.length > 0 ? (
              <View style={styles.section}>
                <SectionLabel
                  title="Assigned to me"
                  colour={colours.success}
                  count={assigned.length}
                />
                {assigned.map((item, index) => staticCard(item, index, 'assigned'))}
              </View>
            ) : null}
            {mine.length > 0 && delegation ? (
              <SectionLabel title="My tasks" colour={colours.navy} count={mine.length} />
            ) : null}
            {empty && !journal.isLoading ? (
              <EmptyState
                title={activeFilterCount ? 'Nothing in this view' : 'A beautifully clear slate'}
                message={
                  activeFilterCount
                    ? 'Adjust your filters to bring more tasks back.'
                    : 'Tap the blue + to capture your first task.'
                }
              />
            ) : null}
          </View>
        }
        renderItem={({ item, drag, isActive, getIndex }) => {
          const index = getIndex() ?? 0;
          const departure = departures[getDepartureKey(scope, 'mine', item.id)];
          return (
            <TaskCard
              item={item}
              index={index}
              dates={dates}
              delegation={delegation}
              onEdit={() => router.push({ pathname: '/task', params: { id: item.id } })}
              onStatus={(status) => updateStatus(item, status, 'mine', index)}
              onDelete={item.user_id === user?.id ? () => confirmDelete(item) : undefined}
              onMoveTop={departure ? undefined : () => moveToTop(item)}
              drag={departure ? undefined : drag}
              isActive={isActive}
              isDeparting={Boolean(departure)}
              isFading={departure?.phase === 'fading'}
            />
          );
        }}
        ListFooterComponent={
          <View style={styles.footerArea}>
            {delegation && delegated.length > 0 ? (
              <View style={styles.section}>
                <SectionLabel
                  title="Delegated to others"
                  colour={colours.warning}
                  count={delegated.length}
                />
                {delegated.map((item, index) => staticCard(item, index, 'delegated'))}
              </View>
            ) : null}
            <AppText variant="caption" colour={colours.textFaint} style={styles.copyright}>
              Psycode Pty. Ltd. © {new Date().getFullYear()}
            </AppText>
          </View>
        }
      />
    </Screen>
  );
}

function SectionLabel({ title, colour, count }: { title: string; colour: string; count: number }) {
  return (
    <View style={styles.sectionLabel}>
      <AppText variant="eyebrow" colour={colour}>
        {title}
      </AppText>
      <View style={[styles.count, { backgroundColor: `${colour}16` }]}>
        <AppText variant="caption" colour={colour}>
          {count}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  headerArea: { gap: spacing.md, paddingBottom: spacing.xs },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerActions: { flexDirection: 'row', gap: spacing.xs },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: colours.skySoft,
    padding: spacing.sm,
  },
  bannerCopy: { flex: 1 },
  section: { gap: spacing.xs },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    paddingHorizontal: 2,
  },
  count: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  footerArea: { gap: spacing.lg, paddingTop: spacing.md },
  copyright: { textAlign: 'center', paddingVertical: spacing.xl },
});
