'use client'

import { Nav } from '@/app/components/nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Megaphone, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MessagingHeader } from '../components/MessagingHeader'

export default function CampaignsPage() {
    const router = useRouter()

    return (
        <div className="h-screen flex flex-col bg-background dark:bg-[#0a0a0a]">
            <Nav />
            
            <MessagingHeader 
                title="Mass Campaigns"
                description="Send bulk messages to customer segments"
            />

            <div className="flex-1 overflow-auto">
                <div className="container mx-auto p-6">
                    <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                        <CardContent className="p-12">
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="h-24 w-24 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                        <Megaphone className="h-12 w-12 text-primary" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-semibold text-foreground dark:text-white">
                                        Mass Campaign Feature Coming Soon
                                    </h3>
                                    <p className="text-muted-foreground dark:text-gray-400 max-w-md mx-auto">
                                        Send targeted promotional messages to specific customer segments. This feature is currently under development.
                                    </p>
                                </div>
                                <div className="flex gap-4 justify-center pt-4">
                                    <Button variant="outline" onClick={() => router.push('/messaging/templates')}>
                                        View Templates
                                    </Button>
                                    <Button variant="outline" onClick={() => router.push('/messaging/queue')}>
                                        View Queue
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

