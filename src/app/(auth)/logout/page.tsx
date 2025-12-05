'use client'

import { useEffect } from 'react'
import { useSignOut } from '@/lib/auth/useSignOut'
import { Loader2 } from 'lucide-react'

export default function LogoutPage() {
    const signOut = useSignOut()

    useEffect(() => {
        signOut()
    }, [signOut])

    return (
        <div className="h-screen flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="text-white text-lg">Signing out...</p>
            </div>
        </div>
    )
}

