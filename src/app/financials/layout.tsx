'use client';

import React, { useEffect, useState } from 'react';
import { FinancialsAuthProvider, useFinancialsAuth } from '@/contexts/FinancialsAuthContext';
import { FinancialsPasswordModal } from '@/components/financials/FinancialsPasswordModal';
import { FinancialsSetupPassword } from '@/components/financials/FinancialsSetupPassword';
import { createClient } from '@/utils/supabase/client';
import { Nav } from '@/components/navigation/nav';
import { SidebarNav } from '@/components/navigation/sidebar-nav';

const SIDEBAR_BEHAVIOR_KEY = "SIDEBAR_BEHAVIOR"
type SidebarBehavior = "expandable" | "open" | "closed"

interface FinancialsLayoutContentProps {
    children: React.ReactNode;
}

function FinancialsLayoutContent({ children }: FinancialsLayoutContentProps) {
    const { isUnlocked, isLocked } = useFinancialsAuth();
    const [needsPasswordSetup, setNeedsPasswordSetup] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize sidebar behavior from localStorage
    const [sidebarBehavior, setSidebarBehavior] = useState<SidebarBehavior>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(SIDEBAR_BEHAVIOR_KEY) as SidebarBehavior
            return stored || "expandable"
        }
        return "expandable"
    })

    // Initialize sidebar open state based on behavior
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(SIDEBAR_BEHAVIOR_KEY) as SidebarBehavior
            const behavior = stored || "expandable"
            if (behavior === "open") return true
            if (behavior === "closed") return false
            return false // expandable starts collapsed
        }
        return false
    })

    // Update sidebar open state when behavior changes
    useEffect(() => {
        if (sidebarBehavior === "open") {
            setSidebarOpen(true)
        } else if (sidebarBehavior === "closed") {
            setSidebarOpen(false)
        }
        // For 'expandable', don't change the current state
    }, [sidebarBehavior])

    // Save behavior to localStorage when it changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(SIDEBAR_BEHAVIOR_KEY, sidebarBehavior)
        }
    }, [sidebarBehavior])

    const handleSidebarBehaviorChange = () => {
        // Toggle between expandable (hovering) and open (locked)
        if (sidebarBehavior === "expandable") {
            setSidebarBehavior("open")
        } else if (sidebarBehavior === "open") {
            setSidebarBehavior("expandable")
        } else {
            // If somehow in "closed" mode, go to expandable
            setSidebarBehavior("expandable")
        }
    }

    // Check if shop has financial password set up
    useEffect(() => {
        const checkPasswordStatus = async () => {
            try {
                const supabase = createClient();
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                
                if (authError || !user) {
                    setIsLoading(false);
                    return;
                }

                // Get user's shop_id
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('shop_id')
                    .eq('id', user.id)
                    .single();

                if (userError || !userData?.shop_id) {
                    setIsLoading(false);
                    return;
                }

                // Check if shop has financial password
                const { data: shopData, error: shopError } = await supabase
                    .from('shops')
                    .select('financials_password_hash')
                    .eq('id', userData.shop_id)
                    .single();

                if (shopError) {
                    console.error('Error checking password status:', shopError);
                    setIsLoading(false);
                    return;
                }

                setNeedsPasswordSetup(!shopData?.financials_password_hash);
            } catch (error) {
                console.error('Error in password status check:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkPasswordStatus();
    }, []);

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
            <div className="flex flex-col h-screen overflow-hidden">
                <Nav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <div className="flex flex-1 overflow-hidden">
                    <SidebarNav
                        isOpen={sidebarOpen}
                        setOpen={setSidebarOpen}
                        behavior={sidebarBehavior}
                        onBehaviorChange={handleSidebarBehaviorChange}
                    />
                    <main className="flex-1 overflow-auto bg-slate-50 dark:bg-background">
                        <div className="flex items-center justify-center h-full p-4">
                            <FinancialsSetupPassword
                                onComplete={() => {
                                    setNeedsPasswordSetup(false);
                                }}
                            />
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // User is locked out or needs to authenticate
    if (!isUnlocked) {
        return (
            <div className="flex flex-col h-screen overflow-hidden">
                {/* Navigation - NOT blurred so users can navigate away */}
                <div className="relative z-50 pointer-events-auto">
                    <Nav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                </div>
                <div className="flex flex-1 overflow-hidden">
                    <SidebarNav
                        isOpen={sidebarOpen}
                        setOpen={setSidebarOpen}
                        behavior={sidebarBehavior}
                        onBehaviorChange={handleSidebarBehaviorChange}
                    />
                    <main className="flex-1 overflow-auto bg-slate-50 dark:bg-background relative">
                        {/* Blurred background content - completely separate from navbar */}
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
                    </main>
                </div>
            </div>
        );
    }

    // User is authenticated - show content
    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Nav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="flex flex-1 overflow-hidden">
                <SidebarNav
                    isOpen={sidebarOpen}
                    setOpen={setSidebarOpen}
                    behavior={sidebarBehavior}
                    onBehaviorChange={handleSidebarBehaviorChange}
                />
                <main className="flex-1 overflow-auto bg-slate-50 dark:bg-background">
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
                </main>
            </div>
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