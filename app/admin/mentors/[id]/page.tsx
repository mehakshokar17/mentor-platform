import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import MentorForm from '@/components/admin/MentorForm'
import SlotManager from '@/components/admin/SlotManager'

export const dynamic = 'force-dynamic'

export default async function EditMentorPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const { data: mentor } = await admin.from('mentors').select('*').eq('id', params.id).single()
  if (!mentor) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/mentors" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to mentors
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit {mentor.name}</h1>
        <p className="text-gray-500 mt-1">Update profile details and manage availability</p>
      </div>
      <MentorForm mode="edit" mentor={mentor} />
      <div className="max-w-2xl">
        <SlotManager mentorId={mentor.id} />
      </div>
    </div>
  )
}
