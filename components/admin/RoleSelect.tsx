'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter()
  const [val, setVal] = useState(role)
  const [busy, setBusy] = useState(false)

  async function change(newRole: string) {
    const prev = val
    setVal(newRole)
    setBusy(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Role updated')
      router.refresh()
    } catch (e: any) {
      setVal(prev)
      toast.error(e.message ?? 'Failed to update role')
    } finally { setBusy(false) }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <select
        value={val}
        disabled={busy}
        onChange={e => change(e.target.value)}
        className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none disabled:opacity-50"
      >
        <option value="student">student</option>
        <option value="mentor">mentor</option>
      </select>
      {busy && <Loader2 className="w-4 h-4 animate-spin text-brand-500" />}
    </div>
  )
}
