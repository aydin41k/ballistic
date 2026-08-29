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
import { ApiError, resendAccountVerification } from '@/lib/api';
import type { RegistrationResponse } from '@/types';

export default function RegisterScreen() {
  const router = useRouter();
  const { loginWithGoogle, register, startOffline, user } = useAuth();
  const [name, setName] = useState(user?.name === 'You' ? '' : (user?.name ?? ''));
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<RegistrationResponse | null>(null);
  const [resending, setResending] = useState(false);
  const [hasResent, setHasResent] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setFieldErrors({});
    if (password.length < 8) {
      setFieldErrors({ password: ['Use at least 8 characters.'] });
      return;
    }
    if (password !== passwordConfirmation) {
      setFieldErrors({ password_confirmation: ['Passwords do not match.'] });
      return;
    }

    setSubmitting(true);
    try {
      const response = await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setRegistrationResult(response);
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

  if (registrationResult) {
    return (
      <AuthScaffold
        title="Check your email"
        subtitle={`We sent a confirmation link to ${registrationResult.destination}. Open it and complete the human check to activate your account.`}
      >
        <View style={styles.form}>
          {error ? <ErrorNotice message={error} /> : null}
          {hasResent ? (
            <AppText colour={colours.success}>A fresh link has been sent by email.</AppText>
          ) : (
            <AppButton
              label={resending ? 'Sending…' : 'Resend by email'}
              variant="secondary"
              loading={resending}
              onPress={() => void resend()}
            />
          )}
          <AppButton label="Go to log in" onPress={() => router.replace('/login')} />
          <AppButton
            label="Continue offline"
            variant="secondary"
            onPress={() => void continueOffline()}
          />
        </View>
      </AuthScaffold>
    );
  }

  async function continueOffline() {
    await startOffline();
    router.replace('/journal');
  }

  async function resend() {
    setResending(true);
    setError(null);
    try {
      await resendAccountVerification(email);
      setHasResent(true);
    } catch {
      setError('We could not resend the email. Please try again.');
    } finally {
      setResending(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    setGoogleSubmitting(true);
    try {
      if (await loginWithGoogle()) router.replace('/journal');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Google sign-in could not be completed.');
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <AuthScaffold
      title="Sync your journal"
      subtitle="Your on-device tasks and notes will be kept and added to your account."
    >
      <View style={styles.form}>
        {error ? <ErrorNotice message={error} /> : null}
        <AppButton
          label={googleSubmitting ? 'Opening Google…' : 'Continue with Google'}
          icon="google"
          variant="secondary"
          onPress={() => void signInWithGoogle()}
          loading={googleSubmitting}
        />
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <AppText variant="caption" colour={colours.textMuted}>
            or create a password
          </AppText>
          <View style={styles.dividerLine} />
        </View>
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
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="new-password"
          textContentType="newPassword"
          keyboardType="default"
          returnKeyType="next"
          placeholder="At least 8 characters"
          error={fieldErrors.password?.[0]}
        />
        <AppTextField
          label="Confirm password"
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="new-password"
          textContentType="newPassword"
          keyboardType="default"
          returnKeyType="go"
          placeholder="Type it once more"
          error={fieldErrors.password_confirmation?.[0]}
          onSubmitEditing={() => void submit()}
        />
        <AppButton
          label={submitting ? 'Creating account…' : 'Create account'}
          onPress={() => void submit()}
          loading={submitting}
          disabled={!name.trim() || !email.trim() || !password || !passwordConfirmation}
        />
        <AppButton
          label="Continue offline"
          variant="secondary"
          onPress={() => void continueOffline()}
        />
      </View>
      <View style={styles.footer}>
        <AppText variant="caption" colour={colours.textMuted}>
          Already have an account?
        </AppText>
        <AppButton
          label="Log in"
          variant="ghost"
          compact
          onPress={() => router.replace('/login')}
        />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colours.border },
  footer: { alignItems: 'center', gap: 2 },
});
