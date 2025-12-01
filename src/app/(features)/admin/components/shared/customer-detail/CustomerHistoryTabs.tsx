'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, History, Wrench, CalendarDays, Receipt } from 'lucide-react'
import { WorkOrdersList } from './WorkOrdersList'
import { AppointmentsList } from './AppointmentsList'
import { InvoicesList } from './InvoicesList'
import type { CustomerHistory } from './types'

interface CustomerHistoryTabsProps {
    customerHistory?: CustomerHistory | null
    loading?: boolean
}

export const CustomerHistoryTabs: React.FC<CustomerHistoryTabsProps> = ({
    customerHistory,
    loading = false
}) => {
    return (
        <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                    <History className="h-5 w-5" />
                    Customer History
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Tabs defaultValue="work-orders" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="work-orders" className="flex items-center gap-2">
                                <Wrench className="h-4 w-4" />
                                Work Orders
                            </TabsTrigger>
                            <TabsTrigger value="appointments" className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                Appointments
                            </TabsTrigger>
                            <TabsTrigger value="invoices" className="flex items-center gap-2">
                                <Receipt className="h-4 w-4" />
                                Invoices
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="work-orders" className="mt-4">
                            <WorkOrdersList workOrders={customerHistory?.workOrders || []} />
                        </TabsContent>

                        <TabsContent value="appointments" className="mt-4">
                            <AppointmentsList appointments={customerHistory?.appointments || []} />
                        </TabsContent>

                        <TabsContent value="invoices" className="mt-4">
                            <InvoicesList invoices={customerHistory?.invoices || []} />
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>
        </Card>
    )
}
