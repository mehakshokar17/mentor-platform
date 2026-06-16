import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'

const MENTOR_FIELDS = [
  'name', 'email', 'linkedin_url', 'current_role', 'organization',
  'years_experience', 'skills', 'bio', 'photo_url', 'session_duration', 'is_active',
] as const

function pick(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const f of MENTOR_FIELDS) if (body[f] !== undefined) out[f] = body[f]
  return out
}

// Create a brand-new mentor (auth user + profile + mentor row) from the admin UI.
export async function POST(req: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await req.json()
    const { email, password, name } = body
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 })
    }
    const admin = createAdminClient()

    // 1. Create the auth user (auto-confirmed). A DB trigger creates the profile.
    const { data: created, error: userErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: 'mentor' },
    })
    if (userErr || !created?.user) {
      return NextResponse.json({ error: userErr?.message ?? 'Could not create user' }, { status: 409 })
    }

    // 2. Insert the mentor profile linked to that user.
    const fields = pick(body)
    const { error: mentorErr } = await admin.from('mentors').insert({
      user_id: created.user.id,
      session_duration: 30,
      is_active: true,
      ...fields,
      email,
      name,
    })
    if (mentorErr) {
      // roll back the user so we don't leave an orphan account
      await admin.auth.admin.deleteUser(created.user.id)
      throw mentorErr
    }
    return NextResponse.json({ success: true, userId: created.user.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/mentors]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update an existing mentor's fields (including is_active toggle).
export async function PATCH(req: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const admin = createAdminClient()
    const { error } = await admin.from('mentors').update(pick(body)).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/mentors]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete a mentor. Blocked (409) if the mentor already has bookings — deactivate instead.
export async function DELETE(req: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const admin = createAdminClient()

    const { count } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('mentor_id', id)
    if (count && count > 0) {
      return NextResponse.json(
        { error: 'This mentor has bookings. Deactivate the profile instead of deleting.' },
        { status: 409 },
      )
    }

    const { data: mentor } = await admin.from('mentors').select('user_id').eq('id', id).single()
    const { error } = await admin.from('mentors').delete().eq('id', id)
    if (error) throw error
    // also remove the linked auth account (cascades the profile)
    if (mentor?.user_id) await admin.auth.admin.deleteUser(mentor.user_id).catch(() => {})
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/admin/mentors]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
