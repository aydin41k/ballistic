# Ballistic mobile

The native iOS and Android client for Ballistic. It targets Expo SDK 54 for compatibility with the current App Store and Play Store Expo Go client, while retaining native navigation, sheets, haptics, swipe actions, long-press reordering, pull-to-refresh, secure token storage, date controls, and push notifications.

## Setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local`.
3. Set `EXPO_PUBLIC_API_BASE_URL` to the Laravel server without a trailing `/api`.
   - iOS simulator default: `http://localhost`
   - Android emulator default: `http://10.0.2.2`
   - Physical devices need a reachable LAN or HTTPS address.
4. Set `EXPO_PUBLIC_EAS_PROJECT_ID` after running `eas init` if native push is required.
5. Run `npm run ios` or `npm run android` for Expo Go-compatible development.
6. For native push testing, initialise EAS with `npx eas init`, build the `development` profile, then run `npm run start:dev-client`.

Remote push notifications require a development or production build; Expo Go does not provide the complete native push path. The notification centre still works through the API without push credentials.

## Verification

Run `npm run check` to perform formatting, lint, TypeScript, and production bundle checks.

## Core interactions

- Tap the status orb to cycle `To do → Doing → Done → Won't do`.
- Swipe a task for contextual actions.
- Long-press anywhere on a task to reorder it.
- Pull down to refresh tasks and notifications.
- Use the centre action in the bottom navigation bar for quick capture.
- Manage dates, recurrence, projects, delegation, notes, activity, profile, feature flags, MCP tokens, and notifications from native screens.
