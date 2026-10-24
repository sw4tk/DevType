import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const cleanUrl = rawUrl.endsWith('/rest/v1') ? rawUrl.slice(0, -8) : rawUrl.replace(/\/$/, '')

  return createBrowserClient(
    cleanUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}