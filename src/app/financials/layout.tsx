'use client'

import React, { useEffect, useState } from 'react'
import { FinancialsAuthProvider, useFinancialsAuth } from '@/contexts/FinancialsAuthContext'
import { FinancialsPasswordModal } from '@/components/financials/FinancialsPasswordModal'
import { FinancialsSetupPassword } from '@/components/financials/FinancialsSetupPassword'
import { FinancialsSessionBar } from '@/components/financials/FinancialsSessionBar'
import { createClient } from '@/utils/supabase/client'
import { AppShell } from '@/components/layout'

interface FinancialsLayoutContentProps {
    children: React.ReactNode
}

function FinancialsLayoutContent({ children }: FinancialsLayoutContentProps) {
    const { isUnlocked } = useFinancialsAuth()
    const [needsPasswordSetup, setNeedsPasswordSetup] = useState<boolean | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Check if shop has financial password set up
    useEffect(() => {
        const checkPasswordStatus = async () => {
            try {
                const supabase = createClient()
                const { data: { user }, error: authError } = await supabase.auth.getUser()
                
                if (authError || !user) {
                    setIsLoading(false)
                    return
                }

                // Get user's shop_id
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('shop_id')
                    .eq('id', user.id)
                    .single()

                if (userError || !userData?.shop_id) {
                    setIsLoading(false)
                    return
                }

                // Check if shop has financial password
                const { data: shopData, error: shopError } = await supabase
                    .from('shops')
                    .select('financials_password_hash')
                    .eq('id', userData.shop_id)
                    .single()

                if (shopError) {
                    console.error('Error checking password status:', shopError)
                    setIsLoading(false)
                    return
                }

                setNeedsPasswordSetup(!shopData?.financials_password_hash)
            } catch (error) {
                console.error('Error in password status check:', error)
            } finally {
                setIsLoading(false)
            }
        }

        checkPasswordStatus()
    }, [])

    // Loading state
    if (isLoading) {
        return (
            <AppShell>
                <div className="min-h-full bg-slate-50 dark:bg-background flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading financial section...</p>
                    </div>
                </div>
            </AppShell>
        )
    }

    // First-time setup
    if (needsPasswordSetup) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-full p-4 bg-slate-50 dark:bg-background">
                    <FinancialsSetupPassword
                        onComplete={() => {
                            setNeedsPasswordSetup(false)
                        }}
                    />
                </div>
            </AppShell>
        )
    }

    // User is locked out or needs to authenticate
    if (!isUnlocked) {
        return (
            <AppShell>
                <div className="relative bg-slate-50 dark:bg-background min-h-full">
                    {/* Blurred background content */}
                    <div className="filter blur-[2px] pointer-events-none">
                        <div className="min-h-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-gray-900 dark:to-black p-8">
                            <div className="max-w-7xl mx-auto">
                                <h1 className="text-3xl font-bold text-foreground mb-8">Financial Dashboard</h1>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div key={i} className="bg-slate-50 dark:bg-zinc-800 rounded-lg p-6 h-40" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Password Modal */}
                    <FinancialsPasswordModal />
                </div>
            </AppShell>
        )
    }

    // User is authenticated - show content with session bar
    return (
        <AppShell beforeMain={<FinancialsSessionBar />}>
            <div className="bg-slate-50 dark:bg-background min-h-full">
                {children}
            </div>
        </AppShell>
    )
}

interface FinancialsLayoutProps {
    children: React.ReactNode
}

export default function FinancialsLayout({ children }: FinancialsLayoutProps) {
    return (
        <FinancialsAuthProvider>
            <FinancialsLayoutContent>
                {children}
            </FinancialsLayoutContent>
        </FinancialsAuthProvider>
    )
}
