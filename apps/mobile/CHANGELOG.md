# Changelog

## 0.2.7 - 2026-07-23

- Kept completed and skipped tasks fully visible for three seconds before a slower, eased departure and gentler list reflow.
- Made the Android profile-photo crop action explicit and visible with a Ballistic toolbar and white “Use photo” control.

## 0.2.6 - 2026-07-22

- Kept background sync invisible so ordinary local actions no longer trigger pull-to-refresh or button spinners.
- Reverted permanently rejected server changes to their pre-action device state and limited sync warnings to those signed-in rollback cases.
- Replaced the springing completed-task departure with a short, stable in-place confirmation and linear fade.
- Resized the notes editor above the Android and iOS keyboards so the full document remains scrollable while typing.
- Replaced avatar URLs with gallery and front-camera profile photo controls backed by durable offline storage and queued background upload.

## 0.2.5 - 2026-07-22

- Stopped successful account syncs from immediately triggering another full sync and exhausting the API rate limit after login.
- Limited automatic sync to sign-in, reconnection, newly queued changes, notifications, foreground refreshes, and the normal background interval.

## 0.2.4 - 2026-07-22

- Made manual logout erase all Ballistic account data, offline workspaces, queued changes, preferences, notifications, and caches from the device before returning to the account screen.
- Fixed offline-created tasks syncing by acknowledging the original create request instead of issuing a redundant update against the new UUID.
- Kept offline work unobstructed and indicated a signed-out session only with a red Profile tab icon.
- Corrected password fields to disable capitalisation, correction, and spelling suggestions while using password autofill metadata.
- Kept new tasks at the end of their natural ordering and scrolled them into view without moving them to the top.
- Reduced overshoot and travel in task, drag, status, empty-state, authentication, activity, and notification animations.
- Made Android hardware Back dismiss task, filter, notification, and settings overlays before leaving the app.
- Kept logout on the account landing screen and suppressed stale connection warnings during ordinary offline use.

## 0.2.3 - 2026-07-22

- Kept routine on-device saves, offline work, and queued changes silent so task rows no longer shift after a status update.
- Limited the compact sync warning and retry action to genuine sync failures while signed in.

## 0.2.2 - 2026-07-22

- Added a first-launch welcome screen with clear Create account, Log in, and Continue offline choices.
- Remembered the offline choice so guest journals open directly on later launches.
- Corrected installable builds to use the live `https://ballistic-api.psycode.com.au` backend.

## 0.2.1 - 2026-07-22

- Removed the unused incompatible Expo UI canary module that caused Android release builds to close during native startup.
- Updated Expo SDK 54 to the latest compatible patch release and added Android preview build-number increments for installable updates.

## 0.2.0 - 2026-07-22

- Made registration optional: first launch now opens directly into a fully usable on-device journal.
- Added persisted offline workspaces for tasks, projects, notes, profile settings, activity, and notifications.
- Added a compacted mutation queue that automatically replays after sign-in or reconnection without blocking local work.
- Added guest-to-account migration so existing on-device data merges into a new or existing account during registration or sign-in.
- Kept registered journals usable after logout, token expiry, and network loss, with clear local and sync status throughout the app.
- Added offline notification read/dismiss actions and queued native push subscription changes.
- Added network-aware background, foreground, manual, and reconnect sync.
- Configured installable preview and production builds to use `https://ballistic-app.psycode.com.au` from any internet connection.

## 0.1.6 - 2026-07-12

- Made plain one-line task rows compact instead of enforcing the obsolete tall control layout.
- Removed spacing from empty metadata groups and centred simple row content cleanly.

## 0.1.5 - 2026-07-12

- Integrated task creation as the centre action in the bottom navigation bar.
- Vertically centred each task status circle against its complete row.

## 0.1.4 - 2026-07-12

- Removed the nested dot and circle glyphs from task-row status controls.
- Made the full-size Doing circle half-filled while retaining clear filled terminal states.

## 0.1.3 - 2026-07-12

- Kept completed and skipped task rows in place for four seconds before fading them out smoothly.
- Debounced rapid status changes per task so only the final state is written after a three-second pause.

## 0.1.2 - 2026-07-12

- Simplified task cards so tapping edits and touching and holding anywhere on a movable task starts reordering.
- Moved the “To top” action into the task swipe actions and removed the redundant edit and row-control buttons.

## 0.1.1 - 2026-07-12

- Fixed the Android Expo Go startup crash caused by initialising unavailable remote-push APIs.
- Fixed static assigned and delegated task cards rendering outside the draggable-list animation context.

## 0.1.0 - 2026-07-12

- Added the first native Ballistic app for iOS and Android.
- Added secure authentication, the complete task workflow, projects, filters, scheduling, recurrence, delegation, notifications, notes, activity, profile, feature flags, and MCP token management.
- Added native navigation, sheets, swipe actions, long-press reordering, haptics, pull-to-refresh, and polished motion.
- Aligned the app with Expo SDK 54 so it can be tested using Expo Go 54.0.8.
