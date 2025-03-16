"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, Edit2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { generateInvoice } from "@/app/invoices/api/invoiceGenerator"
import { toast } from "sonner"

export interface DetailedRepairOrder {
  id: string
  created_at: string
  status: string // "Pending" | "In Progress" | "Completed"
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

  // Extract the first row in details + vehicles
  const firstDetail = initialTask.repair_order_details?.[0]
  const firstVehicle = initialTask.customers?.customer_vehicles?.[0]

  const combinedContact = [
    initialTask.customers?.customer_email,
    initialTask.customers?.customer_phone,
  ]
    .filter(Boolean)
    .join(" | ")

  // ------------------
  // LOCAL FORM
  // ------------------
  const [formData, setFormData] = useState({
    customerName: initialTask.customers?.customer_name || "",
    description: combinedContact,
    date: initialTask.created_at || "",
    year: firstVehicle?.year || "",
    make: firstVehicle?.make || "",
    model: firstVehicle?.model || "",
    engine_type: firstVehicle?.engine_type || "",
    vin: firstVehicle?.vin || "",
    mileage: firstDetail?.mileage || "",
    labour: firstDetail?.labour || "",
    parts: firstDetail?.parts || "",
    notes: firstDetail?.notes || "",
    totalAmount: firstDetail?.cost || "",
    taskPriority: firstDetail?.task_priority || "Medium",
    detailDescription: firstDetail?.description || "",
    assignedToName: "",
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
    const v = initialTask.customers?.customer_vehicles?.[0]
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
      parts: d?.parts || "",
      notes: d?.notes || "",
      totalAmount: d?.cost || "",
      taskPriority: d?.task_priority || "Medium",
      detailDescription: d?.description || "",
      assignedToName: "",
    })
  }, [initialTask])

  // ------------------
  // SAVE CHANGES
  // ------------------
  function handleSave() {
    const dbStatus = mapLocalStatusToDb(status)
    const updated: DetailedRepairOrder = {
      ...initialTask,
      status: dbStatus,
      repair_order_details: initialTask.repair_order_details?.length
        ? [
            {
              ...initialTask.repair_order_details[0],
              mileage: formData.mileage,
              labour: formData.labour,
              parts: formData.parts,
              notes: formData.notes,
              cost: formData.totalAmount,
              task_priority: formData.taskPriority,
              description: formData.detailDescription,
            },
          ]
        : [],
      customers: {
        ...initialTask.customers,
        customer_name: formData.customerName,
      },
    }

    onSave(updated)
    setIsEditing(false)
  }

  // ------------------
  // DELETE with confirmation + full page reload
  // ------------------
  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to remove this task from the shop? This action will hide it from the shop’s list but keep any existing invoice."
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
      <div className="bg-[#131313] w-full max-w-[90%] xl:max-w-7xl rounded-xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-[#222222] shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-white text-xl">Work Order #</h2>
            <span className="text-white text-xl">{initialTask.id}</span>
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

        {/* PROGRESS BAR */}
        <div className="relative h-1 bg-[#222222] shrink-0">
          <div className="absolute inset-0 flex">
            <div
              className={`w-1/3 ${
                status === "not-started" ? "bg-[#e23232]" : "bg-[#222222]"
              }`}
            />
            <div
              className={`w-1/3 ${
                status === "in-progress" ? "bg-[#d6cd24]" : "bg-[#222222]"
              }`}
            />
            <div
              className={`w-1/3 ${
                status === "completed" ? "bg-[#1eb386]" : "bg-[#222222]"
              }`}
            />
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
          <div className="flex gap-4 h-full">
            {/* LEFT SIDE */}
            <div className="flex-1 space-y-4">
              {/* Customer Info */}
              <div className="bg-[#1A1A1A] rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/placeholder.svg?height=64&width=64" />
                    <AvatarFallback>Mech</AvatarFallback>
                  </Avatar>
                  <div>
                    <Input
                      value={formData.customerName}
                      onChange={(e) =>
                        isEditing && setFormData({ ...formData, customerName: e.target.value })
                      }
                      placeholder="Customer Name"
                      className="bg-transparent border-0 text-white text-xl font-semibold p-0 h-auto placeholder-white/70 mb-1"
                      readOnly={!isEditing}
                    />
                    <Input
                      value={formData.description}
                      onChange={(e) =>
                        isEditing && setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Email / Phone"
                      className="bg-transparent border-0 text-[#9d9d9d] p-0 h-auto placeholder-[#9d9d9d]/70"
                      readOnly={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Year</Label>
                  <Input
                    value={formData.year}
                    onChange={(e) =>
                      isEditing && setFormData({ ...formData, year: e.target.value })
                    }
                    placeholder="2015"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
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
                    placeholder="Honda"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
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
                    placeholder="Civic"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
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
                    placeholder="1.8L i-VTEC"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
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
                    placeholder="VIN"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
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
                    placeholder="Enter mileage"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    readOnly={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Priority</Label>
                  <Input
                    value={formData.taskPriority}
                    onChange={(e) =>
                      isEditing && setFormData({ ...formData, taskPriority: e.target.value })
                    }
                    placeholder="High / Medium / Low"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Assigned To</Label>
                  <Input
                    value={formData.assignedToName}
                    onChange={(e) =>
                      isEditing && setFormData({ ...formData, assignedToName: e.target.value })
                    }
                    placeholder="Mechanic Name"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    readOnly={!isEditing}
                  />
                </div>
              </div>

              {/* Collapsibles for labour, parts, notes */}
              <div className="space-y-3 mt-4">
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#1A1A1A] rounded-md text-white">
                    Labour
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-3 bg-[#1A1A1A] mt-1 rounded-md">
                    <textarea
                      value={formData.labour}
                      onChange={(e) =>
                        isEditing && setFormData({ ...formData, labour: e.target.value })
                      }
                      className="w-full h-24 bg-[#222222] text-white p-2 rounded-md resize-none"
                      placeholder="Enter labour details..."
                      readOnly={!isEditing}
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
                      value={formData.parts}
                      onChange={(e) =>
                        isEditing && setFormData({ ...formData, parts: e.target.value })
                      }
                      className="w-full h-24 bg-[#222222] text-white p-2 rounded-md resize-none"
                      placeholder="Enter parts details..."
                      readOnly={!isEditing}
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
                      value={formData.notes}
                      onChange={(e) => isEditing && setFormData({ ...formData, notes: e.target.value })}
                      className="w-full h-24 bg-[#222222] text-white p-2 rounded-md resize-none"
                      placeholder="Enter additional notes..."
                      readOnly={!isEditing}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Additional "description" if needed */}
              <div className="space-y-1.5 mt-4">
                <Label className="text-gray-400">Detail Description</Label>
                <Input
                  value={formData.detailDescription}
                  onChange={(e) =>
                    isEditing && setFormData({ ...formData, detailDescription: e.target.value })
                  }
                  placeholder="extra info..."
                  className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d]"
                  readOnly={!isEditing}
                />
              </div>

              {/* TOTAL COST */}
              <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-md mt-4">
                <span className="text-white">Total Amount</span>
                <Input
                  type="text"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    isEditing && setFormData({ ...formData, totalAmount: e.target.value })
                  }
                  placeholder="Enter amount"
                  className="w-32 bg-[#222222] border-0 text-white placeholder-[#9d9d9d] text-right"
                  readOnly={!isEditing}
                />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between p-6 border-t border-[#222222] shrink-0 bg-[#131313]">
          {/* Left side: "Generate Invoice" + DELETE */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="px-8 py-3 h-auto bg-[#1A1A1A] border-[#222222] text-[#9d9d9d] hover:bg-[#222222] hover:text-white rounded-lg"
              onClick={() => {
                generateInvoice(initialTask.id, shopId).then((success) => {
                  if (success) {
                    toast.success("Invoice generated successfully", {
                      action: {
                        label: "View Invoice",
                        onClick: () => {
                          router.push("/invoices")
                        },
                      },
                    })
                  } else {
                    toast.error("Invoice already exists", {
                      action: {
                        label: "View Invoice",
                        onClick: () => {
                          router.push("/invoices")
                        },
                      },
                    })
                  }
                })
              }}
            >
              Generate Invoice
            </Button>

            {/* DELETE BUTTON */}
            <Button
              variant="destructive"
              className="px-4 py-3 h-auto bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>

          {/* Right side: Cancel/Save OR Close */}
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
                  className="px-8 py-3 h-auto bg-[#b22222] hover:bg-[#e23232] text-white rounded-lg"
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
