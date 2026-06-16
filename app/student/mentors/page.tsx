import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MapPin, Briefcase, Star, Search } from 'lucide-react'

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: { q?: string; skill?: string }
}) {
  const supabase = createClient()

  let query = supabase
    .from('mentors')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const { data: mentors } = await query

  // Client-side filtering (small dataset for this demo)
  const search = searchParams.q?.toLowerCase() ?? ''
  const skillFilter = searchParams.skill?.toLowerCase() ?? ''

  const filtered = (mentors ?? []).filter(m => {
    const matchSearch = !search ||
      m.name.toLowerCase().includes(search) ||
      m.current_role.toLowerCase().includes(search) ||
      m.organization.toLowerCase().includes(search) ||
      m.bio?.toLowerCase().includes(search)
    const matchSkill = !skillFilter ||
      m.skills.some((s: string) => s.toLowerCase().includes(skillFilter))
    return matchSearch && matchSkill
  })

  // Get all unique skills for filter pills
  const allSkills = [...new Set((mentors ?? []).flatMap(m => m.skills as string[]))].sort()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Mentors</h1>
        <p className="text-gray-500 mt-1">Find the right mentor for your goals</p>
      </div>

      {/* Search */}
      <form className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="q"
            type="text"
            placeholder="Search mentors, roles, organisations…"
            defaultValue={searchParams.q}
            className="input pl-9"
          />
        </div>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {/* Skill filter pills */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/student/mentors"
          className={`badge px-3 py-1 text-sm border ${!skillFilter ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}
        >
          All
        </Link>
        {allSkills.slice(0, 10).map(skill => (
          <Link
            key={skill}
            href={`/student/mentors?skill=${encodeURIComponent(skill)}`}
            className={`badge px-3 py-1 text-sm border ${skillFilter === skill.toLowerCase() ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}
          >
            {skill}
          </Link>
        ))}
      </div>

      {/* Results */}
      <p className="text-sm text-gray-400">{filtered.length} mentor{filtered.length !== 1 ? 's' : ''} found</p>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Star className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">No mentors match your search</p>
          <Link href="/student/mentors" className="btn-secondary mt-4">Clear filters</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((mentor: any) => (
            <div key={mentor.id} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={mentor.photo_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=4f46e5&color=fff&size=80`}
                  alt={mentor.name}
                  className="w-14 h-14 rounded-xl object-cover ring-2 ring-brand-100"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{mentor.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    {mentor.current_role}
                  </p>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {mentor.organization}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{mentor.bio}</p>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(mentor.skills as string[]).slice(0, 4).map((skill: string) => (
                  <span key={skill} className="badge bg-brand-50 text-brand-700 border border-brand-100">
                    {skill}
                  </span>
                ))}
                {mentor.skills.length > 4 && (
                  <span className="badge bg-gray-50 text-gray-400">+{mentor.skills.length - 4}</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {mentor.years_experience} yr{mentor.years_experience !== 1 ? 's' : ''} exp · {mentor.session_duration} min sessions
                </span>
                <Link href={`/student/mentors/${mentor.id}`} className="btn-primary !py-2 !text-xs">
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
