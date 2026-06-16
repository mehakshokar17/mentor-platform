import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateMeetingUrl } from '@/lib/utils/meeting'
import { createMeetEvent } from '@/lib/utils/google-meet'
import { sendBookingConfirmation } from '@/lib/utils/email'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { slotId, mentorId, notes } = await req.json()
    if (!slotId || !mentorId) {
      return NextResponse.json({ error: 'slotId and mentorId are required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify slot exists, belongs to mentor, and is not yet booked
    const { data: slot, error: slotErr } = await admin
      .from('availability_slots')
      .select('*')
      .eq('id', slotId)
      .eq('mentor_id', mentorId)
      .eq('is_booked', false)
      .single()

    if (slotErr || !slot) {
      return NextResponse.json({ error: 'Slot not available or already booked' }, { status: 409 })
    }

    // Check for duplicate / overlapping booking (same student, same day, overlapping time)
    const { data: existing } = await admin
      .from('bookings')
      .select('id')
      .eq('student_id', user.id)
      .eq('session_date', slot.slot_date)
      .eq('session_time', slot.start_time)
      .eq('status', 'confirmed')

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'You already have a booking at this time' }, { status: 409 })
    }

    // Get mentor details for the meeting URL and email
    const { data: mentor } = await admin
      .from('mentors')
      .select('*, profiles!mentors_user_id_fkey(full_name, email)')
      .eq('id', mentorId)
      .single()

    // Get student profile
    const { data: studentProfile } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Create the booking
    const bookingId = crypto.randomUUID()

    // Prefer a real Google Meet link + Google Calendar invite (when configured);
    // otherwise fall back to an instant Jitsi room. Calendar invites to both
    // parties are sent by Google automatically (sendUpdates=all).
    const studentEmail = studentProfile?.email ?? user.email!
    const meet = await createMeetEvent({
      summary: `Mentorship: ${studentProfile?.full_name ?? 'Student'} × ${mentor?.name ?? 'Mentor'}`,
      description: notes?.trim()
        ? `SSB mentorship session.\n\nStudent's note: ${notes.trim()}`
        : 'SSB mentorship session.',
      date: slot.slot_date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      attendees: [studentEmail, mentor?.email].filter(Boolean) as string[],
      requestId: bookingId,
    })
    const meetingUrl = meet?.meetingUrl ?? generateMeetingUrl(bookingId)

    const { error: bookingErr } = await admin.from('bookings').insert({
      id: bookingId,
      student_id: user.id,
      mentor_id: mentorId,
      slot_id: slotId,
      status: 'confirmed',
      meeting_url: meetingUrl,
      session_date: slot.slot_date,
      session_time: slot.start_time,
      duration_mins: mentor?.session_duration ?? 30,
      notes: notes ?? null,
    })

    if (bookingErr) throw bookingErr

    // Send confirmation emails (non-blocking — don't fail the booking if email fails)
    if (process.env.RESEND_API_KEY) {
      sendBookingConfirmation({
        studentEmail: studentProfile?.email ?? user.email!,
        studentName: studentProfile?.full_name ?? 'Student',
        mentorEmail: mentor?.email ?? '',
        mentorName: mentor?.name ?? 'Mentor',
        sessionDate: slot.slot_date,
        sessionTime: slot.start_time,
        durationMins: mentor?.session_duration ?? 30,
        meetingUrl,
        bookingId,
      }).catch(console.error)
    }

    return NextResponse.json({ bookingId, meetingUrl }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/bookings]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
