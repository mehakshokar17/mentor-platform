'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Calendar, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, formatTime } from '@/lib/utils/meeting'

interface Slot {
  id: string
  slot_date: string
  start_time: string
  end_time: string
  is_booked: boolean
}

export default function AvailabilityPage() {
  const supabase = createClient()
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [mentorId, setMentorId] = useState<string | null>(null)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('10:45')
  const [adding, setAdding] = useState(false)

  const loadSlots = useCallback(async (mId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('mentor_id', mId)
      .gte('slot_date', today)
      .order('slot_date')
      .order('start_time')
    setSlots(data ?? [])
  }, [supabase])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: mentor } = await supabase.from('mentors').select('id').eq('user_id', user.id).single()
      if (!mentor) return
      setMentorId(mentor.id)
      await loadSlots(mentor.id)
      setLoading(false)
    }
    init()
  }, [supabase, loadSlots])

  async function addSlot(e: React.FormEvent) {
    e.preventDefault()
    if (!mentorId || !date) return
    setAdding(true)
    try {
      const { error } = await supabase.from('availability_slots').insert({
        mentor_id: mentorId,
        slot_date: date,
        start_time: startTime,
        end_time: endTime,
        is_booked: false,
      })
      if (error) throw error
      toast.success('Slot added!')
      await loadSlots(mentorId)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add slot'
      toast.error(msg.includes('unique') ? 'A slot already exists at that time' : msg)
    } finally {
      setAdding(false)
    }
  }

  async function deleteSlot(slotId: string) {
    const { error } = await supabase.from('availability_slots').delete().eq('id', slotId)
    if (error) { toast.error('Failed to delete slot'); return }
    toast.success('Slot removed')
    setSlots(s => s.filter(x => x.id !== slotId))
  }

  // Quick bulk add: 5 common time slots for a chosen date
  async function bulkAdd() {
    if (!mentorId || !date) { toast.error('Please select a date first'); return }
    const defaults = [
      { start_time: '09:00', end_time: '09:45' },
      { start_time: '10:00', end_time: '10:45' },
      { start_time: '11:00', end_time: '11:45' },
      { start_time: '14:00', end_time: '14:45' },
      { start_time: '15:00', end_time: '15:45' },
    ]
    const rows = defaults.map(t => ({ mentor_id: mentorId, slot_date: date, ...t, is_booked: false }))
    const { error } = await supabase.from('availability_slots').upsert(rows, { onConflict: 'mentor_id,slot_date,start_time' })
    if (error) toast.error('Some slots could not be added')
    else toast.success('5 slots added!')
    await loadSlots(mentorId)
  }

  // Group by date
  const byDate: Record<string, Slot[]> = {}
  slots.forEach(s => {
    if (!byDate[s.slot_date]) byDate[s.slot_date] = []
    byDate[s.slot_date].push(s)
  })

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  )

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Availability</h1>
        <p className="text-gray-500 mt-1">Add time slots when you are available for sessions</p>
      </div>

      {/* Add slot form */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Add New Slot</h2>
        <form onSubmit={addSlot} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="input"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                className="input"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                className="input"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button type="submit" className="btn-primary" disabled={adding}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Slot
            </button>
            <button type="button" onClick={bulkAdd} className="btn-secondary">
              <Calendar className="w-4 h-4" />
              Quick Add (5 slots for this date)
            </button>
          </div>
        </form>
      </div>

      {/* Slots list */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">
          Upcoming Slots ({slots.length})
        </h2>
        {Object.keys(byDate).length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p>No upcoming slots. Add some above!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(byDate).map(([date, dateSlots]) => (
              <div key={date} className="card">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="inline w-4 h-4 mr-1.5 text-brand-500" />
                  {formatDate(date)}
                </p>
                <div className="space-y-2">
                  {dateSlots.map(slot => (
                    <div key={slot.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        slot.is_booked
                          ? 'bg-green-50 border-green-100'
                          : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {slot.is_booked
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <Calendar className="w-4 h-4 text-gray-400" />
                        }
                        <span className="text-sm font-medium text-gray-700">
                          {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                        </span>
                        {slot.is_booked && (
                          <span className="badge bg-green-100 text-green-700 text-xs">Booked</span>
                        )}
                      </div>
                      {!slot.is_booked && (
                        <button
                          onClick={() => deleteSlot(slot.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
