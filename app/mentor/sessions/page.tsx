import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, CheckCircle, XCircle, Star, ExternalLink } from 'lucide-react'
import { formatDate, formatTime, isSessionUpcoming } from '@/lib/utils/meeting'

export default async function MentorSessionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: mentor } = await supabase
    .from('mentors')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, status, session_date, session_time, duration_mins, meeting_url, notes, created_at,
      profiles!bookings_student_id_fkey ( full_name, email )
    `)
    .eq('mentor_id', mentor?.id)
    .order('session_date', { ascending: false })

  const { data: feedbacks } = await supabase
    .from('session_feedback')
    .select('booking_id, rating, submitted_by')
    .eq('submitted_by', 'mentor')

  const feedbackMap = new Map(feedbacks?.map(f => [f.booking_id, f]))

  const upcoming = (bookings ?? []).filter(b =>
    b.status === 'confirmed' && isSessionUpcoming(b.session_date, b.session_time)
  )
  const past = (bookings ?? []).filter(b =>
    b.status === 'completed' || (b.status === 'confirmed' && !isSessionUpcoming(b.session_date, b.session_time))
  )

  const SessionCard = ({ booking }: { booking: any }) => {
    const hasFeedback = feedbackMap.has(booking.id)
    const isCompleted = booking.status === 'completed'
    const upcoming = isSessionUpcoming(booking.session_date, booking.session_time)
    return (
      <div className="card hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg shrink-0">
            {booking.profiles?.full_name?.[0] ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">{booking.profiles?.full_name}</h3>
                <p className="text-sm text-gray-400">{booking.profiles?.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {upcoming && <span className="badge bg-blue-50 text-blue-700 border border-blue-100"><Calendar className="w-3 h-3 mr-1" />Upcoming</span>}
                {isCompleted && <span className="badge bg-green-50 text-green-700 border border-green-100"><CheckCircle className="w-3 h-3 mr-1" />Completed</span>}
                {booking.status === 'cancelled' && <span className="badge bg-red-50 text-red-700 border border-red-100"><XCircle className="w-3 h-3 mr-1" />Cancelled</span>}
                {isCompleted && !hasFeedback && (
                  <span className="badge bg-amber-50 text-amber-600 border border-amber-100"><Star className="w-3 h-3 mr-1 fill-amber-400" />Feedback needed</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
              <span>{formatDate(booking.session_date)}</span>
              <span>·</span>
              <span>{formatTime(booking.session_time)}</span>
              <span>·</span>
              <span>{booking.duration_mins} min</span>
            </div>

            {booking.notes && (
              <p className="text-sm text-gray-400 mt-1 italic">Student note: "{booking.notes}"</p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              <Link href={`/mentor/sessions/${booking.id}`} className="btn-secondary !py-1.5 !text-xs">
                View Details
              </Link>
              {upcoming && (
                <a href={booking.meeting_url} target="_blank" rel="noopener noreferrer"
                  className="btn-primary !py-1.5 !text-xs">
                  <ExternalLink className="w-3.5 h-3.5" /> Join Meeting
                </a>
              )}
              {isCompleted && !hasFeedback && (
                <Link href={`/mentor/sessions/${booking.id}#feedback`} className="btn-primary !py-1.5 !text-xs">
                  <Star className="w-3.5 h-3.5" /> Give Feedback
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
        <p className="text-gray-500 mt-1">All your student sessions</p>
      </div>

      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-500" /> Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="card text-center py-8 text-gray-400 text-sm">
            No upcoming sessions. <Link href="/mentor/availability" className="text-brand-600 underline">Add availability →</Link>
          </div>
        ) : (
          <div className="space-y-3">{upcoming.map(b => <SessionCard key={b.id} booking={b} />)}</div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" /> Completed ({past.length})
        </h2>
        {past.length === 0 ? (
          <div className="card text-center py-8 text-gray-400 text-sm">No completed sessions yet.</div>
        ) : (
          <div className="space-y-3">{past.map(b => <SessionCard key={b.id} booking={b} />)}</div>
        )}
      </section>
    </div>
  )
}
