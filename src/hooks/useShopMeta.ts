import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthProvider'

export interface CustomerVehicle {
    id: string
    customer_id: string
    year: string | null
    make: string | null
    model: string | null
    vin: string | null
    engine_type?: string | null
    color?: string | null
    mileage?: string | null
    license_plate?: string | null
}

export interface Customer {
    id: string
    customer_name: string
    customer_phone: string
    customer_email: string | null
    customer_vehicles: CustomerVehicle[]
}

export interface Employee {
    id: string
    first_name: string | null
    last_name: string | null
    role: string | null
}

interface ShopMetaResult {
    shopId: string | null
    customers: Customer[]
    vehicles: CustomerVehicle[]
    employees: Employee[]
}

/**
 * useShopMeta – fetches customers (with vehicles) and active employees
 * Uses centralized auth context for shopId - no redundant getUser() call
 * Caches aggressively via React-Query.
 */
export function useShopMeta() {
    const { shopId } = useAuth()

    return useQuery<ShopMetaResult, Error>({
        queryKey: ['shop-meta', shopId],
        queryFn: async () => {
            if (!shopId) throw new Error('No shop_id found for user')

            // Fetch customers (with vehicles) and employees in parallel
            const [custRes, empRes] = await Promise.all([
                supabase
                    .from('customers')
                    .select('*, customer_vehicles(*)')
                    .eq('shop_id', shopId),
                supabase
                    .from('employees')
                    .select('*')
                    .eq('shop_id', shopId)
                    .is('termination_date', null),
            ])

            if (custRes.error) throw custRes.error
            if (empRes.error) throw empRes.error

            const customers = (custRes.data || []) as Customer[]
            const employees = (empRes.data || []) as Employee[]
            const vehicles: CustomerVehicle[] = customers.flatMap((c) =>
                c.customer_vehicles.map(v => ({...v, customer_id: c.id}))
            )

            return { shopId, customers, vehicles, employees }
        },
        enabled: !!shopId, // Only run query if shopId exists
        staleTime: 1000 * 60 * 5, // 5 min cache
    })
} 