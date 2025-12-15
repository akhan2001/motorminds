'use client';

// import { Nav } from "../components/nav";

import { useAuth } from "@/contexts/AuthProvider";
import { AIDiagnosticsLayout } from "./components/AIDiagnosticsLayout";

import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/feedback/loading-states";
import { AlertCircle } from "lucide-react";

export default function AIDiagnosticsPage() {
    const { user, shopId, isLoading, error } = useAuth();

    // Loading state
    if (isLoading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                {/* <Nav /> */}
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <LoadingSpinner size="md" className="text-blue-500" />
                            <div>
                                <p className="text-foreground font-medium">Loading Mia Diagnostics</p>
                                <p className="text-muted-foreground text-sm">Initializing Mia Diagnostics...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="h-screen flex flex-col bg-background">
                {/* <Nav /> */}
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            <div>
                                <p className="text-foreground font-medium">Failed to Load Mia Diagnostics</p>
                                <p className="text-muted-foreground text-sm mb-3">
                                    {error && typeof error === 'object' && 'message' in error ? (error as Error).message : 'Unknown error occurred'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Auth error state
    if (!shopId || !user) {
        return (
            <div className="h-screen flex flex-col bg-background">
                {/* <Nav /> */}
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-yellow-500" />
                            <div>
                                <p className="text-foreground font-medium">Authentication Required</p>
                                <p className="text-muted-foreground text-sm mb-3">
                                    Unable to access Mia Diagnostics. Please ensure you are logged in.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }
    
	return (
		<div className="h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
			{/* <Nav /> */}
			<div className="flex-1 overflow-hidden">
				<AIDiagnosticsLayout shopId={shopId} />
			</div>
		</div>
	);
}