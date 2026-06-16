import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'

// Add an availability slot for any mentor (admin bypasses the mentor-owns-slots RLS).
export async function POST(req: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { mentor_id, slot_date, start_time, end_time } = await req.json()
    if (!mentor_id || !slot_date || !start_time || !end_time) {
      return NextResponse.json({ error: 'mentor_id, slot_date, start_time, end_time required' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { error } = await admin.from('availability_slots').insert({
      mentor_id, slot_date, start_time, end_time, is_booked: false,
    })
    if (error) {
      const msg = error.message.includes('unique') ? 'A slot already exists at that time' : error.message
      return NextResponse.json({ error: msg }, { status: 409 })
    }
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/slots]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { slot_id } = await req.json()
    if (!slot_id) return NextResponse.json({ error: 'slot_id required' }, { status: 400 })
    const admin = createAdminClient()
    const { error } = await admin.from('availability_slots').delete().eq('id', slot_id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/admin/slots]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
