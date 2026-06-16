import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId, rating, comments, submittedBy } = await req.json()

    if (!bookingId || !rating || !submittedBy) {
      return NextResponse.json({ error: 'bookingId, rating, submittedBy required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify the booking exists and the user is a participant
    const { data: booking } = await admin
      .from('bookings')
      .select('student_id, mentor_id, mentors(user_id)')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const isStudent = booking.student_id === user.id
    const isMentor = (booking.mentors as any)?.user_id === user.id

    if (!isStudent && !isMentor) {
      return NextResponse.json({ error: 'Not authorized to submit feedback for this session' }, { status: 403 })
    }

    // Cross-check: student can only submit student feedback, mentor only mentor
    if (submittedBy === 'student' && !isStudent) {
      return NextResponse.json({ error: 'Students can only submit student feedback' }, { status: 403 })
    }
    if (submittedBy === 'mentor' && !isMentor) {
      return NextResponse.json({ error: 'Mentors can only submit mentor feedback' }, { status: 403 })
    }

    // Upsert (in case of retry)
    const { error } = await admin.from('session_feedback').upsert({
      booking_id: bookingId,
      submitted_by: submittedBy,
      rating,
      comments: comments ?? null,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'booking_id,submitted_by' })

    if (error) throw error

    // Mark booking as completed when student submits feedback
    if (submittedBy === 'student') {
      await admin.from('bookings').update({ status: 'completed' }).eq('id', bookingId)
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/feedback]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
