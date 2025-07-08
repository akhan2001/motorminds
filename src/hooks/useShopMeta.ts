import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

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
 * useShopMeta – fetches shop id for current user plus customers (with vehicles)
 *   and active employees. Caches aggressively via React-Query.
 */
export function useShopMeta() {
    return useQuery<ShopMetaResult, Error>({
        queryKey: ['shop-meta'],
        queryFn: async () => {
            // 1) Get current user
            const {
                data: { user },
                error: userErr,
            } = await supabase.auth.getUser()
            if (userErr) throw userErr
            if (!user) throw new Error('Not authenticated')

            // 2) Get shop_id
            const { data: userData, error: shopErr } = await supabase
                .from('users')
                .select('shop_id')
                .eq('id', user.id)
                .single()
            if (shopErr) throw shopErr
            const shopId = userData?.shop_id || null
            if (!shopId) throw new Error('No shop_id found for user')

            // 3) Fetch customers (with vehicles) and employees in parallel
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
        staleTime: 1000 * 60 * 5, // 5 min cache
    })
} 