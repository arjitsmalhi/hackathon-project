# Studybound — Development, Security & Launch Guidelines

Companion file to `studybound_system_instructions.md`. That file defines WHAT to build and in what order. This file defines HOW to build it responsibly, HOW to keep it secure, and WHAT to do once it's built. Use the same `#P0` / `#P1` / `#P2` priority tags as the system instructions file — do not skip `#P0` items in this file for the sake of speed.

---

## 1. Code Quality Standards `#P0`

- Write clean, readable, well-organized code — clear file/folder structure separating frontend, backend, and shared config. No dumping everything into one giant file.
- Use meaningful variable/function names. No single-letter names outside trivial loop counters.
- Keep functions small and single-purpose. If a function is doing more than one clear thing, split it.
- Add short comments explaining *why*, not *what*, for any non-obvious logic (e.g., why a timer is server-authoritative, why votes are deduplicated a certain way).
- No leftover console.logs, dead code, or commented-out blocks in the final build. `#P1`
- Use consistent formatting (pick one style — e.g., Prettier defaults — and apply it everywhere). `#P1`
- Validate all user input on both frontend and backend — never trust the client. `#P0`
- Handle errors gracefully everywhere: no unhandled promise rejections, no raw stack traces shown to users. Show friendly error states in the UI instead. `#P0`
- Keep environment-specific values (API keys, DB URLs, SDK keys) out of the codebase entirely — use environment variables and a `.env.example` file with placeholder values only. `#P0`

---

## 2. Security Requirements — Specific to This App `#P0`

Studybound's core design choices (anonymity, open notes, shareable room codes) create specific risks. Address these directly, not generically:

### 2.1 Anonymous Voting / Notes Abuse Prevention `#P0`
- Prevent duplicate voting by the same session on the same note (already part of the data model — enforce it server-side, not just in the UI).
- Rate-limit note uploads and votes per session/IP to prevent spam flooding (e.g., max N uploads or votes per minute). `#P0`
- Sanitize all note content on upload to prevent stored XSS — never render raw uploaded HTML/text directly into the DOM without escaping/sanitizing. `#P0`
- If file uploads are supported for notes, restrict file types (e.g., images/PDFs only), enforce a max file size, and scan/limit filenames to prevent path traversal or malicious filenames. `#P1`

### 2.2 Study Room Access Control `#P0`
- Room join codes must be sufficiently random and non-guessable (e.g., 6+ alphanumeric characters from a large character set) to prevent brute-force room-hopping into strangers' sessions.
- Rate-limit room-join attempts by code (to prevent brute-forcing short codes). `#P0`
- Rooms should expire / become invalid after a reasonable period of inactivity so old links/codes can't be reused indefinitely to rejoin stale sessions. `#P1`
- Never expose a full list of active rooms publicly — joining must require the exact link or code. `#P0`

### 2.3 Video/Audio SDK Integration `#P0`
- Any API keys/secrets for the embedded call SDK (Jitsi/Daily.co/100ms/etc.) must live server-side or in environment variables — never hardcoded in frontend source or committed to version control.
- If the SDK requires generating join tokens, generate them server-side per room/session, not client-side. `#P0`
- Ensure mic/camera permissions are requested transparently and can be denied without breaking the rest of the room experience (timer, chat, notes prompt should still work). `#P1`

### 2.4 General Web Security Hygiene `#P0`
- Use HTTPS everywhere in production (should be automatic on Vercel/Netlify/Render, but confirm it).
- Set safe HTTP headers (CSP, X-Content-Type-Options, X-Frame-Options or equivalent) where the hosting platform allows configuration. `#P1`
- Keep dependencies up to date and avoid pulling in unmaintained/unnecessary packages — run an audit (e.g., `npm audit`) before final launch and fix any high/critical vulnerabilities. `#P0`
- Do not log sensitive data (session tokens, personal info) to server logs or third-party analytics. `#P0`
- If any lightweight auth/session system is used, ensure session tokens are generated securely (not predictable/sequential) and expire appropriately. `#P0`

---

## 3. Keep the Core App Requirements in Mind Throughout `#P0`

While writing code, continuously check work against the actual product requirements — it's easy for an AI coding agent to drift into building generic/unrelated features. Before marking any feature "done," confirm it satisfies:
- The notes database stays identity-free in the UI (no usernames/avatars shown). 
- The Pomodoro timer state is synced/server-authoritative across all participants in a room, not run independently per browser.
- The post-session "add a note / confirm a note" prompt actually appears automatically at the end of a focus cycle — this is the product's signature feature and must not be missed, hidden, or broken.
- Navigation stays minimal (2–3 top-level items) and every page is reachable within 2 clicks of Home, per the system instructions file.

If a build decision would conflict with any of these, stop and flag it rather than quietly deviating.

---

## 4. Launch Checklist `#P0`

Once the `#P0` and `#P1` features from the system instructions file are complete and tested locally:

1. Run through the full user flow manually at least once end-to-end: create a course → upload/confirm a note → create a room → join it from a second session/browser → run a Pomodoro cycle → confirm the post-session notes prompt appears → confirm a note.
2. Run a dependency/security audit (`npm audit` or equivalent) and resolve high/critical issues.
3. Confirm all API keys/secrets are in environment variables on the hosting platform, not in the repo.
4. Deploy frontend (Vercel/Netlify) and backend (Render/Railway/Firebase Functions), connecting the production database.
5. Verify HTTPS is active and the deployed room codes/links work across two different devices/networks, not just localhost.
6. Test on at least two browsers (e.g., Chrome + Firefox) to catch obvious compatibility issues.
7. Do a final pass on mobile width to make sure nothing is completely broken, even if full responsiveness is only `#P2`.

---

## 5. Post-Launch Troubleshooting Protocol `#P0`

After launch, when issues come up:
1. Reproduce the issue with clear steps before attempting a fix — don't patch blind.
2. Check browser console and server/backend logs first; most realtime-sync or video-SDK issues will show an error there.
3. For Pomodoro/timer desync issues: verify the timer state is being read from the shared backend/realtime source and not recalculated independently on each client.
4. For room-join failures: verify the room code/link hasn't expired and that rate-limiting isn't incorrectly blocking a legitimate user.
5. For notes not appearing/sorting incorrectly: check the confidence score calculation and confirm votes are being recorded against the correct note/course IDs.
6. Fix the root cause, not just the symptom — if a quick patch is applied under time pressure, note it clearly in code comments so it can be revisited.
7. After any fix, re-run the relevant part of the Section 4 launch checklist to confirm nothing else broke.

---

## 6. Explicitly Do Not `#P0`

- Do not hardcode any API keys, secrets, or credentials anywhere in the committed source code.
- Do not skip input sanitization "for now" — stored XSS on an open notes platform is a real, immediate risk, not a theoretical one.
- Do not build features not covered in the system instructions file without flagging it first — stay scoped.
- Do not silently ignore failed API/network calls — always surface a clear state to the user (loading, error, retry).
