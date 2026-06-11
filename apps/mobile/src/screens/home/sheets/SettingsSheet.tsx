import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  createMcpToken,
  fetchMcpTokens,
  revokeMcpToken,
} from "@/lib/api";
import { getApiBaseUrl } from "@/lib/auth";
import { toDisplayMessage } from "@/lib/http";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { SettingRow } from "@/screens/home/components/SettingRow";
import { Sheet } from "@/screens/home/components/Sheet";
import { styles } from "@/screens/home/styles";
import { formatDateTime } from "@/screens/home/utils";
import { colours } from "@/theme";
import type { McpToken } from "@/types";

type SettingsSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsSheet({
  onClose,
  visible,
}: SettingsSheetProps) {
  const { aiAssistant, available, setFlag, userFlags } = useFeatureFlags();
  const [saving, setSaving] = useState(false);
  const [tokens, setTokens] = useState<McpToken[]>([]);
  const [tokenName, setTokenName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTokens = useCallback(async () => {
    if (!aiAssistant) {
      setTokens([]);
      setError(null);
      return;
    }

    setLoadingTokens(true);

    try {
      setTokens(await fetchMcpTokens());
      setError(null);
    } catch (candidate) {
      setError(toDisplayMessage(candidate, "Failed to load AI assistant tokens."));
    } finally {
      setLoadingTokens(false);
    }
  }, [aiAssistant]);

  useEffect(() => {
    if (visible) {
      void loadTokens();
    }
  }, [loadTokens, visible]);

  async function toggle(
    flag: "dates" | "delegation" | "ai_assistant",
    value: boolean,
  ) {
    setSaving(true);

    try {
      await setFlag(flag, value);
      setError(null);
    } catch (candidate) {
      setError(toDisplayMessage(candidate, "Failed to update settings."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet visible={visible} title="Settings" onClose={onClose}>
      <ScrollView
        contentContainerStyle={styles.sheetContent}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View style={styles.sheetErrorBanner}>
            <Text style={styles.sheetErrorText}>{error}</Text>
          </View>
        ) : null}
        <Text style={styles.groupHeading}>Features</Text>
        <SettingRow
          label="Dates & scheduling"
          description={
            available.dates
              ? "Due dates, scheduled dates, and repeating tasks."
              : "Coming soon."
          }
          value={userFlags.dates}
          disabled={!available.dates || saving}
          onValueChange={(value) => void toggle("dates", value)}
        />
        <SettingRow
          label="Task delegation"
          description={
            available.delegation
              ? "Assign tasks to other users."
              : "Coming soon."
          }
          value={userFlags.delegation}
          disabled={!available.delegation || saving}
          onValueChange={(value) => void toggle("delegation", value)}
        />
        <SettingRow
          label="AI Assistant (MCP)"
          description={
            available.ai_assistant
              ? "Enable MCP token management for agent integrations."
              : "Coming soon."
          }
          value={userFlags.ai_assistant}
          disabled={!available.ai_assistant || saving}
          onValueChange={(value) => void toggle("ai_assistant", value)}
        />

        {aiAssistant ? (
          <>
            <Text style={styles.groupHeading}>AI Assistant Tokens</Text>

            {newToken ? (
              <View style={styles.infoCard}>
                <Text style={styles.readOnlyLabel}>New token</Text>
                <Text style={styles.monoText} selectable>{newToken}</Text>
                <Text style={styles.helperText}>
                  Copy it now. You will not be able to view it again.
                </Text>
              </View>
            ) : null}

            <View style={styles.inlineComposer}>
              <TextInput
                value={tokenName}
                onChangeText={(value: string) => {
                  setError(null);
                  setTokenName(value);
                }}
                placeholder="Token name"
                placeholderTextColor="#94A3B8"
                style={styles.inlineComposerInput}
                accessibilityLabel="Token name"
              />
              <Pressable
                disabled={!tokenName.trim()}
                onPress={() =>
                  void (async () => {
                    try {
                      const created = await createMcpToken(tokenName.trim());
                      setTokens((current) => [created.token_record, ...current]);
                      setNewToken(created.token);
                      setTokenName("");
                      setError(null);
                    } catch (candidate) {
                      setError(toDisplayMessage(candidate, "Failed to create token."));
                    }
                  })()
                }
                accessibilityLabel="Create token"
                accessibilityRole="button"
                style={styles.inlineComposerButton}
              >
                <Text style={styles.inlineComposerButtonText}>Create</Text>
              </Pressable>
            </View>

            {loadingTokens ? <ActivityIndicator color={colours.blueStrong} /> : null}

            {tokens.map((token) => (
              <View key={token.id} style={styles.tokenCard}>
                <View style={styles.flexOne}>
                  <Text style={styles.personName}>{token.name}</Text>
                  <Text style={styles.personMeta}>
                    Created {token.created_at ? formatDateTime(token.created_at) : "-"}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    void (async () => {
                      try {
                        await revokeMcpToken(token.id);
                        setTokens((current) =>
                          current.filter((candidate) => candidate.id !== token.id),
                        );
                        setError(null);
                      } catch (candidate) {
                        setError(toDisplayMessage(candidate, "Failed to revoke token."));
                      }
                    })()
                  }
                  accessibilityLabel={`Revoke token ${token.name}`}
                  accessibilityRole="button"
                  style={styles.secondaryChip}
                >
                  <Text style={styles.secondaryChipText}>Revoke</Text>
                </Pressable>
              </View>
            ))}

            <View style={styles.infoCard}>
              <Text style={styles.readOnlyLabel}>MCP URL</Text>
              <Text style={styles.monoText} selectable>{`${getApiBaseUrl()}/mcp`}</Text>
            </View>
          </>
        ) : null}

        <Text style={styles.groupHeading}>Notifications</Text>
        <View style={styles.infoCard}>
          <Text style={styles.readOnlyText}>
            In-app notifications are available in the inbox. Native lock-screen
            alerts are not available in this build.
          </Text>
        </View>
      </ScrollView>
    </Sheet>
  );
}
