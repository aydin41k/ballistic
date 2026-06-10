import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import {
  createItem,
  createProject,
  dismissNotification,
  fetchItems,
  fetchNotifications,
  fetchProjects,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  reorderItems,
  updateItem,
  updateStatus,
} from "@/lib/api";
import { toDisplayMessage } from "@/lib/http";
import { filterItemsByExcludedProjects } from "@/lib/projectFilters";
import { cycleStatus } from "@/lib/status";
import { TaskCard } from "@/screens/home/components/TaskCard";
import { ToolbarButton } from "@/screens/home/components/ToolbarButton";
import { ActivitySheet } from "@/screens/home/sheets/ActivitySheet";
import { FilterSheet } from "@/screens/home/sheets/FilterSheet";
import { NotesSheet } from "@/screens/home/sheets/NotesSheet";
import { NotificationsSheet } from "@/screens/home/sheets/NotificationsSheet";
import { ProfileSheet } from "@/screens/home/sheets/ProfileSheet";
import { SettingsSheet } from "@/screens/home/sheets/SettingsSheet";
import { TaskEditorSheet } from "@/screens/home/sheets/TaskEditorSheet";
import { styles } from "@/screens/home/styles";
import { type BoardSection, type PanelName } from "@/screens/home/types";
import {
  applyItemUpdate,
  reorderList,
  sortByUrgency,
} from "@/screens/home/utils";
import { colours, spacing } from "@/theme";
import type { Item, ItemScope, Notification, Project, TaskDraft } from "@/types";

export function HomeScreen() {
  const { logout, refreshUser, updateUser, user } = useAuth();
  const { dates, delegation } = useFeatureFlags();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<Item[]>([]);
  const [assignedItems, setAssignedItems] = useState<Item[]>([]);
  const [delegatedItems, setDelegatedItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewScope, setViewScope] = useState<ItemScope>("active");
  const [excludedProjectIds, setExcludedProjectIds] = useState<Set<string>>(
    new Set(),
  );
  const [activePanel, setActivePanel] = useState<PanelName | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FAB spring-in animation on mount.
  const fabScale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(fabScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 180,
      friction: 7,
      delay: 350,
    }).start();
  }, [fabScale]);

  const showToast = useCallback((message: string) => {
    setToast(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const refreshBoard = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }

      try {
        const [mine, assigned, delegatedItemsData, projectList] =
          await Promise.all([
            fetchItems({ scope: viewScope }),
            delegation
              ? fetchItems({ assigned_to_me: true, scope: viewScope })
              : Promise.resolve([]),
            delegation
              ? fetchItems({ delegated: true, scope: viewScope })
              : Promise.resolve([]),
            fetchProjects(),
          ]);

        setItems(mine);
        setAssignedItems(assigned);
        setDelegatedItems(delegatedItemsData);
        setProjects(projectList);
        setLoadError(null);
      } catch (candidate) {
        const message =
          toDisplayMessage(candidate, "Failed to load your workspace.");
        setLoadError(message);
        showToast(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [delegation, showToast, viewScope],
  );

  const refreshNotifications = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!delegation) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      if (!options?.silent) {
        setNotificationsLoading(true);
      }

      try {
        const response = await fetchNotifications();
        setNotifications(response.data);
        setUnreadCount(response.unread_count);
      } catch {
        if (!options?.silent) {
          showToast("Failed to load notifications.");
        }
      } finally {
        setNotificationsLoading(false);
      }
    },
    [delegation, showToast],
  );

  useEffect(() => {
    if (!dates && viewScope !== "active") {
      setViewScope("active");
    }
  }, [dates, viewScope]);

  useEffect(() => {
    void refreshBoard();
  }, [refreshBoard]);

  useEffect(() => {
    void refreshNotifications({ silent: true });

    if (!delegation) {
      return;
    }

    const timer = setInterval(() => {
      void refreshNotifications({ silent: true });
    }, 30_000);

    return () => clearInterval(timer);
  }, [delegation, refreshNotifications]);

  useEffect(() => {
    let previousState = AppState.currentState;

    const subscription = AppState.addEventListener("change", (nextState) => {
      const wasBackgrounded =
        previousState === "background" || previousState === "inactive";
      previousState = nextState;

      if (nextState === "active" && wasBackgrounded) {
        void refreshBoard({ silent: true });
        void refreshNotifications({ silent: true });
      }
    });

    return () => subscription.remove();
  }, [refreshBoard, refreshNotifications]);

  const sortedItems = useMemo(
    () => (dates ? sortByUrgency(items) : items),
    [dates, items],
  );
  const filteredItems = useMemo(
    () => filterItemsByExcludedProjects(sortedItems, excludedProjectIds),
    [excludedProjectIds, sortedItems],
  );
  const filteredAssignedItems = useMemo(
    () => filterItemsByExcludedProjects(assignedItems, excludedProjectIds),
    [assignedItems, excludedProjectIds],
  );
  const filteredDelegatedItems = useMemo(
    () => filterItemsByExcludedProjects(delegatedItems, excludedProjectIds),
    [delegatedItems, excludedProjectIds],
  );

  const sections = useMemo<BoardSection[]>(() => {
    const nextSections: BoardSection[] = [];

    if (delegation && filteredAssignedItems.length > 0) {
      nextSections.push({
        key: "assigned",
        title: "Assigned to Me",
        tone: "emerald",
        data: filteredAssignedItems,
      });
    }

    if (filteredItems.length > 0) {
      nextSections.push({
        key: "mine",
        title: delegation ? "My Tasks" : "Tasks",
        tone: "navy",
        data: filteredItems,
      });
    }

    if (delegation && filteredDelegatedItems.length > 0) {
      nextSections.push({
        key: "delegated",
        title: "Delegated to Others",
        tone: "amber",
        data: filteredDelegatedItems,
      });
    }

    return nextSections;
  }, [delegation, filteredAssignedItems, filteredDelegatedItems, filteredItems]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([
      refreshBoard({ silent: true }),
      refreshNotifications({ silent: true }),
    ]);
  }

  async function handleToggleStatus(item: Item) {
    const snapshot = {
      items,
      assigned: assignedItems,
      delegated: delegatedItems,
    };

    const nextStatus = cycleStatus(item.status);
    const optimistic = {
      ...item,
      status: nextStatus,
      completed_at:
        nextStatus === "done" || nextStatus === "wontdo"
          ? new Date().toISOString()
          : null,
    };

    const patched = applyItemUpdate(snapshot, optimistic);
    setItems(patched.items);
    setAssignedItems(patched.assigned);
    setDelegatedItems(patched.delegated);

    try {
      const saved = await updateStatus(item.id, nextStatus);

      setItems((current) =>
        current.map((candidate) => (candidate.id === saved.id ? saved : candidate)),
      );
      setAssignedItems((current) =>
        current.map((candidate) => (candidate.id === saved.id ? saved : candidate)),
      );
      setDelegatedItems((current) =>
        current.map((candidate) => (candidate.id === saved.id ? saved : candidate)),
      );
    } catch {
      setItems(snapshot.items);
      setAssignedItems(snapshot.assigned);
      setDelegatedItems(snapshot.delegated);
      showToast("Failed to update status. Change reverted.");
    }
  }

  async function handleMoveItem(
    itemId: string,
    direction: "up" | "down" | "top",
  ) {
    const previous = items;
    const reordered = reorderList(items, itemId, direction);
    setItems(reordered);

    try {
      await reorderItems(
        reordered.map((item, position) => ({ id: item.id, position })),
      );
    } catch {
      setItems(previous);
      showToast("Failed to reorder items. Changes reverted.");
    }
  }

  async function handleDecline(item: Item) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const previous = assignedItems;
    setAssignedItems((current) =>
      current.filter((candidate) => candidate.id !== item.id),
    );

    try {
      await updateItem(item.id, { assignee_id: null });
      await refreshBoard({ silent: true });
    } catch {
      setAssignedItems(previous);
      showToast("Failed to decline task.");
    }
  }

  async function handleCreateProject(name: string): Promise<Project> {
    const project = await createProject({ name });
    setProjects((current) => [...current, project]);
    return project;
  }

  async function handleSaveTask(values: TaskDraft): Promise<void> {
    if (!user) {
      throw new Error("You need to be signed in to save tasks.");
    }

    if (editingItem) {
      const snapshot = {
        items,
        assigned: assignedItems,
        delegated: delegatedItems,
      };
      const selectedProject = values.project_id
        ? projects.find((project) => project.id === values.project_id) ?? null
        : null;

      const optimistic: Item = {
        ...editingItem,
        title: values.title,
        description: values.description || null,
        assignee_notes:
          values.assignee_notes !== undefined
            ? values.assignee_notes || null
            : editingItem.assignee_notes,
        project_id: values.project_id ?? null,
        project: selectedProject,
        scheduled_date: values.scheduled_date ?? null,
        due_date: values.due_date ?? null,
        recurrence_rule: values.recurrence_rule ?? null,
        recurrence_strategy:
          (values.recurrence_strategy as Item["recurrence_strategy"]) ?? null,
        is_recurring_template: !!values.recurrence_rule,
        assignee_id: values.assignee_id ?? null,
      };

      const patched = applyItemUpdate(snapshot, optimistic);
      setItems(patched.items);
      setAssignedItems(patched.assigned);
      setDelegatedItems(patched.delegated);

      try {
        await updateItem(editingItem.id, {
          title: values.title,
          description: values.description || null,
          assignee_notes: values.assignee_notes,
          project_id: values.project_id,
          scheduled_date: values.scheduled_date,
          due_date: values.due_date,
          recurrence_rule: values.recurrence_rule,
          recurrence_strategy:
            (values.recurrence_strategy as Item["recurrence_strategy"]) ?? null,
          assignee_id: values.assignee_id,
        });
        await refreshBoard({ silent: true });
        setEditorVisible(false);
        setEditingItem(null);
      } catch (candidate) {
        setItems(snapshot.items);
        setAssignedItems(snapshot.assigned);
        setDelegatedItems(snapshot.delegated);
        throw new Error(
          toDisplayMessage(candidate, "Failed to update task. Changes reverted."),
        );
      }

      return;
    }

    const tempId = `temp-${Date.now()}`;
    const selectedProject = values.project_id
      ? projects.find((project) => project.id === values.project_id) ?? null
      : null;

    const optimistic: Item = {
      id: tempId,
      user_id: user.id,
      assignee_id: values.assignee_id ?? null,
      project_id: values.project_id ?? null,
      title: values.title,
      description: values.description || null,
      assignee_notes: null,
      status: "todo",
      position: items.length,
      scheduled_date: values.scheduled_date ?? null,
      due_date: values.due_date ?? null,
      completed_at: null,
      recurrence_rule: values.recurrence_rule ?? null,
      recurrence_parent_id: null,
      recurrence_strategy:
        (values.recurrence_strategy as Item["recurrence_strategy"]) ?? null,
      is_recurring_template: !!values.recurrence_rule,
      is_recurring_instance: false,
      is_assigned: !!values.assignee_id,
      is_delegated: !!values.assignee_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      project: selectedProject,
    };

    setItems((current) => [...current, optimistic]);

    try {
      const created = await createItem({
        ...values,
        status: "todo",
        position: items.length,
      });
      setItems((current) =>
        current.map((item) => (item.id === tempId ? created : item)),
      );
      if (created.assignee_id) {
        await refreshBoard({ silent: true });
      }
      setEditorVisible(false);
      setEditingItem(null);
    } catch (candidate) {
      setItems((current) => current.filter((item) => item.id !== tempId));
      throw new Error(toDisplayMessage(candidate, "Failed to create task."));
    }
  }

  async function handleMarkNotificationAsRead(id: string) {
    try {
      const response = await markNotificationAsRead(id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, read_at: new Date().toISOString() } : item,
        ),
      );
      setUnreadCount(response.unread_count);
    } catch {
      showToast("Failed to update notification.");
    }
  }

  async function handleMarkAllNotificationsAsRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((item) =>
          item.read_at ? item : { ...item, read_at: new Date().toISOString() },
        ),
      );
      setUnreadCount(0);
    } catch {
      showToast("Failed to update notifications.");
    }
  }

  async function handleDismissNotification(id: string) {
    try {
      const response = await dismissNotification(id);
      setNotifications((current) => current.filter((item) => item.id !== id));
      setUnreadCount(response.unread_count);
    } catch {
      showToast("Failed to dismiss notification.");
    }
  }

  const hasFilters =
    excludedProjectIds.size > 0 || (dates && viewScope === "planned");
  const canCreateTask = !loading && !loadError;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colours.blueStrong} />
          <Text style={styles.loadingLabel}>Loading your workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Ballistic</Text>
            <Text style={styles.headerSubtitle}>The Simplest Bullet Journal</Text>
            <Text style={styles.headerMeta}>
              {user?.name ? `Logged in as ${user.name}` : "Ready to focus"}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert("Log out?", "You can sign back in any time.", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Log out",
                  style: "destructive",
                  onPress: () => void logout(),
                },
              ]);
            }}
            accessibilityLabel="Log out"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.ghostButton,
              pressed && styles.pressedOpacity,
            ]}
          >
            <Text style={styles.ghostButtonText}>Log out</Text>
          </Pressable>
        </View>

        {dates && viewScope === "planned" ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Showing planned items with future scheduled dates.
            </Text>
            <Pressable
              onPress={() => setViewScope("active")}
              accessibilityLabel="Back to active tasks"
              accessibilityRole="button"
            >
              <Text style={styles.bannerAction}>Back to active</Text>
            </Pressable>
          </View>
        ) : null}

        <SectionList
          sections={sections}
          keyExtractor={(item: Item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: 128 + insets.bottom,
            gap: spacing.lg,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={colours.blueStrong}
            />
          }
          renderSectionHeader={({ section }: { section: BoardSection }) => (
            <Text
              style={[
                styles.sectionTitle,
                section.tone === "emerald"
                  ? styles.sectionEmerald
                  : section.tone === "amber"
                    ? styles.sectionAmber
                    : styles.sectionNavy,
              ]}
            >
              {section.title}
            </Text>
          )}
          renderItem={({
            item,
            index,
            section,
          }: {
            item: Item;
            index: number;
            section: BoardSection;
          }) => (
            <View style={styles.cardWrap}>
              <TaskCard
                item={item}
                dates={dates}
                canReorder={section.key === "mine"}
                isFirst={index === 0}
                isLast={index === section.data.length - 1}
                onOpen={() => {
                  setEditingItem(item);
                  setEditorVisible(true);
                }}
                onToggleStatus={() => void handleToggleStatus(item)}
                onMove={(direction) => void handleMoveItem(item.id, direction)}
              />
              {section.key === "assigned" ? (
                <Pressable
                  onPress={() => void handleDecline(item)}
                  accessibilityLabel={`Decline task: ${item.title}`}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.declineButton,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.declineButtonText}>Decline</Text>
                </Pressable>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            loadError ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Workspace unavailable</Text>
                <Text style={styles.emptyCopy}>{loadError}</Text>
                <Pressable
                  onPress={() => void handleRefresh()}
                  accessibilityLabel="Retry loading workspace"
                  accessibilityRole="button"
                  style={styles.primaryEmptyAction}
                >
                  <Text style={styles.primaryEmptyActionText}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No tasks yet</Text>
                <Text style={styles.emptyCopy}>
                  {hasFilters
                    ? "No tasks match the selected projects."
                    : "Start your bullet journal journey by adding your first task."}
                </Text>
                {!hasFilters ? (
                  <Pressable
                    onPress={() => {
                      setEditingItem(null);
                      setEditorVisible(true);
                    }}
                    accessibilityLabel="Add first task"
                    accessibilityRole="button"
                    style={styles.primaryEmptyAction}
                  >
                    <Text style={styles.primaryEmptyActionText}>Add first task</Text>
                  </Pressable>
                ) : null}
              </View>
            )
          }
          ListFooterComponent={
            <Text style={styles.footerCopy}>
              Psycode Pty. Ltd. © {new Date().getFullYear()}
            </Text>
          }
        />

        <View
          style={[
            styles.toolbar,
            {
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolbarScroll}
          >
            <ToolbarButton
              label="Settings"
              onPress={() => setActivePanel("settings")}
            />
            <ToolbarButton label="Notes" onPress={() => setActivePanel("notes")} />
            <ToolbarButton
              label="Activity"
              onPress={() => setActivePanel("activity")}
            />
            <ToolbarButton
              label={hasFilters ? "Filters •" : "Filters"}
              active={hasFilters}
              onPress={() => setActivePanel("filters")}
            />
            {delegation ? (
              <ToolbarButton
                label={unreadCount > 0 ? `Inbox ${unreadCount}` : "Inbox"}
                active={unreadCount > 0}
                onPress={() => setActivePanel("notifications")}
              />
            ) : null}
            <ToolbarButton
              label="Profile"
              onPress={() => setActivePanel("profile")}
            />
          </ScrollView>
          <Animated.View style={{ transform: [{ scale: fabScale }] }}>
            <Pressable
              disabled={!canCreateTask}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setEditingItem(null);
                setEditorVisible(true);
              }}
              accessibilityLabel="Add new task"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.fab,
                !canCreateTask && styles.fabDisabled,
                pressed && !canCreateTask === false && styles.fabPressed,
              ]}
            >
              <Text style={styles.fabLabel}>+</Text>
            </Pressable>
          </Animated.View>
        </View>

        {toast ? (
          <View style={styles.toast} accessibilityLiveRegion="polite">
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}

        <TaskEditorSheet
          visible={editorVisible}
          item={editingItem}
          projects={projects}
          datesEnabled={dates}
          delegationEnabled={delegation}
          favourites={user?.favourites ?? []}
          onClose={() => {
            setEditorVisible(false);
            setEditingItem(null);
          }}
          onCreateProject={handleCreateProject}
          onFavouriteToggled={refreshUser}
          onSubmit={handleSaveTask}
        />

        <FilterSheet
          visible={activePanel === "filters"}
          datesEnabled={dates}
          projects={projects}
          viewScope={viewScope}
          excludedProjectIds={excludedProjectIds}
          onClose={() => setActivePanel(null)}
          onScopeChange={setViewScope}
          onExcludedProjectsChange={setExcludedProjectIds}
        />

        <NotesSheet
          visible={activePanel === "notes"}
          user={user}
          onClose={() => setActivePanel(null)}
          onSave={async (notes) => {
            await updateUser({ notes });
          }}
        />

        <ProfileSheet
          visible={activePanel === "profile"}
          user={user}
          onClose={() => setActivePanel(null)}
          onSave={async (payload) => {
            await updateUser(payload);
          }}
        />

        <SettingsSheet
          visible={activePanel === "settings"}
          onClose={() => setActivePanel(null)}
        />

        <ActivitySheet
          visible={activePanel === "activity"}
          onClose={() => setActivePanel(null)}
        />

        <NotificationsSheet
          visible={activePanel === "notifications"}
          loading={notificationsLoading}
          notifications={notifications}
          unreadCount={unreadCount}
          onClose={() => setActivePanel(null)}
          onRefresh={() => void refreshNotifications()}
          onMarkAsRead={(id) => void handleMarkNotificationAsRead(id)}
          onMarkAllAsRead={() => void handleMarkAllNotificationsAsRead()}
          onDismiss={(id) => void handleDismissNotification(id)}
        />
      </View>
    </SafeAreaView>
  );
}
