"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown } from "lucide-react"
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
    totalAmount: "",
  })

  // The list of possible customers (each with an array of vehicles)
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([])
  // The staff options for "Assigned To"
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([])
  // Once user chooses a customer, we store that customer's vehicles here for the second dropdown
  const [currentVehicles, setCurrentVehicles] = useState<VehicleData[]>([])
  // The shop ID from the logged-in user
  const [shopId, setShopId] = useState<string>("")

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
      // "Add New Customer"
      setWorkOrderData({
        ...workOrderData,
        customerId: "new",
        customerName: "",
        selectedVehicleId: "new", // default to new vehicle as well
        year: "",
        make: "",
        model: "",
        engineType: "",
        vin: "",
      })
      setCurrentVehicles([])
    } else {
      // existing customer
      const selectedCust = customerOptions.find((opt) => opt.id === value)
      if (selectedCust) {
        setWorkOrderData({
          ...workOrderData,
          customerId: selectedCust.id,
          customerName: selectedCust.name,
          selectedVehicleId: "", // user hasn't chosen which vehicle yet
          // Clear out fields until they pick a vehicle
          year: "",
          make: "",
          model: "",
          engineType: "",
          vin: "",
        })
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
      setWorkOrderData({
        ...workOrderData,
        selectedVehicleId: "new",
        year: "",
        make: "",
        model: "",
        engineType: "",
        vin: "",
      })
    } else {
      // user picked an existing vehicle
      const chosen = currentVehicles.find((v) => v.id === value)
      if (!chosen) return

      setWorkOrderData({
        ...workOrderData,
        selectedVehicleId: chosen.id,
        year: chosen.year || "",
        make: chosen.make || "",
        model: chosen.model || "",
        engineType: chosen.engine_type || "",
        vin: chosen.vin || "",
      })
    }
  }

  // ------------------------------------------------------------------
  // 5) Handling staff
  // ------------------------------------------------------------------
  const handleAssignedToChange = (value: string) => {
    setWorkOrderData({ ...workOrderData, assignedTo: value })
  }

  // ------------------------------------------------------------------
  // 6) Validate & Save the form
  // ------------------------------------------------------------------
  function handleSave() {
    // --------------------
    // 6a) Validate the user's input **before** we create a local "task" or call `onSave`.
    //     You can decide which fields are required. 
    //     Here, we assume they must pick a customer, staff, and have at least 1 piece of vehicle info.
    // --------------------
    if (!workOrderData.customerId && !workOrderData.customerName.trim()) {
      toast.error("Please pick a customer or create a new one before saving.")
      return
    }

    // If you want to ensure they pick or type something for the vehicle:
    // if (!workOrderData.selectedVehicleId && !workOrderData.year && !workOrderData.make) {
    //   alert("Please specify or select a vehicle.")
    //   return
    // }

    // If you want to ensure assigned staff is mandatory:
    // if (!workOrderData.assignedTo) {
    //   toast.error("Please select a staff member.")
    //   return
    // }

    // Amount is required
    if (!workOrderData.totalAmount) {
      toast.error("Please enter an amount.")
      return
    }

    // All good => proceed
    // 6b) Pass data to parent's "onSaveWorkOrder"
    onSave(workOrderData)

    // 6c) Optionally create a local "task" for your UI
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

    // 6d) Close the modal
    onClose()
  }

  // ------------------------------------------------------------------
  // 7) Render
  // ------------------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center overflow-hidden p-4">
      <div className="bg-[#131313] w-full max-w-[90%] xl:max-w-7xl rounded-xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#222222] shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-white text-xl">New Work Order</h2>
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

          {/* Main */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
            <div className="flex gap-4 h-full">
              {/* Left column */}
              <div className="flex-1 space-y-4">
                {/* Customer section */}
                <div className="bg-[#1A1A1A] rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="/placeholder.svg?height=64&width=64" />
                      <AvatarFallback>C</AvatarFallback>
                    </Avatar>
                    <div>
                      {/* 1) Pick customer */}
                      <Select
                        value={workOrderData.customerId}
                        onValueChange={handleCustomerChange}
                      >
                        <SelectTrigger className="w-full bg-transparent border-0 text-white">
                          <SelectValue placeholder="Select Customer" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-[#2d2d2d] text-white">
                          <SelectItem value="new">+ Add New Customer</SelectItem>
                          {customerOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name} <span className="text-gray-400 text-xs">{formatPhoneNumber(option.phone)}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* If new customer, show an input */}
                      {workOrderData.customerId === "new" && (
                        <Input
                          value={workOrderData.customerName}
                          onChange={(e) =>
                            setWorkOrderData({
                              ...workOrderData,
                              customerName: e.target.value,
                            })
                          }
                          placeholder="Enter Customer Name"
                          className="mt-2 bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Task Name */}
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Task Name</Label>
                  <Input
                    value={workOrderData.taskName}
                    onChange={(e) =>
                      setWorkOrderData({ ...workOrderData, taskName: e.target.value })
                    }
                    placeholder="(Optional) e.g. Brakes Replacement"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                  />
                </div>

                {/* If user picked an existing customer (NOT "new"), let them pick from that customer's vehicles */}
                {workOrderData.customerId &&
                  workOrderData.customerId !== "new" && (
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Select Vehicle</Label>
                      <Select
                        value={workOrderData.selectedVehicleId}
                        onValueChange={handleVehicleChange}
                      >
                        <SelectTrigger className="w-full bg-[#1A1A1A] border-0 text-white">
                          <SelectValue placeholder="Pick a vehicle" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-[#2d2d2d] text-white">
                          {currentVehicles.map((v) => {
                            const label = `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`
                            return (
                              <SelectItem key={v.id} value={v.id}>
                                {label.trim() || "Unnamed Vehicle"}
                              </SelectItem>
                            )
                          })}
                          <SelectItem value="new">Add New Vehicle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                {/* Vehicle info (could be from existing or brand-new) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Year</Label>
                    <Input
                      value={workOrderData.year}
                      onChange={(e) =>
                        setWorkOrderData({ ...workOrderData, year: e.target.value })
                      }
                      placeholder="e.g. 2015"
                      className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Make</Label>
                    <Input
                      value={workOrderData.make}
                      onChange={(e) =>
                        setWorkOrderData({ ...workOrderData, make: e.target.value })
                      }
                      placeholder="e.g. Honda"
                      className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Model</Label>
                    <Input
                      value={workOrderData.model}
                      onChange={(e) =>
                        setWorkOrderData({ ...workOrderData, model: e.target.value })
                      }
                      placeholder="e.g. Civic"
                      className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Engine</Label>
                    <Input
                      value={workOrderData.engineType}
                      onChange={(e) =>
                        setWorkOrderData({ ...workOrderData, engineType: e.target.value })
                      }
                      placeholder="e.g. 1.8L i-VTEC"
                      className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">VIN</Label>
                    <Input
                      value={workOrderData.vin}
                      onChange={(e) =>
                        setWorkOrderData({ ...workOrderData, vin: e.target.value })
                      }
                      placeholder="Vehicle VIN"
                      className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Mileage</Label>
                    <Input
                      value={workOrderData.mileage}
                      onChange={(e) =>
                        setWorkOrderData({ ...workOrderData, mileage: e.target.value })
                      }
                      placeholder="Current mileage"
                      className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Task Priority</Label>
                    <Select
                      value={workOrderData.priority}
                      onValueChange={(value: "high" | "medium" | "low") =>
                        setWorkOrderData({ ...workOrderData, priority: value })
                      }
                    >
                      <SelectTrigger className="w-full bg-[#1A1A1A] border-0 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-[#2d2d2d] text-white">
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#e23232]" />
                            High
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#d6cd24]" />
                            Medium
                          </div>
                        </SelectItem>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#1eb386]" />
                            Low
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Assigned To</Label>
                    <Select
                      value={workOrderData.assignedTo}
                      onValueChange={handleAssignedToChange}
                    >
                      <SelectTrigger className="w-full bg-[#1A1A1A] border-0 text-white">
                        <SelectValue placeholder="Select Staff" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-[#2d2d2d] text-white">
                        {staffOptions.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.staff_name} <span className="text-gray-400 text-xs">({staff.role})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Collapsible sections (labor, parts, notes) */}
                <div className="space-y-3">
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#1A1A1A] rounded-md text-white">
                      Labor
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-3 bg-[#1A1A1A] mt-1 rounded-md">
                      <textarea
                        value={workOrderData.labor}
                        onChange={(e) =>
                          setWorkOrderData({ ...workOrderData, labor: e.target.value })
                        }
                        className="w-full h-24 bg-[#222222] text-white p-2 rounded-md resize-none"
                        placeholder="Enter labor details..."
                      />
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#1A1A1A] rounded-md text-white">
                      Parts
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-3 bg-[#1A1A1A] mt-1 rounded-md">
                      <textarea
                        value={workOrderData.parts}
                        onChange={(e) =>
                          setWorkOrderData({ ...workOrderData, parts: e.target.value })
                        }
                        className="w-full h-24 bg-[#222222] text-white p-2 rounded-md resize-none"
                        placeholder="Enter parts details..."
                      />
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#1A1A1A] rounded-md text-white">
                      Notes
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-3 bg-[#1A1A1A] mt-1 rounded-md">
                      <textarea
                        value={workOrderData.notes}
                        onChange={(e) =>
                          setWorkOrderData({ ...workOrderData, notes: e.target.value })
                        }
                        className="w-full h-24 bg-[#222222] text-white p-2 rounded-md resize-none"
                        placeholder="Enter additional notes..."
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Total Amount */}
                <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-md">
                  <span className="text-white">Total Amount ($)</span>
                  <Input
                    type="number"
                    value={workOrderData.totalAmount}
                    onChange={(e) =>
                      setWorkOrderData({ ...workOrderData, totalAmount: e.target.value })
                    }
                    placeholder="Enter amount"
                    className="w-32 bg-[#222222] border-0 text-white placeholder-[#9d9d9d] text-right"
                  />
                </div>
              </div>

              {/* (Optional) Right Column... */}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-[#222222] shrink-0 bg-[#131313]">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="px-8 py-3 h-auto bg-[#1A1A1A] border-[#222222] text-[#9d9d9d] hover:bg-[#222222] hover:text-white rounded-lg"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="px-8 py-3 h-auto bg-[#b22222] hover:bg-[#e23232] text-white rounded-lg"
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
