"use client"

import { useState } from 'react'
import { CustomerSearchBar } from '@/components/common/customers/customer-search-bar'
import { SmartCustomerSearchBar } from '@/components/common/customers/smart-customer-search-bar'
import { Customer } from '@/app/(features)/customers/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

/**
 * Test component to verify organization-level customer search functionality
 * This can be used for testing and demonstration purposes
 */
export function OrganizationCustomerSearchTest() {
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [searchMode, setSearchMode] = useState<'shop' | 'organization' | 'smart'>('smart')

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer)
        console.log('Selected customer:', customer)
    }

    const handleCreateNew = () => {
        console.log('Create new customer requested')
        setSelectedCustomer(null)
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Organization-Level Customer Search Test</CardTitle>
                    <CardDescription>
                        Test the organization-wide customer search functionality across different modes
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Search Mode Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Search Mode:</span>
                        <Button
                            variant={searchMode === 'shop' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSearchMode('shop')}
                        >
                            Shop Only
                        </Button>
                        <Button
                            variant={searchMode === 'organization' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSearchMode('organization')}
                        >
                            Organization Wide
                        </Button>
                        <Button
                            variant={searchMode === 'smart' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSearchMode('smart')}
                        >
                            Smart Auto-Detect
                        </Button>
                    </div>

                    <Separator />

                    {/* Search Component */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Customer Search</h3>
                        {searchMode === 'smart' ? (
                            <SmartCustomerSearchBar
                                onSelect={handleCustomerSelect}
                                onCreateNew={handleCreateNew}
                                baseplaceholder="Search customers"
                                className="w-full"
                            />
                        ) : (
                            <CustomerSearchBar
                                onSelect={handleCustomerSelect}
                                onCreateNew={handleCreateNew}
                                placeholder={
                                    searchMode === 'organization' 
                                        ? "Search customers (organization-wide)..."
                                        : "Search customers (shop only)..."
                                }
                                className="w-full"
                                organizationWide={searchMode === 'organization'}
                                showShopNames={searchMode === 'organization'}
                            />
                        )}
                    </div>

                    {/* Selected Customer Display */}
                    {selectedCustomer && (
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">Selected Customer</h3>
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{selectedCustomer.customer_name}</h4>
                                                {selectedCustomer.isFromCurrentShop === false && (
                                                    <Badge variant="secondary">
                                                        {selectedCustomer.shopName || 'Other Shop'}
                                                    </Badge>
                                                )}
                                            </div>
                                            {selectedCustomer.customer_phone && (
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedCustomer.customer_phone}
                                                </p>
                                            )}
                                            {selectedCustomer.customer_email && selectedCustomer.customer_email !== 'NULL' && (
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedCustomer.customer_email}
                                                </p>
                                            )}
                                            {selectedCustomer.customer_address && (
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedCustomer.customer_address}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground">
                                            <p>Shop ID: {selectedCustomer.shop_id}</p>
                                            {selectedCustomer.organization_id && (
                                                <p>Org ID: {selectedCustomer.organization_id}</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">How to Test</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>• <strong>Shop Only:</strong> Search returns only customers from your current shop</p>
                            <p>• <strong>Organization Wide:</strong> Search returns customers from all shops in your organization</p>
                            <p>• <strong>Smart Auto-Detect:</strong> Automatically enables organization search for MSO shops</p>
                            <p>• Customers from other shops will show a badge with the shop name</p>
                            <p>• Try searching for customer names, phone numbers, or email addresses</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
