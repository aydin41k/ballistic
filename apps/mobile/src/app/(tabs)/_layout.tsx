import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { MotionPressable } from '@/components/ui/MotionPressable';
import { colours, radii } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useNotifications } from '@/hooks/useNotifications';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { delegation } = useFeatureFlags();
  const notifications = useNotifications(delegation);
  const unread = notifications.data?.unread_count ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colours.page },
        tabBarActiveTintColor: colours.blue,
        tabBarInactiveTintColor: colours.textFaint,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarStyle: [
          styles.bar,
          {
            height: 60 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 6),
          },
        ],
      }}
    >
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="format-list-checks" size={size} color={color} />
          ),
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="note-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Add task',
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: () => <AddTaskButton />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={size}
              color={isAuthenticated ? color : colours.danger}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function AddTaskButton() {
  const router = useRouter();

  return (
    <View style={styles.addSlot}>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel="Add a new task"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/task');
        }}
        style={styles.addButton}
      >
        <AppIcon name="plus" size={28} colour="#FFFFFF" />
      </MotionPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colours.border,
    backgroundColor: colours.surface,
    elevation: 10,
    shadowColor: colours.navy,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  item: { paddingVertical: 2 },
  label: { fontSize: 11, fontWeight: '600' },
  badge: { backgroundColor: colours.danger, color: '#FFFFFF', fontSize: 10 },
  addSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.blue,
    borderWidth: 3,
    borderColor: colours.surface,
    elevation: 5,
    shadowColor: colours.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
  },
});
