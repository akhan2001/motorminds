"use client"

import { Mail, Phone, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/core/useAuth"
import { PageLoading, PageError, PageAuthRequired } from "@/components/common/feedback/page-states"
import { ScaffoldContainer } from "@/components/layout"
import TwilioMessaging from "./components/TwilioMessaging"
import { EmailDashboard } from "./components/email/EmailDashboard"

export default function Messages() {
    // Authentication
    const { user, shopId, isLoading: authLoading, error: authError } = useAuth()

    // Loading state
    if (authLoading) {
        return <PageLoading title="Loading Messages" description="Fetching data from database..." />
    }

    // Error state
    if (authError) {
        return <PageError title="Error Loading Messages" error={typeof authError === 'string' ? authError : 'An error occurred'} />
    }

    // Auth required state
    if (!shopId || !user) {
        return <PageAuthRequired resource="messages" />
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Fixed Header */}
            <div className="bg-background border-b border-border flex-shrink-0">
                <div className="px-6 py-4">
                    <h1 className="text-2xl font-semibold text-foreground">Messages</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Communicate with your customers through SMS and email
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <ScaffoldContainer size="large" className="py-6">
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
                                            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" size="lg">
                                                Go to Automated Messaging
                                                <ArrowRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </ScaffoldContainer>
            </div>
        </div>
    )
}
