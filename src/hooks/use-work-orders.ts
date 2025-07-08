import { supabase } from '@/lib/supabase'
import useSWR from 'swr'

export interface RepairOrderDetail {
    id: string;
    task_priority: 'High' | 'Medium' | 'Low';
    description: string;
    cost: number;
    Assigned_to: string;
    labour: string;
    completed_at: string;
    notes: string;
}

export interface CustomerVehicle {
    id: string;
    year: string;
    make: string;
    model: string;
    vin: string;
}

export interface Customer {
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    customer_vehicles: CustomerVehicle[];
}

export interface WorkOrder {
    id: string;
    status: string;
    created_at: string;
    customers: Customer;
    vehicle_id: string;
    repair_order_details: RepairOrderDetail[];
    work_order_name: string;
    priority: 'High' | 'Medium' | 'Low';
}

const fetchWorkOrders = async (shopId: string): Promise<WorkOrder[]> => {
  const { data, error } = await supabase
    .from('repair_orders')
    .select(
      `
      *,
      customers (
        *,
        customer_vehicles (
          *
        )
      ),
      repair_order_details (
        *
      )
    `
    )
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching work orders:', error)
    throw new Error(error.message)
  }

  // The RPC might return a different shape, so we adapt it.
  // This is a common pattern when dealing with complex joins in Supabase.
  return (data as any[]).map(wo => ({
      ...wo,
      work_order_name: wo.repair_order_details?.[0]?.description || 'New Work Order',
      priority: wo.repair_order_details?.[0]?.task_priority || 'Medium',
      customer_name: wo.customers?.customer_name,
      vehicle_year: wo.customers?.customer_vehicles?.[0]?.year,
      vehicle_make: wo.customers?.customer_vehicles?.[0]?.make,
      vehicle_model: wo.customers?.customer_vehicles?.[0]?.model,
  }));
}

export const useWorkOrders = (shopId: string) => {
  const { data, error, isLoading, mutate } = useSWR<WorkOrder[]>(shopId ? `work_orders_${shopId}` : null, () => fetchWorkOrders(shopId))

  return {
    data,
    isLoading,
    error,
    mutate,
  }
} 