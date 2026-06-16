import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Plus, Pencil, Users } from 'lucide-react'
import MentorActions from '@/components/admin/MentorActions'

export const dynamic = 'force-dynamic'

export default async function AdminMentorsPage() {
  const admin = createAdminClient()
  const { data: mentors } = await admin
    .from('mentors')
    .select('id, name, email, current_role, organization, years_experience, skills, is_active, photo_url')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentors</h1>
          <p className="text-gray-500 mt-1">{mentors?.length ?? 0} mentor{(mentors?.length ?? 0) !== 1 ? 's' : ''} on the platform</p>
        </div>
        <Link href="/admin/mentors/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Mentor
        </Link>
      </div>

      {!mentors || mentors.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">No mentors yet</p>
          <Link href="/admin/mentors/new" className="btn-primary mt-4">Add your first mentor</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {mentors.map((m: any) => (
            <div key={m.id} className="card flex items-center gap-4 py-4">
              <img
                src={m.photo_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=4f46e5&color=fff`}
                alt={m.name}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-brand-100"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{m.name}</p>
                  {m.is_active
                    ? <span className="badge bg-green-50 text-green-700">Active</span>
                    : <span className="badge bg-gray-100 text-gray-500">Inactive</span>}
                </div>
                <p className="text-sm text-gray-500 truncate">{m.current_role} · {m.organization} · {m.years_experience} yrs</p>
                <p className="text-xs text-gray-400 truncate">{(m.skills ?? []).slice(0, 4).join(' · ')}</p>
              </div>
              <Link href={`/admin/mentors/${m.id}`} className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Edit">
                <Pencil className="w-4 h-4" />
              </Link>
              <MentorActions id={m.id} isActive={m.is_active} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
