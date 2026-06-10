import { Text, TextInput, View, type TextInputProps } from "react-native";

import { styles } from "@/screens/auth/styles";

export type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  hint?: string;
} & Partial<
  Pick<
  TextInputProps,
  | "placeholder"
  | "secureTextEntry"
  | "autoCapitalize"
  | "autoCorrect"
  | "autoComplete"
  | "keyboardType"
  | "textContentType"
  | "returnKeyType"
  | "onSubmitEditing"
  >
>;

export function Field({
  label,
  value,
  onChangeText,
  error,
  hint,
  ...props
}: FieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor="#94A3B8"
        {...props}
      />
      {error ? <Text style={styles.errorCaption}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hintText}>{hint}</Text> : null}
    </View>
  );
}
