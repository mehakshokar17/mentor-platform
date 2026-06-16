import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/shared/Navbar'
import { isAdminEmail } from '@/lib/auth/admin'

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'mentor') redirect('/student/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="mentor" userName={profile?.full_name ?? user.email ?? 'Mentor'} isAdmin={isAdminEmail(user.email)} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
