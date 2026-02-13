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
