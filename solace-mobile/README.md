# Solace Mobile

Native Expo/React Native app (`com.reveuse12.solace`), using Expo Router and the existing Solace PWA APIs at **https://solace-rosy-iota.vercel.app**.

## Current release: 1.2.0

The 1.0.1 app was a local prototype: it persisted a name, but never called the PWA's profile/content APIs. This release uses the same Clerk application and backend as the PWA. The server profile is now the source of truth for onboarding. No service-role or Clerk secret key is bundled in Android.

| Area | Native implementation |
| --- | --- |
| Authentication | SecureStore-backed Clerk sessions; Google, email/password, signup email verification, password recovery; errors remain retryable. Accounts requiring additional MFA or other signup requirements are directed to finish those steps in the PWA. |
| Onboarding | Three steps: welcome/privacy, optional name/focus, first manifestation. City and practice time stay optional in Profile. Encrypted per-account drafts resume after closing; entry failures retain text. A reminder invitation follows a saved first entry. Users can skip writing and go straight to Today. |
| Startup | Wait for session restoration, then load the server profile. Server-confirmed privacy consent completes onboarding, including when optional fields are blank. Lookup failures show retry/sign-out, not new onboarding. An unfinished first-entry draft resumes from Today even if the profile save succeeded. |
| Today | Manifestation create/list/search/filter/edit/mark manifested/archive/detail expansion/share, local template story clearly identified as such, focus-based starter suggestions, rotating/shareable affirmations, saved intentions and editing. |
| Library | Same three catalog entries, categories, favorites filter, shared favorite persistence. Playable audio remains unavailable in the PWA and this app; no fake playback state. |
| Reflect | Reflection save/edit/history, visualization templates/create/edit/delete/complete, guided timed practice, completion counts. |
| Reminders | Shared reminder CRUD, custom weekdays and times, explicit notification permission, native weekly scheduling, cancellation on disable/delete/sign-out, account isolation, foreground reconciliation. Times follow the phone's local timezone. Android battery policies can delay delivery. |
| Profile | Optional synced display name, city, focus, practice time, HTTPS avatar URL, privacy consent, local warm/midnight preference. Resume a setup draft or explicitly share content-free local setup diagnostics. |
| Account/data | Share exported JSON, choose and validate backup, explicitly confirm merge through the existing API, privacy/terms links, sign-out and permanent account deletion with confirmation. |

Stories, appearance and foreground notification history are local per-account preferences. All other implemented saved content uses existing authenticated PWA endpoints. Session tokens remain in SecureStore and are never placed in URLs or AsyncStorage. The API client fetches a current Clerk token per request, sends it as a bearer token to the configured HTTPS origin, rejects redirects and handles error/empty/timeout responses.

## Backend compatibility and remaining limits

- The live PWA URL is also the repository's configured homepage. Its health endpoint responds, unauthenticated profile requests return 401, and its published public Clerk key matches the Android configuration.
- A real authenticated phone-to-production sync has not been performed on this machine. Tests use controlled API/auth/native adapters; there is no connected Android device/emulator available here.
- Existing PWA export/restore endpoints do **not** include the `desires` table. Android labels this limitation. The backend merge is not atomic: an error can occur after earlier sections were merged. Android does not clear existing data before restoring.
- The PWA has no licensed audio files or real server story-generation service; those features were not invented or reported as complete.
- Android delivery across reboot, Doze, timezone changes, permissions and OEM battery rules still requires on-device verification. iOS was not built/tested for this release.
- Existing Expo CLI dependency advisories remain; no incompatible force-upgrade/downgrade was applied.

## Configuration

Local `.env.local` (ignored) and EAS `preview` both need:

```dotenv
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<same public key as the PWA>
EXPO_PUBLIC_API_URL=https://solace-rosy-iota.vercel.app
```

The existing app's `solace://sso-callback` scheme is retained. EAS project/signing credentials and app ID are unchanged. SecureStore, Router, Notifications and Sharing are configured through Expo plugins; native folders remain generated.

## Verification

```sh
npm ci
npm test
npm run typecheck
../node_modules/.bin/eslint App.tsx index.ts src tests
npx expo install --check
npx expo export --platform android --output-dir dist-verification
```

The automated suite covers optional profile fields and consent-based completion, the shorter setup, encrypted draft recovery, privacy gating, first-entry saves, lost-response retries, optional reminders and permission timing, new-mount hydration, bearer requests/invalid origins/error responses, email sign-in/session activation, profile error routing, backup structure/ownership, stable reminder IDs, cancellation, concurrent account scheduling, rollback, and legacy name migration. Native UI tests mount the actual components with controlled native/auth/API adapters. Tests also cover read-aloud chunking, stale callbacks, playback replacement, background stopping, and local setup metrics. Root PWA TypeScript checks also pass with the native source present.

Before rollout, install the new APK over 1.0.1. Sign in with the same PWA account: existing complete answers should appear in Profile, and content should load from that account. Test a fresh account's complete onboarding, retry after disconnecting the network, force-stop/relaunch, cross-check a new reflection in the PWA, and verify reminder creation/edit/disable/delete on the phone. Export a known-good backup before testing restore. Use disposable accounts for permanent deletion tests.

## Verified preview artifact

EAS build `d8e5c1d3-6f27-4bde-a101-b65e535d90ca` finished successfully: Solace 1.1.0 / Android code 3. The APK was downloaded and checked for app ID, matching parsed signer certificate against 1.0.1, and bundled PWA origin/profile/onboarding/content markers. This confirms artifact identity and included code, not phone runtime behavior.

[Download APK](https://expo.dev/artifacts/eas/1-JeG4-zA18lEm8FouR3hcxEcHo-lqgf_boOwzzhdCI.apk).

### Read aloud
Saved manifestations, intentions, reflections, visualizations and future-self stories offer **Read aloud**, **Stop reading**, and voice/pace options. The default pace is 0.85, with enhanced English voices preferred when installed. Voice selection is shared for the current signed-in session. Playback stops on screen changes, backgrounding and sign-out; long entries are read in bounded chunks. This uses the phone's TTS engine rather than a Solace cloud voice API. Installed voices and the engine determine naturalness, supported languages and whether network processing occurs. No autoplay or microphone permission is used. Android uses Stop/restart because Expo Speech does not support pause/resume there. Adding this native module requires a new APK; listening quality and physical-device behavior still need verification.

### Onboarding diagnostics
Timing, last reached setup step, first-entry save, sync failure count, completion, and next-day return are stored in account-scoped local preferences. No journal content, name, city, focus, email, or account identifier is included in the shareable JSON. Nothing is uploaded automatically. Profile offers an explicit share action for support. These local diagnostics support testing; there is no fleet analytics dashboard or claim of measured retention improvement.

### QA for 1.2.0
Use a disposable account: accept privacy, skip name/focus, write an entry, disable the network and retry, then relaunch. The entry and step should survive. Restore connectivity and save; the entry should appear once on Today and in the PWA. Choose Not now for reminders and confirm no permission prompt. Separately choose a reminder, enter a time, and confirm the phone permission request follows that action. Existing accounts with consent but no city/practice time should go directly to Today. Listen on a physical Android phone to choose an installed voice and confirm stopping on navigation, background, and sign-out. No connected Android emulator/device is available in this workspace.

### Finished 1.2.0 artifact
EAS build `fc3fee90-4ac0-49ba-ad3d-ac083bf8d62d` finished. APK: https://expo.dev/artifacts/eas/TGEXoj2CrqI88WDUDwM9tk7SYw9oX9WqfgVlr-uKxmI.apk . Downloaded package is `com.reveuse12.solace`, version 1.2.0 / Android code 4. Its parsed v2 signing certificate matches 1.1.0; it includes the new setup and speech markers, the configured public Clerk key, TTS service discovery, and no microphone permission. All 37 automated tests and checks pass. This is artifact inspection, not physical Android runtime verification.

### 1.2.1 navigation fix
The bottom tabs now have bundled Ionicons: Today (sun), Library (headset), Reflect (journal), Profile (person), with filled selected and outlined unselected states. Labels remain below the icons. The tab layout waits for its bundled font before rendering; no remote font request is required. Version 1.2.1 / Android code 5. TypeScript, lint and the existing 37-test regression suite pass. Finished APK verification is tracked separately.

### 1.3.0 QA fixes

- Preserve the current account's scheduled reminders during offline startup; permission enablement uses the latest fetched reminder list.
- Persist ordinary writing and visualization drafts in encrypted, account-scoped storage. Stable client UUIDs make retries safe after a lost save response.
- Bound token retrieval and API work by one deadline; offer restart recovery for stalled authentication initialization.
- Apply the midnight palette to cards, fields and navigation.
- Include manifestations in paginated exports; restore supported sections through one RLS-enforced database transaction (`006_atomic_account_restore.sql`).
- Validation: mobile typecheck/lint and 49 automated tests pass. Live transactional restore/rollback and cross-account protection verified with synthetic data inside a rolled-back transaction. Device validation and build status are recorded separately in the release report.
