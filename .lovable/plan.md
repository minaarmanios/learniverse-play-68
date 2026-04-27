
# KidLearn — Installable Learning App (v1)

A bright, mobile-first installable web app (PWA) where kids ages 5–12 learn **English** and **Math** through Duolingo-style lessons, with a friendly mascot, XP, streaks, and a dedicated **Chess** corner featuring an AI opponent.

---

## What kids get

### Onboarding
- Mascot (a cheerful cartoon owl named **Hoot**) walks the kid through a 3-step intro.
- Pick an avatar + age band (5–7, 8–10, 11–12) so lessons start at the right level.
- Quick email/password sign-up (built for kids: large inputs, show-password toggle, simple errors).

### Home — the "World Map"
- A scrollable Duolingo-style path with bubble nodes per lesson.
- Top bar shows: avatar, current **XP**, **streak flame**, **coin** count.
- Mascot pops up with a daily greeting and one-tap "Start today's lesson" CTA.
- Tabs at bottom: **Learn**, **Chess**, **Profile**.

### Lesson engine (English & Math)
Lessons are JSON-driven so new ones can be added without code changes. Each lesson is a sequence of mini-game "exercises". Supported exercise types in v1:

- **Multiple choice** (image or text options) — e.g. "Which one is an apple?"
- **Match pairs** — e.g. word ↔ picture, or `3 + 4` ↔ `7`
- **Tap to fill the blank** — e.g. "The cat ___ on the mat."
- **Tap-to-build sentence** — drag word tiles into order.
- **Number tap** — counting visual objects.
- **Math input** — big number pad for addition/subtraction/multiplication/division.
- **Listen & repeat** (English only) — mascot says a word via TTS, kid taps mic and repeats; speech recognition scores pronunciation and gives a star rating.

Every correct answer plays a happy sound + bouncy animation. Wrong answers give gentle feedback ("Try again!") and never punish. End-of-lesson screen: stars earned, XP gained, streak update, "Continue" button.

### Chess corner
- Interactive board (drag pieces, legal-move highlighting, capture animation).
- **Learn** mode: short illustrated lessons on each piece + 5 starter puzzles (mate-in-1, mate-in-2).
- **Play** mode: Kid vs **AI opponent** with three difficulty dials (Beginner / Easy / Friendly) — uses a lightweight chess engine in-browser.
- Winning a puzzle or beating the AI awards XP + a chess-themed badge.

### Gamification
- **XP** per correct answer + lesson completion bonus.
- **Levels** unlock new map sections.
- **Daily streak** with a 24h grace freeze (1 free skip/week so kids don't feel crushed).
- **Coins** earned from lessons; spendable on cosmetic mascot outfits.
- **Badges** for milestones (first lesson, 7-day streak, 100 XP, first chess win, etc.).
- Celebration screen with confetti animation on level up.

### Profile
- Stats: XP, level, streak, badges grid, lessons completed.
- Edit avatar + name.
- Sign out.
- Parent-friendly note: "Your progress is saved to your account."

### Voice (English pronunciation)
- Uses **ElevenLabs TTS** for the mascot's voice (warm, friendly).
- Uses the browser's built-in Speech Recognition for pronunciation scoring (free, works on most modern phones). Falls back gracefully on unsupported devices ("Tap to mark as said it!").

### Installable
- Web app manifest with proper icons, theme color, `display: standalone`.
- Visiting on a phone shows: "Add KidLearn to your home screen" tip.
- No service worker / offline cache in v1 (per Lovable PWA guidance — keeps preview reliable). Lessons load fast from the database.

---

## Look & feel
- Bright, friendly palette: warm yellow, sky blue, mint green, soft coral. White cards with chunky rounded corners and playful shadows.
- Big tap targets (min 56px), rounded "candy" buttons.
- Rounded display font (e.g. **Fredoka** or **Baloo 2**) for headings, readable sans for body.
- Subtle bounce/scale animations on every interaction.
- Mascot illustrations in 3–4 expressions (happy, cheering, thinking, sad).

---

## Data model (Lovable Cloud)

- `profiles` — id (FK auth.users), display_name, avatar_id, age_band, xp, level, coins, current_streak, longest_streak, last_active_date.
- `lessons` — id, subject ('english' | 'math'), order_index, title, age_band, difficulty, content (JSON: array of exercises), xp_reward.
- `lesson_progress` — id, user_id, lesson_id, stars (0–3), score, completed_at.
- `badges` — id, code, title, description, icon.
- `user_badges` — user_id, badge_id, earned_at.
- `chess_progress` — user_id, puzzles_solved, ai_wins, ai_losses, current_difficulty.

RLS: every user can only read/write their own rows. Lessons/badges are public-read.

Seed v1 with **~10 English lessons + ~10 Math lessons + 5 chess puzzles** so the map feels alive on day one.

---

## Out of scope for v1 (future versions)
- Parent dashboard / multi-child profiles
- Adaptive difficulty engine
- Multiplayer chess
- Push notifications (limited on iOS PWAs anyway)
- Admin CMS (lessons added directly via Cloud DB tables for now)
- Offline support
- Native iOS/Android wrap (Capacitor) — easy to add later

---

## Technical notes (for the curious)
- React + Vite + TypeScript + Tailwind, shadcn/ui components.
- Lovable Cloud (Supabase) for auth, DB, storage.
- `chess.js` for move validation; lightweight minimax engine for the AI opponent.
- ElevenLabs TTS via a Cloud edge function (keeps API key secret). Will request the `ELEVENLABS_API_KEY` secret during implementation.
- Web Speech API for pronunciation (browser-native, no key).
- Web app manifest only — no service worker (per project guidance).
- Lottie/CSS animations for celebrations.
- Zustand for lightweight client state; React Query for server data.

---

Tap **Implement plan** when this looks right and I'll start building.
