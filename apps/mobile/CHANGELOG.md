# Changelog

## 0.1.7 - 2026-10-28

- Fixed the TypeScript error in `MotionPressable` that broke `npm run typecheck`.
- Added a 15 second request timeout and clearer messages for timeouts and server (5xx) errors.
- Release builds now fail with a clear message when `EXPO_PUBLIC_API_BASE_URL` is unset instead of calling a loopback address.
- Showed "Your session has expired" on the sign-in screen after an unauthorised response.
- Stopped retrying client (4xx) errors in react-query.
- Showed an alert when deleting, declining, reordering or changing the status of a task fails, instead of silently rolling the change back.
- Enlarged the status orb and chip touch targets to the 44pt guideline with `hitSlop`.
- Applied non-breaking `npm audit fix` updates, clearing the critical production advisory (`shell-quote`).

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
