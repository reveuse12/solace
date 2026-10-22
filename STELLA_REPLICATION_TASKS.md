# Stella replication tracker

This is the working checklist for bringing Solace closer to the Stella product experience. The implementation uses original Solace branding, copy, artwork, and audio. Stella's APK and public product are references for information architecture and interaction behavior.

Status: 2026-10-22

## Current progress

### Complete

- [x] Clerk authentication and protected `/app` route
- [x] Public landing page and stable post-login redirect
- [x] Three-step onboarding flow based on the available Stella prototype
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

- [ ] Home screen has a manifestation-first UI, but the desire is currently local state rather than a complete persistent desire model
- [ ] Affirmations and Wall of Manifestations are UI flows; they need Supabase persistence and account history
- [ ] Future-self visualization has an entry point, but the complete guided session and summary flow is not finished
- [ ] Audio cards and play state exist, but there are no licensed tracks, queue, seek, or resume persistence
- [ ] Profile/settings works, but the full native-style settings and theme system is incomplete
- [ ] The mobile shell is close to the reference direction, but exact APK runtime behavior has not been verified

### Pending by priority

#### P0 — Verify the reference runtime

- [ ] Capture Stella on a connected Android device or emulator
- [ ] Record every screen, navigation action, bottom sheet, dialog, loading state, and error state
- [ ] Confirm onboarding questions, bottom-nav labels, home hierarchy, and back behavior
- [ ] Confirm exact icon roles and visual states without shipping extracted proprietary assets

#### P1 — Desire and manifestation model

- [ ] Add persistent `desires` and manifestation history tables
- [ ] Add create, edit, archive, delete, list, detail, search, filter, and share flows
- [ ] Add a persistent Wall of Manifestations
- [ ] Add empty, loading, error, and optimistic-update states

#### P2 — Personalized story generation

- [ ] Add a server-side generation endpoint and background job
- [ ] Store story drafts, generation status, failures, and revisions
- [ ] Add retry and regeneration behavior
- [ ] Add a clear generated-story detail screen

#### P3 — Audio system

- [ ] Add original or licensed audio tracks
- [ ] Add persistent player, queue, seek, skip, speed, favorites, and resume position
- [ ] Add mini-player and full-screen player
- [ ] Add completion state and playback error handling

#### P4 — Native visual and account flows

- [ ] Rebuild full visualization session and summary screens
- [ ] Add reminder list, edit/delete, notification history, and Web Push
- [ ] Add profile photo, preferences, themes, backup/restore, help, and privacy screens
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
