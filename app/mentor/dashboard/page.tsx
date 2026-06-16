import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, Users, Star, Clock, ArrowRight, CheckCircle } from 'lucide-react'
import { formatDate, formatTime, isSessionUpcoming } from '@/lib/utils/meeting'

export default async function MentorDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const { data: mentor } = await supabase
    .from('mentors')
    .select('id, name, session_duration')
    .eq('user_id', user!.id)
    .single()

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, status, session_date, session_time, duration_mins, meeting_url,
      profiles!bookings_student_id_fkey ( full_name, email )
    `)
    .eq('mentor_id', mentor?.id)
    .order('session_date', { ascending: false })
    .limit(10)

  const { data: feedbacks } = await supabase
    .from('session_feedback')
    .select('booking_id, rating')
    .eq('submitted_by', 'mentor')

  const feedbackIds = new Set(feedbacks?.map(f => f.booking_id))

  const { data: slots } = await supabase
    .from('availability_slots')
    .select('id, is_booked')
    .eq('mentor_id', mentor?.id)

  const upcoming = (bookings ?? []).filter(b =>
    b.status === 'confirmed' && isSessionUpcoming(b.session_date, b.session_time)
  )
  const completed = (bookings ?? []).filter(b => b.status === 'completed')
  const pendingFeedback = (bookings ?? []).filter(b =>
    b.status === 'completed' && !feedbackIds.has(b.id)
  )
  const openSlots = (slots ?? []).filter(s => !s.is_booked).length

  const stats = [
    { label: 'Upcoming Sessions', value: upcoming.length, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Sessions Completed', value: completed.length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Feedback Pending', value: pendingFeedback.length, icon: Star, color: 'text-amber-600 bg-amber-50' },
    { label: 'Open Slots', value: openSlots, icon: Clock, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Your mentor dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex flex-col items-center text-center gap-3 p-5">
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending feedback alert */}
      {pendingFeedback.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <p className="text-sm font-medium text-amber-800">
              {pendingFeedback.length} session{pendingFeedback.length > 1 ? 's' : ''} waiting for your feedback
            </p>
          </div>
          <Link href="/mentor/sessions" className="text-sm font-semibold text-amber-700">
            Submit feedback →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming sessions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Upcoming Sessions</h2>
            <Link href="/mentor/sessions" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No upcoming sessions</p>
              <Link href="/mentor/availability" className="btn-primary mt-3 text-xs">Add Availability</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 4).map((b: any) => (
                <Link key={b.id} href={`/mentor/sessions/${b.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                    {b.profiles?.full_name?.[0] ?? '?'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{b.profiles?.full_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(b.session_date)} · {formatTime(b.session_time)}</p>
                  </div>
                  <span className="badge bg-blue-50 text-blue-700 text-xs">Upcoming</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/mentor/availability" className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-colors group">
              <div className="p-2 rounded-lg bg-brand-100 group-hover:bg-brand-200 transition-colors">
                <Calendar className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Manage Availability</p>
                <p className="text-xs text-gray-400">{openSlots} open slots</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>
            <Link href="/mentor/sessions" className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-colors group">
              <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">View All Sessions</p>
                <p className="text-xs text-gray-400">{(bookings ?? []).length} total</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
