# Studybound — System Instructions for Antigravity

## 0. Priority Legend (use this everywhere below)
- **#P0** — Core / must-have. The site is broken or the demo fails without this.
- **#P1** — Important. Build if P0 is done and stable. Strongly improves the demo.
- **#P2** — Nice-to-have / polish. Only touch after P0 and P1 are solid.

Build strictly in order: all P0 items across both features → all P1 → all P2. Do not start P1 work while any P0 item is incomplete or broken.

---

## 1. Project Overview

**Product name:** Studybound
**One-line pitch:** A study platform where accountability and shared knowledge feed each other — every focus session helps build a verified notes library for the next student.

**Two connected halves:**
1. **Notes Database** — an open, anonymous, per-course notes library where accuracy is decided by peer confirmation, not uploader reputation.
2. **Study Rooms** — Google-Meet-style focus sessions, joined via a shareable link or a short meeting code, with a built-in synced Pomodoro timer. When a session ends, participants are prompted to contribute to the Notes Database for the course they just studied.

**Design philosophy:** Minimalistic, clean, fast to navigate. No clutter, no unnecessary steps, no login walls blocking core actions where avoidable. Every screen should have one obvious primary action.

---

## 2. Tech Stack Guidance

Antigravity should choose the simplest stack that hits every P0 requirement quickly. Suggested defaults (deviate only if there's a clearly faster path):

- **Frontend:** React (Vite), plain CSS or Tailwind for styling — no heavy UI kits, keep it lightweight and custom for the minimalist look.
- **Backend:** Node.js + Express, or a BaaS like Firebase/Supabase if it speeds up auth + realtime + database in one go. **[P0 decision — pick one before writing any other code.]**
- **Database:** Firestore/Supabase Postgres, or plain MongoDB — whatever pairs with the backend choice above. Must support: courses, notes, votes, rooms, participants, sessions.
- **Realtime layer (for Study Rooms + synced Pomodoro):** Firebase Realtime DB/Firestore listeners, or Socket.io if using a custom Node backend. **#P0**
- **Video/Audio call layer:** Do NOT build WebRTC signaling from scratch under hackathon time pressure. Embed an existing SDK/service (e.g., Jitsi Meet embeddable iframe/API, Daily.co, or 100ms) inside the Room page. Room code/link maps to a call room ID from that service. **#P0**
- **Auth:** Minimal — anonymous session tokens or lightweight email/username login. No heavy identity verification needed; this app leans anonymous by design. **#P0**
- **Hosting:** Vercel/Netlify for frontend, Render/Railway/Firebase Functions for backend. **#P1**

---

## 3. Information Architecture / Pages

1. **Home / Landing** `#P0` — Explains the two features in one screen, two clear buttons: "Browse Notes" and "Start or Join a Study Room."
2. **Courses List** `#P0` — List/grid of courses. Search + filter by course code/name.
3. **Course Notes Feed** `#P0` — All notes for one course, sorted by confirmation score.
4. **Upload/Confirm Note Modal** `#P0` — Simple form: title, course, text/file, optional tags.
5. **Study Room Landing** `#P0` — Two actions: "Create a Room" (generates link + short code) or "Join a Room" (enter code or paste link).
6. **Study Room (in-session)** `#P0` — Video tiles (via embedded SDK), participant list, Pomodoro control panel, shared timer display, leave button.
7. **Post-Session Prompt** `#P0` — Appears when a session/Pomodoro cycle ends: "Upload a note from this session" or "Confirm an existing note" or "Skip."
8. **Streaks/Profile (lightweight)** `#P1` — Shows current focus streak, sessions completed, notes contributed.
9. **Note Detail View** `#P1` — Full note content, confirm/flag buttons, vote counts.
10. **About/How it works** `#P2`.

Navigation: a persistent top bar with only 2–3 links max (Notes, Study Rooms, [Profile]). No deep nested menus. This is the core of the "minimalistic, clean, easy to navigate" requirement — enforce it strictly.

---

## 4. Feature 1 — Notes Database (Open Database Model)

### 4.1 Concept
An open, anonymous, crowd-verified notes library, organized by course. No note "belongs" visibly to a person in the UI — trust is built on the note itself via community confirmation, not on uploader identity/reputation.

### 4.2 Data Model `#P0`
- **Course**: `id`, `name`, `code`, `createdAt`
- **Note**: `id`, `courseId`, `title`, `content` (text and/or file/image upload), `tags[]`, `createdAt`, `confirmCount`, `flagCount`, `confidenceScore` (derived)
- **Vote**: `id`, `noteId`, `type` (confirm/flag), `voterSessionId` (to prevent duplicate votes from the same anonymous session — not tied to a public identity), `createdAt`

### 4.3 Core Behaviors `#P0`
- Anyone can upload a note to a course without creating a rich profile — a lightweight anonymous session ID is enough to prevent spam/duplicate voting.
- Anyone can **Confirm** (accurate) or **Flag** (inaccurate/outdated) a note. One vote per session per note.
- Notes feed sorts by **confidenceScore** = `confirmCount − flagCount` (simple formula for MVP; do not over-engineer).
- Notes with flagCount above a small threshold (e.g., ≥3 more flags than confirms) are visually marked "Disputed" but never deleted automatically. `#P1`
- Basic search/filter by course, tag, or keyword in title. `#P1`

### 4.4 UI Requirements `#P0`
- Notes feed: clean card list — title, short preview, confirm/flag counts, "Confirmed ✅" badge if score is high.
- Upload form: as few fields as possible (title, course auto-selected if coming from a course page, content, optional tags). No mandatory account creation to view notes; uploading may require the lightweight anonymous session only.
- No user avatars, usernames, or profile links anywhere in the notes UI — keep it identity-free by design. `#P0`

---

## 5. Feature 2 — Study Rooms (Google-Meet-style Focus Sessions)

### 5.1 Concept
A focus/accountability room that behaves like a lightweight video meeting: create a room, get a shareable link and a short human-readable meeting code, share it, others join. Inside the room, a **synced Pomodoro timer** structures the session for everyone present. When a Pomodoro work-cycle or the full session ends, participants are routed into the Notes contribution flow for the relevant course.

### 5.2 Room Creation & Joining `#P0`
- **Create Room** flow:
  1. User selects the course they're studying (links session to a course for the later notes prompt).
  2. System generates:
     - A **shareable link** (e.g., `studybound.app/room/abc123xyz`)
     - A **short meeting code** (e.g., 6-character alphanumeric, e.g., `KX9F2Q`) as an alternative to the link, mirroring Google Meet's dual entry pattern.
  3. Creator lands directly in the room as the first participant.
- **Join Room** flow:
  1. User pastes the link OR types the meeting code into a single input field.
  2. System validates the room exists and is still active, then joins the user in.
- Rooms should have a reasonable participant cap for MVP demo purposes (e.g., 2–6 people) — this is an accountability room, not a lecture hall. `[P1 to enforce a cap; P0 to at least support 2 participants]`

### 5.3 In-Room Experience `#P0`
- Video/audio tiles via the embedded call SDK (see Section 2). Mic/camera toggle controls.
- Participant list showing who's in the room (anonymous display names like "Student 1", "Student 2" are fine — no forced real names). `#P0`
- Persistent "Leave Room" button.
- A visible **shared session state**: everyone in the room sees the same Pomodoro timer, same phase (Focus/Break), same time remaining — this must be synced via the realtime layer, not run independently per client. `#P0`

### 5.4 Pomodoro Timer (built into the room) `#P0`
- Any participant can start a Pomodoro cycle from inside the room (or the creator starts it for the room — pick whichever is simpler to implement first, then consider allowing any participant).
- Default settings: 25 min focus / 5 min short break / 15 min long break after 4 cycles — but make these adjustable via a simple settings panel before starting. `[P0 for defaults, P1 for adjustability]`
- Timer state (phase, time remaining, cycle count) lives in the realtime backend so every client renders the same countdown — do not let each browser run its own independent timer that can drift out of sync. `#P0`
- Clear visual + audio cue when a phase changes (Focus → Break, Break → Focus). `#P1`
- Leaving mid-cycle breaks that participant's personal streak (see 5.5) but does not necessarily end the room for others. `#P1`

### 5.5 Streaks / Accountability `#P1`
- Track a simple per-user (per anonymous session, or per lightweight account) streak: consecutive completed focus cycles without early exit.
- Display current streak count somewhere visible (room UI and/or lightweight profile page).
- No leaderboard needed for MVP — keep it personal, not competitive, to avoid scope creep. `[P2 if a leaderboard is desired later]`

### 5.6 Post-Session → Notes Bridge `#P0`
This is the feature that connects both halves and should be highlighted clearly in the demo:
- When a Focus cycle (or the full session) ends, show a prompt inside the room: **"Add a note from this session"** (opens the Note Upload form, pre-filled with the room's course) or **"Confirm an existing note"** (jumps to that course's notes feed) or **"Skip."**
- This prompt is the single most important connective feature of the whole product — do not let it be optional/hidden behind extra clicks. It should appear automatically at cycle end. `#P0`

---

## 6. Design / UI Guidelines (applies to the whole site)

- **Minimalist visual language:** generous white space, limited color palette (1 primary accent color + neutrals), no decorative clutter.
- **Navigation:** max 2–3 top-level nav items at all times. Every page should be reachable in 2 clicks or fewer from Home.
- **Typography:** one clean sans-serif font family, clear hierarchy (large page titles, medium section headers, readable body text).
- **Consistency:** buttons, cards, and modals should look and behave identically across Notes and Study Rooms sections — this is one product, not two stitched-together apps.
- **No forced onboarding walls:** users should be able to browse notes and understand the Study Room flow without being forced through a long signup process first. `#P1`
- **Mobile responsiveness:** basic responsive layout is a plus but not required for the first demo-ready build. `#P2`

---

## 7. Explicitly Out of Scope for MVP (do not build these unless P0+P1 are fully done early)

- Full user profiles with public reputation/leaderboards.
- Note versioning/edit history.
- Custom-built WebRTC signaling server (use an embedded SDK instead).
- Payment/monetization of any kind.
- Native mobile apps.
- Advanced moderation tooling beyond simple flag counts.

---

## 8. Build Order Summary (for Antigravity to follow literally)

1. Set up project skeleton, choose backend/DB/realtime/call-SDK stack (Section 2).
2. Build Courses + Notes data model and Notes Feed + Upload/Confirm/Flag flow (Section 4, all P0).
3. Build Study Room creation/joining with link + short code (Section 5.2, P0).
4. Embed video/audio call SDK into the Room page (Section 5.3, P0).
5. Build synced Pomodoro timer backed by realtime state (Section 5.4, P0).
6. Build the Post-Session → Notes bridge prompt (Section 5.6, P0) — **this is the demo's signature moment, do not skip or rush it.**
7. Apply minimalist UI/navigation polish across all pages (Section 6).
8. Only then move to P1 items (streaks, adjustable Pomodoro settings, search/filter, note detail view, disputed-note marking).
9. Only then move to P2 polish items.
