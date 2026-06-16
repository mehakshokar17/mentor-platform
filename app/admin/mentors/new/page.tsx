import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import MentorForm from '@/components/admin/MentorForm'

export default function NewMentorPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/mentors" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to mentors
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Mentor</h1>
        <p className="text-gray-500 mt-1">Creates a login account and a public mentor profile</p>
      </div>
      <MentorForm mode="create" />
    </div>
  )
}
