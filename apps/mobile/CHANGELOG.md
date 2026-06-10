## 0.1.3 - 2026-06-10

### Added

- **Native date picker** — replaced free-text YYYY-MM-DD inputs in the task editor with `@react-native-community/datetimepicker`; iOS shows a spinner sheet with Clear / Done actions, Android shows the native dialog; min/max date constraints are enforced between scheduled and due dates
- **Haptic feedback** — added `expo-haptics` throughout: light impact on status toggle, medium on FAB tap and logout, warning on decline, error/success notifications on form submit
- **Status circle spring animation** — the status button pulses with a `spring → scale` `Animated` sequence on each press for a tactile feel
- **FAB spring-in** — the floating action button springs into view on mount with `Animated.spring`
- **`android_ripple`** — added Material ripple to all `Pressable` elements (task cards, toolbar buttons, choice chips, sheet close, FAB, move buttons, person rows)
- **Pressed-opacity feedback** — `style={({ pressed }) => [..., pressed && styles.pressedOpacity]}` on all interactive elements so iOS users also get visual feedback
- **Tags on task cards** — `TaskCard` now renders tag badges matching web app behaviour; custom tag and project colours supported via `customColor` prop on `Badge`
- **CI workflow** — `mobile-linter-tester.yml` runs lint and typecheck on every PR touching `apps/mobile/**`
- **Accessibility labels** — all `Pressable` and `Switch` elements carry `accessibilityLabel` and `accessibilityRole`

### Fixed

- **Notes race condition** — `useRef savingRef` guard prevents concurrent `saveIfChanged` calls (onBlur + Close) from double-saving

### Changed

- **Project/tag colour on task cards** — project and tag badges now show backend-assigned custom colours
- **MCP token value is selectable** — new token value and MCP URL support long-press copy
- **README** — updated first-boot steps, UAT/internal-distribution section, CI section, known follow-ups
- **`.gitignore`** — added `.codex`, `.codex/`, `.cursor/`, `.aider*` AI tool artifacts

## 0.1.2 - 2026-04-26

### Changed

- pinned Expo SDK-compatible native dependencies and added `expo-doctor` to the mobile check path
- declared the Expo Babel preset directly so native bundles can export cleanly
- added EAS build profiles, release icons, splash assets, iOS build number, Android version code, and production API URL validation
- removed local React/React Native type stubs so lint and typecheck use the real installed package types
- refreshed the workspace when the mobile app returns to the foreground
- matched mobile project filter chip semantics to the web app by showing included projects as selected
- stopped nested task-card and favourite buttons from also triggering their parent press actions
- avoided duplicate notes saves when blurring and closing the notes sheet
- overrode Expo's transitive `postcss` dependency to a patched 8.x release

### Notes

- native lock-screen push notifications still need backend support for Expo Push or direct APNs/FCM device tokens
- `npm audit --omit=dev --audit-level=moderate` still reports Expo CLI/config transitive advisories through `xcode -> uuid`; forcing `uuid@14` would break `xcode`'s CommonJS import path

## 0.1.1 - 2026-04-23

### Changed

- hardened mobile HTTP handling so network failures and non-JSON backend responses surface actionable messages instead of vague request errors
- stopped treating every auth bootstrap failure as a forced sign-out, preserving cached user state unless the backend explicitly returns unauthorised
- improved first-boot auth UX with backend URL guidance, safer submit states, and clearer keyboard/autofill behaviour
- fixed the empty workspace state so failed board loads no longer masquerade as "No tasks yet"
- kept task, notes, and profile sheets open when saves fail so local input is not discarded
- added local task date validation for the scaffold's `YYYY-MM-DD` input path
- documented exact first-boot commands and added `apps/mobile/.env.example`

### Notes

- `apps/mobile/src/screens/HomeScreen.tsx` is still too large and should be split before significant new product work lands

## 0.1.0 - 2026-04-23

### Added

- Expo-based React Native scaffold under `apps/mobile`
- backend-backed auth flow using secure token storage
- mobile task workspace with:
  - sectioned task lists for owned, assigned, and delegated tasks
  - optimistic create/edit/status updates
  - reorder controls translated for touch UX
  - project filters and planned/active scope support
- mobile sheets for:
  - task editing and assignment
  - notes
  - profile
  - settings and feature flags
  - notifications
  - activity log
- README instructions for setup and backend connectivity

### Notes

- Native push notifications are intentionally left as a follow-up because the current backend only exposes web-push endpoints
