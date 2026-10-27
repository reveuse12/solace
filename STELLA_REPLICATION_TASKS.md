# Stella replication tracker

This is the working checklist for bringing Solace closer to the Stella product experience. The implementation uses original Solace branding, copy, artwork, and audio. Stella's APK and public product are references for information architecture and interaction behavior.

Status: 2026-10-22

## Current progress

### Complete

- [x] Clerk authentication and protected `/app` route
- [x] Public landing page and stable post-login redirect
- [x] Stella-inspired onboarding flow with privacy, welcome, name, location, focus, and practice-time questions
- [x] Supabase profile persistence and account controls
- [x] Today, Library, and Reflect app shell
- [x] Mobile bottom navigation
- [x] Responsive layout and normal page scrolling
- [x] Stella-inspired palette, typography, gradients, orbital artwork, and motion
- [x] Reflection creation, editing, and history
- [x] Visualization creation, editing, deletion, completion, templates, and progress count
- [x] Reminder creation and browser notification scheduling while the app is open
- [x] Library categories, filters, and favorites persistence
- [x] PWA manifest, install prompt, offline fallback, and update handling
- [x] Data export, privacy consent, and account deletion controls
- [x] Anonymous API protection, health check, rate limiting, and Playwright baseline checks

### Partial

- [ ] Home screen has a manifestation-first UI; persistent create/list/archive is implemented, while edit/detail/search/filter/share/history remain
- [ ] Affirmations and Wall of Manifestations are UI flows; they need Supabase persistence and account history
- [ ] Future-self visualization has an entry point, but the complete guided session and summary flow is not finished
- [ ] Audio cards and play state exist, but there are no licensed tracks, queue, seek, or resume persistence
- [ ] Profile/settings works, but the full native-style settings and theme system is incomplete
- [ ] The mobile shell is close to the reference direction; live runtime capture is now active and the remaining screens are still being mapped

### Pending by priority

#### P0 — Verify the reference runtime

- [x] Capture Stella on a connected Android device or emulator — **device authorized; splash, consent, and home screens captured**
- [ ] Record every screen, navigation action, bottom sheet, dialog, loading state, and error state
- [x] Confirm onboarding questions, bottom-nav labels, home hierarchy, and back behavior — live device audit completed through the personalized home screen with demo data (Prayag, Mumbai, Mom, AI Engineer, career/wealth focus, London dream city)
- [ ] Confirm exact icon roles and visual states without shipping extracted proprietary assets

P0 static audit completed from the local APK archive. The package contains native layouts for desires, music, playlists, visualization, thoughts, reminders, notifications, profile, themes, settings, backup/restore, help, and subscription/pro flows. It also contains app-specific icon resources for navigation, playlists, statistics, settings, filters, search, favorites, sharing, editing, deletion, notifications, and playback. This is shipped-artifact evidence only; it does not establish runtime order or behavior.

Profile location migration `supabase/migrations/005_profile_context.sql` was applied to the live Solace Supabase project on 2026-10-25. The API schema was refreshed and the profile location schema check returned HTTP 200.

The deeper JADX inspection is separately blocked because `REA_JADX_MCP_JAR` is not configured. Runtime findings are now being recorded from the authorized Android device. On 2026-10-22 the device was connected and the captured screen showed the Android lock screen/launcher rather than Stella. A relaunch attempt left the system notification shade focused, so no additional Stella screen was added from that capture.

#### P1 — Desire and manifestation model

- [x] Add persistent `desires` table and authenticated create/list/archive API
- [x] Add persistent manifestation history and edit/search/filter/share flows; detail screen remains
- [x] Add create, edit, archive, delete, list, search, filter, and share flows
- [x] Add a dedicated manifestation detail screen
- [x] Add a persistent Wall of Manifestations
- [x] Add empty, loading, and error states for manifestations
- [x] Add optimistic manifestation creation with rollback on failure

#### P2 — Personalized story generation

- [x] Add a personalized story card with regeneration and local persistence
- [ ] Add a server-side generation endpoint and background job
- [ ] Store story drafts, generation status, failures, and revisions
- [ ] Add retry and regeneration behavior
- [ ] Add a clear generated-story detail screen

#### P3 — Audio system

- [x] Add browser narration playback for the featured practice
- [ ] Add original or licensed audio tracks
- [ ] Add persistent player, queue, seek, skip, speed, favorites, and resume position
- [ ] Add mini-player and full-screen player
- [ ] Add completion state and playback error handling

#### P4 — Native visual and account flows

- [x] Add guided visualization templates, saved sessions, completion state, and progress cards
- [ ] Rebuild full visualization session and summary screens
- [x] Add reminder creation, list, enable/pause controls, and browser notification permission UI
- [x] Add reminder edit/delete controls
- [x] Add local notification history UI for browser reminders
- [ ] Add closed-app Web Push delivery
- [x] Add persisted appearance preference (warm rose / midnight) in profile settings
- [x] Add profile photo URL persistence in Profile & settings
- [x] Add authenticated backup restore for supported user tables
- [x] Add in-app help/privacy guidance and policy links
- [ ] Add richer support/help flows
- [ ] Add original SVG icon system matching the observed information architecture

#### P5 — Subscription and release hardening

- [ ] Add free/premium states and paywall UI if monetization is planned
- [ ] Add billing and restore-purchase behavior
- [ ] Add authenticated full-journey Playwright coverage
- [ ] Validate mobile widths, iOS standalone mode, offline mode, and deployment environment variables

## Evidence boundary

The local APK archive confirms product areas, resource names, layouts, permissions, and native Android structure. It does not prove runtime navigation or backend rules. Deeper JADX inspection is currently blocked because the required JADX MCP JAR is not configured. Runtime findings should be added here only after they are observed on the real app or a controlled device session.

## Definition of done

The replication milestone is complete when a dedicated authenticated Playwright account can move through onboarding, create a desire, generate or load a story, play and resume audio, complete a visualization, save a reflection, manage reminders, view the manifestation wall, edit profile/settings, and exercise account/data controls on mobile and desktop.

## Release prerequisites

- Copy `.env.example` into the deployment environment and provide Clerk, Supabase, and VAPID values.
- Generate a dedicated Clerk Playwright storage state and set `PLAYWRIGHT_AUTH_STATE` before running the authenticated journey.


## Solace Android 1.2.0 — 2026-10-26
- [x] Three-step onboarding with combined welcome/privacy, optional name/focus, and guided first manifestation; city/practice time moved to optional profile settings.
- [x] Consent-based server profile completion; existing users no longer require optional fields to enter the app.
- [x] Encrypted, chunked, per-account setup drafts with interrupted-write protection; failed entry saves retain text, and lost responses are checked before retrying insertion.
- [x] Post-save optional reminders, explicit permission timing, and a write-later path.
- [x] Read aloud for saved entries, visualizations and template stories, gentle pace, installed voice choices and lifecycle stop controls.
- [x] Content-free local setup diagnostics with explicit sharing; no external telemetry or population-level retention claims.
- [x] 37 automated tests, native lint and typecheck passed.
- [x] EAS build fc3fee90-4ac0-49ba-ad3d-ac083bf8d62d FINISHED; downloaded APK is 1.2.0 / code 4, matches the 1.1.0 parsed signing certificate, includes all new feature markers and the configured public Clerk key, declares TTS discovery and no microphone permission.
- [ ] Physical Android listening, real authenticated onboarding/sync, and phone reminder delivery remain unverified (no device/emulator connected).
