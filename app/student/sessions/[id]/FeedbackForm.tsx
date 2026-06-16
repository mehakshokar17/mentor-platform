'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface FeedbackFormProps {
  bookingId: string
  submittedBy: 'student' | 'mentor'
}

export default function FeedbackForm({ bookingId, submittedBy }: FeedbackFormProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) { toast.error('Please select a rating'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, rating, comments, submittedBy }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      toast.success('Feedback submitted! Thank you.')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How would you rate this session?
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              className="text-3xl transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  s <= (hovered || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-200 fill-gray-200'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-gray-400 mt-1">
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comments <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          rows={4}
          className="input resize-none"
          placeholder={
            submittedBy === 'student'
              ? 'What did you learn? What could be improved?'
              : 'How did the student perform? What would you suggest for their growth?'
          }
          value={comments}
          onChange={e => setComments(e.target.value)}
        />
      </div>

      <button type="submit" disabled={loading || !rating} className="btn-primary">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
        {loading ? 'Submitting…' : 'Submit Feedback'}
      </button>
    </form>
  )
}
