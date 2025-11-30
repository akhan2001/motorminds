'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SearchBar, FilterBar } from '../../../components/shared'
import { CustomerCard } from '../../../../components/common/customers/customer-card'
import { useAdminContext } from '../../../components/admin-context/useAdminContext'

export default function OrganizationCustomersPage() {
    const { organizationId } = useAdminContext()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedShopId, setSelectedShopId] = useState<string>('all')
    const [page, setPage] = useState(1)

    // Fetch organization shops for filter
    const { data: shops } = useQuery({
        queryKey: ['admin', 'organization', organizationId, 'shops'],
        queryFn: async () => {
            const res = await fetch(`/api/admin/organization/shops`)
            const data = await res.json()
            return data.shops || []
        },
        enabled: !!organizationId
    })

    // Fetch customers
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'organization', organizationId, 'customers', searchTerm, selectedShopId, page],
        queryFn: async () => {
            const params = new URLSearchParams({
                search: searchTerm,
                shopId: selectedShopId,
                page: page.toString(),
                limit: '50'
            })
            const res = await fetch(`/api/admin/organization/customers?${params}`)
            return res.json()
        },
        enabled: !!organizationId
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">
                    Organization Customers
                </h1>
            </div>

            <div className="flex gap-4">
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search customers..."
                    className="flex-1"
                />
                <FilterBar
                    filters={{
                        shop: {
                            label: 'Shop',
                            value: selectedShopId,
                            options: [
                                { value: 'all', label: 'All Shops' },
                                ...(shops || []).map(s => ({
                                    value: s.id,
                                    label: s.shop_name
                                }))
                            ],
                            onChange: setSelectedShopId
                        }
                    }}
                />
            </div>

            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data?.customers?.map((customer: any) => (
                            <CustomerCard
                                key={customer.id}
                                customer={customer}
                                showShopName={true}
                            />
                        ))}
                    </div>
                    {/* Pagination component */}
                </>
            )}
        </div>
    )
}