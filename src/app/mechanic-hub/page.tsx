'use client'

import { Nav } from "@/app/components/nav"
// import { EnhancedWorkOrderList } from "@/components/enhanced-work-order-list"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { CreateWorkOrderButton } from "./components/CreateWorkOrderButton"
// import WorkOrderManager from "./work-orders/WorkOrderManager"

export default function MechanicHubPage() {
	const [shopId, setShopId] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const router = useRouter()

	useEffect(() => {
		async function checkUser() {
			const { data: { user } } = await supabase.auth.getUser()
			if (user) {
				// Get shop_id
				const { data: userData, error: userErr } = await supabase
					.from("users")
					.select("shop_id")
					.eq("id", user.id)
					.single()
				
				if (userErr) {
					console.error("Error fetching user data:", userErr)
					return
				}
				
				if (!userData?.shop_id) {
					console.error("No shop_id found")
					return
				}

				setShopId(userData.shop_id)
			} else {
				router.push("/login")
			}
			setIsLoading(false)
		}

		checkUser()
	}, [router])

	if (isLoading) {
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
		<div className="min-h-screen bg-black text-white">
			<Nav activeLink="Mechanic Hub" />
			<div className="p-8">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
					<div className="flex flex-col">
						<h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">Mechanic Hub</h1>
						<p className="text-gray-400 text-sm sm:text-base">
							View and manage work orders assigned to you. You can also view your own work orders and see the status of your work orders.
						</p>
					</div>
					<div className="flex flex-row gap-4 w-full sm:w-auto justify-end">
						<CreateWorkOrderButton 
							shopId={shopId}
							onWorkOrderCreated={() => {
								// Refresh the work order list if needed
								console.log("Work order created, refreshing list...")
								router.refresh()
							}}
						/>
					</div>
				</div>
				{/* <div className="bg-[#1A1A1A] rounded-lg shadow-lg p-6">
					<EnhancedWorkOrderList 
						shopId={shopId}
						onWorkOrderClick={(workOrder) => {
							console.log('Work order clicked:', workOrder)
							// Handle work order click - e.g., open details modal
						}}
					/>
				</div> */}
				{/* <WorkOrderManager /> */}
			</div>
		</div>
	)
}