'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Calendar, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, formatTime } from '@/lib/utils/meeting'

interface Slot { id: string; slot_date: string; start_time: string; end_time: string; is_booked: boolean }

export default function SlotManager({ mentorId }: { mentorId: string }) {
  const supabase = createClient()
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [start, setStart] = useState('10:00')
  const [end, setEnd] = useState('10:45')
  const [busy, setBusy] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('mentor_id', mentorId)
      .gte('slot_date', today)
      .order('slot_date').order('start_time')
    setSlots(data ?? [])
    setLoading(false)
  }, [supabase, mentorId, today])

  useEffect(() => { load() }, [load])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!date) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/slots', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentor_id: mentorId, slot_date: date, start_time: start, end_time: end }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Slot added')
      await load()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to add slot')
    } finally { setBusy(false) }
  }

  async function remove(slotId: string) {
    try {
      const res = await fetch('/api/admin/slots', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSlots(s => s.filter(x => x.id !== slotId))
      toast.success('Slot removed')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed')
    }
  }

  const byDate: Record<string, Slot[]> = {}
  slots.forEach(s => { (byDate[s.slot_date] ??= []).push(s) })

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-gray-900">Availability ({slots.length} upcoming)</h2>
      <form onSubmit={add} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input type="date" className="input" value={date} min={today} onChange={e => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
          <input type="time" className="input" value={start} onChange={e => setStart(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
          <input type="time" className="input" value={end} onChange={e => setEnd(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary justify-center" disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
      ) : slots.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No upcoming slots.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(byDate).map(([d, ds]) => (
            <div key={d}>
              <p className="text-xs font-semibold text-gray-600 mb-2">
                <Calendar className="inline w-3.5 h-3.5 mr-1 text-brand-500" />{formatDate(d)}
              </p>
              <div className="flex flex-wrap gap-2">
                {ds.map(s => (
                  <span key={s.id} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                    s.is_booked ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-700'
                  }`}>
                    {s.is_booked && <CheckCircle className="w-3 h-3" />}
                    {formatTime(s.start_time)}
                    {s.is_booked
                      ? <span className="text-[10px] font-semibold">booked</span>
                      : <button onClick={() => remove(s.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
