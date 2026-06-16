# SSB Mentor Platform

A full-stack mentorship booking platform for Scaler School of Business.
Students discover mentors, book sessions, join meetings, and submit feedback.
Mentors manage availability and give session feedback.

**Live demo URL:** _(deploy to Vercel and paste URL here)_  
**GitHub repo:** _(paste URL here)_

---

## Quick Start (5 minutes to deploy)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd mentor-platform
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **anon key** from Project Settings → API
3. Also copy the **service_role key** (keep secret)

### 3. Run database migrations

In Supabase Dashboard → SQL Editor, paste and run **in order**:
- `supabase/migrations/001_schema.sql`
- (see step 4 before running seed)

### 4. Create test users

In Supabase Dashboard → Authentication → Users, click "Add user":

| Email | Password | Role |
|---|---|---|
| `mehakshokar17@gmail.com` | `Mentor@2024` | mentor |
| `shanmuga@ssb.scaler.com` | `Student@2024` | student |

Then run `supabase/migrations/002_seed.sql` in the SQL Editor.  
This creates the mentor profile for Mehak Shokar and seeds 14 availability slots.

### 5. Set environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...           # optional — get free key at resend.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Run locally

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 7. Deploy to Vercel

```bash
npx vercel --prod
```
Add the same env vars in Vercel project settings → Environment Variables.  
Update `NEXT_PUBLIC_APP_URL` to your Vercel URL.

---

## Testing the Complete Flow

1. **Login as student:** `shanmuga@ssb.scaler.com` / `Student@2024`
2. Browse mentors → find **Mehak Shokar**
3. View profile → select a slot → book session
4. Receive meeting URL (Jitsi) and confirmation email
5. Click **Join Meeting** → opens Jitsi in a new tab
6. After session: submit feedback (star rating + comments)
7. **Login as mentor:** `mehakshokar17@gmail.com` / `Mentor@2024`
8. View the booking notification in dashboard
9. Submit mentor feedback for the student

---

## Architecture

```
Next.js 14 (App Router)
├── /app/auth          → Login, OAuth callback
├── /app/student/*     → Student dashboard, mentor browse, sessions
├── /app/mentor/*      → Mentor dashboard, availability, sessions
├── /app/api/*         → POST /bookings, POST /feedback
└── /components        → Shared Navbar, FeedbackForm, BookingModal

Supabase
├── Auth               → Email/password auth
├── PostgreSQL         → profiles, mentors, availability_slots, bookings, session_feedback
└── RLS                → Row-level security per role

Meetings   → Jitsi Meet (free, no API key, per-booking room URL)
Emails     → Resend (optional, free 3k/mo)
Deploy     → Vercel (zero config)
```

---

## Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| **Backend** | Supabase | Instant Postgres + Auth + RLS. No server to manage. |
| **Framework** | Next.js 14 App Router | SSR for dashboards, client components for interactions |
| **Meetings** | Jitsi Meet | Zero API key, just a URL per room. Works instantly. |
| **Email** | Resend | 3,000 free emails/mo, React email templates, 5-min setup |
| **Auth** | Email+password | Simple for demo; magic link or Google OAuth can be added |
| **Duplicate prevention** | DB constraint + API check | `unique(mentor_id, slot_date, start_time)` + RLS |
| **Styling** | Tailwind CSS | Rapid UI, mobile-first, no design system dependency |

---

## Feature Checklist

- [x] Student: Browse & search mentors by name/role/skill
- [x] Student: View mentor profile (LinkedIn, skills, bio, experience)
- [x] Student: Book session from available slots
- [x] Student: Receive email confirmation with meeting URL
- [x] Student: View upcoming & past sessions
- [x] Student: Join meeting via Jitsi (1-click)
- [x] Student: Submit star-rating feedback + comments
- [x] Mentor: Dashboard with stats
- [x] Mentor: Add/remove availability slots (bulk or single)
- [x] Mentor: View all bookings with student details
- [x] Mentor: Join meeting via Jitsi
- [x] Mentor: Submit feedback for students
- [x] Platform: Booking confirmation emails (Resend)
- [x] Platform: Duplicate/overlapping booking prevention
- [x] Platform: Feedback completion tracking
- [x] Platform: Role-based routing (students ≠ mentor pages)
- [x] Platform: Mobile-responsive UI
- [x] Mentor profile: Mehak Shokar seeded with 14 availability slots
