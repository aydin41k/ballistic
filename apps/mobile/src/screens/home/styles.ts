import { Platform, StyleSheet } from "react-native";

import { colours, radii, spacing } from "@/theme";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colours.page,
  },
  container: {
    flex: 1,
    backgroundColor: colours.page,
  },
  flexOne: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingLabel: {
    color: colours.muted,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: colours.navy,
  },
  headerSubtitle: {
    marginTop: 2,
    color: colours.muted,
  },
  headerMeta: {
    marginTop: 8,
    color: colours.blueStrong,
    fontWeight: "600",
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  ghostButtonText: {
    color: colours.navy,
    fontWeight: "700",
  },
  banner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colours.blueSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  bannerText: {
    color: colours.blueStrong,
    lineHeight: 20,
  },
  bannerAction: {
    color: colours.blueStrong,
    fontWeight: "700",
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionEmerald: {
    color: "#059669",
  },
  sectionAmber: {
    color: "#D97706",
  },
  sectionNavy: {
    color: colours.navy,
  },
  cardWrap: {
    marginBottom: spacing.sm,
  },
  taskCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
  },
  taskCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: colours.danger,
    backgroundColor: "#FFF7F7",
  },
  taskCardSoon: {
    borderLeftWidth: 4,
    borderLeftColor: colours.warning,
    backgroundColor: "#FFFBF2",
  },
  statusButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colours.page,
  },
  statusButtonText: {
    color: colours.blueStrong,
    fontSize: 16,
    fontWeight: "700",
  },
  taskBody: {
    flex: 1,
    gap: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colours.text,
  },
  taskTitleMuted: {
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  taskDescription: {
    color: colours.muted,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  badgeNavy: {
    backgroundColor: "#E2E8F0",
  },
  badgeBlue: {
    backgroundColor: colours.blueSoft,
  },
  badgeAmber: {
    backgroundColor: colours.amberSoft,
  },
  badgeEmerald: {
    backgroundColor: colours.emeraldSoft,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgeTextNavy: {
    color: colours.navy,
  },
  badgeTextBlue: {
    color: colours.blueStrong,
  },
  badgeTextAmber: {
    color: "#B45309",
  },
  badgeTextEmerald: {
    color: "#047857",
  },
  taskNotes: {
    color: colours.muted,
    fontStyle: "italic",
  },
  dateMeta: {
    color: colours.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  dateMetaDanger: {
    color: colours.danger,
  },
  dateMetaWarning: {
    color: "#B45309",
  },
  secondaryMeta: {
    color: colours.muted,
    fontSize: 12,
  },
  moveStack: {
    justifyContent: "center",
    gap: 6,
  },
  moveButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colours.page,
    borderRadius: radii.md,
  },
  moveButtonText: {
    color: colours.navy,
    fontSize: 12,
    fontWeight: "700",
  },
  declineButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  declineButtonText: {
    color: colours.danger,
    fontWeight: "700",
  },
  emptyState: {
    marginTop: spacing.xxl,
    borderRadius: radii.lg,
    backgroundColor: "#FFFFFF",
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyStateCompact: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colours.navy,
  },
  emptyCopy: {
    color: colours.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  primaryEmptyAction: {
    marginTop: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colours.blueStrong,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryEmptyActionText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  footerCopy: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    textAlign: "center",
    color: colours.muted,
    fontSize: 12,
  },
  toolbar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: "rgba(247,248,250,0.97)",
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.2)",
  },
  toolbarScroll: {
    paddingRight: 92,
    gap: 10,
  },
  toolbarButton: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radii.pill,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colours.border,
  },
  toolbarButtonActive: {
    backgroundColor: colours.blueStrong,
    borderColor: colours.blueStrong,
  },
  toolbarButtonText: {
    color: colours.navy,
    fontWeight: "700",
  },
  toolbarButtonTextActive: {
    color: "#FFFFFF",
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    top: -22,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colours.blueStrong,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabLabel: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "300",
  },
  fabDisabled: {
    opacity: 0.45,
  },
  fabPressed: {
    transform: [{ scale: 0.93 }],
  },
  toast: {
    position: "absolute",
    top: 64,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colours.dangerSoft,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  toastText: {
    color: colours.danger,
    textAlign: "center",
    fontWeight: "700",
  },
  sheetSafeArea: {
    flex: 1,
    backgroundColor: colours.page,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colours.navy,
  },
  sheetContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  disclosure: {
    alignSelf: "flex-start",
  },
  disclosureText: {
    color: colours.blueStrong,
    fontWeight: "700",
  },
  formGroup: {
    gap: spacing.lg,
  },
  fieldBlock: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: colours.navy,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: radii.md,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colours.text,
  },
  multilineInput: {
    minHeight: 84,
    textAlignVertical: "top",
  },
  notesInput: {
    minHeight: 320,
    textAlignVertical: "top",
  },
  helperText: {
    color: colours.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  selectionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colours.border,
  },
  choiceChipActive: {
    backgroundColor: colours.blueStrong,
    borderColor: colours.blueStrong,
  },
  choiceChipText: {
    color: colours.navy,
    fontWeight: "700",
  },
  choiceChipTextActive: {
    color: "#FFFFFF",
  },
  inlineComposer: {
    flexDirection: "row",
    gap: 10,
  },
  inlineComposerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: radii.md,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colours.text,
  },
  inlineComposerButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colours.navy,
    borderRadius: radii.md,
    paddingHorizontal: 16,
  },
  inlineComposerButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  selectedPerson: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colours.border,
  },
  selectedPersonName: {
    color: colours.text,
    fontSize: 15,
    fontWeight: "700",
  },
  selectedPersonMeta: {
    color: colours.muted,
    fontSize: 12,
    marginTop: 4,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colours.border,
  },
  personName: {
    color: colours.text,
    fontSize: 15,
    fontWeight: "700",
  },
  personMeta: {
    color: colours.muted,
    fontSize: 12,
    marginTop: 4,
  },
  discoveryTag: {
    color: colours.blueStrong,
    fontWeight: "700",
  },
  readOnlyCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colours.border,
    gap: 6,
  },
  readOnlyLabel: {
    color: colours.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  readOnlyText: {
    color: colours.text,
    lineHeight: 21,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
  },
  sheetErrorBanner: {
    borderRadius: radii.md,
    backgroundColor: colours.dangerSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sheetErrorText: {
    color: colours.danger,
    lineHeight: 20,
  },
  primaryActionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    minHeight: 50,
    backgroundColor: colours.blueStrong,
  },
  primaryActionButtonDisabled: {
    opacity: 0.65,
  },
  primaryActionButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  secondaryActionButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    minHeight: 48,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colours.border,
  },
  secondaryActionButtonText: {
    color: colours.navy,
    fontWeight: "700",
  },
  secondaryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colours.page,
  },
  secondaryChipText: {
    color: colours.navy,
    fontWeight: "700",
  },
  groupHeading: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colours.muted,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colours.border,
  },
  settingLabel: {
    color: colours.text,
    fontSize: 15,
    fontWeight: "700",
  },
  settingDescription: {
    color: colours.muted,
    marginTop: 4,
    lineHeight: 20,
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colours.border,
    gap: 8,
  },
  monoText: {
    color: colours.navy,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  tokenCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colours.border,
  },
  activityCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colours.border,
    gap: 8,
  },
  inlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkText: {
    color: colours.blueStrong,
    fontWeight: "700",
  },
  notificationCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colours.border,
  },
  notificationCardUnread: {
    backgroundColor: colours.blueSoft,
    borderColor: "#BFDBFE",
  },
  notificationActions: {
    gap: 8,
    justifyContent: "center",
  },

  // ─── Press feedback ──────────────────────────────────────────────────────
  pressedOpacity: {
    opacity: 0.6,
  },

  // ─── Native date picker field ─────────────────────────────────────────────
  datePickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  datePickerTriggerText: {
    flex: 1,
    color: colours.text,
    fontSize: 16,
  },
  datePickerPlaceholder: {
    color: "#94A3B8",
  },
  datePickerChevron: {
    color: colours.muted,
    fontSize: 20,
    marginLeft: 8,
  },
  datePickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  datePickerSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingBottom: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  datePickerSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  datePickerSheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colours.navy,
  },
  datePickerAction: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    minWidth: 52,
  },
  datePickerActionText: {
    fontSize: 16,
  },
});
