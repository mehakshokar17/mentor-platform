/**
 * Generate a Jitsi Meet URL for a booking.
 * Jitsi is free, needs no API key, and works in every browser.
 */
export function generateMeetingUrl(bookingId: string): string {
  const roomName = `ssb-mentor-${bookingId.replace(/-/g, '').slice(0, 16)}`
  return `https://meet.jit.si/${roomName}`
}

// Label the join button based on which provider actually issued the link.
export function meetingLabel(url?: string | null): string {
  if (url?.includes('meet.google.com')) return 'Join Google Meet'
  if (url?.includes('meet.jit.si')) return 'Join Meeting (Jitsi)'
  return 'Join Meeting'
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function isSessionUpcoming(date: string, time: string): boolean {
  const sessionDt = new Date(`${date}T${time}`)
  return sessionDt > new Date()
}
