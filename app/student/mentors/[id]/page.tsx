import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Linkedin, Briefcase, Clock, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import BookingModal from './BookingModal'
import { formatDate, formatTime } from '@/lib/utils/meeting'

export default async function MentorProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: mentor } = await supabase
    .from('mentors')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!mentor) notFound()

  // Load available (unbooked) slots, today onward
  const today = new Date().toISOString().split('T')[0]
  const { data: slots } = await supabase
    .from('availability_slots')
    .select('*')
    .eq('mentor_id', params.id)
    .eq('is_booked', false)
    .gte('slot_date', today)
    .order('slot_date')
    .order('start_time')

  // Check if student already has a booking with this mentor
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('id, session_date, session_time, status')
    .eq('student_id', user!.id)
    .eq('mentor_id', params.id)
    .in('status', ['confirmed'])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/student/mentors" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to mentors
      </Link>

      <div className="card">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <img
            src={mentor.photo_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=4f46e5&color=fff&size=200`}
            alt={mentor.name}
            className="w-28 h-28 rounded-2xl object-cover ring-4 ring-brand-100"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{mentor.name}</h1>
                <p className="text-brand-600 font-medium mt-0.5 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  {mentor.current_role} at {mentor.organization}
                </p>
              </div>
              {mentor.linkedin_url && (
                <a
                  href={mentor.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary !py-1.5"
                >
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  LinkedIn
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {mentor.years_experience} years experience
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {mentor.session_duration}-minute sessions
              </span>
            </div>

            <p className="mt-4 text-gray-600 leading-relaxed">{mentor.bio}</p>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {(mentor.skills as string[]).map((skill: string) => (
                <span key={skill} className="badge bg-brand-50 text-brand-700 border border-brand-100 text-sm px-3 py-1">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Existing bookings with this mentor */}
      {existingBookings && existingBookings.length > 0 && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm font-medium text-blue-800 mb-2">You have an existing booking with {mentor.name}:</p>
          {existingBookings.map((b: any) => (
            <p key={b.id} className="text-sm text-blue-700">
              {formatDate(b.session_date)} at {formatTime(b.session_time)}
              <Link href={`/student/sessions/${b.id}`} className="ml-2 underline">View session →</Link>
            </p>
          ))}
        </div>
      )}

      {/* Available slots + booking */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Slots</h2>
        {!slots || slots.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p>No available slots at the moment</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <BookingModal
            mentor={mentor}
            slots={slots}
            studentId={user!.id}
          />
        )}
      </div>
    </div>
  )
}
