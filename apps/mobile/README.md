# Ballistic Mobile

Expo-based React Native client for Ballistic, pointed at the existing Laravel backend in this repo.

## Scope

The mobile app reuses the current backend contract rather than introducing a separate mobile API. It currently includes:

- sign in and registration
- authenticated task board with optimistic create/edit/status/reorder flows
- project filtering with colour-coded project badges and tag display
- delegation, favourites, notifications, and activity log surfaces
- notes, profile, settings, and MCP token management

## First Boot

Run these commands exactly from a fresh local checkout.

1. Start the backend:

   ```bash
   cd apps/backend
   ./vendor/bin/sail up -d
   ```

2. Install mobile dependencies:

   ```bash
   cd apps/mobile
   npm install
   ```

3. Create the mobile env file:

   ```bash
   cd apps/mobile
   cp .env.example .env
   ```

4. Set `EXPO_PUBLIC_API_BASE_URL` in `apps/mobile/.env` for your target:

   ```dotenv
   # iOS simulator on the same machine
   EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
   ```

   ```dotenv
   # Android emulator
   EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000
   ```

   ```dotenv
   # Physical device on the same LAN
   EXPO_PUBLIC_API_BASE_URL=http://YOUR_MACHINE_LAN_IP:8000
   ```

5. Start Expo:

   ```bash
   cd apps/mobile
   npm run start
   ```

6. Open the app:

   - press `i` for the iOS simulator
   - press `a` for the Android emulator
   - or scan the Expo QR code for a device running Expo Go that can reach your backend URL

## First-Boot Notes

- If `EXPO_PUBLIC_API_BASE_URL` is missing, the app falls back to `http://127.0.0.1:8000` on iOS/web and `http://10.0.2.2:8000` on Android. That fallback is only safe for local simulators/emulators.
- A physical device will not be able to reach `127.0.0.1` or `10.0.2.2`; use your machine's LAN IP instead.
- If sign-in fails immediately, check that Sail is up and that the URL in `apps/mobile/.env` matches the device you launched on.
- Scheduled and due dates use the native date picker (a sheet with Clear/Done on iOS, the OS dialog on Android).

## User Testing Before Deployment

The recommended flow for UAT is:

1. Run an internal/preview EAS build:

   ```bash
   cd apps/mobile
   EXPO_PUBLIC_API_BASE_URL=https://your-staging-api-host eas build --platform all --profile preview
   ```

2. Distribute via EAS internal distribution to testers (iOS ad-hoc / Android APK).
3. Testers install and exercise the app against the staging backend.
4. Confirm sign-in, task creation, delegation, notifications, and settings all work as expected.
5. Approve the build before creating a `production` EAS build.

## Local Validation

Once dependencies are installed, run:

```bash
cd apps/mobile
npm run check
```

Quick config checks:

```bash
node -e "JSON.parse(require('fs').readFileSync('app.json', 'utf8')); console.log('app.json ok')"
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log('package.json ok')"
```

## CI

Pull requests that touch `apps/mobile/**` trigger the `Mobile Linter Tester` workflow, which runs:

- `npm run lint` (Expo-config ESLint)
- `npm run typecheck` (TypeScript strict mode)
- `npm run doctor` (Expo Doctor; advisory, non-blocking)

## Store Builds

Store builds use EAS profiles from `eas.json`.

> **Before the first EAS build:** this app is not yet linked to an EAS
> project (`app.json` has no `extra.eas.projectId`/`owner`, and
> `eas.json#submit.production` is empty). Run `eas init` from `apps/mobile`
> with an authenticated EAS account to link the project and commit the
> resulting `projectId`/`owner`, then fill in `submit.production` with the
> real Apple/Google submission details. Until then, `eas build`/`eas submit`
> will prompt interactively and cannot run in CI.

```bash
cd apps/mobile
EXPO_PUBLIC_API_BASE_URL=https://YOUR_PRODUCTION_API_HOST eas build --platform all --profile production
```

Production EAS builds intentionally fail if `EXPO_PUBLIC_API_BASE_URL` is missing, invalid, non-HTTPS, or points at a local/emulator host. This prevents accidentally shipping a Play Store or App Store build that still targets `127.0.0.1` or `10.0.2.2`.

Before submitting:

- replace `YOUR_PRODUCTION_API_HOST` with the real public backend host
- confirm the Laravel API allows the mobile bundle/package origins and token flow
- prepare App Store / Play Store screenshots, privacy answers, support URL, and marketing copy
- run `npm run check`

## Known Follow-Ups

- Native lock-screen push notifications are not wired yet because the current backend exposes web-push subscription endpoints, not mobile device-token endpoints. A follow-up should add Expo Push Notifications backed by Expo's push service or direct APNs/FCM token registration.
- The main authenticated screen (`HomeScreen.tsx`) is still the largest file in the app and would benefit from splitting board state/handlers into a dedicated hook and extracting the toolbar/empty-state JSX into `home/components`, before significant new behaviour is added.
- `TaskEditorSheet.tsx` is similarly large; the "Assign to" block is a good candidate for extraction into its own component.
- The EAS project is not yet linked (see "Store Builds" above) - required before non-interactive EAS builds/submissions are possible.
- Reordering (Top/Up/Down) is only available when the task list is in its default, unsorted, unfiltered order (dates feature off and no project filters applied), since the move actions operate on that canonical ordering.
