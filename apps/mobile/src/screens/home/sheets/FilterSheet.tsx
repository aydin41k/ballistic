import { Pressable, ScrollView, Text, View } from "react-native";

import { NO_PROJECT_FILTER_ID } from "@/lib/projectFilters";
import { styles } from "@/screens/home/styles";
import { ChoiceChip } from "@/screens/home/components/ChoiceChip";
import { Sheet } from "@/screens/home/components/Sheet";
import type { ItemScope, Project } from "@/types";

type FilterSheetProps = {
  visible: boolean;
  datesEnabled: boolean;
  excludedProjectIds: Set<string>;
  onClose: () => void;
  onExcludedProjectsChange: (value: Set<string>) => void;
  onScopeChange: (scope: ItemScope) => void;
  projects: Project[];
  viewScope: ItemScope;
};

export function FilterSheet({
  visible,
  datesEnabled,
  excludedProjectIds,
  onClose,
  onExcludedProjectsChange,
  onScopeChange,
  projects,
  viewScope,
}: FilterSheetProps) {
  function toggleProject(id: string) {
    const next = new Set(excludedProjectIds);

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    onExcludedProjectsChange(next);
  }

  return (
    <Sheet visible={visible} title="Filters" onClose={onClose}>
      <ScrollView contentContainerStyle={styles.sheetContent}>
        <Text style={styles.groupHeading}>Projects</Text>
        <View style={styles.selectionWrap}>
          <ChoiceChip
            label="No project"
            selected={!excludedProjectIds.has(NO_PROJECT_FILTER_ID)}
            onPress={() => toggleProject(NO_PROJECT_FILTER_ID)}
          />
          {projects.map((project) => (
            <ChoiceChip
              key={project.id}
              label={project.name}
              selected={!excludedProjectIds.has(project.id)}
              onPress={() => toggleProject(project.id)}
            />
          ))}
        </View>

        <Pressable
          onPress={() => onExcludedProjectsChange(new Set())}
          style={styles.secondaryActionButton}
          accessibilityLabel="Show all projects"
          accessibilityRole="button"
        >
          <Text style={styles.secondaryActionButtonText}>Show all projects</Text>
        </Pressable>

        {datesEnabled ? (
          <>
            <Text style={styles.groupHeading}>Scope</Text>
            <View style={styles.selectionWrap}>
              <ChoiceChip
                label="Active"
                selected={viewScope === "active"}
                onPress={() => onScopeChange("active")}
              />
              <ChoiceChip
                label="Planned"
                selected={viewScope === "planned"}
                onPress={() => onScopeChange("planned")}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}
