'use server'

import { supabase } from '@/lib/supabase'
import { WorkOrder } from '@/hooks/useWorkOrders'
import { revalidatePath } from 'next/cache'

export async function getWorkOrder(workOrderId: string): Promise<WorkOrder | null> {
  const { data, error } = await supabase
    .from('repair_orders')
    .select(
      `
        *,
        repair_order_details(*),
        customers(
          *,
          customer_vehicles(*)
        )
      `
    )
    .eq('id', workOrderId)
    .single()

  if (error) {
    console.error('Error fetching work order:', error)
    return null
  }

  return data as WorkOrder
}

export async function createWorkOrder(workOrderData: Partial<WorkOrder>) {
  // Logic to create a work order
  // This will likely involve inserts into `repair_orders`, `repair_order_details`,
  // and potentially `customers` and `customer_vehicles` if they are new.
  console.log('Creating work order with data:', workOrderData)
  // const { data, error } = await supabase.from('repair_orders').insert([workOrderData]).select()
  // if (error) throw error
  revalidatePath('/mechanic-hub')
  // return data
}

export async function updateWorkOrder(
  workOrderId: string,
  workOrderData: Partial<WorkOrder>
) {
  // Logic to update a work order
  console.log(`Updating work order ${workOrderId} with data:`, workOrderData)
  // const { data, error } = await supabase.from('repair_orders').update(workOrderData).eq('id', workOrderId).select()
  // if (error) throw error
  revalidatePath(`/mechanic-hub/work-orders/${workOrderId}`)
  revalidatePath('/mechanic-hub')
  // return data
}

export async function deleteWorkOrder(workOrderId: string) {
  // Logic to delete a work order
  console.log(`Deleting work order ${workOrderId}`)
  // const { data, error } = await supabase.from('repair_orders').delete().eq('id', workOrderId)
  // if (error) throw error
  revalidatePath('/mechanic-hub')
}
