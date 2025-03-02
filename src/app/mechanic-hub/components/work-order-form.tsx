"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, ArrowRight } from "lucide-react"
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

interface CustomerOption {
  id: string
  name: string
  vehicle?: {
    year?: string
    make?: string
    model?: string
    engine_type?: string
    vin?: string
  }
}

interface StaffOption {
  id: string
  staff_name: string
}

export function WorkOrderForm({
  onClose,
  onSave,
  onAddTask = () => {},
}: WorkOrderFormProps) {
  const [workOrderData, setWorkOrderData] = useState({
    taskName: "",
    customerId: "",
    customerName: "",
    description: "",
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

  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([])
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([])
  const [shopId, setShopId] = useState<string>("")

  useEffect(() => {
    async function fetchShopAndData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
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

      const { data: shopCustomersData, error: customersError } = await supabase
        .from("shop_customers")
        .select(`
          *,
          customers(*, customer_vehicles(*))
        `)
        .eq("shop_id", userData.shop_id)
      if (!customersError && shopCustomersData) {
        const options: CustomerOption[] = shopCustomersData.map((row: any) => ({
          id: row.customers.id,
          name: row.customers.customer_name,
          vehicle: row.customers.customer_vehicles?.[0] || {},
        }))
        setCustomerOptions(options)
      }

      const { data: staffData, error: staffErr } = await supabase
        .from("shop_staff")
        .select("id, staff_name")
        .eq("shop_id", userData.shop_id)
      if (!staffErr && staffData) {
        const staffList: StaffOption[] = staffData.map((s: any) => ({
          id: s.id,
          staff_name: s.staff_name,
        }))
        setStaffOptions(staffList)
      }
    }
    fetchShopAndData()
  }, [])

  const handleCustomerChange = (value: string) => {
    if (value === "new") {
      setWorkOrderData({
        ...workOrderData,
        customerId: "new",
        customerName: "",
        year: "",
        make: "",
        model: "",
        engineType: "",
        vin: "",
      })
    } else {
      const selected = customerOptions.find((opt) => opt.id === value)
      if (selected) {
        setWorkOrderData({
          ...workOrderData,
          customerId: selected.id,
          customerName: selected.name,
          year: selected.vehicle?.year || "",
          make: selected.vehicle?.make || "",
          model: selected.vehicle?.model || "",
          engineType: selected.vehicle?.engine_type || "",
          vin: selected.vehicle?.vin || "",
        })
      }
    }
  }

  const handleAssignedToChange = (value: string) => {
    setWorkOrderData({ ...workOrderData, assignedTo: value })
  }

  function handleSave() {
    onSave(workOrderData)
    const newTask: Task = {
      id: Date.now().toString(),
      title: workOrderData.taskName || `${workOrderData.year} ${workOrderData.make} ${workOrderData.model}`,
      vehicle: `${workOrderData.year} ${workOrderData.make} ${workOrderData.model}`,
      date: new Date().toISOString().split("T")[0],
      status: "red",
      column: "todo",
      priority: workOrderData.priority,
    }
    onAddTask(newTask)
    onClose()
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "high":
        return "bg-[#e23232]"
      case "medium":
        return "bg-[#d6cd24]"
      case "low":
        return "bg-[#1eb386]"
      default:
        return "bg-[#e23232]"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center overflow-hidden p-4">
      <div className="bg-[#131313] w-full max-w-[90%] xl:max-w-7xl rounded-xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#222222] shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-white text-xl">New Work Order</h2>
            </div>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
            <div className="flex gap-4 h-full">
              {/* Left Column */}
              <div className="flex-1 space-y-4">
                {/* Customer Info */}
                <div className="bg-[#1A1A1A] rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="/placeholder.svg?height=64&width=64" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <Select value={workOrderData.customerId} onValueChange={handleCustomerChange}>
                        <SelectTrigger className="w-full bg-transparent border-0 text-white">
                          <SelectValue placeholder="Customer Name" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-[#2d2d2d]">
                          {customerOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="new">Add New Customer</SelectItem>
                        </SelectContent>
                      </Select>
                      {workOrderData.customerId === "new" && (
                        <Input
                          value={workOrderData.customerName}
                          onChange={(e) =>
                            setWorkOrderData({ ...workOrderData, customerName: e.target.value })
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
                    onChange={(e) => setWorkOrderData({ ...workOrderData, taskName: e.target.value })}
                    placeholder="Enter task name (optional)"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                  />
                </div>

                {/* Vehicle Details */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Year</Label>
                    <Input
                      value={workOrderData.year}
                      onChange={(e) => setWorkOrderData({ ...workOrderData, year: e.target.value })}
                      placeholder="e.g. 2016"
                      className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Make</Label>
                    <Input
                      value={workOrderData.make}
                      onChange={(e) => setWorkOrderData({ ...workOrderData, make: e.target.value })}
                      placeholder="e.g. Audi"
                      className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Model</Label>
                    <Input
                      value={workOrderData.model}
                      onChange={(e) => setWorkOrderData({ ...workOrderData, model: e.target.value })}
                      placeholder="e.g. S4"
                      className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Engine Type</Label>
                    <Input
                      value={workOrderData.engineType}
                      onChange={(e) => setWorkOrderData({ ...workOrderData, engineType: e.target.value })}
                      placeholder="e.g. 3.0 V6 TFSI"
                      className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">VIN (Vehicle Identification Number)</Label>
                    <Input
                      value={workOrderData.vin}
                      onChange={(e) => setWorkOrderData({ ...workOrderData, vin: e.target.value })}
                      placeholder="Enter VIN"
                      className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Mileage</Label>
                    <Input
                      value={workOrderData.mileage}
                      onChange={(e) => setWorkOrderData({ ...workOrderData, mileage: e.target.value })}
                      placeholder="Enter mileage"
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
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                workOrderData.priority === "high"
                                  ? "bg-[#e23232]"
                                  : workOrderData.priority === "medium"
                                  ? "bg-[#d6cd24]"
                                  : "bg-[#1eb386]"
                              }`}
                            />
                            <span className="capitalize">{workOrderData.priority}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-[#2d2d2d]">
                        <SelectItem value="high" className="text-white hover:bg-[#222222] cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#e23232]" />
                            High
                          </div>
                        </SelectItem>
                        <SelectItem value="medium" className="text-white hover:bg-[#222222] cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#d6cd24]" />
                            Medium
                          </div>
                        </SelectItem>
                        <SelectItem value="low" className="text-white hover:bg-[#222222] cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#1eb386]" />
                            Low
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assigned To Dropdown */}
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Assigned To</Label>
                    <Select value={workOrderData.assignedTo} onValueChange={handleAssignedToChange}>
                      <SelectTrigger className="w-full bg-[#1A1A1A] border-0 text-white">
                        <SelectValue placeholder="Select Staff" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-[#2d2d2d]">
                        {staffOptions.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.staff_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Collapsible Sections */}
                <div className="space-y-3">
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#1A1A1A] rounded-md text-white">
                      Labor
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-3 bg-[#1A1A1A] mt-1 rounded-md">
                      <textarea
                        value={workOrderData.labor}
                        onChange={(e) => setWorkOrderData({ ...workOrderData, labor: e.target.value })}
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
                        onChange={(e) => setWorkOrderData({ ...workOrderData, parts: e.target.value })}
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
                        onChange={(e) => setWorkOrderData({ ...workOrderData, notes: e.target.value })}
                        className="w-full h-24 bg-[#222222] text-white p-2 rounded-md resize-none"
                        placeholder="Enter additional notes..."
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Total Amount */}
                <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-md">
                  <span className="text-white">Total Amount</span>
                  <Input
                    type="text"
                    value={workOrderData.totalAmount}
                    onChange={(e) => setWorkOrderData({ ...workOrderData, totalAmount: e.target.value })}
                    placeholder="Enter amount"
                    className="w-32 bg-[#222222] border-0 text-white placeholder-[#9d9d9d] text-right"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="w-72 bg-[#131313] rounded-xl p-4 h-fit">
                <div className="flex flex-col items-center text-center mb-8">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Mdr8ip4BNugvvaw6rCGOacqY7Fhu0h.png"
                    alt="Motorminds Logo"
                    className="h-16 w-16 mb-4"
                  />
                  <h3 className="text-3xl text-white font-medium">How Can I Assist You?</h3>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-white hover:text-white hover:bg-[#222222] h-auto py-3 px-4 rounded-xl text-left"
                  >
                    📊 Customer History & Past Work Orders
                    <ArrowRight className="h-5 w-5 text-[#b22222]" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-white hover:text-white hover:bg-[#222222] h-auto py-3 px-4 rounded-xl text-left"
                  >
                    🛠️ Suggested Services for this vehicle
                    <ArrowRight className="h-5 w-5 text-[#b22222]" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-white hover:text-white hover:bg-[#222222] h-auto py-3 px-4 rounded-xl text-left"
                  >
                    ⚒️ Repair Time Estimates
                    <ArrowRight className="h-5 w-5 text-[#b22222]" />
                  </Button>
                </div>

                <div className="mt-8">
                  <Button
                    variant="outline"
                    className="w-full justify-between text-white bg-white hover:bg-white/90 text-[#131313] h-auto py-3 px-4 rounded-xl border-0"
                  >
                    Retrieve previous work orders for this car
                    <ArrowRight className="h-5 w-5 text-[#b22222]" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-6 border-t border-[#222222] shrink-0 bg-[#131313]">
            <Button
              variant="outline"
              className="px-8 py-3 h-auto bg-[#1A1A1A] border-[#222222] text-[#9d9d9d] hover:bg-[#222222] hover:text-white rounded-lg"
            >
              Generate Invoice
            </Button>
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
