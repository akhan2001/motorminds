'use client'

import { Nav } from "@/app/components/nav"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { CreateWorkOrderButton } from "./components/CreateWorkOrderButton"
import { WorkOrderList } from './components/WorkOrderList'
import { useWorkOrders, type WorkOrder } from "@/hooks/use-work-orders"
import { TaskDetailsModal } from "@/components/task-details-modal"
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export default function MechanicHubPage() {
	const [shopId, setShopId] = useState<string | null>(null)
	const [isCheckingUser, setIsCheckingUser] = useState(true)
	const router = useRouter()
	const [selectedTask, setSelectedTask] = useState<WorkOrder | null>(null)
    const queryClient = useQueryClient();

	useEffect(() => {
		async function checkUser() {
			const { data: { user } } = await supabase.auth.getUser()
			if (user) {
				const { data: userData, error: userErr } = await supabase
					.from("users")
					.select("shop_id")
					.eq("id", user.id)
					.single()
				
				if (userErr || !userData?.shop_id) {
					console.error("Error fetching user data or no shop_id found:", userErr)
				} else {
					setShopId(userData.shop_id)
				}
			} else {
				router.push("/login")
			}
			setIsCheckingUser(false)
		}

		checkUser()
	}, [router])

	const { 
		data: workOrders, 
		isLoading: isLoadingWorkOrders, 
		error, 
		mutate,
		updateWorkOrderStatus,
	} = useWorkOrders(shopId || '')

	const handleWorkOrderClick = (order: WorkOrder) => {
        setSelectedTask(order);
    };

    const handleCloseModal = () => {
        setSelectedTask(null);
    };

	const handleSave = async (updatedTaskFromModal: any) => {
		if (!updateWorkOrderStatus || !selectedTask) return;
		
		// Manually construct the final, correctly-shaped object for the update
		const finalUpdatedTask = {
			...selectedTask, // Start with the original, full work order
			status: updatedTaskFromModal.status, // Apply the new status
			repair_order_details: updatedTaskFromModal.repair_order_details, // Apply the new details
		};

        try {
			await updateWorkOrderStatus(finalUpdatedTask);
            toast.success("Work order updated successfully!");
        } catch (error: any) {
            toast.error(`Failed to update work order: ${error.message}`);
        } finally {
            setSelectedTask(null);
        }
    };


	if (isCheckingUser) {
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b22222]"></div>
			</div>
		)
	}

	if (!shopId) {
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<div className="text-white">No shop ID found. Please contact support.</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col min-h-screen bg-black text-white">
			<Nav />
			<main className="flex-1 px-4 py-8 max-w-[1400px] mx-auto w-full">
				
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold text-white mb-2">Mechanics Hub</h1>
						<p className="text-gray-400">Complete overview of your shop's mechanics hub</p>
					</div>
					<div>
						<CreateWorkOrderButton shopId={shopId} onWorkOrderCreated={mutate} />
					</div>
				</div>

				<WorkOrderList 
					shopId={shopId} 
					workOrders={workOrders} 
					isLoading={isLoadingWorkOrders} 
					error={error} 
					onWorkOrderClick={handleWorkOrderClick}
				/>
				{selectedTask && shopId && (
                    <TaskDetailsModal
                        task={selectedTask as any}
                        onClose={handleCloseModal}
                        onSave={handleSave}
                        shopId={shopId}
                    />
                )}
			</main>
		</div>
	)
}