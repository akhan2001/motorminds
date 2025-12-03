'use client';

import React, { useEffect, useState } from 'react';
import { FinancialsAuthProvider, useFinancialsAuth } from '@/contexts/FinancialsAuthContext';
import { FinancialsPasswordModal } from '@/components/financials/FinancialsPasswordModal';
import { FinancialsSetupPassword } from '@/components/financials/FinancialsSetupPassword';
import { createClient } from '@/utils/supabase/client';
import { Nav } from '@/components/navigation/nav';
import { useUnifiedAuth } from '@/contexts/unified-auth-context';

interface FinancialsLayoutContentProps {
    children: React.ReactNode;
}

function FinancialsLayoutContent({ children }: FinancialsLayoutContentProps) {
    const { isUnlocked, isLocked } = useFinancialsAuth();
    const { user, shopInfo, isLoading: authLoading } = useUnifiedAuth();
    const [needsPasswordSetup, setNeedsPasswordSetup] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if shop has financial password set up
    useEffect(() => {
        const checkPasswordStatus = async () => {
            // Wait for auth to finish loading
            if (authLoading) {
                return;
            }

            try {
                // Use shopInfo from UnifiedAuth instead of separate query
                if (!user || !shopInfo?.id) {
                    console.log('[FinancialsLayout] No user or shop info available');
                    setIsLoading(false);
                    return;
                }

                console.log('[FinancialsLayout] Checking password status for shop:', shopInfo.id);

                // Check if shop has financial password
                const supabase = createClient();
                const { data: shopData, error: shopError } = await supabase
                    .from('shops')
                    .select('financials_password_hash')
                    .eq('id', shopInfo.id)
                    .maybeSingle();

                if (shopError) {
                    console.error('[FinancialsLayout] Error checking password status:', shopError);
                    setIsLoading(false);
                    return;
                }

                setNeedsPasswordSetup(!shopData?.financials_password_hash);
            } catch (error) {
                console.error('[FinancialsLayout] Error in password status check:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkPasswordStatus();
    }, [user, shopInfo, authLoading]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading financial section...</p>
                </div>
            </div>
        );
    }

    // First-time setup
    if (needsPasswordSetup) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-background">
                {/* Navigation */}
                <Nav />
                
                <div className="min-h-screen flex items-center justify-center p-4">
                    <FinancialsSetupPassword
                        onComplete={() => {
                            setNeedsPasswordSetup(false);
                        }}
                    />
                </div>
            </div>
        );
    }

    // User is locked out or needs to authenticate
    if (!isUnlocked) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-background">
                {/* Navigation - NOT blurred so users can navigate away */}
                <div className="relative z-50 pointer-events-auto">
                    <Nav />
                </div>
                
                {/* Blurred background content - completely separate from navbar */}
                <div className="relative">
                    <div className="filter blur-[2px] pointer-events-none">
                        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-50 dark:from-gray-900 dark:to-black p-8">
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
                </div>
                
                {/* Password Modal */}
                <FinancialsPasswordModal />
            </div>
        );
    }

    // User is authenticated - show content
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background">
            {/* Session indicator */}
            <div className="bg-green-50 dark:bg-green-600/10 border-b border-green-300 dark:border-green-600/20 p-2">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                        <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-2" />
                        Financial session active
                    </div>
                    <button
                        onClick={() => {
                            // This will be handled by the context
                            window.location.reload();
                        }}
                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm underline"
                    >
                        Lock section
                    </button>
                </div>
            </div>
            
            {children}
        </div>
    );
}

interface FinancialsLayoutProps {
    children: React.ReactNode;
}

export default function FinancialsLayout({ children }: FinancialsLayoutProps) {
    return (
        <FinancialsAuthProvider>
            <FinancialsLayoutContent>
                {children}
            </FinancialsLayoutContent>
        </FinancialsAuthProvider>
    );
}