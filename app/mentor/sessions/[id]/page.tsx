import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, ExternalLink, CheckCircle } from 'lucide-react'
import { formatDate, formatTime, isSessionUpcoming } from '@/lib/utils/meeting'
import FeedbackForm from '@/app/student/sessions/[id]/FeedbackForm'

export default async function MentorSessionDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: mentor } = await supabase
    .from('mentors')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      profiles!bookings_student_id_fkey ( full_name, email )
    `)
    .eq('id', params.id)
    .eq('mentor_id', mentor?.id)
    .single()

  if (!booking) notFound()

  const { data: feedbacks } = await supabase
    .from('session_feedback')
    .select('*')
    .eq('booking_id', params.id)

  const mentorFeedback = feedbacks?.find(f => f.submitted_by === 'mentor')
  const studentFeedback = feedbacks?.find(f => f.submitted_by === 'student')
  const isUpcoming = isSessionUpcoming(booking.session_date, booking.session_time)
  const canSubmitFeedback = !isUpcoming && !mentorFeedback

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/mentor/sessions" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to sessions
      </Link>

      <div className="card">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-3xl">
            {booking.profiles?.full_name?.[0] ?? '?'}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Session with {booking.profiles?.full_name}</h1>
                <p className="text-gray-400 mt-0.5">{booking.profiles?.email}</p>
              </div>
              <span className={`badge px-3 py-1 text-sm font-medium ${
                isUpcoming ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'bg-green-50 text-green-700 border border-green-100'
              }`}>
                {isUpcoming ? 'Upcoming' : booking.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-brand-400" />
                {formatDate(booking.session_date)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-brand-400" />
                {formatTime(booking.session_time)} · {booking.duration_mins} minutes
              </div>
            </div>

            {booking.notes && (
              <div className="mt-4 p-3 rounded-lg bg-gray-50 text-sm text-gray-600">
                <strong className="text-gray-700">Student notes:</strong> {booking.notes}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              <a href={booking.meeting_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <ExternalLink className="w-4 h-4" /> Join Meeting (Jitsi)
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mentor feedback */}
      <div id="feedback" className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Feedback for the Student</h2>

        {mentorFeedback ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 font-medium text-sm mb-2">
              <CheckCircle className="w-4 h-4" /> Feedback submitted
            </div>
            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className={`text-xl ${s <= (mentorFeedback.rating ?? 0) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                ))}
              </div>
              {mentorFeedback.comments && <p className="text-sm text-gray-600">"{mentorFeedback.comments}"</p>}
            </div>
          </div>
        ) : canSubmitFeedback ? (
          <FeedbackForm bookingId={booking.id} submittedBy="mentor" />
        ) : isUpcoming ? (
          <p className="text-sm text-gray-400">Feedback can be submitted after the session.</p>
        ) : null}

        {/* Show student's feedback */}
        {studentFeedback && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Student&apos;s Feedback for this Session</h3>
            <div className="p-4 rounded-xl bg-brand-50 border border-brand-100">
              <div className="flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className={`text-xl ${s <= (studentFeedback.rating ?? 0) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                ))}
              </div>
              {studentFeedback.comments && <p className="text-sm text-gray-600">"{studentFeedback.comments}"</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
