// Google Meet + Calendar integration.
//
// A Google Meet link is created by inserting a Google Calendar event with
// conferencing attached. Doing so ALSO puts the event on both attendees'
// Google Calendars and emails them an invite (sendUpdates=all). So this one
// call satisfies both "generate a Meet link" and "auto-connect Google Calendar".
//
// Requires three env vars (a one-time OAuth setup): GOOGLE_CLIENT_ID,
// GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN (+ optional GOOGLE_CALENDAR_ID).
// When they're absent, callers fall back to the Jitsi link — nothing breaks.

interface MeetEventParams {
  summary: string
  description: string
  date: string        // YYYY-MM-DD
  startTime: string   // HH:MM or HH:MM:SS
  endTime: string     // HH:MM or HH:MM:SS
  attendees: string[]
  requestId: string   // stable idempotency key (use the booking id)
}

export function isGoogleMeetConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN,
  )
}

async function getAccessToken(): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) {
    console.error('[google token]', res.status, await res.text())
    return null
  }
  const data = await res.json()
  return data.access_token ?? null
}

// Returns the Meet link + calendar event id, or null on any failure / not configured.
export async function createMeetEvent(p: MeetEventParams): Promise<{ meetingUrl: string; eventId: string } | null> {
  if (!isGoogleMeetConfigured()) return null
  try {
    const token = await getAccessToken()
    if (!token) return null

    const withSeconds = (t: string) => (t.length === 5 ? `${t}:00` : t)
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: p.summary,
          description: p.description,
          start: { dateTime: `${p.date}T${withSeconds(p.startTime)}`, timeZone: 'Asia/Kolkata' },
          end: { dateTime: `${p.date}T${withSeconds(p.endTime)}`, timeZone: 'Asia/Kolkata' },
          attendees: p.attendees.filter(Boolean).map(email => ({ email })),
          conferenceData: {
            createRequest: {
              requestId: p.requestId,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        }),
      },
    )
    if (!res.ok) {
      console.error('[google event]', res.status, await res.text())
      return null
    }
    const ev = await res.json()
    const meetingUrl: string | undefined =
      ev.hangoutLink ||
      ev.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri
    if (!meetingUrl) return null
    return { meetingUrl, eventId: ev.id }
  } catch (err) {
    console.error('[createMeetEvent]', err)
    return null
  }
}
