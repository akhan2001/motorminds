'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSignOut } from '@/lib/auth/useSignOut'
import { Loader2 } from 'lucide-react'

/**
 * Logout page - matches Supabase Studio pattern
 * 
 * Flow:
 * 1. User navigates to /logout
 * 2. useEffect runs on mount
 * 3. Calls signOut() hook
 * 4. Redirects to /login
 */
export default function LogoutPage() {
    const router = useRouter()
    const signOut = useSignOut()

    useEffect(() => {
        async function handleLogout() {
            await signOut()
            // signOut already redirects, but just in case
            router.push('/login')
        }

        handleLogout()
    }, [signOut, router])

    return (
        <div className="h-screen flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="text-white text-lg">Signing out...</p>
            </div>
        </div>
    )
}

