import { StyleSheet } from "react-native";

import { colours, radii, spacing } from "@/theme";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colours.navy,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  heroCard: {
    gap: spacing.lg,
  },
  brand: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  tagline: {
    marginTop: 6,
    fontSize: 15,
    color: "rgba(255,255,255,0.76)",
  },
  modeSwitch: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    padding: 4,
    borderRadius: radii.pill,
  },
  modePill: {
    flex: 1,
    borderRadius: radii.pill,
    paddingVertical: 11,
    alignItems: "center",
  },
  modePillActive: {
    backgroundColor: "#FFFFFF",
  },
  modeText: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  modeTextActive: {
    color: colours.navy,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colours.text,
  },
  formSubtitle: {
    marginTop: -6,
    color: colours.muted,
    lineHeight: 21,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colours.navy,
  },
  input: {
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: radii.md,
    backgroundColor: colours.page,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colours.text,
  },
  inputError: {
    borderColor: colours.danger,
    backgroundColor: colours.dangerSoft,
  },
  errorBanner: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colours.dangerSoft,
  },
  errorText: {
    color: colours.danger,
    lineHeight: 20,
  },
  errorCaption: {
    fontSize: 12,
    color: colours.danger,
  },
  hintText: {
    fontSize: 12,
    color: colours.muted,
  },
  infoBanner: {
    gap: 4,
    borderRadius: radii.md,
    backgroundColor: colours.blueSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoBannerWarning: {
    backgroundColor: colours.amberSoft,
  },
  infoBannerText: {
    color: colours.blueStrong,
    lineHeight: 20,
  },
  infoBannerTextWarning: {
    color: "#B45309",
  },
  infoBannerMeta: {
    color: colours.muted,
    fontSize: 12,
  },
  primaryButton: {
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colours.navy,
    minHeight: 54,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  secondaryAction: {
    alignItems: "center",
    paddingVertical: 6,
  },
  secondaryActionText: {
    color: colours.blueStrong,
    fontWeight: "600",
  },
});
