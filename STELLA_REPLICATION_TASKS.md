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
- [x] Confirm onboarding questions, bottom-nav labels, home hierarchy, and back behavior — location question observed; remaining runtime screens still being mapped
- [ ] Confirm exact icon roles and visual states without shipping extracted proprietary assets

P0 static audit completed from the local APK archive. The package contains native layouts for desires, music, playlists, visualization, thoughts, reminders, notifications, profile, themes, settings, backup/restore, help, and subscription/pro flows. It also contains app-specific icon resources for navigation, playlists, statistics, settings, filters, search, favorites, sharing, editing, deletion, notifications, and playback. This is shipped-artifact evidence only; it does not establish runtime order or behavior.

Profile location persistence now has a pending migration in `supabase/migrations/005_profile_context.sql`; run it in the linked Supabase project before relying on saved location.

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
