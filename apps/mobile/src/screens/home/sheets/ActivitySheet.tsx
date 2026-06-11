import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { fetchActivityLog } from "@/lib/api";
import { toDisplayMessage } from "@/lib/http";
import { statusLabel } from "@/lib/status";
import { Badge } from "@/screens/home/components/Badge";
import { Sheet } from "@/screens/home/components/Sheet";
import { styles } from "@/screens/home/styles";
import {
  formatDateTime,
  getActivityTimestamp,
} from "@/screens/home/utils";
import { colours } from "@/theme";
import type { ActivityLogItem } from "@/types";

type ActivitySheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function ActivitySheet({
  onClose,
  visible,
}: ActivitySheetProps) {
  const [items, setItems] = useState<ActivityLogItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadInitial = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchActivityLog();
      setItems(response.data);
      setNextCursor(response.meta.next_cursor);
      setError(null);
    } catch (candidate) {
      setError(toDisplayMessage(candidate, "Failed to load the activity log."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      void loadInitial();
    }
  }, [loadInitial, visible]);

  async function loadMore() {
    if (!nextCursor) {
      return;
    }

    setLoadingMore(true);

    try {
      const response = await fetchActivityLog(nextCursor);
      setItems((current) => [...current, ...response.data]);
      setNextCursor(response.meta.next_cursor);
      setError(null);
    } catch (candidate) {
      setError(toDisplayMessage(candidate, "Failed to load more activity."));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <Sheet visible={visible} title="Activity Log" onClose={onClose}>
      <ScrollView contentContainerStyle={styles.sheetContent}>
        {error ? (
          <View style={styles.sheetErrorBanner}>
            <Text style={styles.sheetErrorText}>{error}</Text>
          </View>
        ) : null}
        {loading ? <ActivityIndicator color={colours.blueStrong} /> : null}

        {items.length === 0 && !loading && !error ? (
          <View style={styles.emptyStateCompact}>
            <Text style={styles.emptyCopy}>No activity yet.</Text>
          </View>
        ) : null}

        {items.map((item) => (
          <View key={`${item.id}-${getActivityTimestamp(item)}`} style={styles.activityCard}>
            <Text style={styles.personName}>{item.title}</Text>
            <View style={styles.chipRow}>
              <Badge label={statusLabel(item.status)} tone="navy" />
              {item.project?.name ? (
                <Badge label={item.project.name} tone="blue" customColor={item.project.color} />
              ) : null}
            </View>
            {item.is_assigned_to_me && item.owner ? (
              <Text style={styles.secondaryMeta}>Assigned by {item.owner.name}</Text>
            ) : null}
            {item.is_delegated && item.assignee ? (
              <Text style={styles.secondaryMeta}>Assigned to {item.assignee.name}</Text>
            ) : null}
            <Text style={styles.secondaryMeta}>
              {item.completed_by?.name
                ? `Updated by ${item.completed_by.name}`
                : "Task updated"}
            </Text>
            <Text style={styles.secondaryMeta}>
              {formatDateTime(getActivityTimestamp(item))}
            </Text>
          </View>
        ))}

        {nextCursor ? (
          <Pressable
            onPress={() => void loadMore()}
            style={styles.secondaryActionButton}
            accessibilityLabel="Load more activity"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryActionButtonText}>
              {loadingMore ? "Loading..." : "Load more"}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}
