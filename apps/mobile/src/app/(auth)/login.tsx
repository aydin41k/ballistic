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

export default function LoginScreen() {
  const router = useRouter();
  const { login, startOffline, user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await login(email, password);
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

  async function continueOffline() {
    await startOffline();
    router.replace('/journal');
  }

  return (
    <AuthScaffold title="Welcome back" subtitle="Pick up exactly where you left off.">
      <View style={styles.form}>
        {error ? <ErrorNotice message={error} /> : null}
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
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="current-password"
          textContentType="password"
          keyboardType="default"
          returnKeyType="go"
          placeholder="Your password"
          error={fieldErrors.password?.[0]}
          onSubmitEditing={() => void submit()}
        />
        <AppButton
          label={submitting ? 'Logging in…' : 'Log in'}
          onPress={() => void submit()}
          loading={submitting}
          disabled={!email.trim() || !password}
        />
        <AppButton
          label="Continue offline"
          variant="secondary"
          onPress={() => void continueOffline()}
        />
      </View>
      <View style={styles.footer}>
        <AppText variant="caption" colour={colours.textMuted}>
          New to Ballistic?
        </AppText>
        <AppButton
          label="Create account"
          variant="ghost"
          compact
          onPress={() => router.replace('/register')}
        />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  footer: { alignItems: 'center', gap: 2 },
});
