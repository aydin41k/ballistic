import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { colours, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setFieldErrors({});
    if (password.length < 8) {
      setFieldErrors({ password: ['Use at least 8 characters.'] });
      return;
    }
    if (password !== confirmation) {
      setFieldErrors({ password_confirmation: ['Passwords do not match.'] });
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, email, password, password_confirmation: confirmation });
      router.replace('/journal');
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors(caught.errors);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScaffold title="Create your journal" subtitle="A calm place for everything in motion.">
      <View style={styles.form}>
        {error ? <ErrorNotice message={error} /> : null}
        <AppTextField
          label="Name"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          placeholder="Your name"
          error={fieldErrors.name?.[0]}
        />
        <AppTextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          error={fieldErrors.email?.[0]}
        />
        <AppTextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={fieldErrors.password?.[0]}
        />
        <AppTextField
          label="Confirm password"
          value={confirmation}
          onChangeText={setConfirmation}
          secureTextEntry
          autoComplete="new-password"
          placeholder="Type it once more"
          error={fieldErrors.password_confirmation?.[0]}
          onSubmitEditing={() => void submit()}
        />
        <AppButton
          label={submitting ? 'Creating account…' : 'Create account'}
          onPress={() => void submit()}
          loading={submitting}
          disabled={!name.trim() || !email.trim() || !password || !confirmation}
        />
      </View>
      <View style={styles.footer}>
        <AppText variant="caption" colour={colours.textMuted}>
          Already have an account?
        </AppText>
        <AppButton label="Sign in" variant="ghost" compact onPress={() => router.back()} />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  footer: { alignItems: 'center', gap: 2 },
});
