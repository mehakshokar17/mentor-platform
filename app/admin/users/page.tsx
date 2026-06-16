import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/auth/admin'
import { UserCog, Shield } from 'lucide-react'
import RoleSelect from '@/components/admin/RoleSelect'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const admin = createAdminClient()
  const { data: users } = await admin
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">{users?.length ?? 0} registered user{(users?.length ?? 0) !== 1 ? 's' : ''}</p>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u: any) => {
              const admin = isAdminEmail(u.email)
              return (
                <tr key={u.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-xs">
                        {(u.full_name ?? u.email)[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    {admin ? (
                      <span className="inline-flex items-center gap-1 badge bg-gray-900 text-white">
                        <Shield className="w-3 h-3" /> admin
                      </span>
                    ) : (
                      <RoleSelect userId={u.id} role={u.role} />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <UserCog className="w-3.5 h-3.5" />
        Admin access is granted by the ADMIN_EMAILS allowlist and isn’t changed here.
      </p>
    </div>
  )
}
