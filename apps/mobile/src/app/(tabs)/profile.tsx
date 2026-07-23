import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { SyncStatusBanner } from '@/components/SyncStatusBanner';
import { Screen } from '@/components/ui/Screen';
import { colours, radii, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { deleteLocalAvatar, persistAvatarAsset } from '@/lib/avatar-files';
import type { UserUpdatePayload } from '@/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser, updateAvatar, logout, isAuthenticated, isRegistered } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [changingAvatar, setChangingAvatar] = useState(false);

  async function save() {
    setFeedback(null);
    try {
      const payload: UserUpdatePayload = {};
      const nextName = name.trim();
      const nextPhone = phone.trim() || null;
      const nextBio = bio.trim() || null;
      if (nextName && nextName !== user?.name) payload.name = nextName;
      if (isAuthenticated && email.trim() !== user?.email) payload.email = email.trim();
      if (nextPhone !== user?.phone) payload.phone = nextPhone;
      if (nextBio !== user?.bio) payload.bio = nextBio;
      await updateUser(payload);
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : 'Could not save your profile.');
    }
  }

  async function selectAvatar(source: 'library' | 'camera') {
    setFeedback(null);
    setChangingAvatar(true);
    let localFileUri: string | null = null;
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          throw new Error('Camera access is required to take a profile photo.');
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          throw new Error('Photo access is required to choose a profile photo.');
        }
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              ...options,
              cameraType: ImagePicker.CameraType.front,
            })
          : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;

      const avatar = persistAvatarAsset(result.assets[0]);
      localFileUri = avatar.fileUri;
      await updateAvatar(avatar);
    } catch (caught) {
      if (localFileUri) deleteLocalAvatar(localFileUri);
      setFeedback(caught instanceof Error ? caught.message : 'Could not use that profile photo.');
    } finally {
      setChangingAvatar(false);
    }
  }

  function confirmLogout() {
    Alert.alert(
      'Log out and erase this device?',
      'This removes all Ballistic data, cached files, queued changes, and settings from this device. Synced server data is not deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase and log out',
          style: 'destructive',
          onPress: () => {
            void logout().then(() => router.replace('/'));
          },
        },
      ],
    );
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              <AppText colour={colours.textMuted}>
                {isRegistered ? 'The person behind the momentum.' : 'Your private local journal.'}
              </AppText>
            </View>
          </View>

          <View style={styles.avatarActions}>
            <AppButton
              label="Choose photo"
              icon="image-outline"
              variant="secondary"
              compact
              disabled={changingAvatar}
              onPress={() => void selectAvatar('library')}
            />
            <AppButton
              label="Take photo"
              icon="camera-outline"
              variant="secondary"
              compact
              disabled={changingAvatar}
              onPress={() => void selectAvatar('camera')}
            />
          </View>

          <SyncStatusBanner />

          <View style={styles.settingsCard}>
            <View style={styles.accountIcon}>
              <AppIcon
                name={isAuthenticated ? 'cloud-check-outline' : 'cloud-outline'}
                size={22}
                colour={colours.blue}
              />
            </View>
            <View style={styles.settingsCopy}>
              <AppText variant="bodyStrong">
                {isAuthenticated
                  ? 'Account connected'
                  : isRegistered
                    ? 'Account offline'
                    : 'Optional account'}
              </AppText>
              <AppText variant="caption" colour={colours.textMuted}>
                {isAuthenticated
                  ? user.email
                  : isRegistered
                    ? 'Sign in to resume backup and sync.'
                    : 'Use Ballistic without registering, for as long as you like.'}
              </AppText>
            </View>
            {!isAuthenticated ? (
              <AppButton
                label={isRegistered ? 'Sign in' : 'Create'}
                variant="secondary"
                compact
                onPress={() => router.push(isRegistered ? '/login' : '/register')}
              />
            ) : null}
          </View>

          {!isRegistered ? (
            <AppButton
              label="I already have an account"
              variant="ghost"
              compact
              onPress={() => router.push('/login')}
            />
          ) : null}

          <View style={styles.settingsCard}>
            <View style={styles.settingsIcon}>
              <AppIcon name="tune-variant" size={22} colour={colours.blue} />
            </View>
            <View style={styles.settingsCopy}>
              <AppText variant="bodyStrong">App settings</AppText>
              <AppText variant="caption" colour={colours.textMuted}>
                Features, notifications, sync, and device preferences.
              </AppText>
            </View>
            <AppButton
              label="Open"
              variant="secondary"
              compact
              onPress={() => router.push('/settings')}
            />
          </View>

          {feedback ? <ErrorNotice message={feedback} /> : null}

          <View style={styles.form}>
            <AppTextField
              label="Name"
              value={name === 'You' && !isRegistered ? '' : name}
              onChangeText={setName}
              autoComplete="name"
              placeholder="Optional until you create an account"
            />
            {isRegistered ? (
              <AppTextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                editable={isAuthenticated}
                helper={isAuthenticated ? undefined : 'Sign in before changing your account email.'}
              />
            ) : null}
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
            <AppButton
              label="Save changes"
              disabled={(isRegistered && !name.trim()) || (isAuthenticated && !email.trim())}
              onPress={() => void save()}
            />
          </View>
          {isAuthenticated ? (
            <AppButton label="Log out" variant="danger" icon="logout" onPress={confirmLogout} />
          ) : null}
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
  avatarActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
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
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.blueSoft,
  },
  settingsCopy: { flex: 1, gap: 2 },
  form: { gap: spacing.md },
});
