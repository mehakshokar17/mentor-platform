# Product & Technical Decisions

## Product Thinking

### Problem framing
The core challenge is a two-sided marketplace with a scheduling workflow.
The hardest UX problems are: (1) showing availability without overwhelming the student,
(2) ensuring feedback actually gets submitted, and (3) keeping both sides informed without
building a full notification system.

### Mentor discovery
Chose a card-based grid with skill filter pills over a table or list view.
Cards communicate the mentor's personality faster and the pills let students quickly
narrow by domain (PM, Data, Finance) without needing a full search engine.

### Booking UX
Grouped available slots by date with visual time chips rather than a calendar widget.
Calendars feel heavy and often have poor mobile UX. Time chips are scannable and work
perfectly on small screens.

### Feedback nudge
When a student has pending feedback, we show a persistent amber banner on the dashboard
AND surface a "Leave Feedback" CTA directly on the sessions list.
This double-nudge pattern has consistently higher completion rates than a single reminder.

### Meeting platform
Chose Jitsi Meet over Zoom/Google Meet because:
- No API key required
- No OAuth scopes needed
- Generates a deterministic room URL from booking ID
- Works in every browser, no app download needed
- Each session gets a private room: `meet.jit.si/ssb-mentor-{bookingId[:16]}`

---

## Technical Decisions

### Supabase over Firebase
PostgreSQL lets us express complex relational queries (bookings → slots → mentors → profiles)
in a single join rather than multiple Firestore reads. Row-Level Security enforces data access
rules at the database layer, not the application layer — much harder to accidentally expose data.

### Next.js App Router
Server Components handle all the data-fetching dashboard pages (no loading spinners, no API
waterfalls). Client Components are used only where interactivity is needed (BookingModal,
FeedbackForm, AvailabilityPage). This keeps the UI fast and the bundle small.

### Booking creation is server-only
The booking POST route uses the Supabase service-role key (admin client) to:
1. Re-verify the slot is still available (prevents TOCTOU race)
2. Create the booking atomically
3. A database trigger marks the slot as booked

This means the slot can never be double-booked, even with concurrent requests.

### Email is non-blocking
If Resend fails, the booking still succeeds. We log the error server-side.
For a production system, we'd add a background job queue (e.g. pg_cron or a Supabase Edge
Function on `bookings` INSERT) to guarantee delivery.

### Feedback triggers status change
When a student submits feedback, the booking status changes to `completed`.
This is intentional: it creates a clear lifecycle (confirmed → completed)
and prevents students from submitting duplicate feedback.

### No real-time subscriptions
For this demo scope, we use server-side rendering + `router.refresh()` after mutations.
At higher scale, we'd add Supabase Realtime subscriptions on the mentor dashboard
so they see new bookings without refreshing.
