'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, LogOut } from 'lucide-react'
import { useSignOut } from '@/lib/auth/hooks'
import { useQueryClient } from '@tanstack/react-query'

export default function LogoutPage() {
    const [status, setStatus] = useState<'signing-out' | 'success' | 'error'>('signing-out')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const { signOut } = useSignOut()
    const queryClient = useQueryClient()

    useEffect(() => {
        const performLogout = async () => {
            try {
                // Clear React Query cache
                queryClient.clear()
                console.log('[useSignOut] Query cache cleared')
                
                // Perform sign out
                const result = await signOut()
                
                if (result?.success === false) {
                    setStatus('error')
                    setErrorMessage(result.error || 'Logout failed')
                } else {
                    setStatus('success')
                    // signOut already handles redirect to /login
                }
            } catch (error) {
                setStatus('error')
                setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
            }
        }

        performLogout()
    }, [signOut, queryClient])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-6 p-8">
                {status === 'signing-out' && (
                    <>
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                    <LogOut className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div className="absolute -bottom-1 -right-1">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">Signing out...</h1>
                            <p className="text-muted-foreground mt-2">Please wait while we sign you out securely.</p>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">Signed out successfully</h1>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                                <LogOut className="w-8 h-8 text-red-500" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">Logout failed</h1>
                            <p className="text-muted-foreground mt-2">{errorMessage}</p>
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                            >
                                Go to Login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

