import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { MotionPressable } from '@/components/ui/MotionPressable';
import { colours, radii, spacing } from '@/constants/theme';
import { formatDateKey, fromDateKey, toDateKey } from '@/lib/date';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  minimumDate?: Date;
}

export function DateField({ label, value, onChange, helper, minimumDate }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ? fromDateKey(value) : new Date());

  function show() {
    setDraft(value ? fromDateKey(value) : (minimumDate ?? new Date()));
    setOpen(true);
    void Haptics.selectionAsync();
  }

  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" colour={colours.textMuted}>
        {label}
      </AppText>
      <View style={styles.row}>
        <MotionPressable onPress={show} style={styles.field} accessibilityRole="button">
          <AppIcon name="calendar-blank-outline" size={19} colour={colours.blue} />
          <AppText colour={value ? colours.text : colours.textFaint}>
            {value ? formatDateKey(value, true) : 'Choose a date'}
          </AppText>
        </MotionPressable>
        {value ? (
          <AppButton label="Clear" variant="ghost" compact onPress={() => onChange('')} />
        ) : null}
      </View>
      {helper ? (
        <AppText variant="caption" colour={colours.textFaint}>
          {helper}
        </AppText>
      ) : null}

      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          value={draft}
          mode="date"
          minimumDate={minimumDate}
          onChange={(_event, selected) => {
            setOpen(false);
            if (selected) onChange(toDateKey(selected));
          }}
        />
      ) : null}

      {Platform.OS !== 'android' ? (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <View style={styles.backdrop}>
            <View style={styles.pickerCard}>
              <DateTimePicker
                value={draft}
                mode="date"
                display="inline"
                minimumDate={minimumDate}
                onChange={(_event, selected) => selected && setDraft(selected)}
                accentColor={colours.blue}
              />
              <View style={styles.actions}>
                <AppButton
                  label="Cancel"
                  variant="secondary"
                  compact
                  onPress={() => setOpen(false)}
                />
                <AppButton
                  label="Use date"
                  compact
                  onPress={() => {
                    onChange(toDateKey(draft));
                    setOpen(false);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  field: {
    flex: 1,
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colours.borderStrong,
    backgroundColor: colours.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colours.overlay,
    padding: spacing.md,
  },
  pickerCard: {
    backgroundColor: colours.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.xs },
});
