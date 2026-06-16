import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'

// Change a user's role (student <-> mentor).
export async function PATCH(req: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { user_id, role } = await req.json()
    if (!user_id || !['student', 'mentor'].includes(role)) {
      return NextResponse.json({ error: 'user_id and a valid role are required' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { error } = await admin.from('profiles').update({ role }).eq('id', user_id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/users]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
