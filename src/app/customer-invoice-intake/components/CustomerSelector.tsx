'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CustomerSelectorProps {
    shopId: string
    onCustomerSelect: (customerId: string, customerData: any) => void
    selectedCustomerId: string | null
}

export default function CustomerSelector({ shopId, onCustomerSelect, selectedCustomerId }: CustomerSelectorProps) {
    const [existingCustomers, setExistingCustomers] = useState<any[]>([])
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearchFocused, setIsSearchFocused] = useState(false)

    useEffect(() => {
        async function fetchCustomers() {
            if (!shopId) return
            
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('id, customer_name, customer_email, customer_phone')
                    .eq('shop_id', shopId)
                    .order('customer_name')
                
                if (error) throw error
                setExistingCustomers(data || [])
                setFilteredCustomers(data || [])
            } catch (error) {
                console.error('Error fetching customers:', error)
            }
        }
        
        fetchCustomers()
    }, [shopId])

    const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase()
        setSearchQuery(query)
        
        if (!query) {
            setFilteredCustomers(existingCustomers)
            return
        }
        
        const filtered = existingCustomers.filter(customer => 
            (customer.customer_name && customer.customer_name.toLowerCase().includes(query)) ||
            (customer.customer_phone && customer.customer_phone.includes(query)) ||
            (customer.customer_email && customer.customer_email.toLowerCase().includes(query))
        )
        
        setFilteredCustomers(filtered)
    }

    const handleCustomerClick = async (customerId: string) => {
        try {
            const { data: customer, error } = await supabase
                .from('customers')
                .select('*')
                .eq('id', customerId)
                .single()
            
            if (error) throw error
            onCustomerSelect(customerId, customer)
        } catch (error) {
            console.error('Error fetching customer details:', error)
        }
    }

    return (
        <div className="mb-6">
            <label className="text-gray-300 mb-2 block">Select Existing Customer</label>
            
            <div className="relative mb-4">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Search className="h-4 w-4" />
                </div>
                <Input
                    placeholder="Search customers by name, phone, or email..."
                    value={searchQuery}
                    onChange={handleCustomerSearch}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    className="pl-10 bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222]"
                />
            </div>
            
            <div 
                className={`max-h-[200px] overflow-y-auto border border-[#222] rounded-md transition-all duration-200 ${
                    isSearchFocused || searchQuery ? 'opacity-100 visible' : 'opacity-0 invisible h-0 border-0'
                }`}
            >
                {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(customer => (
                        <div
                            key={customer.id}
                            className={`p-3 cursor-pointer hover:bg-[#1A1A1A] border-b border-[#222] last:border-b-0 ${
                                selectedCustomerId === customer.id ? 'bg-[#222] text-white' : 'text-gray-300'
                            }`}
                            onClick={() => handleCustomerClick(customer.id)}
                        >
                            <div className="font-medium">{customer.customer_name}</div>
                            <div className="text-xs text-gray-400 flex flex-wrap gap-x-4">
                                <span>{customer.customer_phone}</span>
                                {customer.customer_email && <span>{customer.customer_email}</span>}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-gray-400">No customers found</div>
                )}
            </div>
            
            {selectedCustomerId && (
                <div className="mt-4 p-3 bg-[#1A1A1A] rounded-md border border-[#333]">
                    <div className="text-sm text-white font-medium">
                        Selected: {existingCustomers.find(c => c.id === selectedCustomerId)?.customer_name}
                    </div>
                </div>
            )}
        </div>
    )
} 