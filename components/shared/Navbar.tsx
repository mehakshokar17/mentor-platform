'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, LayoutDashboard, Users, Calendar, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface NavbarProps {
  role: 'student' | 'mentor'
  userName: string
}

const studentLinks = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/mentors',   label: 'Browse Mentors', icon: Users },
  { href: '/student/sessions',  label: 'My Sessions', icon: Calendar },
]

const mentorLinks = [
  { href: '/mentor/dashboard',    label: 'Dashboard', icon: LayoutDashboard },
  { href: '/mentor/availability', label: 'Availability', icon: Calendar },
  { href: '/mentor/sessions',     label: 'Sessions', icon: Users },
]

export default function Navbar({ role, userName }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = role === 'student' ? studentLinks : mentorLinks

  async function signOut() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={`/${role}/dashboard`} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">SSB Mentors</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
                {userName[0]?.toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">{userName}</p>
                <p className="text-gray-400 capitalize text-xs">{role}</p>
              </div>
            </div>
            <button onClick={signOut} className="btn-secondary !px-2.5 !py-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
            {/* Mobile menu button */}
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname.startsWith(href)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
