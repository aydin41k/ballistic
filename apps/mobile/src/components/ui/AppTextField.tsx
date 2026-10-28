import { forwardRef } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colours, radii, spacing, typography } from '@/constants/theme';

interface AppTextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
}

export const AppTextField = forwardRef<TextInput, AppTextFieldProps>(function AppTextField(
  { label, error, helper, style, multiline, ...props },
  ref,
) {
  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="caption" colour={colours.textMuted}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        {...props}
        ref={ref}
        multiline={multiline}
        placeholderTextColor={colours.textFaint}
        selectionColor={colours.blueBright}
        style={[
          styles.input,
          multiline && styles.multiline,
          error ? styles.errorInput : undefined,
          style,
        ]}
      />
      {error ? (
        <AppText variant="caption" colour={colours.danger}>
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="caption" colour={colours.textFaint}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  input: {
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colours.borderStrong,
    backgroundColor: colours.surface,
    color: colours.text,
    fontFamily: typography.ui,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  multiline: { minHeight: 112, textAlignVertical: 'top' },
  errorInput: { borderColor: colours.danger },
});
