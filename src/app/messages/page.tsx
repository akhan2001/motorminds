"use client"

import { Nav } from "@/app/components/nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, ArrowRight, Mail, MessageSquare, Phone, Sparkles } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/common/feedback/loading-states"
import { useAuth } from "@/hooks/core/useAuth"
import TwilioMessaging from "./components/TwilioMessaging"
import { EmailDashboard } from "./components/email/EmailDashboard"

export default function Messages() {
    // Authentication
    const { user, shopId, isLoading: authLoading, error: authError } = useAuth()

    // Loading state
    if (authLoading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <LoadingSpinner size="md" className="text-blue-500" />
                            <div>
                                <p className="text-foreground font-medium">Loading Messages</p>
                                <p className="text-muted-foreground text-sm">Fetching data from database...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Error state
    if (authError) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            <div>
                                <p className="text-foreground font-medium">Error Loading Messages</p>
                                <p className="text-muted-foreground text-sm">{typeof authError === 'string' ? authError : 'An error occurred'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Don't render main content if we don't have authentication data
    if (!shopId || !user) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-yellow-500" />
                            <div>
                                <p className="text-foreground font-medium">Authentication Required</p>
                                <p className="text-muted-foreground text-sm mb-3">
                                    Unable to access messages. Please ensure you are logged in.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground">
            <Nav />
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 sm:px-6 pb-4">
                <div className="container mx-auto max-w-[1400px] w-full h-full flex flex-col min-h-0 overflow-hidden">
                    <div className="flex-shrink-0 pt-4 pb-3">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Messages</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            Communicate with your customers through SMS and email.
                        </p>
                    </div>

                    <Tabs defaultValue="sms" className="flex-1 flex flex-col min-h-0 overflow-hidden mt-4">
                        <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/60 p-1 rounded-lg h-11 flex-shrink-0">
                            <TabsTrigger value="sms" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground rounded-md">
                                <Phone className="h-4 w-4 mr-2" />
                                SMS
                            </TabsTrigger>
                            <TabsTrigger value="email" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground rounded-md">
                                <Mail className="h-4 w-4 mr-2" />
                                Email
                            </TabsTrigger>
                            <TabsTrigger value="automated" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground rounded-md">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Automated
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="sms" className="flex-1 flex flex-col min-h-0 overflow-hidden mt-4 data-[state=inactive]:hidden">
                            {shopId && <TwilioMessaging shopId={shopId} />}
                        </TabsContent>

                        <TabsContent value="email" className="flex-1 min-h-0 overflow-auto mt-4 data-[state=inactive]:hidden">
                            <EmailDashboard />
                        </TabsContent>

                        <TabsContent value="automated" className="flex-1 min-h-0 overflow-auto mt-4 data-[state=inactive]:hidden">
                            <Card className="bg-card border-border">
                                <CardContent className="p-8 text-center">
                                    <h3 className="text-xl font-medium text-foreground">Automated Follow-Up Messages</h3>
                                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                                        Set up automated messages that send to customers after service completion.
                                    </p>
                                    <Link href="/messaging" className="inline-block mt-6">
                                        <Button size="lg">
                                            Go to Automated Messaging
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
