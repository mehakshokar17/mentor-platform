'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Loader2, Check } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils/meeting'
import toast from 'react-hot-toast'

interface Slot {
  id: string
  slot_date: string
  start_time: string
  end_time: string
}

interface Mentor {
  id: string
  name: string
  session_duration: number
}

export default function BookingModal({
  mentor,
  slots,
  studentId,
}: {
  mentor: Mentor
  slots: Slot[]
  studentId: string
}) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Group slots by date
  const byDate: Record<string, Slot[]> = {}
  slots.forEach(slot => {
    if (!byDate[slot.slot_date]) byDate[slot.slot_date] = []
    byDate[slot.slot_date].push(slot)
  })

  async function handleBook() {
    if (!selectedSlot) return
    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: selectedSlot, mentorId: mentor.id, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Booking failed')
      toast.success('Session booked! Confirmation email sent.')
      router.push(`/student/sessions/${data.bookingId}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(byDate).map(([date, dateSlots]) => (
        <div key={date}>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1 text-brand-500" />
            {formatDate(date)}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {dateSlots.map(slot => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id === selectedSlot ? null : slot.id)}
                className={`relative px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  selectedSlot === slot.id
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300 hover:bg-brand-50'
                }`}
              >
                {selectedSlot === slot.id && (
                  <Check className="absolute top-1 right-1 w-3 h-3" />
                )}
                {formatTime(slot.start_time)}
              </button>
            ))}
          </div>
        </div>
      ))}

      {selectedSlot && (
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What do you want to discuss? <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              className="input resize-none"
              placeholder="E.g. Career transition from engineering to PM, building product sense..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBook}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              {loading ? 'Booking…' : `Confirm Booking (${mentor.session_duration} min)`}
            </button>
            <button onClick={() => setSelectedSlot(null)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
