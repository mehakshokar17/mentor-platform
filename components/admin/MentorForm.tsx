'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

interface Mentor {
  id?: string
  name?: string
  email?: string
  linkedin_url?: string
  current_role?: string
  organization?: string
  years_experience?: number
  skills?: string[]
  bio?: string
  photo_url?: string
  session_duration?: number
}

export default function MentorForm({ mode, mentor }: { mode: 'create' | 'edit'; mentor?: Mentor }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [f, setF] = useState({
    name: mentor?.name ?? '',
    email: mentor?.email ?? '',
    password: '',
    linkedin_url: mentor?.linkedin_url ?? '',
    current_role: mentor?.current_role ?? '',
    organization: mentor?.organization ?? '',
    years_experience: mentor?.years_experience ?? 1,
    skills: (mentor?.skills ?? []).join(', '),
    bio: mentor?.bio ?? '',
    photo_url: mentor?.photo_url ?? '',
    session_duration: mentor?.session_duration ?? 30,
  })

  const set = (k: string, v: any) => setF(prev => ({ ...prev, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: any = {
        name: f.name,
        email: f.email,
        linkedin_url: f.linkedin_url || null,
        current_role: f.current_role,
        organization: f.organization,
        years_experience: Number(f.years_experience),
        skills: f.skills.split(',').map(s => s.trim()).filter(Boolean),
        bio: f.bio || null,
        photo_url: f.photo_url || null,
        session_duration: Number(f.session_duration),
      }
      let res: Response
      if (mode === 'create') {
        payload.password = f.password
        res = await fetch('/api/admin/mentors', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
      } else {
        payload.id = mentor!.id
        res = await fetch('/api/admin/mentors', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      toast.success(mode === 'create' ? 'Mentor created!' : 'Mentor updated!')
      router.push('/admin/mentors')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name" required>
          <input className="input" value={f.name} onChange={e => set('name', e.target.value)} required />
        </Field>
        <Field label="Email" required>
          <input type="email" className="input" value={f.email} onChange={e => set('email', e.target.value)}
            required disabled={mode === 'edit'} />
        </Field>
        {mode === 'create' && (
          <Field label="Initial password" required>
            <input className="input" value={f.password} onChange={e => set('password', e.target.value)}
              placeholder="Min 6 characters" minLength={6} required />
          </Field>
        )}
        <Field label="Current role" required>
          <input className="input" value={f.current_role} onChange={e => set('current_role', e.target.value)}
            placeholder="e.g. Product Manager" required />
        </Field>
        <Field label="Organization" required>
          <input className="input" value={f.organization} onChange={e => set('organization', e.target.value)} required />
        </Field>
        <Field label="Years of experience" required>
          <input type="number" min={0} className="input" value={f.years_experience}
            onChange={e => set('years_experience', e.target.value)} required />
        </Field>
        <Field label="Session duration (min)" required>
          <input type="number" min={15} step={5} className="input" value={f.session_duration}
            onChange={e => set('session_duration', e.target.value)} required />
        </Field>
        <Field label="LinkedIn URL">
          <input className="input" value={f.linkedin_url} onChange={e => set('linkedin_url', e.target.value)}
            placeholder="https://linkedin.com/in/…" />
        </Field>
        <Field label="Photo URL">
          <input className="input" value={f.photo_url} onChange={e => set('photo_url', e.target.value)}
            placeholder="https://…" />
        </Field>
      </div>
      <Field label="Skills (comma-separated)">
        <input className="input" value={f.skills} onChange={e => set('skills', e.target.value)}
          placeholder="Product Management, Strategy, Growth" />
      </Field>
      <Field label="Bio">
        <textarea rows={3} className="input resize-none" value={f.bio} onChange={e => set('bio', e.target.value)} />
      </Field>
      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'create' ? <UserPlus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {mode === 'create' ? 'Create Mentor' : 'Save Changes'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.push('/admin/mentors')}>Cancel</button>
      </div>
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-400"> *</span>}
      </label>
      {children}
    </div>
  )
}
