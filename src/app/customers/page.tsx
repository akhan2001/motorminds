'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { CustomerDashboard } from './components/customer-dashboard'
import { PageLoading, PageAuthRequired } from '@/components/common/feedback/page-states'
import { ScaffoldContainer } from '@/components/layout'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerForm } from './components/customer-form'

export default function CustomersPage() {
    const { user, shopId, isLoading } = useAuth()
    const [isAdding, setIsAdding] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const handleCustomerAdded = () => {
        setIsAdding(false)
        setRefreshKey(prev => prev + 1)
    }

    if (isLoading) {
        return <PageLoading title="Loading Customers" description="Fetching customer data..." />
    }

    if (!shopId || !user) {
        return <PageAuthRequired resource="customers" />
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Fixed Header */}
            <div className="bg-background border-b border-border flex-shrink-0">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Manage your customer base and track their activity
                            </p>
                        </div>
                        <Button 
                            className="bg-red-600 hover:bg-red-700 text-white" 
                            onClick={() => setIsAdding(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Customer
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                <ScaffoldContainer size="large" className="py-6">
                    <CustomerDashboard 
                        shopId={shopId} 
                        user={user} 
                        refreshKey={refreshKey}
                        hideHeader={true}
                    />
                </ScaffoldContainer>
            </div>

            {/* Add Customer Form */}
            {isAdding && (
                <CustomerForm 
                    onClose={handleCustomerAdded} 
                    shopId={shopId} 
                    isOpen={isAdding} 
                />
            )}
        </div>
    )
}