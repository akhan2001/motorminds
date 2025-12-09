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

	const updateWorkOrderStatus = async (updatedTask: WorkOrder) => {
		// Optimistically update the local data
		mutate(
			(currentData: WorkOrder[] | undefined) => {
				if (!currentData) return [];
				return currentData.map(order =>
					order.id === updatedTask.id ? { ...order, ...updatedTask } : order
				);
			},
			false // do not revalidate yet
		);

		try {
			// Attempt to update the database
			const { error: orderError } = await supabase
				.from('repair_orders')
				.update({ status: updatedTask.status })
				.eq('id', updatedTask.id);
			if (orderError) throw orderError;

			if (updatedTask.repair_order_details && updatedTask.repair_order_details.length > 0) {
				const detail: any = updatedTask.repair_order_details[0];
				const { id, ...detailToUpdate } = detail;
				// The repair_order_id is not part of the update payload for the details table
				delete detailToUpdate.repair_order_id;

				const { error: detailError } = await supabase
					.from('repair_order_details')
					.update(detailToUpdate)
					.eq('id', detail.id);
				if (detailError) throw detailError;
			}
		} catch (error) {
			// If the update fails, revert the local data and re-throw the error
			mutate();
			throw error;
		}

		// After a successful update, revalidate to ensure data is in sync
		mutate();
	};

	return {
		data,
		isLoading,
		error,
		mutate,
		updateWorkOrderStatus,
	}
}