import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/screens/home/styles";
import { colours } from "@/theme";

type DatePickerFieldProps = {
  label: string;
  value: string; // YYYY-MM-DD or empty
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

function parseDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function formatDisplay(value: string): string {
  if (!value) return "";
  const d = parseDateValue(value);
  if (!d) return value;
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DatePickerField({
  hint,
  label,
  maximumDate,
  minimumDate,
  onChange,
  placeholder = "Select date",
  value,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  // iOS inline picker date state (confirmed on "Done").
  const [iosDraft, setIosDraft] = useState<Date | undefined>(
    parseDateValue(value),
  );

  function handleAndroidChange(
    event: DateTimePickerEvent,
    selected?: Date,
  ) {
    setOpen(false);
    if (event.type === "set" && selected) {
      onChange(selected.toISOString().slice(0, 10));
    }
  }

  function handleIosChange(
    _event: DateTimePickerEvent,
    selected?: Date,
  ) {
    setIosDraft(selected);
  }

  function confirmIos() {
    if (iosDraft) {
      onChange(iosDraft.toISOString().slice(0, 10));
    }
    setOpen(false);
  }

  function clearDate() {
    onChange("");
    setOpen(false);
    setIosDraft(undefined);
  }

  function openPicker() {
    setIosDraft(parseDateValue(value) ?? new Date());
    setOpen(true);
  }

  const display = formatDisplay(value);

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.inputLabel}>{label}</Text>

      {/* Trigger */}
      <Pressable
        onPress={openPicker}
        accessibilityLabel={`${label}: ${display || placeholder}`}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.textInput,
          styles.datePickerTrigger,
          pressed && styles.pressedOpacity,
        ]}
      >
        <Text
          style={[
            styles.datePickerTriggerText,
            !display && styles.datePickerPlaceholder,
          ]}
        >
          {display || placeholder}
        </Text>
        <Text style={styles.datePickerChevron}>›</Text>
      </Pressable>

      {hint ? <Text style={styles.helperText}>{hint}</Text> : null}

      {/* Android — shows native dialog directly */}
      {Platform.OS === "android" && open ? (
        <DateTimePicker
          mode="date"
          display="default"
          value={parseDateValue(value) ?? new Date()}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleAndroidChange}
        />
      ) : null}

      {/* iOS — wrap in a modal sheet so the user can confirm or cancel */}
      {Platform.OS === "ios" ? (
        <Modal
          visible={open}
          transparent
          animationType="slide"
          onRequestClose={() => setOpen(false)}
          accessibilityViewIsModal
        >
          <Pressable
            style={styles.datePickerBackdrop}
            onPress={() => setOpen(false)}
          />
          <SafeAreaView edges={["bottom"]} style={styles.datePickerSheet}>
            <View style={styles.datePickerSheetHeader}>
              <Pressable
                onPress={clearDate}
                accessibilityRole="button"
                accessibilityLabel="Clear date"
                style={({ pressed }) => [
                  styles.datePickerAction,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={[styles.datePickerActionText, { color: colours.danger }]}>
                  Clear
                </Text>
              </Pressable>
              <Text style={styles.datePickerSheetTitle}>{label}</Text>
              <Pressable
                onPress={confirmIos}
                accessibilityRole="button"
                accessibilityLabel="Confirm date"
                style={({ pressed }) => [
                  styles.datePickerAction,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text
                  style={[
                    styles.datePickerActionText,
                    { color: colours.blueStrong, fontWeight: "700" },
                  ]}
                >
                  Done
                </Text>
              </Pressable>
            </View>
            <DateTimePicker
              mode="date"
              display="spinner"
              value={iosDraft ?? new Date()}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={handleIosChange}
              style={{ width: "100%" }}
              themeVariant="light"
            />
          </SafeAreaView>
        </Modal>
      ) : null}
    </View>
  );
}
