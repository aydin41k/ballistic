import { useEffect, useState } from 'react';
import { FlatList, Modal, SafeAreaView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { MotionPressable } from '@/components/ui/MotionPressable';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { colours, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { discoverUser, lookupUsers, toggleFavourite } from '@/lib/api';
import type { UserLookup } from '@/types';

interface AssigneePickerProps {
  visible: boolean;
  current: UserLookup | null;
  onSelect: (user: UserLookup | null) => void;
  onClose: () => void;
}

export function AssigneePicker({ visible, current, onSelect, onClose }: AssigneePickerProps) {
  const { user, refreshUser } = useAuth();
  const favourites = user?.favourites ?? [];
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserLookup[]>([]);
  const [discovered, setDiscovered] = useState<UserLookup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || query.trim().length < 3) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setDiscovered(null);
      try {
        const connected = await lookupUsers(query.trim());
        if (cancelled) return;
        setResults(connected);
        if (connected.length === 0) {
          const discovery = await discoverUser(query.trim());
          if (!cancelled) setDiscovered(discovery.found ? (discovery.user ?? null) : null);
        }
      } catch {
        if (!cancelled) setError('Could not search for people.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 320);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, visible]);

  const isFavourite = (id: string) => favourites.some((favourite) => favourite.id === id);

  async function favourite(id: string) {
    setToggling(id);
    try {
      await toggleFavourite(id);
      await refreshUser();
    } catch {
      setError('Could not update favourites.');
    } finally {
      setToggling(null);
    }
  }

  function select(person: UserLookup | null) {
    onSelect(person);
    close();
  }

  function close() {
    setQuery('');
    setResults([]);
    setDiscovered(null);
    setError(null);
    onClose();
  }

  const displayResults = query.trim().length < 3 ? favourites : results;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <SafeAreaView style={styles.screen}>
        <SheetHeader
          title="Assign task"
          subtitle="Search by email or the last 9 phone digits."
          onClose={close}
        />
        <View style={styles.search}>
          <AppTextField
            value={query}
            onChangeText={setQuery}
            placeholder="Email or phone"
            autoCapitalize="none"
            autoFocus
          />
          {current ? (
            <View style={styles.current}>
              <Avatar person={current} />
              <View style={styles.personCopy}>
                <AppText variant="bodyStrong">{current.name}</AppText>
                <AppText variant="caption" colour={colours.textMuted}>
                  {current.email_masked}
                </AppText>
              </View>
              <AppButton label="Remove" variant="danger" compact onPress={() => select(null)} />
            </View>
          ) : null}
          {query.trim().length < 3 && favourites.length > 0 ? (
            <AppText variant="eyebrow" colour={colours.textMuted}>
              Favourites
            </AppText>
          ) : null}
          {loading ? (
            <AppText variant="caption" colour={colours.textMuted}>
              Searching…
            </AppText>
          ) : null}
          {error ? (
            <AppText variant="caption" colour={colours.danger}>
              {error}
            </AppText>
          ) : null}
        </View>
        <FlatList
          data={displayResults}
          keyExtractor={(person) => person.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PersonRow
              person={item}
              favourite={isFavourite(item.id)}
              toggling={toggling === item.id}
              onPress={() => select(item)}
              onFavourite={() => void favourite(item.id)}
            />
          )}
          ListFooterComponent={
            query.trim().length >= 3 && discovered ? (
              <View style={styles.discoveredSection}>
                <AppText variant="caption" colour={colours.warning}>
                  Person found — assigning will connect you automatically.
                </AppText>
                <PersonRow
                  person={discovered}
                  favourite={false}
                  onPress={() => select(discovered)}
                />
              </View>
            ) : !loading && query.trim().length >= 3 && results.length === 0 && !error ? (
              <AppText style={styles.empty} colour={colours.textMuted}>
                No matching person found.
              </AppText>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

function PersonRow({
  person,
  favourite,
  toggling = false,
  onPress,
  onFavourite,
}: {
  person: UserLookup;
  favourite: boolean;
  toggling?: boolean;
  onPress: () => void;
  onFavourite?: () => void;
}) {
  return (
    <MotionPressable onPress={onPress} style={styles.personRow}>
      <Avatar person={person} />
      <View style={styles.personCopy}>
        <AppText variant="bodyStrong">{person.name}</AppText>
        <AppText variant="caption" colour={colours.textMuted}>
          {person.email_masked}
        </AppText>
      </View>
      {onFavourite ? (
        <MotionPressable
          disabled={toggling}
          onPress={(event) => {
            event.stopPropagation();
            onFavourite();
          }}
          hitSlop={10}
          accessibilityLabel={favourite ? 'Remove favourite' : 'Add favourite'}
        >
          <AppIcon
            name={favourite ? 'star' : 'star-outline'}
            size={24}
            colour={favourite ? '#F59E0B' : colours.textFaint}
          />
        </MotionPressable>
      ) : null}
    </MotionPressable>
  );
}

function Avatar({ person }: { person: UserLookup }) {
  return (
    <View style={styles.avatar}>
      <AppText variant="bodyStrong" colour="#FFFFFF">
        {person.name.charAt(0).toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colours.page },
  search: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  list: { padding: spacing.lg, gap: spacing.xs },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
  },
  personRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
    padding: spacing.sm,
  },
  personCopy: { flex: 1 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.blue,
  },
  discoveredSection: { gap: spacing.xs, paddingTop: spacing.sm },
  empty: { textAlign: 'center', paddingVertical: spacing.xl },
});
