'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
    BarChart3, 
    Calendar, 
    Download, 
    FileText, 
    Building2, 
    Users, 
    MessageSquare,
    Wrench,
    Receipt,
    Bot,
    Loader2
} from 'lucide-react'
import { Nav } from '@/components/navigation/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Slash } from "lucide-react"
import Link from 'next/link'
import { toast } from 'sonner'
import AdminNav from '../../components/AdminNav'
import type { UsageMetrics, ShopMetric } from '../../lib/usage-metrics-service'

interface UsageMetricsPageState {
    startDate: string
    endDate: string
    metrics: UsageMetrics | null
    loading: boolean
    downloading: boolean
}

export default function UsageMetricsPage() {
    const [state, setState] = useState<UsageMetricsPageState>({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        endDate: new Date().toISOString().split('T')[0], // today
        metrics: null,
        loading: false,
        downloading: false
    })

    const fetchMetrics = async () => {
        if (!state.startDate || !state.endDate) {
            toast.error('Please select both start and end dates')
            return
        }

        if (new Date(state.startDate) > new Date(state.endDate)) {
            toast.error('Start date must be before end date')
            return
        }

        setState(prev => ({ ...prev, loading: true }))

        try {
            const params = new URLSearchParams({
                startDate: state.startDate,
                endDate: state.endDate
            })

            const response = await fetch(`/api/admin/usage-metrics?${params}`)
            const data = await response.json()

            if (response.ok) {
                setState(prev => ({ ...prev, metrics: data.metrics }))
                toast.success('Usage metrics loaded successfully')
            } else {
                toast.error(data.error || 'Failed to fetch usage metrics')
            }
        } catch (error) {
            console.error('Error fetching usage metrics:', error)
            toast.error('Failed to fetch usage metrics')
        } finally {
            setState(prev => ({ ...prev, loading: false }))
        }
    }

    const downloadReport = async (format: 'text' | 'json' = 'text') => {
        if (!state.metrics) {
            toast.error('No metrics data available to download')
            return
        }

        setState(prev => ({ ...prev, downloading: true }))

        try {
            const response = await fetch('/api/admin/usage-metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    startDate: state.startDate,
                    endDate: state.endDate,
                    format
                })
            })

            if (response.ok) {
                if (format === 'text') {
                    const textContent = await response.text()
                    const blob = new Blob([textContent], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `usage-metrics-${state.startDate}-to-${state.endDate}.txt`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                } else {
                    const jsonData = await response.json()
                    const blob = new Blob([JSON.stringify(jsonData.metrics, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `usage-metrics-${state.startDate}-to-${state.endDate}.json`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                }
                toast.success(`Report downloaded as ${format.toUpperCase()}`)
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to download report')
            }
        } catch (error) {
            console.error('Error downloading report:', error)
            toast.error('Failed to download report')
        } finally {
            setState(prev => ({ ...prev, downloading: false }))
        }
    }

    const renderShopMetrics = (title: string, metrics: ShopMetric[], icon: React.ReactNode) => (
        <Card>
            <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                    {icon}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {metrics.length > 0 ? (
                    <div className="space-y-2">
                        {metrics.slice(0, 10).map((shop, index) => (
                            <div key={shop.shopId} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                <span className="text-foreground text-sm">{shop.shopName}</span>
                                <span className="text-foreground font-medium">{shop.count}</span>
                            </div>
                        ))}
                        {metrics.length > 10 && (
                            <div className="text-xs text-muted-foreground text-center pt-2">
                                And {metrics.length - 10} more shops...
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-4 text-muted-foreground">
                        No data available for this period
                    </div>
                )}
            </CardContent>
        </Card>
    )

    return (
        <div className="h-screen flex flex-col bg-background">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-7xl mx-auto w-full">
                        {/* Breadcrumb Navigation */}
                        <Breadcrumb className="mb-4">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                                            Admin
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="text-muted-foreground" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-foreground">
                                        Usage Metrics
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Admin Navigation */}
                        <AdminNav />

                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">
                                    Usage Metrics
                                </h1>
                                <p className="text-muted-foreground">
                                    Comprehensive platform usage insights across all shops
                                </p>
                            </div>
                        </div>

                        {/* Date Range Selection */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Date Range Selection
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <Label className="text-muted-foreground">Start Date</Label>
                                        <Input
                                            type="date"
                                            value={state.startDate}
                                            onChange={(e) => setState(prev => ({ ...prev, startDate: e.target.value }))}
                                            className="bg-background border-border text-foreground"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-muted-foreground">End Date</Label>
                                        <Input
                                            type="date"
                                            value={state.endDate}
                                            onChange={(e) => setState(prev => ({ ...prev, endDate: e.target.value }))}
                                            className="bg-background border-border text-foreground"
                                        />
                                    </div>
                                    <Button
                                        onClick={fetchMetrics}
                                        disabled={state.loading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {state.loading ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <BarChart3 className="h-4 w-4 mr-2" />
                                        )}
                                        Generate Report
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Metrics Display */}
                        {state.metrics && (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-5 w-5 text-blue-500" />
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Total Shops</div>
                                                    <div className="text-xl font-bold text-foreground">
                                                        {state.metrics.shopOnboardingSummary.totalShops}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Receipt className="h-5 w-5 text-green-500" />
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Total Invoices</div>
                                                    <div className="text-xl font-bold text-foreground">
                                                        {state.metrics.invoices.reduce((sum, shop) => sum + shop.count, 0)}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Wrench className="h-5 w-5 text-orange-500" />
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Total Work Orders</div>
                                                    <div className="text-xl font-bold text-foreground">
                                                        {state.metrics.workOrders.reduce((sum, shop) => sum + shop.count, 0)}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Bot className="h-5 w-5 text-purple-500" />
                                                <div>
                                                    <div className="text-sm text-muted-foreground">MIA Messages</div>
                                                    <div className="text-xl font-bold text-foreground">
                                                        {state.metrics.miadiagnostics.totalMessages}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Download Actions */}
                                <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle className="text-foreground flex items-center gap-2">
                                            <Download className="h-5 w-5" />
                                            Download Report
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={() => downloadReport('text')}
                                                disabled={state.downloading}
                                                variant="outline"
                                            >
                                                {state.downloading ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <FileText className="h-4 w-4 mr-2" />
                                                )}
                                                Download as TXT
                                            </Button>
                                            <Button
                                                onClick={() => downloadReport('json')}
                                                disabled={state.downloading}
                                                variant="outline"
                                            >
                                                {state.downloading ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Download className="h-4 w-4 mr-2" />
                                                )}
                                                Download as JSON
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Detailed Metrics */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {renderShopMetrics(
                                        'Invoices by Shop',
                                        state.metrics.invoices,
                                        <Receipt className="h-5 w-5 text-green-500" />
                                    )}
                                    {renderShopMetrics(
                                        'Work Orders by Shop',
                                        state.metrics.workOrders,
                                        <Wrench className="h-5 w-5 text-orange-500" />
                                    )}
                                    {renderShopMetrics(
                                        'Appointments by Shop',
                                        state.metrics.appointments,
                                        <Calendar className="h-5 w-5 text-blue-500" />
                                    )}
                                    {renderShopMetrics(
                                        'SMS Messages by Shop',
                                        state.metrics.smsMessages,
                                        <MessageSquare className="h-5 w-5 text-cyan-500" />
                                    )}
                                </div>

                                {/* MIA Diagnostics */}
                                <Card className="mt-6">
                                    <CardHeader>
                                        <CardTitle className="text-foreground flex items-center gap-2">
                                            <Bot className="h-5 w-5 text-purple-500" />
                                            MIA Diagnostics
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="bg-muted/50 p-4 rounded">
                                                <div className="text-sm text-muted-foreground">Total Messages</div>
                                                <div className="text-2xl font-bold text-foreground">
                                                    {state.metrics.miadiagnostics.totalMessages}
                                                </div>
                                            </div>
                                            <div className="bg-muted/50 p-4 rounded">
                                                <div className="text-sm text-muted-foreground">Unique Sessions</div>
                                                <div className="text-2xl font-bold text-foreground">
                                                    {state.metrics.miadiagnostics.uniqueSessions}
                                                </div>
                                            </div>
                                        </div>
                                        {state.metrics.miadiagnostics.messagesByShop.length > 0 && (
                                            <div>
                                                <h4 className="text-foreground font-medium mb-3">Messages by Shop</h4>
                                                <div className="space-y-2">
                                                    {state.metrics.miadiagnostics.messagesByShop.slice(0, 10).map((shop) => (
                                                        <div key={shop.shopId} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                                            <span className="text-foreground text-sm">{shop.shopName}</span>
                                                            <span className="text-foreground font-medium">{shop.count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {/* Empty State */}
                        {!state.metrics && !state.loading && (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-foreground mb-2">
                                        No Metrics Data
                                    </h3>
                                    <p className="text-muted-foreground mb-4">
                                        Select a date range and click "Generate Report" to view usage metrics
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
