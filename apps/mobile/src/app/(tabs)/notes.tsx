import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { colours, radii, shadows, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const maxCharacters = 10_000;

export default function NotesScreen() {
  const { user, updateUser } = useAuth();
  const [notes, setNotes] = useState(user?.notes ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const lastSaved = useRef(user?.notes ?? '');
  const notesRef = useRef(notes);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const save = useCallback(async () => {
    const value = notesRef.current;
    if (value === lastSaved.current) return;
    setState('saving');
    try {
      await updateUser({ notes: value || null });
      lastSaved.current = value;
      setState('saved');
      setTimeout(() => setState('idle'), 1400);
    } catch {
      setState('error');
    }
  }, [updateUser]);

  useEffect(() => {
    const timer = setTimeout(() => void save(), 900);
    return () => clearTimeout(timer);
  }, [notes, save]);

  useEffect(() => () => void save(), [save]);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <View style={styles.headingIcon}>
              <AppIcon name="notebook-outline" size={25} colour={colours.blue} />
            </View>
            <View style={styles.headingCopy}>
              <AppText variant="headline">Notes</AppText>
              <AppText colour={colours.textMuted}>
                A quiet scratchpad for everything around the edges.
              </AppText>
            </View>
          </View>
          <Animated.View entering={FadeIn.duration(300)} style={styles.paper}>
            <TextInput
              value={notes}
              onChangeText={(value) => setNotes(value.slice(0, maxCharacters))}
              onBlur={() => void save()}
              multiline
              textAlignVertical="top"
              placeholder="Jot down anything…"
              placeholderTextColor={colours.textFaint}
              selectionColor={colours.blueBright}
              style={styles.input}
            />
            <View style={styles.meta}>
              <View style={styles.saveState}>
                {state === 'saving' ? (
                  <AppIcon name="cloud-upload-outline" size={16} colour={colours.textFaint} />
                ) : null}
                {state === 'saved' ? (
                  <AppIcon name="check-circle" size={16} colour={colours.success} />
                ) : null}
                {state === 'error' ? (
                  <AppIcon name="alert-circle" size={16} colour={colours.danger} />
                ) : null}
                <AppText
                  variant="caption"
                  colour={
                    state === 'error'
                      ? colours.danger
                      : state === 'saved'
                        ? colours.success
                        : colours.textFaint
                  }
                >
                  {state === 'saving'
                    ? 'Saving…'
                    : state === 'saved'
                      ? 'Saved'
                      : state === 'error'
                        ? 'Could not save'
                        : 'Autosaves as you write'}
                </AppText>
              </View>
              <AppText variant="caption" colour={colours.textFaint}>
                {notes.length.toLocaleString('en-AU')} / {maxCharacters.toLocaleString('en-AU')}
              </AppText>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 140, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xs },
  headingIcon: {
    width: 50,
    height: 50,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.blueSoft,
  },
  headingCopy: { flex: 1, gap: 2 },
  paper: {
    minHeight: 520,
    borderRadius: radii.lg,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  input: {
    minHeight: 470,
    padding: spacing.lg,
    color: colours.text,
    fontFamily: typography.reading,
    fontSize: 17,
    lineHeight: 27,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colours.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveState: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
