'use client'

import { Suspense } from 'react'
import { ProfileForm } from "@/app/(features)/settings/profile-form"
import { useAuth } from '@/lib/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

function SettingsContent() {
    // Authentication
    const { user, shopId, isLoading: authLoading, error: authError } = useAuth()
    const router = useRouter()

    // Loading state
    if (authLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                    <CardContent className="flex items-center gap-4 p-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <div>
                            <p className="text-foreground dark:text-white font-medium">Loading Settings</p>
                            <p className="text-muted-foreground dark:text-gray-400 text-sm">Fetching your shop information...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Error state
    if (authError) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] max-w-md">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <CardTitle className="text-foreground">Unable to Load Settings</CardTitle>
                        </div>
                        <CardDescription>
                            {authError}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Button
                                onClick={() => window.location.reload()}
                                className="flex-1"
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/dashboard')}
                                className="flex-1"
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // No shop found state
    if (!shopId) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] max-w-md">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-foreground">No Shop Found</CardTitle>
                        </div>
                        <CardDescription>
                            We couldn't find a shop associated with your account. Please contact support if you believe this is an error.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => router.push('/dashboard')}
                            className="w-full"
                        >
                            Go to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Success state - show settings form
    return (
        <div className="container mx-auto max-w-7xl p-4 md:p-6 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Shop Settings</h1>
                <p className="text-muted-foreground">
                    Manage your shop profile, contact information, and preferences.
                </p>
            </div>
            <ProfileForm shopId={shopId} />
        </div>
    )
}

function SettingsLoading() {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-foreground">Loading...</div>
        </div>
    )
}

// Main component with Suspense wrapper
export default function SettingsProfilePage() {
    return (
        <Suspense fallback={<SettingsLoading />}>
            <SettingsContent />
        </Suspense>
    )
}

