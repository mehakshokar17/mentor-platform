import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, ExternalLink, User, CheckCircle } from 'lucide-react'
import { formatDate, formatTime, isSessionUpcoming, meetingLabel } from '@/lib/utils/meeting'
import FeedbackForm from './FeedbackForm'

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      mentors ( id, name, current_role, organization, photo_url, linkedin_url ),
      profiles!bookings_student_id_fkey ( full_name, email )
    `)
    .eq('id', params.id)
    .eq('student_id', user!.id)
    .single()

  if (!booking) notFound()

  const { data: feedbacks } = await supabase
    .from('session_feedback')
    .select('*')
    .eq('booking_id', params.id)

  const studentFeedback = feedbacks?.find(f => f.submitted_by === 'student')
  const mentorFeedback = feedbacks?.find(f => f.submitted_by === 'mentor')
  const isUpcoming = isSessionUpcoming(booking.session_date, booking.session_time)
  const canSubmitFeedback = !isUpcoming && !studentFeedback

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/student/sessions" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to sessions
      </Link>

      {/* Session Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <img
            src={booking.mentors?.photo_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.mentors?.name ?? 'M')}&background=4f46e5&color=fff&size=128`}
            alt={booking.mentors?.name}
            className="w-20 h-20 rounded-2xl object-cover"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-xl font-bold text-gray-900">Session with {booking.mentors?.name}</h1>
              <span className={`badge px-3 py-1 text-sm font-medium ${
                booking.status === 'confirmed' && isUpcoming
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : booking.status === 'completed'
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {booking.status === 'confirmed' && isUpcoming ? 'Upcoming' : booking.status}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{booking.mentors?.current_role} · {booking.mentors?.organization}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-brand-400" />
                {formatDate(booking.session_date)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-brand-400" />
                {formatTime(booking.session_time)} · {booking.duration_mins} minutes
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4 text-brand-400" />
                {booking.mentors?.name} ({booking.mentors?.id})
              </div>
            </div>

            {booking.notes && (
              <div className="mt-4 p-3 rounded-lg bg-gray-50 text-sm text-gray-600">
                <strong className="text-gray-700">Your notes:</strong> {booking.notes}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              <a
                href={booking.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <ExternalLink className="w-4 h-4" />
                {meetingLabel(booking.meeting_url)}
              </a>
              <Link href={`/student/mentors/${booking.mentors?.id}`} className="btn-secondary">
                View Mentor Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback section */}
      <div id="feedback" className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Feedback</h2>

        {studentFeedback ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 font-medium text-sm mb-2">
              <CheckCircle className="w-4 h-4" /> Your feedback submitted
            </div>
            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} className={`text-xl ${s <= (studentFeedback.rating ?? 0) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                ))}
                <span className="text-sm text-gray-500 ml-2">{studentFeedback.rating}/5</span>
              </div>
              {studentFeedback.comments && (
                <p className="text-sm text-gray-600">"{studentFeedback.comments}"</p>
              )}
            </div>
          </div>
        ) : canSubmitFeedback ? (
          <FeedbackForm bookingId={booking.id} submittedBy="student" />
        ) : isUpcoming ? (
          <p className="text-sm text-gray-400">Feedback will be available after the session.</p>
        ) : null}

        {/* Show mentor feedback if available */}
        {mentorFeedback && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Mentor&apos;s Feedback for You</h3>
            <div className="p-4 rounded-xl bg-brand-50 border border-brand-100">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} className={`text-xl ${s <= (mentorFeedback.rating ?? 0) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                ))}
              </div>
              {mentorFeedback.comments && (
                <p className="text-sm text-gray-600">"{mentorFeedback.comments}"</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
