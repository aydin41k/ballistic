import { Text, TextInput, View } from "react-native";

import { styles } from "@/screens/home/styles";

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  minHeight?: number;
};

export function FormField({
  hint,
  label,
  minHeight,
  multiline,
  onChangeText,
  placeholder,
  value,
}: FormFieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        style={[
          styles.textInput,
          multiline ? styles.multilineInput : null,
          minHeight ? { minHeight } : null,
        ]}
      />
      {hint ? <Text style={styles.helperText}>{hint}</Text> : null}
    </View>
  );
}
