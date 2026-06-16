import { Resend } from 'resend'

// Lazily construct the client. The Resend constructor throws when no API key
// is present, so instantiating at module scope would break the build/runtime
// whenever RESEND_API_KEY is unset (email is optional). Construct on demand.
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

interface BookingEmailPayload {
  studentEmail: string
  studentName: string
  mentorEmail: string
  mentorName: string
  sessionDate: string
  sessionTime: string
  durationMins: number
  meetingUrl: string
  bookingId: string
}

export async function sendBookingConfirmation(payload: BookingEmailPayload) {
  const {
    studentEmail, studentName, mentorEmail, mentorName,
    sessionDate, sessionTime, durationMins, meetingUrl
  } = payload

  const subject = `✅ Session Confirmed: ${studentName} × ${mentorName}`
  const formattedDate = new Date(sessionDate + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const resend = getResend()
  if (!resend) return []

  const [h, m] = sessionTime.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const formattedTime = `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${suffix} IST`

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#f8f9ff;padding:32px;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <span style="font-size:2rem">🎓</span>
        <h1 style="color:#4338ca;margin:8px 0 0">Session Confirmed!</h1>
      </div>
      <div style="background:#fff;border-radius:8px;padding:24px;margin-bottom:16px">
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>Mentor:</strong> ${mentorName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Duration:</strong> ${durationMins} minutes</p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="${meetingUrl}" style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
          Join Meeting (Jitsi)
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;text-align:center">
        Meeting link: <a href="${meetingUrl}">${meetingUrl}</a>
      </p>
      <p style="color:#9ca3af;font-size:12px;text-align:center">
        Sent by SSB Mentor Platform
      </p>
    </div>
  `

  const results = await Promise.allSettled([
    resend.emails.send({
      from: 'SSB Mentors <noreply@ssb-mentors.com>',
      to: studentEmail,
      subject,
      html,
    }),
    resend.emails.send({
      from: 'SSB Mentors <noreply@ssb-mentors.com>',
      to: mentorEmail,
      subject,
      html,
    }),
  ])

  return results
}

export async function sendFeedbackReminder(studentEmail: string, studentName: string, mentorName: string, bookingId: string, appUrl: string) {
  const resend = getResend()
  if (!resend) return

  await resend.emails.send({
    from: 'SSB Mentors <noreply@ssb-mentors.com>',
    to: studentEmail,
    subject: `📝 How was your session with ${mentorName}?`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px">
        <h2>Hi ${studentName},</h2>
        <p>Your mentorship session with <strong>${mentorName}</strong> is now complete.</p>
        <p>Please take 2 minutes to share your feedback — it helps mentors improve and helps other students discover great mentors.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${appUrl}/student/sessions/${bookingId}" style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
            Leave Feedback
          </a>
        </div>
      </div>
    `,
  })
}
