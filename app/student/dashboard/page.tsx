import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, Users, CheckCircle, Clock, ArrowRight, Star } from 'lucide-react'
import { formatDate, formatTime, isSessionUpcoming } from '@/lib/utils/meeting'

export default async function StudentDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, status, session_date, session_time, duration_mins, meeting_url,
      mentors ( name, current_role, organization, photo_url )
    `)
    .eq('student_id', user!.id)
    .order('session_date', { ascending: false })
    .limit(5)

  const { data: feedbacks } = await supabase
    .from('session_feedback')
    .select('booking_id')
    .eq('submitted_by', 'student')

  const feedbackBookingIds = new Set(feedbacks?.map(f => f.booking_id) ?? [])

  const upcoming = bookings?.filter(b =>
    b.status === 'confirmed' && isSessionUpcoming(b.session_date, b.session_time)
  ) ?? []

  const completed = bookings?.filter(b => b.status === 'completed') ?? []
  const pendingFeedback = completed.filter(b => !feedbackBookingIds.has(b.id))

  const stats = [
    { label: 'Upcoming Sessions', value: upcoming.length, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed Sessions', value: completed.length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Pending Feedback', value: pendingFeedback.length, icon: Star, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Track your mentorship journey</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
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
              You have {pendingFeedback.length} session{pendingFeedback.length > 1 ? 's' : ''} awaiting your feedback
            </p>
          </div>
          <Link href="/student/sessions" className="text-sm font-semibold text-amber-700 hover:text-amber-900">
            Submit feedback →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming sessions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Upcoming Sessions</h2>
            <Link href="/student/sessions" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No upcoming sessions</p>
              <Link href="/student/mentors" className="btn-primary mt-3 text-xs">Browse Mentors</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((b: any) => (
                <Link key={b.id} href={`/student/sessions/${b.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                  <img
                    src={b.mentors?.photo_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(b.mentors?.name ?? 'M')}&background=4f46e5&color=fff`}
                    alt={b.mentors?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{b.mentors?.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(b.session_date)} · {formatTime(b.session_time)}</p>
                  </div>
                  <span className="badge bg-blue-50 text-blue-700">Upcoming</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/student/mentors" className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-colors group">
              <div className="p-2 rounded-lg bg-brand-100 group-hover:bg-brand-200 transition-colors">
                <Users className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Browse Mentors</p>
                <p className="text-xs text-gray-400">Discover and book sessions</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-brand-600 transition-colors" />
            </Link>
            <Link href="/student/sessions" className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-colors group">
              <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">My Sessions</p>
                <p className="text-xs text-gray-400">View history and feedback</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-brand-600 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
