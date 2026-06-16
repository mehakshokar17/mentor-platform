import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

// Admins are identified by an email allowlist (ADMIN_EMAILS, comma-separated).
// This avoids a DB role migration and lets a trusted account double as admin.
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? 'mehakshokar17@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}

// Returns the signed-in user if they are an admin, otherwise null.
export async function getAdminUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}
