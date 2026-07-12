import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { FeatureToggle } from '@/components/settings/FeatureToggle';
import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { Screen } from '@/components/ui/Screen';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { colours, radii, spacing } from '@/constants/theme';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { createMcpToken, fetchMcpTokens, getApiBaseUrl, revokeMcpToken } from '@/lib/api';
import { formatDateTime } from '@/lib/date';

export default function SettingsScreen() {
  const router = useRouter();
  const client = useQueryClient();
  const { dates, delegation, aiAssistant, available, setFlag } = useFeatureFlags();
  const push = usePushNotifications();
  const [savingFlag, setSavingFlag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const tokens = useQuery({
    queryKey: ['mcp-tokens'],
    queryFn: fetchMcpTokens,
    enabled: aiAssistant,
  });
  const createToken = useMutation({
    mutationFn: createMcpToken,
    onSuccess: async (created) => {
      setNewToken(created.token);
      setTokenName('');
      await client.invalidateQueries({ queryKey: ['mcp-tokens'] });
    },
  });
  const revokeToken = useMutation({
    mutationFn: revokeMcpToken,
    onSuccess: () => client.invalidateQueries({ queryKey: ['mcp-tokens'] }),
  });

  const config = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            ballistic: {
              url: `${getApiBaseUrl()}/mcp`,
              headers: { Authorization: 'Bearer YOUR_MCP_TOKEN' },
            },
          },
        },
        null,
        2,
      ),
    [],
  );

  async function toggle(flag: 'dates' | 'delegation' | 'ai_assistant', value: boolean) {
    setSavingFlag(flag);
    setError(null);
    try {
      await setFlag(flag, value);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save this setting.');
    } finally {
      setSavingFlag(null);
    }
  }

  function confirmRevoke(id: string, name: string) {
    Alert.alert('Revoke token?', `“${name}” will stop working immediately.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: () => revokeToken.mutate(id) },
    ]);
  }

  const pushEnabled = push.state === 'enabled';
  const pushDescription =
    push.state === 'unsupported'
      ? 'Use a physical device and development build.'
      : push.state === 'denied'
        ? 'Blocked in system settings.'
        : pushEnabled
          ? 'Native task updates are enabled on this device.'
          : 'Get notified when delegated tasks change.';

  return (
    <Screen safeBottom>
      <SheetHeader
        title="Settings"
        subtitle="Shape Ballistic around how you work."
        onClose={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <ErrorNotice message={error} /> : null}
        <Section title="Features">
          <FeatureToggle
            icon="calendar-range"
            title="Dates & scheduling"
            description={
              available.dates ? 'Due dates, scheduled dates, and repeating tasks.' : 'Coming soon.'
            }
            value={dates}
            disabled={Boolean(savingFlag) || !available.dates}
            onChange={(value) => void toggle('dates', value)}
          />
          <FeatureToggle
            icon="account-multiple-outline"
            title="Task delegation"
            description={
              available.delegation
                ? 'Assign tasks and collaborate with other people.'
                : 'Coming soon.'
            }
            value={delegation}
            disabled={Boolean(savingFlag) || !available.delegation}
            onChange={(value) => void toggle('delegation', value)}
          />
          <FeatureToggle
            icon="robot-outline"
            title="AI assistant (MCP)"
            description={
              available.ai_assistant
                ? 'Manage dedicated tokens for agent integrations.'
                : 'Coming soon.'
            }
            value={aiAssistant}
            disabled={Boolean(savingFlag) || !available.ai_assistant}
            onChange={(value) => void toggle('ai_assistant', value)}
          />
        </Section>

        <Section title="Notifications">
          <FeatureToggle
            icon="bell-ring-outline"
            title="Native notifications"
            description={pushDescription}
            value={pushEnabled}
            disabled={push.busy || push.state === 'unsupported' || push.state === 'denied'}
            onChange={(value) => void (value ? push.enable() : push.disable())}
          />
          {push.error ? <ErrorNotice message={push.error} /> : null}
        </Section>

        {aiAssistant ? (
          <Section title="AI assistant tokens">
            {newToken ? (
              <View style={styles.tokenReveal}>
                <AppText variant="bodyStrong" colour={colours.success}>
                  Copy this token now
                </AppText>
                <AppText variant="caption" colour={colours.textMuted}>
                  For your security, it will not be shown again.
                </AppText>
                <AppText variant="mono" selectable style={styles.tokenText}>
                  {newToken}
                </AppText>
                <AppButton
                  label="Copy token"
                  icon="content-copy"
                  onPress={() => void Clipboard.setStringAsync(newToken)}
                />
              </View>
            ) : null}
            <View style={styles.createRow}>
              <View style={styles.tokenInput}>
                <AppTextField
                  value={tokenName}
                  onChangeText={setTokenName}
                  placeholder="Token name, e.g. Claude Desktop"
                />
              </View>
              <AppButton
                label="Create"
                compact
                loading={createToken.isPending}
                disabled={!tokenName.trim()}
                onPress={() => createToken.mutate(tokenName.trim())}
              />
            </View>
            {createToken.error ? <ErrorNotice message={createToken.error.message} /> : null}
            {tokens.data?.length ? (
              <View style={styles.tokenList}>
                {tokens.data.map((token) => (
                  <View key={token.id} style={styles.tokenRow}>
                    <View style={styles.tokenIcon}>
                      <AppIcon name="key-outline" size={20} colour={colours.blue} />
                    </View>
                    <View style={styles.tokenCopy}>
                      <AppText variant="bodyStrong">{token.name}</AppText>
                      <AppText variant="caption" colour={colours.textMuted}>
                        {token.created_at
                          ? `Created ${formatDateTime(token.created_at)}`
                          : 'Creation date unavailable'}
                        {token.last_used_at ? ` · Used ${formatDateTime(token.last_used_at)}` : ''}
                      </AppText>
                      {token.is_legacy_wildcard ? (
                        <AppText variant="caption" colour={colours.warning}>
                          Legacy wildcard — replace with a dedicated token.
                        </AppText>
                      ) : null}
                    </View>
                    <AppButton
                      label="Revoke"
                      variant="danger"
                      compact
                      onPress={() => confirmRevoke(token.id, token.name)}
                    />
                  </View>
                ))}
              </View>
            ) : !tokens.isLoading ? (
              <AppText variant="caption" colour={colours.textMuted}>
                No MCP tokens yet.
              </AppText>
            ) : null}
            <AppButton
              label={showConfig ? 'Hide MCP config' : 'Show MCP config'}
              variant="secondary"
              compact
              onPress={() => setShowConfig((visible) => !visible)}
            />
            {showConfig ? (
              <View style={styles.config}>
                <AppText variant="mono" selectable>
                  {config}
                </AppText>
                <AppButton
                  label="Copy config"
                  variant="ghost"
                  compact
                  icon="content-copy"
                  onPress={() => void Clipboard.setStringAsync(config)}
                />
              </View>
            ) : null}
          </Section>
        ) : null}

        <AppText variant="caption" colour={colours.textFaint} style={styles.version}>
          Ballistic v{Constants.expoConfig?.version ?? '0.1.0'}
        </AppText>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <AppText variant="eyebrow" colour={colours.textMuted}>
        {title}
      </AppText>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.huge, gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionContent: { gap: spacing.xs },
  tokenReveal: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: colours.successSoft,
    padding: spacing.md,
    gap: spacing.xs,
  },
  tokenText: { borderRadius: radii.sm, backgroundColor: '#D1FAE5', padding: spacing.sm },
  createRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  tokenInput: { flex: 1 },
  tokenList: { gap: spacing.xs },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colours.border,
    backgroundColor: colours.surface,
    padding: spacing.sm,
  },
  tokenIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.blueSoft,
  },
  tokenCopy: { flex: 1, gap: 2 },
  config: {
    borderRadius: radii.md,
    backgroundColor: colours.surfaceRaised,
    borderWidth: 1,
    borderColor: colours.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  version: { textAlign: 'center', paddingTop: spacing.md },
});
