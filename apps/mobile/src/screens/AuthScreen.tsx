import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthError, useAuth } from "@/contexts/AuthContext";
import {
  getApiBaseUrl,
  getApiBaseUrlHelpText,
  isUsingFallbackApiBaseUrl,
} from "@/lib/auth";
import { Field } from "@/screens/auth/Field";
import { styles } from "@/screens/auth/styles";

type Mode = "login" | "register";

export function AuthScreen() {
  const { bootstrapError, clearBootstrapError, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = useMemo(
    () => (mode === "login" ? "Welcome back" : "Create your account"),
    [mode],
  );
  const submitDisabled = useMemo(() => {
    if (!email.trim() || !password) {
      return true;
    }

    if (mode === "register") {
      return !name.trim() || !passwordConfirmation;
    }

    return false;
  }, [email, mode, name, password, passwordConfirmation]);

  function clearVisibleErrors() {
    setError(null);
    setFieldErrors({});
    clearBootstrapError();
  }

  function switchMode(nextMode: Mode) {
    clearVisibleErrors();
    setMode(nextMode);
  }

  async function handleSubmit() {
    clearVisibleErrors();

    if (mode === "register") {
      if (password !== passwordConfirmation) {
        setFieldErrors({
          password_confirmation: ["Passwords do not match"],
        });
        return;
      }

      if (password.length < 8) {
        setFieldErrors({
          password: ["Password must be at least 8 characters"],
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(
          name.trim(),
          email.trim(),
          password,
          passwordConfirmation,
        );
      }
    } catch (candidate) {
      if (candidate instanceof AuthError) {
        setError(candidate.message);
        setFieldErrors(candidate.errors);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <Text style={styles.brand}>Ballistic</Text>
            <Text style={styles.tagline}>The Simplest Bullet Journal</Text>

            <View style={styles.modeSwitch}>
              <Pressable
                onPress={() => switchMode("login")}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === "login" }}
                style={[
                  styles.modePill,
                  mode === "login" && styles.modePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeText,
                    mode === "login" && styles.modeTextActive,
                  ]}
                >
                  Sign in
                </Text>
              </Pressable>
              <Pressable
                onPress={() => switchMode("register")}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === "register" }}
                style={[
                  styles.modePill,
                  mode === "register" && styles.modePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeText,
                    mode === "register" && styles.modeTextActive,
                  ]}
                >
                  Register
                </Text>
              </Pressable>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{title}</Text>
              <Text style={styles.formSubtitle}>
                {mode === "login"
                  ? "Pick up exactly where your list left off."
                  : "Create an account and start firing tasks."}
              </Text>

              <View
                style={[
                  styles.infoBanner,
                  isUsingFallbackApiBaseUrl() ? styles.infoBannerWarning : null,
                ]}
              >
                <Text
                  style={[
                    styles.infoBannerText,
                    isUsingFallbackApiBaseUrl()
                      ? styles.infoBannerTextWarning
                      : null,
                  ]}
                >
                  {getApiBaseUrlHelpText()}
                </Text>
                <Text style={styles.infoBannerMeta}>
                  Backend URL: {getApiBaseUrl()}
                </Text>
              </View>

              {bootstrapError && !error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{bootstrapError}</Text>
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {mode === "register" ? (
                <Field
                  label="Name"
                  value={name}
                  onChangeText={(value) => {
                    clearVisibleErrors();
                    setName(value);
                  }}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                  placeholder="Aydin"
                  error={fieldErrors.name?.[0]}
                />
              ) : null}

              <Field
                label="Email"
                value={email}
                onChangeText={(value) => {
                  clearVisibleErrors();
                  setEmail(value);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                placeholder="you@example.com"
                error={fieldErrors.email?.[0]}
              />

              <Field
                label="Password"
                value={password}
                onChangeText={(value) => {
                  clearVisibleErrors();
                  setPassword(value);
                }}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                textContentType={
                  mode === "login" ? "password" : "newPassword"
                }
                returnKeyType={mode === "login" ? "go" : "next"}
                onSubmitEditing={() => {
                  if (mode === "login" && !submitDisabled && !isSubmitting) {
                    void handleSubmit();
                  }
                }}
                placeholder="••••••••"
                error={fieldErrors.password?.[0]}
              />

              {mode === "register" ? (
                <Field
                  label="Confirm Password"
                  value={passwordConfirmation}
                  onChangeText={(value) => {
                    clearVisibleErrors();
                    setPasswordConfirmation(value);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={() => {
                    if (!submitDisabled && !isSubmitting) {
                      void handleSubmit();
                    }
                  }}
                  placeholder="••••••••"
                  error={fieldErrors.password_confirmation?.[0]}
                  hint="Must match your password and be at least 8 characters."
                />
              ) : null}

              <Pressable
                onPress={() => void handleSubmit()}
                disabled={isSubmitting || submitDisabled}
                accessibilityRole="button"
                accessibilityLabel={mode === "login" ? "Sign in" : "Create account"}
                style={[
                  styles.primaryButton,
                  (isSubmitting || submitDisabled) && styles.primaryButtonDisabled,
                ]}
              >
                {isSubmitting ? (
                  <View style={styles.inlineRow}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.primaryButtonText}>
                      {mode === "login" ? "Signing in..." : "Creating account..."}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {mode === "login" ? "Sign in" : "Create account"}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() =>
                  switchMode(mode === "login" ? "register" : "login")
                }
                accessibilityRole="button"
                style={styles.secondaryAction}
              >
                <Text style={styles.secondaryActionText}>
                  {mode === "login"
                    ? "Need an account? Create one"
                    : "Already have an account? Sign in"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
