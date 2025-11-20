'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

export default function GetCustomerIntakeLinkPage() {
    const [shopId, setShopId] = useState<string>('')
    const [shopName, setShopName] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const router = useRouter()

    useEffect(() => {
        async function fetchShopInfo() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                
                if (!user) {
                    router.push('/login')
                    return
                }

                // Get shop_id from user
                let userShopId = user.user_metadata?.shop_id
                
                if (!userShopId) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('shop_id')
                        .eq('id', user.id)
                        .single()
                    
                    if (userData?.shop_id) {
                        userShopId = userData.shop_id
                    }
                }

                if (userShopId) {
                    setShopId(userShopId)
                    
                    // Get shop name
                    const { data: shopData } = await supabase
                        .from('shops')
                        .select('shop_name')
                        .eq('id', userShopId)
                        .single()
                    
                    if (shopData?.shop_name) {
                        setShopName(shopData.shop_name)
                    }
                }

                setIsLoading(false)
            } catch (error) {
                console.error('Error fetching shop info:', error)
                setIsLoading(false)
            }
        }

        fetchShopInfo()
    }, [router])

    const customerIntakeLink = shopId 
        ? `${window.location.origin}/customer-intake?shop=${shopId}`
        : ''

    const handleCopyLink = () => {
        navigator.clipboard.writeText(customerIntakeLink)
        setCopied(true)
        toast.success('Link copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
    }

    const handleGenerateQR = () => {
        // Open QR code generator in new tab
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(customerIntakeLink)}`
        window.open(qrUrl, '_blank')
    }

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <div className="flex justify-center items-center h-screen">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </div>
        )
    }

    if (!shopId) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <div className="flex justify-center items-center h-screen">
                    <div className="text-center">
                        <p className="text-muted-foreground">No shop found for your account.</p>
                        <Button onClick={() => router.push('/dashboard')} className="mt-4">
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="bg-card border-b border-border py-4">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/motorminds-logo-white (1).svg"
                            alt="MotorMinds Logo"
                            width={35}
                            height={35}
                            className="w-8 h-8 dark:invert-0 invert"
                        />
                        <span className="text-foreground font-medium text-lg">MotorMinds</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto py-8 px-4 max-w-3xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Intake Form Link</CardTitle>
                        {shopName && (
                            <p className="text-sm text-muted-foreground">{shopName}</p>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-medium mb-2">Share this link with your customers:</h3>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-muted rounded-lg p-3 font-mono text-sm break-all">
                                    {customerIntakeLink}
                                </div>
                                <Button
                                    onClick={handleCopyLink}
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-medium">Ways to share:</h3>
                            <div className="grid gap-3">
                                <div className="bg-muted rounded-lg p-4">
                                    <h4 className="font-medium text-sm mb-1">📱 QR Code</h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Display at your front desk for easy scanning
                                    </p>
                                    <Button onClick={handleGenerateQR} variant="outline" size="sm">
                                        <QrCode className="h-4 w-4 mr-2" />
                                        Generate QR Code
                                    </Button>
                                </div>

                                <div className="bg-muted rounded-lg p-4">
                                    <h4 className="font-medium text-sm mb-1">💬 Text/Email</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Copy and send the link to customers via SMS or email
                                    </p>
                                </div>

                                <div className="bg-muted rounded-lg p-4">
                                    <h4 className="font-medium text-sm mb-1">🖥️ Kiosk/Tablet</h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Open the link on a tablet at your reception area
                                    </p>
                                    <Button 
                                        onClick={() => window.open(customerIntakeLink, '_blank')}
                                        variant="outline" 
                                        size="sm"
                                    >
                                        Open Form
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                <strong>💡 Tip:</strong> Customers can fill out this form before arriving or while waiting. 
                                It will create a work order that you can view in Operations → Work Orders.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

