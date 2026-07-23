import { useMemo, useState } from 'react';
import { FlatList, Modal, SafeAreaView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { MotionPressable } from '@/components/ui/MotionPressable';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { colours, radii, spacing } from '@/constants/theme';
import type { Project } from '@/types';

const palette = [
  '#2563EB',
  '#7C3AED',
  '#DB2777',
  '#DC2626',
  '#D97706',
  '#059669',
  '#0891B2',
  '#475569',
];

interface ProjectPickerProps {
  visible: boolean;
  projects: Project[];
  selectedId: string | null;
  onSelect: (project: Project | null) => void;
  onCreate: (payload: { name: string; color?: string | null }) => Promise<Project>;
  onClose: () => void;
}

export function ProjectPicker({
  visible,
  projects,
  selectedId,
  onSelect,
  onCreate,
  onClose,
}: ProjectPickerProps) {
  const [query, setQuery] = useState('');
  const [colour, setColour] = useState(palette[0]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filtered = useMemo(
    () =>
      projects.filter((project) => project.name.toLowerCase().includes(query.trim().toLowerCase())),
    [projects, query],
  );
  const canCreate =
    query.trim().length > 0 &&
    !projects.some((project) => project.name.toLowerCase() === query.trim().toLowerCase());

  async function create() {
    setCreating(true);
    setError(null);
    try {
      const project = await onCreate({ name: query.trim(), color: colour });
      onSelect(project);
      close();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create the project.');
    } finally {
      setCreating(false);
    }
  }

  function close() {
    setQuery('');
    setError(null);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <SafeAreaView style={styles.screen}>
        <SheetHeader title="Choose project" subtitle="Give this task a home." onClose={close} />
        <View style={styles.search}>
          <AppTextField
            value={query}
            onChangeText={setQuery}
            placeholder="Search or create a project"
            autoFocus
          />
          {error ? (
            <AppText variant="caption" colour={colours.danger}>
              {error}
            </AppText>
          ) : null}
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(project) => project.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <ProjectRow
              label="No project"
              selected={!selectedId}
              icon="inbox-outline"
              onPress={() => {
                onSelect(null);
                close();
              }}
            />
          }
          renderItem={({ item }) => (
            <ProjectRow
              label={item.name}
              selected={selectedId === item.id}
              colour={item.color}
              onPress={() => {
                onSelect(item);
                close();
              }}
            />
          )}
          ListFooterComponent={
            canCreate ? (
              <View style={styles.createCard}>
                <View style={styles.createCopy}>
                  <AppText variant="bodyStrong">Create “{query.trim()}”</AppText>
                  <AppText variant="caption" colour={colours.textMuted}>
                    Choose a project colour.
                  </AppText>
                </View>
                <View style={styles.palette}>
                  {palette.map((option) => (
                    <MotionPressable
                      key={option}
                      accessibilityLabel={`Use project colour ${option}`}
                      onPress={() => setColour(option)}
                      style={[
                        styles.colour,
                        { backgroundColor: option },
                        colour === option && styles.colourSelected,
                      ]}
                    />
                  ))}
                </View>
                <AppButton
                  label="Create project"
                  disabled={creating}
                  onPress={() => void create()}
                />
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

function ProjectRow({
  label,
  selected,
  colour,
  icon,
  onPress,
}: {
  label: string;
  selected: boolean;
  colour?: string | null;
  icon?: React.ComponentProps<typeof AppIcon>['name'];
  onPress: () => void;
}) {
  return (
    <MotionPressable onPress={onPress} style={[styles.row, selected && styles.rowSelected]}>
      {colour ? (
        <View style={[styles.projectDot, { backgroundColor: colour }]} />
      ) : icon ? (
        <AppIcon name={icon} size={20} colour={colours.textMuted} />
      ) : null}
      <AppText variant="bodyStrong" style={styles.rowLabel}>
        {label}
      </AppText>
      {selected ? <AppIcon name="check-circle" size={22} colour={colours.blue} /> : null}
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colours.page },
  search: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.xs },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xs },
  row: {
    minHeight: 54,
    borderRadius: radii.md,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowSelected: { borderColor: colours.blue, backgroundColor: colours.blueSoft },
  rowLabel: { flex: 1 },
  projectDot: { width: 12, height: 12, borderRadius: 6 },
  createCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
    gap: spacing.md,
  },
  createCopy: { gap: 2 },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  colour: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colours.transparent,
  },
  colourSelected: { borderColor: colours.navy },
});
