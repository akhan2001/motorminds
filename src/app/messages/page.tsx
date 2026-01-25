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
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Nav />
            <div className="flex items-center justify-center py-4 sm:py-8 px-4 sm:px-6">
                <div className="container mx-auto max-w-[1300px]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
                        <div className="flex flex-col w-full">
                            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2 text-foreground">Messages</h1>
                            <p className="text-muted-foreground mb-6">
                                Communicate with your customers through SMS and email.
                            </p>
                                    
                            <Tabs defaultValue="sms" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 bg-slate-50 dark:bg-muted">
                                    <TabsTrigger value="sms" className="data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-red-600 hover:bg-muted">
                                        <Phone className="h-4 w-4 mr-2" />
                                        SMS Messages
                                    </TabsTrigger>
                                    <TabsTrigger value="email" className="data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-red-600 hover:bg-muted">
                                        <Mail className="h-4 w-4 mr-2" />
                                        Emails
                                    </TabsTrigger>
                                    <TabsTrigger value="automated" className="data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-red-600 hover:bg-muted">
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Automated
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="sms" className="mt-6">
                                    {shopId && <TwilioMessaging shopId={shopId} />}
                                </TabsContent>

                                <TabsContent value="email" className="mt-6">
                                    <EmailDashboard />
                                </TabsContent>

                                <TabsContent value="automated" className="mt-6">
                                    <Card className="bg-slate-50 dark:bg-card border-border">
                                        <CardContent className="p-8 text-center">
                                            <div className="max-w-md mx-auto space-y-4">
                                                <h3 className="text-xl font-medium text-foreground">Automated Follow-Up Messages</h3>
                                                <p className="text-muted-foreground">
                                                    Set up automated messages that send to customers after service completion
                                                </p>
                                                <Link href="/messaging">
                                                    <Button className="w-full" size="lg">
                                                        Go to Automated Messaging
                                                        <ArrowRight className="h-4 w-4 ml-2" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
