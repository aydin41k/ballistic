import * as Haptics from "expo-haptics";
import {
  Animated,
  Platform,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import { useRef } from "react";

import { statusLabel } from "@/lib/status";
import { styles } from "@/screens/home/styles";
import { formatShortDate, getTaskUrgency } from "@/screens/home/utils";
import type { Item } from "@/types";

import { Badge } from "./Badge";

type TaskCardProps = {
  item: Item;
  dates: boolean;
  canReorder: boolean;
  isFirst: boolean;
  isLast: boolean;
  onOpen: () => void;
  onToggleStatus: () => void;
  onMove: (direction: "up" | "down" | "top") => void;
};

export function TaskCard({
  item,
  dates,
  canReorder,
  isFirst,
  isLast,
  onOpen,
  onToggleStatus,
  onMove,
}: TaskCardProps) {
  const completed = item.status === "done" || item.status === "wontdo";
  const urgency = getTaskUrgency(item, dates);

  // Animated scale for status-circle feedback.
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function pulseStatusCircle() {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.82,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
    ]).start();
  }

  function handleStatusPress(e: GestureResponderEvent) {
    e.stopPropagation();
    pulseStatusCircle();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleStatus();
  }

  const stopAndRun =
    (action: () => void) => (e: GestureResponderEvent) => {
      e.stopPropagation();
      action();
    };

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Task: ${item.title}. Status: ${statusLabel(item.status)}. Double-tap to open.`}
      style={({ pressed }) => [
        styles.taskCard,
        urgency === "overdue"
          ? styles.taskCardOverdue
          : urgency === "soon"
            ? styles.taskCardSoon
            : null,
        pressed && styles.pressedOpacity,
      ]}
      android_ripple={{ color: "rgba(0,0,0,0.05)", borderless: false }}
    >
      {/* Status circle with spring animation */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={handleStatusPress}
          hitSlop={8}
          style={styles.statusButton}
          accessibilityLabel={`Toggle status. Current: ${statusLabel(item.status)}`}
          accessibilityRole="button"
        >
          <Text style={styles.statusButtonText}>
            {item.status === "todo"
              ? "○"
              : item.status === "doing"
                ? "◐"
                : item.status === "done"
                  ? "●"
                  : "—"}
          </Text>
        </Pressable>
      </Animated.View>

      <View style={styles.taskBody}>
        <Text style={[styles.taskTitle, completed ? styles.taskTitleMuted : null]}>
          {item.title}
        </Text>

        {item.description ? (
          <Text style={styles.taskDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.chipRow}>
          <Badge label={statusLabel(item.status)} tone="navy" />
          {item.project?.name ? (
            <Badge
              label={item.project.name}
              tone="blue"
              customColor={item.project.color}
            />
          ) : null}
          {item.tags?.map((tag) => (
            <Badge
              key={tag.id}
              label={tag.name}
              tone="navy"
              customColor={tag.color}
            />
          ))}
          {item.is_delegated && item.assignee ? (
            <Badge label={`→ ${item.assignee.name}`} tone="amber" />
          ) : null}
          {item.is_assigned && !item.is_delegated && item.owner ? (
            <Badge label={`← ${item.owner.name}`} tone="emerald" />
          ) : null}
        </View>

        {item.assignee_notes ? (
          <Text style={styles.taskNotes} numberOfLines={2}>
            Note: {item.assignee_notes}
          </Text>
        ) : null}

        {dates && item.due_date && !completed ? (
          <Text
            style={[
              styles.dateMeta,
              urgency === "overdue"
                ? styles.dateMetaDanger
                : urgency === "soon"
                  ? styles.dateMetaWarning
                  : null,
            ]}
          >
            {urgency === "overdue" ? "Overdue " : "Due "}
            {formatShortDate(item.due_date)}
          </Text>
        ) : null}

        {dates && item.scheduled_date && !completed ? (
          <Text style={styles.secondaryMeta}>
            Scheduled {formatShortDate(item.scheduled_date)}
          </Text>
        ) : null}
      </View>

      {canReorder ? (
        <View style={styles.moveStack}>
          {!isFirst ? (
            <MoveButton
              label="Top"
              onPress={stopAndRun(() => onMove("top"))}
              accessibilityLabel="Move to top"
            />
          ) : null}
          {!isFirst ? (
            <MoveButton
              label="Up"
              onPress={stopAndRun(() => onMove("up"))}
              accessibilityLabel="Move up"
            />
          ) : null}
          {!isLast ? (
            <MoveButton
              label="Down"
              onPress={stopAndRun(() => onMove("down"))}
              accessibilityLabel="Move down"
            />
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

function MoveButton({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.moveButton,
        pressed && styles.pressedOpacity,
      ]}
      android_ripple={
        Platform.OS === "android"
          ? { color: "rgba(0,0,0,0.1)", borderless: false }
          : undefined
      }
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Text style={styles.moveButtonText}>{label}</Text>
    </Pressable>
  );
}
