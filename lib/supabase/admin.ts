import { createClient } from '@supabase/supabase-js'

// Uses the Service Role key — NEVER expose this to the browser.
// Server-side only (Route Handlers, Server Actions).
export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
