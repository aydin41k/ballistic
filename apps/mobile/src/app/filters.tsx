import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { colours, spacing } from '@/constants/theme';
import { noProjectFilterId, useJournalPreferences } from '@/contexts/JournalPreferencesContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useHardwareBackDismiss } from '@/hooks/useHardwareBackDismiss';
import { offlineStore } from '@/lib/offline-store';

export default function FiltersScreen() {
  const router = useRouter();
  useHardwareBackDismiss(() => router.back());
  const { dates } = useFeatureFlags();
  const { scope, setScope, excludedProjectIds, toggleProject, clearProjects } =
    useJournalPreferences();
  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: offlineStore.getProjects,
    staleTime: Infinity,
    networkMode: 'always',
  });

  return (
    <Screen safeBottom>
      <SheetHeader
        title="Filter journal"
        subtitle="Tap a project to hide or show it."
        onClose={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <AppText variant="eyebrow" colour={colours.textMuted}>
            Projects
          </AppText>
          {excludedProjectIds.size > 0 ? (
            <AppButton label="Show all" variant="ghost" compact onPress={clearProjects} />
          ) : null}
        </View>
        <View style={styles.chips}>
          <Chip
            label="No project"
            selected={!excludedProjectIds.has(noProjectFilterId)}
            crossedOut={excludedProjectIds.has(noProjectFilterId)}
            onPress={() => toggleProject(noProjectFilterId)}
          />
          {projects.data?.map((project) => {
            const excluded = excludedProjectIds.has(project.id);
            return (
              <Chip
                key={project.id}
                label={project.name}
                colour={project.color}
                selected={!excluded}
                crossedOut={excluded}
                onPress={() => toggleProject(project.id)}
              />
            );
          })}
        </View>

        {dates ? (
          <View style={styles.section}>
            <AppText variant="eyebrow" colour={colours.textMuted}>
              Scope
            </AppText>
            <View style={styles.chips}>
              <Chip
                label="Active"
                icon="weather-sunny"
                selected={scope === 'active'}
                onPress={() => setScope('active')}
              />
              <Chip
                label="Planned"
                icon="calendar-clock"
                selected={scope === 'planned'}
                onPress={() => setScope('planned')}
              />
            </View>
            <AppText variant="caption" colour={colours.textFaint}>
              Active shows tasks ready now. Planned holds tasks scheduled for a future date.
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
