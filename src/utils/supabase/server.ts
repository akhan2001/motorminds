import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createClient = () => 
  createServerComponentClient({ cookies })

export const createClient = () => {
  const cookieStore = cookies()

  return createServerComponentClient({ cookies })
} 