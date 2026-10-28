import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { LoadingScreen } from '@/components/LoadingScreen';
import { AssigneePicker } from '@/components/tasks/AssigneePicker';
import { ProjectPicker } from '@/components/tasks/ProjectPicker';
import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { Chip } from '@/components/ui/Chip';
import { DateField } from '@/components/ui/DateField';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { MotionPressable } from '@/components/ui/MotionPressable';
import { Screen } from '@/components/ui/Screen';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { colours, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useJournalPreferences } from '@/contexts/JournalPreferencesContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { findCachedItem, useJournalActions } from '@/hooks/useJournal';
import { fetchItem, fetchProjects, type ItemInput } from '@/lib/api';
import { fromDateKey } from '@/lib/date';
import {
  recurrenceRules,
  type Item,
  type Project,
  type RecurrencePreset,
  type UserLookup,
} from '@/types';

const recurrenceOptions: { value: RecurrencePreset; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function presetFromRule(rule: string | null | undefined): RecurrencePreset {
  const match = Object.entries(recurrenceRules).find(([, value]) => value === rule);
  return (match?.[0] as RecurrencePreset | undefined) ?? 'none';
}

export default function TaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const client = useQueryClient();
  const cached = id ? findCachedItem(client, id) : undefined;
  const itemQuery = useQuery({
    queryKey: ['item', id],
    queryFn: () => fetchItem(id!),
    enabled: Boolean(id && !cached),
    initialData: cached,
  });
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: fetchProjects });
  const item = itemQuery.data;

  if (id && itemQuery.isLoading && !item) return <LoadingScreen />;
  if (id && itemQuery.error && !item) {
    return (
      <Screen safeBottom>
        <SheetHeader title="Task unavailable" onClose={() => router.back()} />
        <View style={styles.errorPage}>
          <ErrorNotice
            message={
              itemQuery.error instanceof Error
                ? itemQuery.error.message
                : 'Could not load this task.'
            }
          />
        </View>
      </Screen>
    );
  }

  return <TaskEditor key={item?.id ?? 'new'} item={item} projects={projectsQuery.data ?? []} />;
}

function TaskEditor({ item, projects }: { item?: Item; projects: Project[] }) {
  const router = useRouter();
  const client = useQueryClient();
  const { user, refreshUser } = useAuth();
  const { dates, delegation } = useFeatureFlags();
  const { scope } = useJournalPreferences();
  const actions = useJournalActions(user);

  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [project, setProject] = useState<Project | null>(
    item?.project ?? projects.find((candidate) => candidate.id === item?.project_id) ?? null,
  );
  const [scheduledDate, setScheduledDate] = useState(item?.scheduled_date ?? '');
  const [dueDate, setDueDate] = useState(item?.due_date ?? '');
  const [recurrence, setRecurrence] = useState<RecurrencePreset>(
    presetFromRule(item?.recurrence_rule),
  );
  const [recurrenceStrategy, setRecurrenceStrategy] = useState<'carry_over' | 'expires'>(
    item?.recurrence_strategy ?? 'carry_over',
  );
  const [assignee, setAssignee] = useState<UserLookup | null>(item?.assignee ?? null);
  const [assigneeNotes, setAssigneeNotes] = useState(item?.assignee_notes ?? '');
  const [moreOpen, setMoreOpen] = useState(Boolean(item));
  const [projectPicker, setProjectPicker] = useState(false);
  const [assigneePicker, setAssigneePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAssignee = Boolean(item?.is_assigned && !item.is_delegated);
  const ownsTask = !item || item.user_id === user?.id;
  const canAssign = delegation && ownsTask;
  const busy = saving || actions.updateTask.isPending || actions.createTask.isPending;
  const minimumDueDate = scheduledDate ? fromDateKey(scheduledDate) : undefined;
  const projectList = useMemo(() => {
    return project && !projects.some((candidate) => candidate.id === project.id)
      ? [...projects, project]
      : projects;
  }, [project, projects]);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const ownerPayload: ItemInput = {
      title: title.trim(),
      description: description.trim() || null,
      project_id: project?.id ?? null,
      scheduled_date: dates ? scheduledDate || null : null,
      due_date: dates ? dueDate || null : null,
      recurrence_rule: dates ? recurrenceRules[recurrence] : null,
      recurrence_strategy: dates && recurrence !== 'none' ? recurrenceStrategy : null,
      assignee_id: canAssign ? (assignee?.id ?? null) : item?.assignee_id,
      assignee_notes: item?.assignee_notes,
    };
    const payload: Partial<ItemInput> = isAssignee
      ? {
          description: description.trim() || null,
          assignee_notes: assigneeNotes.trim() || null,
        }
      : ownerPayload;

    try {
      if (item) await actions.updateTask.mutateAsync({ id: item.id, payload });
      else await actions.createTask.mutateAsync(ownerPayload);
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save this task.');
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    if (!item) return;
    Alert.alert('Delete task?', `“${item.title}” will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await actions.removeTask.mutateAsync(item.id);
            router.back();
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Could not delete this task.');
          }
        },
      },
    ]);
  }

  return (
    <Screen safeBottom>
      <SheetHeader
        title={item ? 'Edit task' : 'New task'}
        subtitle={item ? 'Make a considered adjustment.' : 'Capture it while it is fresh.'}
        onClose={() => router.back()}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {error ? <ErrorNotice message={error} /> : null}
          <AppTextField
            label="Task"
            value={title}
            onChangeText={setTitle}
            placeholder="What needs doing?"
            autoFocus={!item}
            editable={!isAssignee}
            helper={isAssignee ? 'Only the task owner can rename it.' : undefined}
            returnKeyType="done"
            onSubmitEditing={() => !moreOpen && void save()}
          />

          <View style={styles.moreSection}>
            <MotionPressable onPress={() => setMoreOpen((open) => !open)} style={styles.moreButton}>
              <AppIcon
                name={moreOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                colour={colours.textMuted}
              />
              <AppText variant="bodyStrong" colour={colours.textMuted}>
                More settings
              </AppText>
            </MotionPressable>

            {moreOpen ? (
              <Animated.View
                entering={FadeInDown.duration(220)}
                layout={LinearTransition}
                style={styles.fields}
              >
                {!isAssignee ? (
                  <View style={styles.fieldGroup}>
                    <AppText variant="caption" colour={colours.textMuted}>
                      Project
                    </AppText>
                    <MotionPressable onPress={() => setProjectPicker(true)} style={styles.selector}>
                      <View
                        style={[
                          styles.projectDot,
                          { backgroundColor: project?.color ?? colours.borderStrong },
                        ]}
                      />
                      <AppText
                        colour={project ? colours.text : colours.textFaint}
                        style={styles.selectorCopy}
                      >
                        {project?.name ?? 'No project'}
                      </AppText>
                      <AppIcon name="chevron-right" size={20} colour={colours.textFaint} />
                    </MotionPressable>
                  </View>
                ) : null}
                <AppTextField
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add more detail…"
                  multiline
                  numberOfLines={4}
                />

                {dates && !isAssignee ? (
                  <>
                    <DateField
                      label="Scheduled date"
                      value={scheduledDate}
                      onChange={setScheduledDate}
                      helper="The task appears in Active on this date."
                    />
                    <DateField
                      label="Due date"
                      value={dueDate}
                      onChange={setDueDate}
                      minimumDate={minimumDueDate}
                      helper="The deadline used for urgency sorting."
                    />
                    <View style={styles.fieldGroup}>
                      <AppText variant="caption" colour={colours.textMuted}>
                        Repeat
                      </AppText>
                      <View style={styles.chips}>
                        {recurrenceOptions.map((option) => (
                          <Chip
                            key={option.value}
                            label={option.label}
                            selected={recurrence === option.value}
                            onPress={() => setRecurrence(option.value)}
                          />
                        ))}
                      </View>
                    </View>
                    {recurrence !== 'none' ? (
                      <View style={styles.fieldGroup}>
                        <AppText variant="caption" colour={colours.textMuted}>
                          If missed
                        </AppText>
                        <View style={styles.chips}>
                          <Chip
                            label="Carry over"
                            selected={recurrenceStrategy === 'carry_over'}
                            onPress={() => setRecurrenceStrategy('carry_over')}
                          />
                          <Chip
                            label="Expire"
                            selected={recurrenceStrategy === 'expires'}
                            onPress={() => setRecurrenceStrategy('expires')}
                          />
                        </View>
                        <AppText variant="caption" colour={colours.textFaint}>
                          {recurrenceStrategy === 'expires'
                            ? 'Past occurrences are skipped.'
                            : 'Past occurrences remain overdue until completed.'}
                        </AppText>
                      </View>
                    ) : null}
                  </>
                ) : null}

                {delegation && isAssignee ? (
                  <AppTextField
                    label="My notes"
                    value={assigneeNotes}
                    onChangeText={setAssigneeNotes}
                    placeholder="Add your private working notes…"
                    multiline
                  />
                ) : null}
                {delegation && item?.is_delegated && item.assignee_notes ? (
                  <View style={styles.readOnlyNote}>
                    <AppText variant="caption" colour={colours.textMuted}>
                      Assignee notes
                    </AppText>
                    <AppText>{item.assignee_notes}</AppText>
                  </View>
                ) : null}
                {canAssign ? (
                  <View style={styles.fieldGroup}>
                    <AppText variant="caption" colour={colours.textMuted}>
                      Assign to
                    </AppText>
                    <MotionPressable
                      onPress={() => setAssigneePicker(true)}
                      style={styles.selector}
                    >
                      <AppIcon name="account-arrow-right-outline" size={20} colour={colours.blue} />
                      <AppText
                        colour={assignee ? colours.text : colours.textFaint}
                        style={styles.selectorCopy}
                      >
                        {assignee?.name ?? 'Choose a person'}
                      </AppText>
                      <AppIcon name="chevron-right" size={20} colour={colours.textFaint} />
                    </MotionPressable>
                  </View>
                ) : null}
              </Animated.View>
            ) : null}
          </View>

          <View style={styles.actions}>
            <View style={styles.primaryAction}>
              <AppButton
                label={item ? 'Save changes' : 'Add task'}
                loading={busy}
                disabled={!title.trim()}
                onPress={() => void save()}
              />
            </View>
            <View style={styles.secondaryAction}>
              <AppButton label="Cancel" variant="secondary" onPress={() => router.back()} />
            </View>
          </View>
          {item && ownsTask ? (
            <AppButton
              label="Delete task"
              variant="danger"
              icon="trash-can-outline"
              onPress={remove}
            />
          ) : null}
          {scope === 'planned' && !item ? (
            <AppText variant="caption" colour={colours.textFaint} style={styles.centre}>
              Tip: choose a future scheduled date to keep this task in Planned.
            </AppText>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <ProjectPicker
        visible={projectPicker}
        projects={projectList}
        selectedId={project?.id ?? null}
        onSelect={setProject}
        onCreate={async (payload) => {
          const created = await actions.addProject.mutateAsync(payload);
          await client.invalidateQueries({ queryKey: ['projects'] });
          return created;
        }}
        onClose={() => setProjectPicker(false)}
      />
      <AssigneePicker
        visible={assigneePicker}
        current={assignee}
        onSelect={setAssignee}
        onClose={() => {
          setAssigneePicker(false);
          void refreshUser().catch(() => undefined);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  errorPage: { padding: spacing.lg },
  content: { padding: spacing.lg, paddingBottom: spacing.huge, gap: spacing.lg },
  moreSection: {
    borderTopWidth: 1,
    borderTopColor: colours.border,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    minHeight: 40,
  },
  fields: { gap: spacing.lg },
  fieldGroup: { gap: 7 },
  selector: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colours.borderStrong,
    backgroundColor: colours.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  selectorCopy: { flex: 1 },
  projectDot: { width: 10, height: 10, borderRadius: 5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  readOnlyNote: {
    borderRadius: radii.md,
    backgroundColor: colours.surfaceRaised,
    borderWidth: 1,
    borderColor: colours.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  actions: { flexDirection: 'row', gap: spacing.xs },
  primaryAction: { flex: 1.35 },
  secondaryAction: { flex: 1 },
  centre: { textAlign: 'center' },
});
