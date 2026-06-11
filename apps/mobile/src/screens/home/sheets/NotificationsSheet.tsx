import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { Sheet } from "@/screens/home/components/Sheet";
import { styles } from "@/screens/home/styles";
import { formatTimeAgo } from "@/screens/home/utils";
import { colours } from "@/theme";
import type { Notification } from "@/types";

type NotificationsSheetProps = {
  visible: boolean;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
};

export function NotificationsSheet({
  loading,
  notifications,
  onClose,
  onDismiss,
  onMarkAllAsRead,
  onMarkAsRead,
  onRefresh,
  unreadCount,
  visible,
}: NotificationsSheetProps) {
  return (
    <Sheet visible={visible} title="Notifications" onClose={onClose}>
      <ScrollView contentContainerStyle={styles.sheetContent}>
        <View style={styles.inlineHeader}>
          <Text style={styles.groupHeading}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </Text>
          <Pressable
            onPress={onRefresh}
            accessibilityLabel="Refresh notifications"
            accessibilityRole="button"
          >
            <Text style={styles.linkText}>Refresh</Text>
          </Pressable>
        </View>

        {unreadCount > 0 ? (
          <Pressable
            onPress={onMarkAllAsRead}
            style={styles.secondaryActionButton}
            accessibilityLabel="Mark all notifications as read"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryActionButtonText}>Mark all as read</Text>
          </Pressable>
        ) : null}

        {loading ? <ActivityIndicator color={colours.blueStrong} /> : null}

        {notifications.length === 0 && !loading ? (
          <View style={styles.emptyStateCompact}>
            <Text style={styles.emptyCopy}>No notifications yet.</Text>
          </View>
        ) : null}

        {notifications.map((notification) => (
          <View
            key={notification.id}
            style={[
              styles.notificationCard,
              !notification.read_at ? styles.notificationCardUnread : null,
            ]}
            accessibilityLabel={`${notification.title}. ${notification.message}. ${notification.read_at ? "Read" : "Unread"}.`}
          >
            <View style={styles.flexOne}>
              <Text style={styles.personName}>{notification.title}</Text>
              <Text style={styles.personMeta}>{notification.message}</Text>
              <Text style={styles.secondaryMeta}>
                {formatTimeAgo(notification.created_at)}
              </Text>
            </View>
            <View style={styles.notificationActions}>
              {!notification.read_at ? (
                <Pressable
                  onPress={() => onMarkAsRead(notification.id)}
                  style={styles.secondaryChip}
                  accessibilityLabel="Mark as read"
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryChipText}>Read</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => onDismiss(notification.id)}
                style={styles.secondaryChip}
                accessibilityLabel="Dismiss notification"
                accessibilityRole="button"
              >
                <Text style={styles.secondaryChipText}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}
