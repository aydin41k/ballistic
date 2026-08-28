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
import type { RegistrationResponse, VerificationChannel } from '@/types';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, startOffline, user } = useAuth();
  const [name, setName] = useState(user?.name === 'You' ? '' : (user?.name ?? ''));
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [verificationChannel, setVerificationChannel] = useState<VerificationChannel>('email');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<RegistrationResponse | null>(null);
  const [resending, setResending] = useState(false);
  const [hasResent, setHasResent] = useState(false);

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
        phone,
        password,
        password_confirmation: passwordConfirmation,
        verification_channel: verificationChannel,
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
        title={`Check your ${registrationResult.verification_channel === 'sms' ? 'messages' : 'email'}`}
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

  return (
    <AuthScaffold
      title="Sync your journal"
      subtitle="Your on-device tasks and notes will be kept and added to your account."
    >
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
        <View style={styles.channelSection}>
          <AppText variant="bodyStrong">Send confirmation by</AppText>
          <View style={styles.channelButtons}>
            <View style={styles.channelButton}>
              <AppButton
                label="Email"
                compact
                variant={verificationChannel === 'email' ? 'primary' : 'secondary'}
                onPress={() => setVerificationChannel('email')}
              />
            </View>
            <View style={styles.channelButton}>
              <AppButton
                label="SMS"
                compact
                variant={verificationChannel === 'sms' ? 'primary' : 'secondary'}
                onPress={() => setVerificationChannel('sms')}
              />
            </View>
          </View>
          {fieldErrors.verification_channel?.[0] ? (
            <AppText variant="caption" colour={colours.danger}>
              {fieldErrors.verification_channel[0]}
            </AppText>
          ) : null}
        </View>
        {verificationChannel === 'sms' ? (
          <AppTextField
            label="Mobile number"
            value={phone}
            onChangeText={setPhone}
            autoCapitalize="none"
            autoComplete="tel"
            keyboardType="phone-pad"
            placeholder="+61412345678"
            helper="Use international format, including + and country code."
            error={fieldErrors.phone?.[0]}
          />
        ) : null}
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
          disabled={
            !name.trim() ||
            !email.trim() ||
            !password ||
            !passwordConfirmation ||
            (verificationChannel === 'sms' && !phone.trim())
          }
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
  channelSection: { gap: spacing.sm },
  channelButtons: { flexDirection: 'row', gap: spacing.sm },
  channelButton: { flex: 1 },
  footer: { alignItems: 'center', gap: 2 },
});
