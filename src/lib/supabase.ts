// DEPRECATED: Use @/utils/supabase/client instead
// This file will be removed in a future version

import { createBrowserClient } from '@supabase/ssr'
import { createClient as createBrowserClientSSR } from '@/utils/supabase/client'

/**
 * @deprecated Use createClient from @/utils/supabase/client instead
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * @deprecated Use createClient from @/utils/supabase/client instead
 * Export instance for backward compatibility with existing files
 */
export const supabase = createClient()