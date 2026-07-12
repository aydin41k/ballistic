import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { Screen } from '@/components/ui/Screen';
import { colours, radii, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(
    null,
  );

  async function save() {
    setSaving(true);
    setFeedback(null);
    try {
      await updateUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });
      setFeedback({ type: 'success', message: 'Profile updated.' });
    } catch (caught) {
      setFeedback({
        type: 'error',
        message: caught instanceof Error ? caught.message : 'Could not save your profile.',
      });
    } finally {
      setSaving(false);
    }
  }

  function confirmLogout() {
    Alert.alert('Log out?', 'Your journal will remain safely stored on the server.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void logout() },
    ]);
  }

  if (!user) return null;
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            {user.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatar}>
                <AppText variant="title" colour="#FFFFFF">
                  {initials}
                </AppText>
              </View>
            )}
            <View style={styles.headerCopy}>
              <AppText variant="headline">Profile</AppText>
              <AppText colour={colours.textMuted}>The person behind the momentum.</AppText>
            </View>
          </View>

          <View style={styles.settingsCard}>
            <View style={styles.settingsIcon}>
              <AppIcon name="tune-variant" size={22} colour={colours.blue} />
            </View>
            <View style={styles.settingsCopy}>
              <AppText variant="bodyStrong">App settings</AppText>
              <AppText variant="caption" colour={colours.textMuted}>
                Features, notifications, and AI assistant tokens.
              </AppText>
            </View>
            <AppButton
              label="Open"
              variant="secondary"
              compact
              onPress={() => router.push('/settings')}
            />
          </View>

          {feedback?.type === 'error' ? <ErrorNotice message={feedback.message} /> : null}
          {feedback?.type === 'success' ? (
            <View style={styles.success}>
              <AppIcon name="check-circle" size={18} colour={colours.success} />
              <AppText variant="caption" colour={colours.success}>
                {feedback.message}
              </AppText>
            </View>
          ) : null}

          <View style={styles.form}>
            <AppTextField label="Name" value={name} onChangeText={setName} autoComplete="name" />
            <AppTextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
            <AppTextField
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              autoComplete="tel"
              keyboardType="phone-pad"
              placeholder="Optional"
            />
            <AppTextField
              label="Bio"
              value={bio}
              onChangeText={(value) => setBio(value.slice(0, 500))}
              multiline
              placeholder="Tell us about yourself"
              helper={`${bio.length}/500`}
            />
            <AppTextField
              label="Avatar URL"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://example.com/avatar.jpg"
            />
            <AppButton
              label="Save changes"
              loading={saving}
              disabled={!name.trim() || !email.trim()}
              onPress={() => void save()}
            />
          </View>
          <AppButton label="Log out" variant="danger" icon="logout" onPress={confirmLogout} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 140, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.xs },
  headerCopy: { flex: 1, gap: 2 },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.blue,
    ...shadows.card,
  },
  avatarImage: { width: 70, height: 70, borderRadius: 35, backgroundColor: colours.blueSoft },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
  },
  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.blueSoft,
  },
  settingsCopy: { flex: 1, gap: 2 },
  success: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: colours.successSoft,
    padding: spacing.sm,
  },
  form: { gap: spacing.md },
});
