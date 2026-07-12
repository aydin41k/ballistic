import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { ItemScope } from '@/types';

const storageKey = 'ballistic_journal_preferences';
export const noProjectFilterId = '__no_project__';

interface JournalPreferencesValue {
  scope: ItemScope;
  setScope: (scope: ItemScope) => void;
  excludedProjectIds: Set<string>;
  toggleProject: (projectId: string) => void;
  clearProjects: () => void;
  activeFilterCount: number;
}

const JournalPreferencesContext = createContext<JournalPreferencesValue | null>(null);

export function JournalPreferencesProvider({ children }: PropsWithChildren) {
  const [scope, setScopeState] = useState<ItemScope>('active');
  const [excludedProjectIds, setExcludedProjectIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as { scope?: ItemScope; excludedProjectIds?: string[] };
        if (saved.scope) setScopeState(saved.scope);
        if (saved.excludedProjectIds) setExcludedProjectIds(new Set(saved.excludedProjectIds));
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(
      storageKey,
      JSON.stringify({ scope, excludedProjectIds: [...excludedProjectIds] }),
    );
  }, [excludedProjectIds, hydrated, scope]);

  const setScope = useCallback((nextScope: ItemScope) => setScopeState(nextScope), []);
  const toggleProject = useCallback((projectId: string) => {
    setExcludedProjectIds((current) => {
      const next = new Set(current);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);
  const clearProjects = useCallback(() => setExcludedProjectIds(new Set()), []);

  const value = useMemo<JournalPreferencesValue>(
    () => ({
      scope,
      setScope,
      excludedProjectIds,
      toggleProject,
      clearProjects,
      activeFilterCount: excludedProjectIds.size + (scope === 'planned' ? 1 : 0),
    }),
    [clearProjects, excludedProjectIds, scope, setScope, toggleProject],
  );

  return (
    <JournalPreferencesContext.Provider value={value}>
      {children}
    </JournalPreferencesContext.Provider>
  );
}

export function useJournalPreferences(): JournalPreferencesValue {
  const context = useContext(JournalPreferencesContext);
  if (!context) throw new Error('useJournalPreferences must be used inside its provider.');
  return context;
}
