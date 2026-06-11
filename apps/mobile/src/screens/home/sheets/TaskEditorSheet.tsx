import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  discoverUser,
  lookupUsers,
  toggleFavourite,
} from "@/lib/api";
import { toDisplayMessage } from "@/lib/http";
import { ChoiceChip } from "@/screens/home/components/ChoiceChip";
import { DatePickerField } from "@/screens/home/components/DatePickerField";
import { FormField } from "@/screens/home/components/FormField";
import { Sheet } from "@/screens/home/components/Sheet";
import { styles } from "@/screens/home/styles";
import { derivePreset } from "@/screens/home/utils";
import { colours } from "@/theme";
import {
  type Item,
  type Project,
  type RecurrencePreset,
  RECURRENCE_PRESET_RULES,
  type TaskDraft,
  type UserLookup,
} from "@/types";

type TaskEditorSheetProps = {
  visible: boolean;
  item: Item | null;
  projects: Project[];
  favourites: UserLookup[];
  datesEnabled: boolean;
  delegationEnabled: boolean;
  onClose: () => void;
  onCreateProject: (name: string) => Promise<Project>;
  onFavouriteToggled: () => Promise<void>;
  onSubmit: (values: TaskDraft) => Promise<void>;
};

const RECURRENCE_OPTIONS: [RecurrencePreset, string][] = [
  ["none", "None"],
  ["daily", "Daily"],
  ["weekdays", "Weekdays"],
  ["weekly", "Weekly"],
  ["monthly", "Monthly"],
];

const RECURRENCE_STRATEGY_OPTIONS: [string, string][] = [
  ["carry_over", "Carry over"],
  ["expires", "Expires"],
];

export function TaskEditorSheet({
  visible,
  item,
  projects,
  favourites,
  datesEnabled,
  delegationEnabled,
  onClose,
  onCreateProject,
  onFavouriteToggled,
  onSubmit,
}: TaskEditorSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  // Dates are now stored as YYYY-MM-DD strings (empty = not set).
  const [scheduledDate, setScheduledDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurrencePreset, setRecurrencePreset] = useState<RecurrencePreset>("none");
  const [recurrenceStrategy, setRecurrenceStrategy] = useState("carry_over");
  const [assignee, setAssignee] = useState<UserLookup | null>(null);
  const [assigneeNotes, setAssigneeNotes] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [projectDraft, setProjectDraft] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserLookup[]>([]);
  const [discoveredUser, setDiscoveredUser] = useState<UserLookup | null>(null);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [togglingFavouriteId, setTogglingFavouriteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAssignee =
    !!item && item.is_assigned === true && item.is_delegated === false;

  useEffect(() => {
    if (!visible) {
      return;
    }
    setTitle(item?.title ?? "");
    setDescription(item?.description ?? "");
    setProjectId(item?.project_id ?? null);
    setScheduledDate(item?.scheduled_date ?? "");
    setDueDate(item?.due_date ?? "");
    setRecurrencePreset(derivePreset(item?.recurrence_rule));
    setRecurrenceStrategy(item?.recurrence_strategy ?? "carry_over");
    setAssignee(item?.assignee ?? null);
    setAssigneeNotes(item?.assignee_notes ?? "");
    setShowMore(!!item);
    setProjectDraft("");
    setQuery("");
    setResults([]);
    setDiscoveredUser(null);
    setFormError(null);
    setSubmitting(false);
  }, [item, visible]);

  // Debounced user search (320 ms).
  useEffect(() => {
    if (!visible || !delegationEnabled) {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        if (query.trim().length < 3) {
          setResults([]);
          setDiscoveredUser(null);
          return;
        }
        setSearchingUsers(true);
        try {
          const trimmed = query.trim();
          const lookup = await lookupUsers(trimmed);
          if (cancelled) return;
          if (lookup.length > 0) {
            setResults(lookup);
            setDiscoveredUser(null);
          } else {
            setResults([]);
            // Discovery requires an exact match: a valid email, or a phone
            // number with at least 9 digits (matches backend validation).
            // Skip the request otherwise to avoid a guaranteed 422.
            const looksLikeEmail = trimmed.includes("@");
            const digitCount = trimmed.replace(/[^0-9]/g, "").length;
            if (looksLikeEmail || digitCount >= 9) {
              try {
                const discovered = await discoverUser(trimmed);
                if (cancelled) return;
                setDiscoveredUser(
                  discovered.found ? (discovered.user ?? null) : null,
                );
              } catch {
                if (!cancelled) setDiscoveredUser(null);
              }
            } else {
              setDiscoveredUser(null);
            }
          }
        } finally {
          if (!cancelled) setSearchingUsers(false);
        }
      })();
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [delegationEnabled, query, visible]);

  async function handleCreateProjectPress() {
    if (!projectDraft.trim()) return;
    try {
      const project = await onCreateProject(projectDraft.trim());
      setProjectId(project.id);
      setProjectDraft("");
      setFormError(null);
    } catch (candidate) {
      setFormError(toDisplayMessage(candidate, "Failed to create project."));
    }
  }

  async function handleToggleFavourite(userId: string) {
    setTogglingFavouriteId(userId);
    try {
      await toggleFavourite(userId);
      await onFavouriteToggled();
      setFormError(null);
    } catch (candidate) {
      setFormError(toDisplayMessage(candidate, "Failed to update favourites."));
    } finally {
      setTogglingFavouriteId(null);
    }
  }

  function favouriteSelected(id: string): boolean {
    return favourites.some((u) => u.id === id);
  }

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    setFormError(null);

    if (!trimmedTitle) {
      setFormError("Task title is required.");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (datesEnabled && scheduledDate && dueDate && dueDate < scheduledDate) {
      setFormError("Due date cannot be earlier than the scheduled date.");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setSubmitting(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim() || undefined,
        project_id: projectId,
        scheduled_date: scheduledDate || null,
        due_date: dueDate || null,
        recurrence_rule: RECURRENCE_PRESET_RULES[recurrencePreset],
        recurrence_strategy: recurrencePreset !== "none" ? recurrenceStrategy : null,
        assignee_id: assignee?.id ?? null,
        assignee_notes: isAssignee ? assigneeNotes.trim() || null : undefined,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (candidate) {
      setFormError(toDisplayMessage(candidate, "Failed to save task."));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      title={item ? "Edit Task" : "New Task"}
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={styles.sheetContent}
        keyboardShouldPersistTaps="handled"
      >
        <FormField
          label="Task"
          value={title}
          onChangeText={(value) => {
            setFormError(null);
            setTitle(value);
          }}
          placeholder="Ship the mobile app"
        />

        {formError ? (
          <View style={styles.sheetErrorBanner}>
            <Text style={styles.sheetErrorText}>{formError}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => setShowMore((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: showMore }}
          style={({ pressed }) => [styles.disclosure, pressed && styles.pressedOpacity]}
        >
          <Text style={styles.disclosureText}>
            {showMore ? "Hide extra settings" : "More settings"}
          </Text>
        </Pressable>

        {showMore ? (
          <View style={styles.formGroup}>
            <FormField
              label="Description"
              value={description}
              onChangeText={(value) => {
                setFormError(null);
                setDescription(value);
              }}
              placeholder="Add more detail"
              multiline
              minHeight={96}
            />

            {/* ── Project ─────────────────────────────────────────── */}
            <Text style={styles.inputLabel}>Project</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectionRow}
            >
              <ChoiceChip
                label="No project"
                selected={projectId === null}
                onPress={() => setProjectId(null)}
              />
              {projects.map((project) => (
                <ChoiceChip
                  key={project.id}
                  label={project.name}
                  selected={projectId === project.id}
                  onPress={() => setProjectId(project.id)}
                />
              ))}
            </ScrollView>

            <View style={styles.inlineComposer}>
              <TextInput
                value={projectDraft}
                onChangeText={setProjectDraft}
                placeholder="Create project"
                placeholderTextColor="#94A3B8"
                style={styles.inlineComposerInput}
                accessibilityLabel="New project name"
                returnKeyType="done"
                onSubmitEditing={() => void handleCreateProjectPress()}
              />
              <Pressable
                onPress={() => void handleCreateProjectPress()}
                style={({ pressed }) => [
                  styles.inlineComposerButton,
                  pressed && styles.pressedOpacity,
                ]}
                android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                accessibilityLabel="Add project"
                accessibilityRole="button"
              >
                <Text style={styles.inlineComposerButtonText}>Add</Text>
              </Pressable>
            </View>

            {/* ── Dates (native picker) ────────────────────────────── */}
            {datesEnabled ? (
              <>
                <DatePickerField
                  label="Scheduled date"
                  value={scheduledDate}
                  onChange={(v) => {
                    setFormError(null);
                    setScheduledDate(v);
                  }}
                  placeholder="Optional — when to start"
                  hint="Leave empty for immediate visibility."
                  maximumDate={dueDate ? new Date(`${dueDate}T00:00:00`) : undefined}
                />

                <DatePickerField
                  label="Due date"
                  value={dueDate}
                  onChange={(v) => {
                    setFormError(null);
                    setDueDate(v);
                  }}
                  placeholder="Optional — deadline"
                  minimumDate={
                    scheduledDate ? new Date(`${scheduledDate}T00:00:00`) : undefined
                  }
                />

                {/* ── Recurrence ──────────────────────────────────── */}
                <Text style={styles.inputLabel}>Repeat</Text>
                <View style={styles.selectionWrap}>
                  {RECURRENCE_OPTIONS.map(([value, label]) => (
                    <ChoiceChip
                      key={value}
                      label={label}
                      selected={recurrencePreset === value}
                      onPress={() => setRecurrencePreset(value)}
                    />
                  ))}
                </View>

                {recurrencePreset !== "none" ? (
                  <>
                    <Text style={styles.inputLabel}>If missed</Text>
                    <View style={styles.selectionWrap}>
                      {RECURRENCE_STRATEGY_OPTIONS.map(([value, label]) => (
                        <ChoiceChip
                          key={value}
                          label={label}
                          selected={recurrenceStrategy === value}
                          onPress={() => setRecurrenceStrategy(value)}
                        />
                      ))}
                    </View>
                  </>
                ) : null}
              </>
            ) : null}

            {/* ── Delegation ──────────────────────────────────────── */}
            {delegationEnabled ? (
              <>
                {isAssignee ? (
                  <FormField
                    label="My notes"
                    value={assigneeNotes}
                    onChangeText={setAssigneeNotes}
                    placeholder="Add a quick update"
                    multiline
                    minHeight={90}
                  />
                ) : null}

                {item?.is_delegated && item.assignee_notes ? (
                  <View style={styles.readOnlyCard}>
                    <Text style={styles.readOnlyLabel}>Assignee notes</Text>
                    <Text style={styles.readOnlyText}>{item.assignee_notes}</Text>
                  </View>
                ) : null}

                <Text style={styles.inputLabel}>Assign to</Text>

                {/* Favourites quick-pick */}
                {favourites.length > 0 && query.length < 3 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.selectionRow}
                  >
                    {favourites.map((fav) => (
                      <ChoiceChip
                        key={fav.id}
                        label={`★ ${fav.name}`}
                        selected={assignee?.id === fav.id}
                        onPress={() => setAssignee(fav)}
                      />
                    ))}
                  </ScrollView>
                ) : null}

                <FormField
                  label="Search users"
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Email or phone"
                  hint="Search by email or the last 9 digits of a phone number."
                />

                {assignee ? (
                  <View style={styles.selectedPerson}>
                    <View style={styles.flexOne}>
                      <Text style={styles.selectedPersonName}>{assignee.name}</Text>
                      <Text style={styles.selectedPersonMeta}>
                        {assignee.email_masked}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setAssignee(null)}
                      style={({ pressed }) => [
                        styles.secondaryChip,
                        pressed && styles.pressedOpacity,
                      ]}
                      accessibilityLabel="Remove assignee"
                      accessibilityRole="button"
                    >
                      <Text style={styles.secondaryChipText}>Remove</Text>
                    </Pressable>
                  </View>
                ) : null}

                {searchingUsers ? (
                  <ActivityIndicator color={colours.blueStrong} />
                ) : null}

                {results.map((result) => (
                  <Pressable
                    key={result.id}
                    onPress={() => setAssignee(result)}
                    style={({ pressed }) => [
                      styles.personRow,
                      pressed && styles.pressedOpacity,
                    ]}
                    android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    accessibilityLabel={`Assign to ${result.name}`}
                    accessibilityRole="button"
                  >
                    <View style={styles.flexOne}>
                      <Text style={styles.personName}>{result.name}</Text>
                      <Text style={styles.personMeta}>{result.email_masked}</Text>
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        void handleToggleFavourite(result.id);
                      }}
                      style={({ pressed }) => [
                        styles.secondaryChip,
                        pressed && styles.pressedOpacity,
                      ]}
                      accessibilityLabel={
                        favouriteSelected(result.id)
                          ? `Remove ${result.name} from favourites`
                          : `Add ${result.name} to favourites`
                      }
                      accessibilityRole="button"
                    >
                      <Text style={styles.secondaryChipText}>
                        {togglingFavouriteId === result.id
                          ? "..."
                          : favouriteSelected(result.id)
                            ? "★"
                            : "☆"}
                      </Text>
                    </Pressable>
                  </Pressable>
                ))}

                {discoveredUser ? (
                  <Pressable
                    onPress={() => setAssignee(discoveredUser)}
                    style={({ pressed }) => [
                      styles.personRow,
                      pressed && styles.pressedOpacity,
                    ]}
                    android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    accessibilityLabel={`Assign to ${discoveredUser.name} (discovered user)`}
                    accessibilityRole="button"
                  >
                    <View style={styles.flexOne}>
                      <Text style={styles.personName}>{discoveredUser.name}</Text>
                      <Text style={styles.personMeta}>
                        {discoveredUser.email_masked}
                      </Text>
                    </View>
                    <Text style={styles.discoveryTag}>Found</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </View>
        ) : null}

        {/* ── Actions ───────────────────────────────────────────────── */}
        <View style={styles.sheetActions}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.secondaryActionButton,
              pressed && styles.pressedOpacity,
            ]}
            android_ripple={{ color: "rgba(0,0,0,0.08)" }}
            accessibilityLabel="Cancel"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryActionButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            disabled={submitting}
            onPress={() => void handleSubmit()}
            style={({ pressed }) => [
              styles.primaryActionButton,
              submitting && styles.primaryActionButtonDisabled,
              pressed && !submitting && styles.pressedOpacity,
            ]}
            android_ripple={{ color: "rgba(255,255,255,0.2)" }}
            accessibilityLabel={
              submitting
                ? item ? "Saving task..." : "Adding task..."
                : item ? "Save task" : "Add task"
            }
            accessibilityRole="button"
          >
            <Text style={styles.primaryActionButtonText}>
              {submitting
                ? item ? "Saving..." : "Adding..."
                : item ? "Save task" : "Add task"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Sheet>
  );
}
