import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ScaleDecorator } from 'react-native-draggable-flatlist';

import { StatusOrb } from '@/components/tasks/StatusOrb';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { MotionPressable } from '@/components/ui/MotionPressable';
import { colours, radii, shadows, spacing } from '@/constants/theme';
import { formatDateKey, getUrgency } from '@/lib/date';
import type { Item, Status } from '@/types';

interface TaskCardProps {
  item: Item;
  index: number;
  dates: boolean;
  delegation: boolean;
  onEdit: () => void;
  onStatus: (status: Status) => void;
  onDelete?: () => void;
  onDecline?: () => void;
  onMoveTop?: () => void;
  drag?: () => void;
  isActive?: boolean;
  isDeparting?: boolean;
  isFading?: boolean;
}

export function TaskCard({
  item,
  index,
  dates,
  delegation,
  onEdit,
  onStatus,
  onDelete,
  onDecline,
  onMoveTop,
  drag,
  isActive = false,
  isDeparting = false,
  isFading = false,
}: TaskCardProps) {
  const completed = item.status === 'done' || item.status === 'wontdo';
  const urgency = getUrgency(item);
  const projectName = item.project?.name;
  const showAssigneeBadge = Boolean(delegation && item.is_delegated && item.assignee);
  const showOwnerBadge = Boolean(
    delegation && item.is_assigned && !item.is_delegated && item.owner,
  );
  const hasBadges = Boolean(
    projectName || item.tags?.length || showAssigneeBadge || showOwnerBadge,
  );
  const longPressTriggered = useRef(false);
  const departureOpacity = useSharedValue(1);

  useEffect(() => {
    departureOpacity.value = withTiming(isFading ? 0 : 1, {
      duration: isFading ? 1200 : 150,
    });
  }, [departureOpacity, isFading]);

  const departureStyle = useAnimatedStyle(() => ({ opacity: departureOpacity.value }));

  const rightActions = (_progress: unknown, _translation: unknown, methods: SwipeableMethods) => (
    <View style={styles.actionsRow}>
      {onMoveTop && item.position > 0 ? (
        <SwipeAction
          icon="arrow-collapse-up"
          label="To top"
          colour={colours.blue}
          onPress={() => {
            methods.close();
            onMoveTop();
          }}
        />
      ) : null}
      {onDecline ? (
        <SwipeAction
          icon="account-arrow-left-outline"
          label="Decline"
          colour={colours.warning}
          onPress={() => {
            methods.close();
            onDecline();
          }}
        />
      ) : null}
      {onDelete ? (
        <SwipeAction
          icon="trash-can-outline"
          label="Delete"
          colour={colours.danger}
          onPress={() => {
            methods.close();
            onDelete();
          }}
        />
      ) : null}
    </View>
  );

  const leftActions = (_progress: unknown, _translation: unknown, methods: SwipeableMethods) => (
    <View style={styles.leftAction}>
      <SwipeAction
        icon="check-circle-outline"
        label="Next"
        colour={colours.success}
        onPress={() => {
          methods.close();
          onStatus(
            item.status === 'wontdo'
              ? 'todo'
              : item.status === 'done'
                ? 'wontdo'
                : item.status === 'doing'
                  ? 'done'
                  : 'doing',
          );
        }}
      />
    </View>
  );

  const card = (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 35)
        .springify()
        .damping(19)}
      layout={LinearTransition.springify().damping(20)}
    >
      <Animated.View style={departureStyle}>
        <ReanimatedSwipeable
          enabled={!isActive && !isDeparting}
          friction={1.8}
          overshootFriction={9}
          renderLeftActions={leftActions}
          renderRightActions={rightActions}
          containerStyle={styles.swipeContainer}
        >
          <MotionPressable
            onPressIn={() => {
              longPressTriggered.current = false;
            }}
            onPress={() => {
              if (longPressTriggered.current) return;
              onEdit();
            }}
            onLongPress={
              drag
                ? () => {
                    longPressTriggered.current = true;
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    drag();
                  }
                : undefined
            }
            delayLongPress={260}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.status}`}
            accessibilityHint={
              isDeparting
                ? 'Status updated. This task will leave the journal shortly.'
                : drag
                  ? 'Tap to edit. Touch and hold to reorder.'
                  : 'Tap to edit.'
            }
            style={[
              styles.card,
              urgency === 'overdue' && styles.overdue,
              urgency === 'soon' && styles.soon,
              isActive && styles.active,
            ]}
          >
            <StatusOrb status={item.status} onChange={onStatus} />
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <AppText
                  variant="bodyStrong"
                  colour={completed ? colours.textFaint : colours.navy}
                  style={[styles.title, completed && styles.completed]}
                >
                  {item.title}
                </AppText>
                {dates && (item.is_recurring_template || item.is_recurring_instance) ? (
                  <AppIcon name="repeat" size={15} colour={colours.textFaint} />
                ) : null}
              </View>
              {hasBadges ? (
                <View style={styles.badges}>
                  {projectName ? (
                    <Badge
                      label={projectName}
                      background={colours.blueSoft}
                      foreground={colours.blue}
                      dot={item.project?.color}
                    />
                  ) : null}
                  {item.tags?.map((tag) => (
                    <Badge
                      key={tag.id}
                      label={tag.name}
                      background={colours.violetSoft}
                      foreground={tag.color || colours.violet}
                    />
                  ))}
                  {showAssigneeBadge && item.assignee ? (
                    <Badge
                      label={`→ ${item.assignee.name}`}
                      background={colours.warningSoft}
                      foreground={colours.warning}
                    />
                  ) : null}
                  {showOwnerBadge && item.owner ? (
                    <Badge
                      label={`← ${item.owner.name}`}
                      background={colours.successSoft}
                      foreground={colours.success}
                    />
                  ) : null}
                </View>
              ) : null}
              {item.description ? (
                <AppText
                  variant="caption"
                  colour={completed ? colours.textFaint : colours.textMuted}
                  numberOfLines={2}
                >
                  {item.description}
                </AppText>
              ) : null}
              {delegation && item.assignee_notes ? (
                <AppText variant="caption" colour={colours.textFaint} numberOfLines={2}>
                  Note: {item.assignee_notes}
                </AppText>
              ) : null}
              {dates && item.due_date && !completed ? (
                <View style={styles.dateRow}>
                  {urgency === 'overdue' ? <View style={styles.pulseDot} /> : null}
                  <AppText
                    variant="caption"
                    colour={
                      urgency === 'overdue'
                        ? colours.danger
                        : urgency === 'soon'
                          ? colours.warning
                          : colours.textFaint
                    }
                  >
                    {urgency === 'overdue' ? 'Overdue' : 'Due'} {formatDateKey(item.due_date)}
                  </AppText>
                </View>
              ) : null}
              {dates && item.scheduled_date && !completed ? (
                <AppText variant="caption" colour={colours.textFaint}>
                  Scheduled {formatDateKey(item.scheduled_date)}
                </AppText>
              ) : null}
            </View>
          </MotionPressable>
        </ReanimatedSwipeable>
      </Animated.View>
    </Animated.View>
  );

  return drag ? <ScaleDecorator activeScale={1.025}>{card}</ScaleDecorator> : card;
}

function Badge({
  label,
  background,
  foreground,
  dot,
}: {
  label: string;
  background: string;
  foreground: string;
  dot?: string | null;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      {dot ? <View style={[styles.badgeDot, { backgroundColor: dot }]} /> : null}
      <AppText style={styles.badgeText} colour={foreground}>
        {label}
      </AppText>
    </View>
  );
}

function SwipeAction({
  icon,
  label,
  colour,
  onPress,
}: {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  label: string;
  colour: string;
  onPress: () => void;
}) {
  return (
    <MotionPressable onPress={onPress} style={[styles.swipeAction, { backgroundColor: colour }]}>
      <AppIcon name={icon} size={21} colour="#FFFFFF" />
      <AppText variant="caption" colour="#FFFFFF">
        {label}
      </AppText>
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  swipeContainer: { borderRadius: radii.lg, overflow: 'hidden', marginBottom: spacing.xs },
  card: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
    padding: spacing.sm,
    ...shadows.card,
  },
  overdue: { borderLeftWidth: 4, borderLeftColor: colours.danger, backgroundColor: '#FFFAFA' },
  soon: { borderLeftWidth: 4, borderLeftColor: '#FBBF24', backgroundColor: '#FFFEF8' },
  active: { borderColor: colours.blueBright, backgroundColor: colours.blueSoft },
  content: { flex: 1, alignSelf: 'center', gap: 5, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  title: { flexShrink: 1 },
  completed: { textDecorationLine: 'line-through' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colours.danger },
  actionsRow: { flexDirection: 'row', alignSelf: 'stretch' },
  leftAction: { alignSelf: 'stretch' },
  swipeAction: {
    width: 78,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
});
