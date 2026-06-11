## 0.2.0 - 2026-06-11

### Fixed

- **Reorder controls (Top/Up/Down)** — the move buttons and their first/last visibility now only appear when the task list is in its canonical, position-ordered state (the dates feature is off and no project filters are applied). Previously they could act on a different ordering than what was on screen when urgency-sorting or project filters were active, making moves appear to do nothing.
- **Assignee search** — searching for a user by a short, non-email query no longer triggers an unhandled rejection from the backend's user-discovery validation (which requires an email or a 9+ digit phone number); the discovery request is now skipped for queries that can't match, and any failure is handled gracefully.
- **FAB pressed state** — fixed a misleading boolean expression so the floating action button's pressed style only applies while task creation is enabled.
- **Logout robustness** — clearing local auth storage on logout is now wrapped so a SecureStore/AsyncStorage failure can't leave the UI stuck on an authenticated screen with a server-revoked token.
- **Session-expiry messaging** — a 401 response now signs the user out with a clear "Your session has expired. Please sign in again." message on the sign-in screen, instead of silently bouncing back to it.

### Added

- **Request timeout** — API requests now abort after 15 seconds via `AbortController`, so a backend that accepts a connection but never responds no longer leaves the UI spinning indefinitely.
- **Activity log empty state** — the Activity sheet now shows "No activity yet." when there is nothing to display, matching the Notifications sheet.
- Larger touch target (`hitSlop`) on the Top/Up/Down move buttons.

### Changed

- **Status label** — "Doing" is now labelled "In Progress" to match the web app's terminology.
- `tsconfig.json` now extends `expo/tsconfig.base` for the project's TypeScript configuration, matching Expo SDK conventions.
- Removed the unused `react-native-screens` dependency (the app has no navigation stack).
- Updated `expo-haptics` (`~15.0.8`), `@react-native-community/datetimepicker` (`8.4.4`), and `expo` (`~54.0.35`) to the versions expected by the installed Expo SDK, and registered the date picker as a config plugin in `app.json`. `expo-doctor` now reports 17/17 checks passing.
- Regenerated `package-lock.json` so it matches `package.json` (it previously omitted `expo-haptics` and `@react-native-community/datetimepicker`); CI now uses `npm ci` again instead of `npm install`.
- Added `shell-quote`, `brace-expansion`, and `ws` overrides to clear a critical and several moderate `npm audit` advisories in transitive dev-tooling dependencies.
- Removed leftover scratch files from a previous review session (`MOBILE_PR_READY.md`, `MOBILE_PR_BODY.md`, `commit_mobile_pr.py`, `finish_mobile_pr.sh`) — not part of the app.

### Notes

- `npm audit --omit=dev --audit-level=moderate` still reports 11 moderate advisories in the `uuid -> xcode -> @expo/config-plugins -> expo` chain; the only available fix downgrades `expo` to a 46.x major, which is not appropriate. This matches the gap documented in 0.1.2.
- The EAS project is not yet linked (no `extra.eas.projectId`/`owner` in `app.json`, empty `eas.json#submit.production`); `eas build`/`eas submit` will prompt interactively until `eas init` is run with an authenticated EAS account. See README "Store Builds".
- `HomeScreen.tsx` and `TaskEditorSheet.tsx` remain the largest files in the app and are good candidates for extracting a board-state hook and an `AssigneePicker` component respectively in a follow-up.

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
