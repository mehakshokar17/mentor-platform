'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Power, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MentorActions({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/mentors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !isActive }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(isActive ? 'Mentor deactivated' : 'Mentor activated')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message ?? 'Failed')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm('Delete this mentor permanently? This also removes their account.')) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/mentors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Mentor deleted')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to delete')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggle}
        disabled={busy}
        title={isActive ? 'Deactivate' : 'Activate'}
        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
          isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
        }`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
      </button>
      <button
        onClick={remove}
        disabled={busy}
        title="Delete"
        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
