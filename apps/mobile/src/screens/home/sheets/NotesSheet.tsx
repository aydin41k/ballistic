import { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { toDisplayMessage } from "@/lib/http";
import { styles } from "@/screens/home/styles";
import { Sheet } from "@/screens/home/components/Sheet";
import type { User } from "@/types";

type NotesSheetProps = {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (notes: string | null) => Promise<void>;
};

export function NotesSheet({
  onClose,
  onSave,
  user,
  visible,
}: NotesSheetProps) {
  const [notes, setNotes] = useState("");
  const [originalNotes, setOriginalNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Guard against concurrent saves (e.g. onBlur fires at the same time as Close).
  const savingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      const currentNotes = user?.notes ?? "";
      setNotes(currentNotes);
      setOriginalNotes(currentNotes);
      setError(null);
    }
  }, [user?.notes, visible]);

  async function saveIfChanged() {
    // Prevent concurrent invocations (onBlur + persistAndClose race).
    if (savingRef.current) {
      return;
    }

    const nextValue = notes.trim() || null;
    const previousValue = originalNotes.trim() || null;

    if (nextValue === previousValue) {
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      await onSave(nextValue);
      setOriginalNotes(notes);
    } catch (candidate) {
      setError(toDisplayMessage(candidate, "Failed to save notes."));
      throw candidate;
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  async function persistAndClose() {
    try {
      await saveIfChanged();
      onClose();
    } catch {
      // Keep the sheet open so the user does not lose unsaved notes.
    }
  }

  return (
    <Sheet visible={visible} title="Notes" onClose={() => void persistAndClose()}>
      <View style={styles.sheetContent}>
        {error ? (
          <View style={styles.sheetErrorBanner}>
            <Text style={styles.sheetErrorText}>{error}</Text>
          </View>
        ) : null}
        <TextInput
          multiline
          value={notes}
          onChangeText={(value: string) => {
            setError(null);
            setNotes(value.slice(0, 10_000));
          }}
          style={[styles.textInput, styles.notesInput]}
          placeholder="Jot down anything..."
          placeholderTextColor="#94A3B8"
          accessibilityLabel="Notes scratchpad"
          onBlur={() =>
            void saveIfChanged().catch(() => {
              // Error state is set inside saveIfChanged.
            })
          }
        />
        <Text style={styles.helperText}>
          {notes.length.toLocaleString()} / 10,000 characters
        </Text>
        {saving ? <Text style={styles.helperText}>Saving...</Text> : null}
      </View>
    </Sheet>
  );
}
