import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Users, Calendar, CheckCircle, Star, UserCog, Clock, ArrowRight, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function count(table: string, filter?: (q: any) => any) {
  const admin = createAdminClient()
  let q = admin.from(table).select('id', { count: 'exact', head: true })
  if (filter) q = filter(q)
  const { count } = await q
  return count ?? 0
}

export default async function AdminDashboard() {
  const [mentors, activeMentors, students, bookings, completed, feedback, openSlots] = await Promise.all([
    count('mentors'),
    count('mentors', q => q.eq('is_active', true)),
    count('profiles', q => q.eq('role', 'student')),
    count('bookings'),
    count('bookings', q => q.eq('status', 'completed')),
    count('session_feedback'),
    count('availability_slots', q => q.eq('is_booked', false)),
  ])

  const stats = [
    { label: 'Active Mentors', value: activeMentors, sub: `${mentors} total`, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Students', value: students, icon: UserCog, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Total Bookings', value: bookings, icon: Calendar, color: 'text-purple-600 bg-purple-50' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Feedback Records', value: feedback, icon: Star, color: 'text-amber-600 bg-amber-50' },
    { label: 'Open Slots', value: openSlots, icon: Clock, color: 'text-rose-600 bg-rose-50' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-gray-500 mt-1">Manage mentors, bookings, and users from one place</p>
        </div>
        <Link href="/admin/mentors/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Mentor
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="card flex flex-col items-center text-center gap-3 p-5">
            <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/admin/mentors', title: 'Manage Mentors', desc: 'Add, edit, and manage availability', icon: Users },
          { href: '/admin/bookings', title: 'View Bookings', desc: 'All sessions and feedback status', icon: Calendar },
          { href: '/admin/users', title: 'Manage Users', desc: 'View users and change roles', icon: UserCog },
        ].map(({ href, title, desc, icon: Icon }) => (
          <Link key={href} href={href} className="card flex items-center gap-4 hover:border-brand-200 hover:bg-brand-50/30 transition-colors group">
            <div className="p-3 rounded-xl bg-brand-100 group-hover:bg-brand-200 transition-colors">
              <Icon className="w-6 h-6 text-brand-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{title}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  )
}
