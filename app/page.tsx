import { redirect } from 'next/navigation'

// Middleware handles routing; this is just a fallback
export default function Home() {
  redirect('/auth/login')
}
