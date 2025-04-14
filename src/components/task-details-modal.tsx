"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, Edit2, Trash2, Mail, Phone, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { generateInvoice } from "@/app/invoices/api/invoiceGenerator"
import { toast } from "sonner"
import { formatPhoneNumber } from "@/app/invoices/utils/invoice-utils"

export interface DetailedRepairOrder {
  id: string
  created_at: string
  status: string // "Pending" | "In Progress" | "Completed"
  vehicle_id?: string
  repair_order_details?: Array<{
    id: string
    mechanic_id?: string
    labour?: string
    parts?: string
    notes?: string
    cost?: string
    mileage?: string
    task_priority?: string
    description?: string
    labour_cost?: string
    parts_cost?: string
  }>
  customers?: {
    id: string
    customer_name?: string
    customer_email?: string
    customer_phone?: string
    customer_vehicles?: Array<{
      id: string
      year?: string
      make?: string
      model?: string
      engine_type?: string
      vin?: string
    }>
  }
}

interface TaskDetailsModalProps {
  task: DetailedRepairOrder
  onClose: () => void
  onSave: (updated: DetailedRepairOrder) => void
  shopId: string
}

export function TaskDetailsModal({
  task: initialTask,
  onClose,
  onSave,
  shopId,
}: TaskDetailsModalProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  // ------------------
  // STATUS mapping
  // ------------------
  function mapDbStatusToLocal(dbStatus: string): "not-started" | "in-progress" | "completed" {
    switch (dbStatus) {
      case "In Progress":
        return "in-progress"
      case "Completed":
        return "completed"
      case "Pending":
      default:
        return "not-started"
    }
  }
  function mapLocalStatusToDb(local: "not-started" | "in-progress" | "completed") {
    switch (local) {
      case "in-progress":
        return "In Progress"
      case "completed":
        return "Completed"
      case "not-started":
      default:
        return "Pending"
    }
  }

  const [status, setStatus] = useState<"not-started" | "in-progress" | "completed">(
    mapDbStatusToLocal(initialTask.status)
  )

  // Extract the first row in details
  const firstDetail = initialTask.repair_order_details?.[0]
  
  // Instead of using the first vehicle, find the matching vehicle using vehicle_id
  const matchingVehicle = initialTask.vehicle_id && initialTask.customers?.customer_vehicles 
    ? initialTask.customers.customer_vehicles.find(v => v.id === initialTask.vehicle_id)
    : null;
  // Fallback to first vehicle if no matching vehicle found
  const vehicleToUse = matchingVehicle || initialTask.customers?.customer_vehicles?.[0];

  const combinedContact = [
    initialTask.customers?.customer_email,
    initialTask.customers?.customer_phone,
  ]
    .filter(Boolean)
    .join(" | ")

  // ------------------
  // LOCAL FORM
  // ------------------
  const [labourCost, setLabourCost] = useState(firstDetail?.labour_cost || "0")
  const [partsCost, setPartsCost] = useState(firstDetail?.parts_cost || "0")

  const [formData, setFormData] = useState({
    customerName: initialTask.customers?.customer_name || "",
    description: combinedContact,
    date: initialTask.created_at || "",
    year: vehicleToUse?.year || "",
    make: vehicleToUse?.make || "",
    model: vehicleToUse?.model || "",
    engine_type: vehicleToUse?.engine_type || "",
    vin: vehicleToUse?.vin || "",
    mileage: firstDetail?.mileage || "",
    labour: firstDetail?.labour || "",
    labourCost: firstDetail?.labour_cost || "0",
    parts: firstDetail?.parts || "",
    partsCost: firstDetail?.parts_cost || "0",
    notes: firstDetail?.notes || "",
    totalAmount: firstDetail?.cost || "0",
    taskPriority: firstDetail?.task_priority || "Medium",
    detailDescription: firstDetail?.description || "",
    assignedToName: "",
    email: initialTask.customers?.customer_email || "",
    phone: initialTask.customers?.customer_phone || "",
  })

  // ------------------
  // Fetch staff_name if there's mechanic_id
  // ------------------
  useEffect(() => {
    async function fetchStaffName() {
      if (firstDetail?.mechanic_id) {
        const { data: staffRow, error: staffErr } = await supabase
          .from("shop_staff")
          .select("staff_name")
          .eq("id", firstDetail.mechanic_id)
          .single()

        if (!staffErr && staffRow) {
          setFormData((prev) => ({
            ...prev,
            assignedToName: staffRow.staff_name,
          }))
        } else {
          setFormData((prev) => ({
            ...prev,
            assignedToName: "Unknown Mechanic",
          }))
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          assignedToName: "",
        }))
      }
    }
    fetchStaffName()
  }, [firstDetail?.mechanic_id])

  // If the parent re-renders with a new task
  useEffect(() => {
    setStatus(mapDbStatusToLocal(initialTask.status))
    const d = initialTask.repair_order_details?.[0]
    
    // Find the matching vehicle using vehicle_id
    const matchingVehicle = initialTask.vehicle_id && initialTask.customers?.customer_vehicles 
      ? initialTask.customers.customer_vehicles.find(v => v.id === initialTask.vehicle_id)
      : null;
    // Fallback to first vehicle if no matching vehicle found
    const v = matchingVehicle || initialTask.customers?.customer_vehicles?.[0];
    
    const combo = [
      initialTask.customers?.customer_email,
      initialTask.customers?.customer_phone,
    ]
      .filter(Boolean)
      .join(" | ")

    setFormData({
      customerName: initialTask.customers?.customer_name || "",
      description: combo,
      date: initialTask.created_at || "",
      year: v?.year || "",
      make: v?.make || "",
      model: v?.model || "",
      engine_type: v?.engine_type || "",
      vin: v?.vin || "",
      mileage: d?.mileage || "",
      labour: d?.labour || "",
      labourCost: d?.labour_cost || "0",
      parts: d?.parts || "",
      partsCost: d?.parts_cost || "0",
      notes: d?.notes || "",
      totalAmount: d?.cost || "0",
      taskPriority: d?.task_priority || "Medium",
      detailDescription: d?.description || "",
      assignedToName: "",
      email: initialTask.customers?.customer_email || "",
      phone: initialTask.customers?.customer_phone || "",
    })
  }, [initialTask])

  // Add useEffect for total calculation
  useEffect(() => {
    const labour = parseFloat(formData.labourCost) || 0
    const parts = parseFloat(formData.partsCost) || 0
    const total = labour + parts
    setFormData(prev => ({
      ...prev,
      totalAmount: total.toFixed(2)
    }))
  }, [formData.labourCost, formData.partsCost])

  // ------------------
  // SAVE CHANGES
  // ------------------
  function handleSave() {
    const dbStatus = mapLocalStatusToDb(status)
    
    // First create a base updated object
    const updated: DetailedRepairOrder = {
      ...initialTask,
      status: dbStatus,
      repair_order_details: initialTask.repair_order_details?.length
        ? [
            {
              ...initialTask.repair_order_details[0],
              mileage: formData.mileage,
              labour: formData.labour,
              labour_cost: formData.labourCost,
              parts: formData.parts,
              parts_cost: formData.partsCost,
              notes: formData.notes,
              cost: formData.totalAmount,
              task_priority: formData.taskPriority,
              description: formData.detailDescription,
            },
          ]
        : [],
      customers: initialTask.customers ? {
        id: initialTask.customers.id,
        customer_name: formData.customerName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_vehicles: [...(initialTask.customers.customer_vehicles || [])],
      } : undefined,
    }
    
    // Update vehicle information if we have a vehicle_id and customer vehicles
    if (updated.vehicle_id && updated.customers?.customer_vehicles) {
      const vehicleIndex = updated.customers.customer_vehicles.findIndex(
        v => v.id === updated.vehicle_id
      );
      
      if (vehicleIndex >= 0) {
        updated.customers.customer_vehicles[vehicleIndex] = {
          ...updated.customers.customer_vehicles[vehicleIndex],
          year: formData.year,
          make: formData.make,
          model: formData.model,
          engine_type: formData.engine_type,
          vin: formData.vin,
        };
      }
    }

    onSave(updated)
    setIsEditing(false)
  }

  // ------------------
  // DELETE with confirmation + full page reload
  // ------------------
  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to remove this task from the shop? This action will hide it from the shop's list but keep any existing invoice."
    )
    if (!confirmed) return
  
    try {
      // 1) Instead of truly deleting the order, we simply remove the shop reference:
      const { error: updateErr } = await supabase
        .from("repair_orders")
        .update({ shop_id: null })  // <— Key line
        .eq("id", initialTask.id)
      if (updateErr) throw updateErr
  
      // NOTE: If your detail rows also have a `shop_id`, you might want to null them out too.
      // If they only reference the repair_order_id, no change is needed.
  
      toast.success("Task removed from shop successfully.")
      onClose()
      window.location.reload()
    } catch (err: any) {
      console.error("handleDelete error:", err)
      toast.error("Failed to remove task: " + err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center overflow-hidden p-4">
      <div className="bg-[#131313] w-full max-w-[95vw] sm:max-w-[75vw] md:max-w-[65vw] rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-[#222222] shrink-0">
          <div className="space-y-1">
            <h2 className="text-white text-xl sm:text-2xl">Work Order <span className="text-gray-400 text-sm">#{initialTask.id}</span></h2>
            <p className="text-gray-400 text-xs sm:text-sm">
              Manage work order details and customer information.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button
                variant="outline"
                size="icon"
                className="text-gray-400 hover:text-white border-[#222222]"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* STATUS BUTTONS */}
        <div className="flex items-center gap-4 p-4 border-b border-[#222222]">
          <Button
            variant="ghost"
            className={`flex items-center gap-2 ${
              status === "not-started" ? "text-white" : "text-gray-400"
            }`}
            onClick={() => isEditing && setStatus("not-started")}
          >
            <div className="w-3 h-3 rounded-full bg-[#e23232]" />
            Not Started
          </Button>
          <Button
            variant="ghost"
            className={`flex items-center gap-2 ${
              status === "in-progress" ? "text-white" : "text-gray-400"
            }`}
            onClick={() => isEditing && setStatus("in-progress")}
          >
            <div className="w-3 h-3 rounded-full bg-[#d6cd24]" />
            In Progress
          </Button>
          <Button
            variant="ghost"
            className={`flex items-center gap-2 ${
              status === "completed" ? "text-white" : "text-gray-400"
            }`}
            onClick={() => isEditing && setStatus("completed")}
          >
            <div className="w-3 h-3 rounded-full bg-[#1eb386]" />
            Completed
          </Button>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Customer Information</h3>
            <div className="bg-[#1A1A1A] rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder.svg?height=64&width=64" />
                  <AvatarFallback className="bg-[#b22222] text-white text-xl">
                    {formData.customerName?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Customer Name</Label>
                      <Input
                        value={formData.customerName}
                        onChange={(e) =>
                          isEditing && setFormData({ ...formData, customerName: e.target.value })
                        }
                        className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Email</Label>
                      <Input
                        value={formData.email}
                        onChange={(e) =>
                          isEditing && setFormData({ ...formData, email: e.target.value })
                        }
                        className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Phone</Label>
                      <Input
                        value={formData.phone ? formatPhoneNumber(formData.phone) : ""}
                        onChange={(e) =>
                          isEditing && setFormData({ ...formData, phone: e.target.value })
                        }
                        className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                        readOnly={!isEditing}
                      />
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Vehicle Information</h3>
            <div className="bg-[#1A1A1A] rounded-xl p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Year</Label>
                  <Input
                    value={formData.year}
                    onChange={(e) =>
                      isEditing && setFormData({ ...formData, year: e.target.value })
                    }
                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Make</Label>
                  <Input
                    value={formData.make}
                    onChange={(e) =>
                      isEditing && setFormData({ ...formData, make: e.target.value })
                    }
                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Model</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) =>
                      isEditing && setFormData({ ...formData, model: e.target.value })
                    }
                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Engine</Label>
                  <Input
                    value={formData.engine_type}
                    onChange={(e) =>
                      isEditing && setFormData({ ...formData, engine_type: e.target.value })
                    }
                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                    readOnly={!isEditing}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-400">VIN</Label>
                  <Input
                    value={formData.vin}
                    onChange={(e) =>
                      isEditing && setFormData({ ...formData, vin: e.target.value })
                    }
                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Mileage</Label>
                  <Input
                    value={formData.mileage}
                    onChange={(e) =>
                      isEditing && setFormData({ ...formData, mileage: e.target.value })
                    }
                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                    readOnly={!isEditing}
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
                  value={formData.detailDescription}
                  onChange={(e) =>
                    isEditing && setFormData({ ...formData, detailDescription: e.target.value })
                  }
                  className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 w-full"
                  readOnly={!isEditing}
                />
              </div>

              <Label className="text-gray-400 self-center sm:col-span-1">Labour</Label>
              <div className="flex flex-row gap-2 sm:col-span-3">
                <Input
                  value={formData.labour}
                  onChange={(e) =>
                    isEditing && setFormData({ ...formData, labour: e.target.value })
                  }
                  className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 w-full"
                  placeholder="Enter labour details"
                  readOnly={!isEditing}
                />
                <span className="text-gray-300 text-md self-center">$</span>
                <Input
                  type="number"
                  value={formData.labourCost}
                  onChange={(e) =>
                    isEditing && setFormData({ ...formData, labourCost: e.target.value || "0" })
                  }
                  className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 w-[150px]"
                  placeholder="0.00"
                  readOnly={!isEditing}
                />
              </div>

              <Label className="text-gray-400 self-center sm:col-span-1">Parts</Label>
              <div className="flex flex-row gap-2 sm:col-span-3">
                <Input
                  value={formData.parts}
                  onChange={(e) =>
                    isEditing && setFormData({ ...formData, parts: e.target.value })
                  }
                  className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 w-full"
                  placeholder="Enter parts details"
                  readOnly={!isEditing}
                />
                <span className="text-gray-300 text-md self-center">$</span>
                <Input
                  type="number"
                  value={formData.partsCost}
                  onChange={(e) =>
                    isEditing && setFormData({ ...formData, partsCost: e.target.value || "0" })
                  }
                  className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 w-[150px]"
                  placeholder="0.00"
                  readOnly={!isEditing}
                />
              </div>

              <Label className="text-gray-400 self-center sm:col-span-1">Notes</Label>
              <div className="sm:col-span-3">
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    isEditing && setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full bg-[#292929] text-white border-[#626262] focus:ring-gray-500 rounded-md p-2 min-h-[100px]"
                  readOnly={!isEditing}
                />
              </div>

              <Label className="text-gray-400 self-center sm:col-span-1">Total Amount</Label>
              <div className="flex flex-row gap-2 items-center sm:col-span-3">
                <span className="text-white text-xl">$ {formData.totalAmount}</span>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between p-6 border-t border-[#222222] shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="px-8 py-3 h-auto bg-[#1A1A1A] border-[#222222] text-[#9d9d9d] hover:bg-[#222222] hover:text-white rounded-lg"
              onClick={() => {
                generateInvoice(initialTask.id, shopId)
              }}
            >
              Generate Invoice
            </Button>
            <Button
              variant="destructive"
              className="px-4 py-3 h-auto bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  className="px-8 py-3 h-auto bg-[#1A1A1A] border-[#222222] text-[#9d9d9d] hover:bg-[#222222] hover:text-white rounded-lg"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="px-8 py-3 h-auto bg-[#22C55E] hover:bg-[#22C55E]/80 text-white rounded-lg"
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                className="px-8 py-3 h-auto bg-[#1A1A1A] border-[#222222] text-[#9d9d9d] hover:bg-[#222222] hover:text-white rounded-lg"
                onClick={onClose}
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
