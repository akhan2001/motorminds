"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { formatPhoneNumber } from "@/app/invoices/utils/invoice-utils"
import { decodeVin } from '@/app/utils/vin-decode'
import { WorkOrderPartsLabor } from "@/app/mechanic-hub/components/work-order-parts-labor"

// Minimal Task interface for local usage
interface Task {
	id: string
	title: string
	vehicle: string
	date: string
	status: "red" | "yellow" | "green"
	column: "todo" | "inProgress" | "done"
	priority: "high" | "medium" | "low"
}

interface WorkOrderFormProps {
	onClose: () => void
	onSave: (data: any) => void
	onAddTask?: (task: Task) => void
}

// Vehicle shape
interface VehicleData {
	id: string
	year?: string
	make?: string
	model?: string
	engine_type?: string
	vin?: string
	color?: string
	mileage?: string
}

// Customer dropdown option
interface CustomerOption {
	id: string
	name: string
	phone: string
	vehicles: VehicleData[] // we store all vehicles for that customer
}

// Staff
interface StaffOption {
	id: string
	staff_name: string
	role: string
}

export function WorkOrderForm({
	onClose,
	onSave,
	onAddTask = () => {},
}: WorkOrderFormProps) {
// ------------------------------------------------------------------
// 1) Local State
// ------------------------------------------------------------------
const [workOrderData, setWorkOrderData] = useState({
	taskName: "",
	customerId: "",
	customerName: "",
	customerPhone: "",
	customerEmail: "",
	customerAddress: "",
	selectedVehicleId: "",
	year: "",
	make: "",
	model: "",
	engineType: "",
	vin: "",
	mileage: "",
	priority: "high" as "high" | "medium" | "low",
	assignedTo: "",
	labor: "",
	parts: "",
	notes: "",
	totalAmount: "0",
	laborCost: "0",
	partsCost: "0",
	color: "",
})

// The list of possible customers (each with an array of vehicles)
const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([])
// The staff options for "Assigned To"
const [staffOptions, setStaffOptions] = useState<{ id: string; staff_name: string; role: string }[]>([])
// Once user chooses a customer, we store that customer's vehicles here for the second dropdown
const [currentVehicles, setCurrentVehicles] = useState<VehicleData[]>([])
// The shop ID from the logged-in user
const [shopId, setShopId] = useState<string>("")

// Add new state for tracking selected item IDs
const [selectedLaborId, setSelectedLaborId] = useState<string | undefined>(undefined);
const [selectedPartsId, setSelectedPartsId] = useState<string | undefined>(undefined);

// ------------------------------------------------------------------
// 2) On mount => fetch user, shop_id, customers, staff
// ------------------------------------------------------------------
useEffect(() => {
	async function fetchShopAndData() {
	// a) get logged-in user
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return

	// b) find the user's shop_id from "users"
	const { data: userData, error: userError } = await supabase
		.from("users")
		.select("shop_id")
		.eq("id", user.id)
		.single()
	if (userError || !userData?.shop_id) {
		console.error("Error fetching shop_id", userError)
		return
	}
	setShopId(userData.shop_id)

	// c) fetch the customers for this shop directly from "customers"
	//    (including their vehicles from "customer_vehicles")
	const { data: customersData, error: customersError } = await supabase
		.from("customers")
		.select("*, customer_vehicles(*)")
		.eq("shop_id", userData.shop_id)
	if (customersError) {
		console.error("Error fetching customers", customersError)
	} else if (customersData) {
		// build an array of { id, name, vehicles[] }
		const options: CustomerOption[] = customersData.map((cust: any) => ({
			id: cust.id,
			name: cust.customer_name,
			phone: cust.customer_phone,
			vehicles: (cust.customer_vehicles || []).map((v: any) => ({
				id: v.id,
				year: v.year,
				make: v.make,
				model: v.model,
				engine_type: v.engine_type,
				vin: v.vin,
			})),
		}))
		setCustomerOptions(options)
	}

	// d) fetch staff from "shop_staff"
	const { data: staffData, error: staffErr } = await supabase
		.from("shop_staff")
		.select("id, staff_name, role")
		.eq("shop_id", userData.shop_id)

	console.log(staffData)

	if (!staffErr && staffData) {
		const staffList: StaffOption[] = staffData.map((s: any) => ({
		id: s.id,
		staff_name: s.staff_name,
		role: s.role,
		}))
		setStaffOptions(staffList)
	}
	}

	fetchShopAndData()
}, [])

// ------------------------------------------------------------------
// 3) Handling a customer pick
// ------------------------------------------------------------------
const handleCustomerChange = (value: string) => {
	if (value === "new") {
	// "Add New Customer" - only reset customer-related fields
	setWorkOrderData(prev => ({
		...prev,
		customerId: "new",
		customerName: "",
		customerPhone: "",
		customerEmail: "",
		customerAddress: "",
		selectedVehicleId: "new", // default to new vehicle as well
		year: "",
		make: "",
		model: "",
		engineType: "",
		vin: "",
	}))
	setCurrentVehicles([])
	} else {
	// existing customer - only update customer-related fields
	const selectedCust = customerOptions.find((opt) => opt.id === value)
	if (selectedCust) {
		setWorkOrderData(prev => ({
		...prev,
		customerId: selectedCust.id,
		customerName: selectedCust.name,
		customerPhone: selectedCust.phone,
		selectedVehicleId: "", // user hasn't chosen which vehicle yet
		// Clear out vehicle fields until they pick a vehicle
		year: "",
		make: "",
		model: "",
		engineType: "",
		vin: "",
		}))
		// store their vehicles for the second dropdown
		setCurrentVehicles(selectedCust.vehicles)
	}
	}
}

// ------------------------------------------------------------------
// 4) Handling a vehicle pick
// ------------------------------------------------------------------
const handleVehicleChange = (value: string) => {
	if (value === "new") {
	// user wants to add new vehicle
	setWorkOrderData(prev => ({
		...prev,
		selectedVehicleId: "new",
		year: "",
		make: "",
		model: "",
		engineType: "",
		vin: "",
		color: "",
		mileage: "",
	}))
	} else {
	// user picked an existing vehicle
	const chosen = currentVehicles.find((v) => v.id === value)
	if (!chosen) return

	setWorkOrderData(prev => ({
		...prev,
		selectedVehicleId: chosen.id,
		year: chosen.year || "",
		make: chosen.make || "",
		model: chosen.model || "",
		engineType: chosen.engine_type || "",
		vin: chosen.vin || "",
		color: chosen.color || "",
		mileage: chosen.mileage || "",
	}))
	}
}

// ------------------------------------------------------------------
// 5) Handling staff
// ------------------------------------------------------------------
const handleAssignedToChange = (value: string) => {
	setWorkOrderData(prev => ({ ...prev, assignedTo: value }))
}

// ------------------------------------------------------------------
// 6) Validate & Save the form
// ------------------------------------------------------------------
function handleSave() {
	// 1. Customer validation
	if (!workOrderData.customerId) {
	toast.error("Please pick a customer or create a new one before saving.")
	return
	}

	// 2. New customer validation
	if (workOrderData.customerId === "new") {
	if (!workOrderData.customerName.trim()) {
		toast.error("Please enter customer name.")
		return
	}
	if (!workOrderData.customerPhone.trim()) {
		toast.error("Please enter customer phone number.")
		return
	}
	if (workOrderData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workOrderData.customerEmail)) {
		toast.error("Please enter a valid email address.")
		return
	}
	}

	// 3. Task name validation
	if (!workOrderData.taskName) {
	toast.error("Please enter a task name.")
	return
	}

	// 4. Vehicle validation
	// If they selected an existing vehicle, we just need to verify they actually picked one
	if (workOrderData.customerId !== "new" && !workOrderData.selectedVehicleId) {
	toast.error("Please select a vehicle or add a new one.")
	return
	}

	// For both new vehicles and selected vehicles, we need at least year, make, and model
	if (!workOrderData.year || !workOrderData.make || !workOrderData.model) {
	toast.error("Please provide vehicle year, make, and model.")
	return
	}

	// 5. Amount validation
	if (!workOrderData.totalAmount) {
	toast.error("Please enter an amount.")
	return
	}

	onSave(workOrderData)

	const newTask: Task = {
	id: Date.now().toString(),
	title:
		workOrderData.taskName ||
		`${workOrderData.year} ${workOrderData.make} ${workOrderData.model}`,
	vehicle: `${workOrderData.year} ${workOrderData.make} ${workOrderData.model}`,
	date: new Date().toISOString().split("T")[0],
	status: "red",
	column: "todo",
	priority: workOrderData.priority,
	}
	onAddTask(newTask)

	onClose()
}


// Add this after your other useEffects
useEffect(() => {
	calculateTotal();
}, [workOrderData.laborCost, workOrderData.partsCost]);

const calculateTotal = () => {
	const labor = parseFloat(workOrderData.laborCost) || 0;
	const parts = parseFloat(workOrderData.partsCost) || 0;
	const total = labor + parts;
	setWorkOrderData(prev => ({
		...prev,
		totalAmount: total.toFixed(2)
	}));
};

// ------------------------------------------------------------------
// 7) Render
// ------------------------------------------------------------------
return (
	<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center overflow-hidden">
		<div className="bg-[#131313] text-white border-none rounded-lg shadow-lg flex max-h-[90vh] w-[95vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw]">
			{/* Main content */}
			<div className="flex-1 flex flex-col">
			<div className="p-4 sm:p-6 overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between pb-4 border-b border-[#222222]">
					<div className="space-y-1">
						<h2 className="text-white text-xl sm:text-2xl">Create New Work Order</h2>
						<p className="text-gray-400 text-xs sm:text-sm">
						Fill in the details below to create a new work order.
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="text-gray-400 hover:text-white"
						onClick={onClose}
					>
						<X className="h-6 w-6" />
					</Button>
				</div>

				<div className="space-y-4 sm:space-y-6 py-4">

					{/* Customer Information */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-white">Customer Information</h3>
						<div className="bg-[#1A1A1A] rounded-xl p-6">
						<div className="flex items-start gap-4">
							<Avatar className="h-16 w-16">
							<AvatarImage src="/placeholder.svg?height=64&width=64" />
							<AvatarFallback className="bg-[#b22222] text-white text-xl">
								{workOrderData.customerName?.split(' ').map(n => n[0]).join('')}
							</AvatarFallback>
							</Avatar>
							<div className="flex-1 space-y-4">
							<div className="flex flex-wrap gap-2">
								<div className="w-full sm:w-auto sm:flex-1">
								<Select
									value={workOrderData.customerId}
									onValueChange={handleCustomerChange}
								>
									<SelectTrigger className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500">
									<SelectValue placeholder="Select Customer" />
									</SelectTrigger>
									<SelectContent className="bg-[#292929] text-white border-[#626262]">
									<SelectItem value="new">+ Add New Customer</SelectItem>
									{customerOptions.map((option) => (
										<SelectItem key={option.id} value={option.id}>
										{option.name} <span className="text-gray-400 text-xs">{formatPhoneNumber(option.phone)}</span>
										</SelectItem>
									))}
									</SelectContent>
								</Select>
								</div>
							</div>

							{workOrderData.customerId === "new" && (
								<div className="space-y-2 mt-2 p-3 border border-[#626262] rounded-md">
								<Input
									className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500"
									placeholder="Customer Name"
									value={workOrderData.customerName}
									onChange={(e) =>
									setWorkOrderData(prev => ({ ...prev, customerName: e.target.value }))
									}
									required
								/>
								<Input
									className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500"
									placeholder="Phone Number"
									value={workOrderData.customerPhone}
									onChange={(e) =>
									setWorkOrderData(prev => ({ ...prev, customerPhone: e.target.value }))
									}
									required
								/>
								<Input
									className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500"
									placeholder="Email Address"
									type="email"
									value={workOrderData.customerEmail}
									onChange={(e) =>
									setWorkOrderData(prev => ({ ...prev, customerEmail: e.target.value }))
									}
								/>
								<Input
									className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500"
									placeholder="Address"
									value={workOrderData.customerAddress}
									onChange={(e) =>
									setWorkOrderData(prev => ({ ...prev, customerAddress: e.target.value }))
									}
								/>
								</div>
							)}
							</div>
						</div>
						</div>
					</div>

					{/* Vehicle Information */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-white">Vehicle Information</h3>
						<div className="bg-[#1A1A1A] rounded-xl p-6">
						{workOrderData.customerId && workOrderData.customerId !== "new" && (
							<div className="mb-4">
							<Select
								value={workOrderData.selectedVehicleId}
								onValueChange={handleVehicleChange}
							>
								<SelectTrigger className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500">
								<SelectValue placeholder="Select a vehicle" />
								</SelectTrigger>
								<SelectContent className="bg-[#292929] text-white border-[#626262]">
								{currentVehicles.map((v) => (
									<SelectItem key={v.id} value={v.id}>
									{`${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim() || "Unnamed Vehicle"}
									</SelectItem>
								))}
								<SelectItem value="new">+ Add New Vehicle</SelectItem>
								</SelectContent>
							</Select>
							</div>
						)}

						<div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
							<div className="space-y-1.5">
							<Label className="text-gray-400">Year</Label>
							<Input
								value={workOrderData.year}
								onChange={(e) =>
								setWorkOrderData(prev => ({ ...prev, year: e.target.value }))
								}
								className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
								placeholder="e.g. 2015"
								disabled={!workOrderData.customerId}
							/>
							</div>

							<div className="space-y-1.5">
							<Label className="text-gray-400">Make</Label>
							<Input
								value={workOrderData.make}
								onChange={(e) =>
								setWorkOrderData(prev => ({ ...prev, make: e.target.value }))
								}
								className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
								placeholder="e.g. Honda"
								disabled={!workOrderData.customerId}
							/>
							</div>

							<div className="space-y-1.5">
							<Label className="text-gray-400">Model</Label>
							<Input
								value={workOrderData.model}
								onChange={(e) =>
								setWorkOrderData(prev => ({ ...prev, model: e.target.value }))
								}
								className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
								placeholder="e.g. Civic"
								disabled={!workOrderData.customerId}
							/>
							</div>

							<div className="space-y-1.5">
							<Label className="text-gray-400">Engine</Label>
							<Input
								value={workOrderData.engineType}
								onChange={(e) =>
								setWorkOrderData(prev => ({ ...prev, engineType: e.target.value }))
								}
								className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
								placeholder="e.g. 1.8L i-VTEC"
								disabled={!workOrderData.customerId}
							/>
							</div>

							<div className="space-y-1.5">
							<Label className="text-gray-400">Color</Label>
							<Input
								value={workOrderData.color || ""}
								onChange={(e) =>
								setWorkOrderData(prev => ({ ...prev, color: e.target.value }))
								}
								className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
								placeholder="e.g. Silver"
								disabled={!workOrderData.customerId}
							/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3 mt-3">
							<div className="space-y-1.5">
							<Label className="text-gray-400">VIN</Label>
							<div className="flex gap-2">
								<Input
								value={workOrderData.vin}
								onChange={(e) =>
									setWorkOrderData(prev => ({ 
									...prev, 
									vin: e.target.value.toUpperCase() 
									}))
								}
								className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 flex-1"
								placeholder="Enter VIN number"
								disabled={!workOrderData.customerId}
								/>
								<Button
								type="button"
								variant="outline"
								className="bg-[#292929] text-white border-[#626262] hover:bg-[#626262] hover:text-white"
								onClick={async () => {
									try {
									const vehicleData = await decodeVin(workOrderData.vin);
									if (vehicleData) {
										setWorkOrderData(prev => ({
										...prev,
										year: vehicleData.year,
										make: vehicleData.make,
										model: vehicleData.model,
										engineType: vehicleData.engine,
										}));
										toast.success("Vehicle information decoded successfully");
									}
									} catch (error) {
									toast.error(error instanceof Error ? error.message : 'Failed to decode VIN');
									}
								}}
								disabled={!workOrderData.customerId || !workOrderData.vin}
								>
								<SearchIcon className="h-4 w-4" />
								</Button>
							</div>
							</div>

							<div className="space-y-1.5">
							<Label className="text-gray-400">Mileage</Label>
							<Input
								value={workOrderData.mileage}
								onChange={(e) =>
								setWorkOrderData(prev => ({ ...prev, mileage: e.target.value }))
								}
								className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
								placeholder="e.g. 45,000 miles"
								disabled={!workOrderData.customerId}
							/>
							</div>
						</div>
						</div>
					</div>

					{/* Work Order Details */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-white">Work Order Details</h3>
						<div className="bg-[#1A1A1A] rounded-xl p-6">
						<div className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 gap-y-3">
							<Label className="text-gray-400 self-center sm:col-span-1">Title</Label>
							<div className="sm:col-span-3">
								<Input
									value={workOrderData.taskName}
									onChange={(e) =>
									setWorkOrderData(prev => ({ 
										...prev, 
										taskName: e.target.value
										.split(' ')
										.map(word => word.charAt(0).toUpperCase() + word.slice(1))
										.join(' ')
									}))
									}
									className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 w-full"
									placeholder="Enter work order title"
									disabled={!workOrderData.customerId}
								/>
							</div>

							<Label className="text-gray-400 self-center sm:col-span-1">Labor</Label>
							<div className="flex flex-row gap-2 sm:col-span-3">
								<Input
									value={workOrderData.labor}
									onChange={(e) =>
									setWorkOrderData(prev => ({ ...prev, labor: e.target.value }))
									}
									className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 w-full"
									placeholder="Enter labor details"
									disabled={!workOrderData.customerId}
								/>
								<span className="text-gray-300 text-md self-center">$</span>
								<Input
									type="number"
									value={workOrderData.laborCost}
									onChange={(e) =>
									setWorkOrderData(prev => ({ ...prev, laborCost: e.target.value || "0" }))
									}
									className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 w-[150px]"
									placeholder="0.00"
									disabled={!workOrderData.customerId}
								/>
							</div>

							<Label className="text-gray-400 self-center sm:col-span-1">Assigned To</Label>
							<div className="sm:col-span-3">
								<Select 
									value={workOrderData.assignedTo} 
									onValueChange={handleAssignedToChange}
									disabled={!workOrderData.customerId}
								>
									<SelectTrigger className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 w-full">
										<SelectValue placeholder="Select a staff member" />
									</SelectTrigger>
									<SelectContent className="bg-[#292929] text-white border-[#626262]">
										<SelectItem value="none">None</SelectItem>
										{staffOptions.map((staff) => (
											<SelectItem key={staff.id} value={staff.id}>
												{staff.staff_name} <span className="text-gray-400 text-xs">({staff.role})</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<Label className="text-gray-400 self-center sm:col-span-1">Parts</Label>
							<div className="flex flex-row gap-2 sm:col-span-3">
								<Input
									value={workOrderData.parts}
									onChange={(e) =>
									setWorkOrderData(prev => ({ ...prev, parts: e.target.value }))
									}
									className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 w-full"
									placeholder="Enter parts details"
									disabled={!workOrderData.customerId}
								/>
								<span className="text-gray-300 text-md self-center">$</span>
								<Input
									type="number"
									value={workOrderData.partsCost}
									onChange={(e) =>
									setWorkOrderData(prev => ({ ...prev, partsCost: e.target.value || "0" }))
									}
									className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 w-[150px]"
									placeholder="0.00"
									disabled={!workOrderData.customerId}
								/>
							</div>

							<Label className="text-gray-400 self-center sm:col-span-1">Notes</Label>
							<div className="sm:col-span-3">
								<Input
									value={workOrderData.notes}
									onChange={(e) =>
									setWorkOrderData(prev => ({ ...prev, notes: e.target.value }))
									}
									className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 w-full"
									placeholder="Enter additional notes"
									disabled={!workOrderData.customerId}
								/>
							</div>

							<Label className="text-gray-400 self-center sm:col-span-1">Total Amount</Label>
							<div className="flex flex-row gap-2 items-center sm:col-span-3">
								<span className="text-white text-xl">$ {workOrderData.totalAmount}</span>
							</div>
						</div>
						</div>
					</div>

				</div>
			</div>

			{/* Footer - moved inside the main content div */}
			<div className="p-4 sm:p-6 mt-auto border-t border-[#222222]">
				<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
				<Button
					variant="outline"
					onClick={onClose}
					className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white w-full sm:w-auto order-2 sm:order-1"
				>
					Cancel
				</Button>
				<Button
					onClick={handleSave}
					className="bg-[#22C55E] text-white hover:bg-[#22C55E]/80 w-full sm:w-auto order-1 sm:order-2"
					disabled={!workOrderData.customerId}
				>
					Create Work Order
				</Button>
				</div>
			</div>
			</div>

			{/* Labor & Parts Section */}
			<WorkOrderPartsLabor
			onUpdateTotal={(total) => {
				setWorkOrderData(prev => ({
				...prev,
				totalAmount: total.toFixed(2)
				}))
			}}
			onSelectLabor={(description, cost, id) => {
				setWorkOrderData(prev => ({
				...prev,
				labor: description,
				laborCost: cost.toString()
				}));
				setSelectedLaborId(id);
				toast.success(`Added labor: ${description}`);
			}}
			onDeselectLabor={() => {
				setWorkOrderData(prev => ({
				...prev,
				labor: "",
				laborCost: "0"
				}));
				setSelectedLaborId(undefined);
				toast.info("Removed labor selection");
			}}
			onSelectParts={(description, cost, id) => {
				setWorkOrderData(prev => ({
				...prev,
				parts: description,
				partsCost: cost.toString()
				}));
				setSelectedPartsId(id);
				toast.success(`Added parts: ${description}`);
			}}
			onDeselectParts={() => {
				setWorkOrderData(prev => ({
				...prev,
				parts: "",
				partsCost: "0"
				}));
				setSelectedPartsId(undefined);
				toast.info("Removed parts selection");
			}}
			selectedLaborId={selectedLaborId}
			selectedPartsId={selectedPartsId}
			/>
		</div>
	</div>
	)
}
