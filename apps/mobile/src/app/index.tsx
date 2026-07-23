import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colours, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { authStorage } from '@/lib/auth-storage';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isReady, isRegistered, startOffline } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    if (!isReady) return () => undefined;
    if (!user) {
      setOnboardingComplete(false);
      return () => undefined;
    }
    if (isRegistered) {
      setOnboardingComplete(true);
      return () => undefined;
    }

    void authStorage
      .getOnboardingComplete()
      .then((complete) => {
        if (active) setOnboardingComplete(complete);
      })
      .catch(() => {
        if (active) setOnboardingComplete(false);
      });

    return () => {
      active = false;
    };
  }, [isReady, isRegistered, user]);

  async function continueOffline() {
    await startOffline();
    setOnboardingComplete(true);
    router.replace('/journal');
  }

  if (!isReady || (user && onboardingComplete === null)) return <LoadingScreen />;
  if (user && (isRegistered || onboardingComplete)) return <Redirect href="/journal" />;

  return (
    <AuthScaffold
      title="Create account or log in"
      subtitle="Connect an account to sync across devices, or keep your journal private on this phone."
    >
      <View style={styles.actions}>
        <AppButton
          label="Create account"
          icon="account-plus-outline"
          onPress={() => router.push('/register')}
        />
        <AppButton
          label="Log in"
          icon="login"
          variant="secondary"
          onPress={() => router.push('/login')}
        />
        <View style={styles.offlineChoice}>
          <AppText variant="caption" colour={colours.textMuted} style={styles.offlineCopy}>
            No account needed. Your data stays available offline and can be synced later.
          </AppText>
          <AppButton
            label="Continue offline"
            icon="cloud-off-outline"
            variant="ghost"
            compact
            onPress={() => void continueOffline()}
          />
        </View>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  offlineChoice: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.xs },
  offlineCopy: { textAlign: 'center' },
});
