import { createAdminClient } from '@/lib/supabase/admin'
import { Calendar, Check, X } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils/meeting'

export const dynamic = 'force-dynamic'

const statusStyles: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default async function AdminBookingsPage() {
  const admin = createAdminClient()
  const { data: bookings } = await admin
    .from('bookings')
    .select(`
      id, status, session_date, session_time,
      student:profiles!bookings_student_id_fkey ( full_name, email ),
      mentor:mentors!bookings_mentor_id_fkey ( name ),
      session_feedback ( submitted_by )
    `)
    .order('session_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 mt-1">{bookings?.length ?? 0} total session{(bookings?.length ?? 0) !== 1 ? 's' : ''}</p>
      </div>

      {!bookings || bookings.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">No bookings yet</p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Mentor</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Student FB</th>
                <th className="px-4 py-3 font-medium">Mentor FB</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: any) => {
                const fb = new Set((b.session_feedback ?? []).map((f: any) => f.submitted_by))
                return (
                  <tr key={b.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.student?.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{b.student?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{b.mentor?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(b.session_date)}<br />
                      <span className="text-xs text-gray-400">{formatTime(b.session_time)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusStyles[b.status] ?? 'bg-gray-100 text-gray-500'} capitalize`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3"><FB ok={fb.has('student')} /></td>
                    <td className="px-4 py-3"><FB ok={fb.has('mentor')} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FB({ ok }: { ok: boolean }) {
  return ok
    ? <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><Check className="w-3.5 h-3.5" /> Done</span>
    : <span className="inline-flex items-center gap-1 text-gray-300 text-xs"><X className="w-3.5 h-3.5" /> —</span>
}
