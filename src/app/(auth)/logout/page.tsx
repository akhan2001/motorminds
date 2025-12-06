'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function LogoutPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        async function performLogout() {
            try {
                console.log('[Logout] Starting logout process...')

                // Sign out with global scope (all tabs/devices)
                const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' })

                if (signOutError) {
                    console.error('[Logout] Sign out error:', signOutError)
                    setError(signOutError.message)
                    return
                }

                console.log('[Logout] Sign out successful')

                // Clear localStorage (Supabase already handles this, but being explicit)
                if (typeof window !== 'undefined') {
                    const keysToRemove: string[] = []
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i)
                        if (key && (
                            key.startsWith('sb-') ||
                            key.includes('supabase') ||
                            key.includes('auth')
                        )) {
                            keysToRemove.push(key)
                        }
                    }
                    keysToRemove.forEach(key => localStorage.removeItem(key))
                    console.log('[Logout] localStorage cleared')
                }

                // Redirect to login after a brief delay
                setTimeout(() => {
                    router.push('/login')
                }, 500)

            } catch (err: any) {
                console.error('[Logout] Unexpected error:', err)
                setError(err.message || 'An unexpected error occurred during logout.')
            }
        }

        performLogout()
    }, [router, supabase.auth])

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <div>
                        <p className="text-foreground text-lg font-medium">Logout Failed</p>
                        <p className="text-muted-foreground text-sm mt-2">{error}</p>
                    </div>
                    <button
                        onClick={() => router.push('/login')}
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-foreground text-lg">Signing out...</p>
                <p className="text-muted-foreground text-sm">Revoking your session</p>
            </div>
        </div>
    )
}

