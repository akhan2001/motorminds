import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type WorkOrder = {
	id: string
	shop_id: string
	customer_id: string
	vehicle_id: string
	status: 'Pending' | 'In Progress' | 'Completed' | 'Waiting on Customer' | 'Cancelled'
	created_at: string
	updated_at: string
	repair_order_details: {
		id: string
		mechanic_id: string | null
		description: string
		cost: number | null
		completed_at: string | null
		labour: string | null
		parts: string | null
		notes: string | null
		mileage: string | null
		task_priority: 'High' | 'Medium' | 'Low'
		Assigned_to: string | null
		parts_cost: number | null
		labour_cost: number | null
	}[]
	customers: {
		id: string
		customer_name: string
		customer_phone: string
		customer_email: string | null
		customer_vehicles: {
			id: string
			year: string | null
			make: string | null
			model: string | null
			vin: string | null
		}[]
	}
}

export function useWorkOrders(shopId: string, limit: number = 100) {
	return useQuery({
		queryKey: ['workOrders', shopId, limit],
		queryFn: async () => {
			const { data, error } = await supabase
				.from('repair_orders')
				.select(`
					id, shop_id, customer_id, vehicle_id, status, created_at, updated_at,
					repair_order_details(id, description, cost, completed_at, labour, parts, notes, mileage, task_priority, Assigned_to, parts_cost, labour_cost),
					customers(
						id, customer_name, customer_phone, customer_email,
						customer_vehicles(id, year, make, model, vin)
						)
					`)
				.eq('shop_id', shopId)
				.order('created_at', { ascending: false })
				.limit(limit)

			if (error) throw error
			return data as WorkOrder[]
		},
		enabled: !!shopId,
	})
}

export function useFilteredWorkOrders(
	workOrders: WorkOrder[] | undefined,
	searchQuery: string,
	statusFilter: string,
	technicianFilter: string,
	dateRangeFilter: string
) {
	if (!workOrders) return {}

	return workOrders.reduce((acc, order) => {
		// Find the matching vehicle using vehicle_id
		const matchingVehicle = order.vehicle_id && order.customers?.customer_vehicles
			? order.customers.customer_vehicles.find(v => v.id === order.vehicle_id)
			: null;
		// Fallback to first vehicle if no matching vehicle found
		const vehicle = matchingVehicle || order.customers.customer_vehicles[0];
		const detail = order.repair_order_details[0]

		const matchesSearch = searchQuery === '' ||
			(vehicle?.vin?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
			order.customers.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			`${vehicle?.year || ''} ${vehicle?.make || ''} ${vehicle?.model || ''}`.toLowerCase().includes(searchQuery.toLowerCase())

		const matchesStatus = statusFilter === 'all' || order.status === statusFilter
		const matchesTechnician = technicianFilter === 'all' ||
			detail?.Assigned_to === technicianFilter
		const matchesDateRange = dateRangeFilter === 'all' // Add date range filtering logic here

		if (matchesSearch && matchesStatus && matchesTechnician && matchesDateRange) {
			if (!acc[order.status]) {
				acc[order.status] = []
			}
			acc[order.status].push(order)
		}
		return acc
	}, {} as Record<string, WorkOrder[]>)
} 