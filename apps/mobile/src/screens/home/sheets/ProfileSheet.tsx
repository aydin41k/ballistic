import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { toDisplayMessage } from "@/lib/http";
import { FormField } from "@/screens/home/components/FormField";
import { Sheet } from "@/screens/home/components/Sheet";
import { styles } from "@/screens/home/styles";
import type { User } from "@/types";

type ProfileSheetProps = {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    email: string;
    phone: string | null;
    bio: string | null;
    avatar_url: string | null;
  }) => Promise<void>;
};

export function ProfileSheet({
  onClose,
  onSave,
  user,
  visible,
}: ProfileSheetProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !user) {
      return;
    }

    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone ?? "");
    setBio(user.bio ?? "");
    setAvatarUrl(user.avatar_url ?? "");
    setError(null);
  }, [user, visible]);

  return (
    <Sheet visible={visible} title="Profile" onClose={onClose}>
      <ScrollView
        contentContainerStyle={styles.sheetContent}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View style={styles.sheetErrorBanner}>
            <Text style={styles.sheetErrorText}>{error}</Text>
          </View>
        ) : null}
        <FormField
          label="Name"
          value={name}
          onChangeText={(value) => {
            setError(null);
            setName(value);
          }}
        />
        <FormField
          label="Email"
          value={email}
          onChangeText={(value) => {
            setError(null);
            setEmail(value);
          }}
        />
        <FormField
          label="Phone"
          value={phone}
          onChangeText={(value) => {
            setError(null);
            setPhone(value);
          }}
          placeholder="Optional"
        />
        <FormField
          label="Bio"
          value={bio}
          onChangeText={(value) => {
            setError(null);
            setBio(value.slice(0, 500));
          }}
          placeholder="Tell us about yourself"
          multiline
          minHeight={100}
        />
        <FormField
          label="Avatar URL"
          value={avatarUrl}
          onChangeText={(value) => {
            setError(null);
            setAvatarUrl(value);
          }}
          placeholder="https://..."
        />
        <Text style={styles.helperText}>{bio.length}/500 characters</Text>
        <Pressable
          disabled={saving}
          onPress={() =>
            void (async () => {
              setSaving(true);
              try {
                await onSave({
                  name: name.trim(),
                  email: email.trim(),
                  phone: phone.trim() || null,
                  bio: bio.trim() || null,
                  avatar_url: avatarUrl.trim() || null,
                });
                onClose();
              } catch (candidate) {
                setError(toDisplayMessage(candidate, "Failed to save profile."));
              } finally {
                setSaving(false);
              }
            })()
          }
          accessibilityLabel={saving ? "Saving profile..." : "Save profile"}
          accessibilityRole="button"
          style={[
            styles.primaryActionButton,
            saving ? styles.primaryActionButtonDisabled : null,
          ]}
        >
          <Text style={styles.primaryActionButtonText}>
            {saving ? "Saving..." : "Save profile"}
          </Text>
        </Pressable>
      </ScrollView>
    </Sheet>
  );
}
