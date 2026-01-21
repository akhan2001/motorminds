'use client'

import { Suspense } from 'react'
import { ProfileForm } from "@/app/(features)/settings/profile-form"
import { useAuth } from '@/app/(features)/operations/hooks/use-auth'
import { Settings } from 'lucide-react'
import { PageLoading, PageError, PageAuthRequired } from '@/components/common/feedback/page-states'
import { ScaffoldContainer } from '@/components/layout'

function SettingsContent() {
    // Authentication
    const { user, shopId, isLoading: authLoading, error: authError } = useAuth()

    // Loading state
    if (authLoading) {
        return <PageLoading title="Loading Settings" description="Fetching your shop information..." />
    }

    // Error state
    if (authError) {
        return (
            <PageError 
                title="Unable to Load Settings" 
                error={authError}
                onRetry={() => window.location.reload()}
            />
        )
    }

    // No shop found state
    if (!shopId) {
        return <PageAuthRequired resource="settings" />
    }

    // Success state - show settings form
    return (
        <div className="h-full flex flex-col bg-background">
            <div className="bg-background border-b border-border flex-shrink-0">
                <div className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Settings className="h-6 w-6 text-muted-foreground" />
                        <h1 className="text-2xl font-bold text-foreground">Shop Settings</h1>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your shop profile, contact information, and preferences.
                    </p>
                </div>
            </div>
            <div className="flex-1 overflow-auto">
                <ScaffoldContainer size="large" className="py-6">
                    <ProfileForm shopId={shopId} />
                </ScaffoldContainer>
            </div>
        </div>
    )
}

// Main component with Suspense wrapper
export default function SettingsProfilePage() {
    return (
        <Suspense fallback={<PageLoading title="Loading Settings" />}>
            <SettingsContent />
        </Suspense>
    )
}

