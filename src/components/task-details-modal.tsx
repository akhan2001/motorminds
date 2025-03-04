"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, ArrowRight, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

/**
 * If your DB columns are:
 *  - "Assigned_to" => "John Gay"
 *  - Possibly "mechanic_id", etc.
 *  - Then we read "Assigned_to" for the UI.
 */
export interface DetailedRepairOrder {
  id: string
  created_at: string
  status: string // "Pending" | "In Progress" | "Completed"
  customer_id: string
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

    // IMPORTANT: EXACT same case as your console logs:
    // If your logs say "Assigned_to": "John Gay", use Assigned_to here:
    Assigned_to?: string
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
}

export function TaskDetailsModal({ task: initialTask, onClose, onSave }: TaskDetailsModalProps) {
  console.log("TaskDetailsModal - initialTask:", initialTask)

  // If you store "Assigned_to" in repair_order_details, let's read from the first row:
  const firstDetail = initialTask.repair_order_details?.[0]
  console.log("First Detail row =>", firstDetail)

  /**
   * "Pending" => "not-started"
   * "In Progress" => "in-progress"
   * "Completed" => "completed"
   */
  function mapDbStatusToLocal(dbStatus: string): "not-started" | "in-progress" | "completed" {
    switch (dbStatus) {
      case "Pending":
        return "not-started"
      case "In Progress":
        return "in-progress"
      case "Completed":
        return "completed"
      default:
        return "not-started"
    }
  }

  function mapLocalStatusToDb(local: "not-started" | "in-progress" | "completed"): string {
    switch (local) {
      case "not-started":
        return "Pending"
      case "in-progress":
        return "In Progress"
      case "completed":
        return "Completed"
      default:
        return "Pending"
    }
  }

  // Convert DB status => local
  const [isEditing, setIsEditing] = useState(false)
  const [status, setStatus] = useState<"not-started" | "in-progress" | "completed">(
    mapDbStatusToLocal(initialTask.status)
  )

  // The first vehicle from customers.customer_vehicles
  const firstVehicle = initialTask.customers?.customer_vehicles?.[0]

  // Combine email + phone
  const combinedContact = `${initialTask.customers?.customer_email ?? ""} | ${
    initialTask.customers?.customer_phone ?? ""
  }`.trim()

  /**
   * We'll store the needed fields in formData:
   *   - "Assigned To" => read from "Assigned_to" in your first detail row
   */
  const [formData, setFormData] = useState({
    customerName: initialTask.customers?.customer_name || "Unknown Customer",
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
    // KEY FIX: referencing your DB column "Assigned_to"
    assignedToName: firstDetail?.Assigned_to || "",
    taskPriority: firstDetail?.task_priority || "Normal",
    detailDescription: firstDetail?.description || ""
  })

  // If parent updates the "initialTask", let's re-sync
  useEffect(() => {
    setStatus(mapDbStatusToLocal(initialTask.status))
    const d = initialTask.repair_order_details?.[0]
    const v = initialTask.customers?.customer_vehicles?.[0]
    const combo = `${initialTask.customers?.customer_email ?? ""} | ${
      initialTask.customers?.customer_phone ?? ""
    }`.trim()

    setFormData({
      customerName: initialTask.customers?.customer_name || "Unknown Customer",
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
      // again: EXACT property name => "Assigned_to"
      assignedToName: d?.Assigned_to || "",
      taskPriority: d?.task_priority || "Normal",
      detailDescription: d?.description || ""
    })
  }, [initialTask])

  /**
   * handleSave => build updated record for onSave
   */
  function handleSave() {
    const dbStatus = mapLocalStatusToDb(status)

    const updated: DetailedRepairOrder = {
      ...initialTask,
      status: dbStatus,
      // If there's a detail row:
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
              // If you want to write "assignedToName" back to DB,
              // do so here:
              // Assigned_to: formData.assignedToName
            }
          ]
        : [],
      customers: {
        ...initialTask.customers,
        customer_name: formData.customerName
      }
    }

    onSave(updated)
    setIsEditing(false)
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
            <div className={`w-1/3 ${status === "not-started" ? "bg-[#e23232]" : "bg-[#222222]"}`} />
            <div className={`w-1/3 ${status === "in-progress" ? "bg-[#d6cd24]" : "bg-[#222222]"}`} />
            <div className={`w-1/3 ${status === "completed" ? "bg-[#1eb386]" : "bg-[#222222]"}`} />
          </div>
        </div>

        {/* MAIN CONTENT - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
          <div className="flex gap-4 h-full">
            <div className="flex-1 space-y-4">
              {/* Customer Info */}
              <div className="bg-[#1A1A1A] rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/placeholder.svg?height=64&width=64" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <Input
                      value={formData.customerName}
                      onChange={(e) =>
                        isEditing && setFormData({ ...formData, customerName: e.target.value })
                      }
                      placeholder="John Doe"
                      className="bg-transparent border-0 text-white text-xl font-semibold p-0 h-auto placeholder-white/70 mb-1"
                      readOnly={!isEditing}
                    />
                    <Input
                      value={formData.description}
                      onChange={(e) => isEditing && setFormData({ ...formData, description: e.target.value })}
                      placeholder="Email / Phone"
                      className="bg-transparent border-0 text-[#9d9d9d] p-0 h-auto placeholder-[#9d9d9d]/70"
                      readOnly={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Year</Label>
                  <Input
                    value={formData.year}
                    onChange={(e) => isEditing && setFormData({ ...formData, year: e.target.value })}
                    placeholder="2016"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Make</Label>
                  <Input
                    value={formData.make}
                    onChange={(e) => isEditing && setFormData({ ...formData, make: e.target.value })}
                    placeholder="Audi"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Model</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => isEditing && setFormData({ ...formData, model: e.target.value })}
                    placeholder="S4"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Engine Type</Label>
                  <Input
                    value={formData.engine_type}
                    onChange={(e) => isEditing && setFormData({ ...formData, engine_type: e.target.value })}
                    placeholder="3.0 V6 TFSI"
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
                    onChange={(e) => isEditing && setFormData({ ...formData, vin: e.target.value })}
                    placeholder="Enter VIN"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Mileage</Label>
                  <Input
                    value={formData.mileage}
                    onChange={(e) => isEditing && setFormData({ ...formData, mileage: e.target.value })}
                    placeholder="Enter mileage"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    readOnly={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Priority with color in read-only */}
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Task Priority</Label>
                  {isEditing ? (
                    <Input
                      value={formData.taskPriority}
                      onChange={(e) => setFormData({ ...formData, taskPriority: e.target.value })}
                      placeholder="High, Medium, etc."
                      className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] rounded-md h-9">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            formData.taskPriority.toLowerCase() === "high"
                              ? "#e23232"
                              : formData.taskPriority.toLowerCase() === "medium"
                              ? "#d6cd24"
                              : "#1eb386"
                        }}
                      />
                      <span className="text-white">{formData.taskPriority}</span>
                    </div>
                  )}
                </div>
                {/* ***HERE*** we display "Assigned_to" in the "Assigned To" input */}
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Assigned To</Label>
                  <Input
                    value={formData.assignedToName}
                    onChange={(e) =>
                      isEditing && setFormData({ ...formData, assignedToName: e.target.value })
                    }
                    placeholder="Mechanic name"
                    className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d] h-9"
                    readOnly={!isEditing}
                  />
                </div>
              </div>

              {/* Collapsibles for labour, parts, notes */}
              <div className="space-y-3">
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#1A1A1A] rounded-md text-white">
                    Labour
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-3 bg-[#1A1A1A] mt-1 rounded-md">
                    <textarea
                      value={formData.labour}
                      onChange={(e) => isEditing && setFormData({ ...formData, labour: e.target.value })}
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
                      onChange={(e) => isEditing && setFormData({ ...formData, parts: e.target.value })}
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

              {/* detailDescription if you store it */}
              <div className="space-y-1.5 mt-4">
                <Label className="text-gray-400">Detail Description</Label>
                <Input
                  value={formData.detailDescription}
                  onChange={(e) => isEditing && setFormData({ ...formData, detailDescription: e.target.value })}
                  placeholder="extra info..."
                  className="bg-[#1A1A1A] border-0 text-white placeholder-[#9d9d9d]"
                  readOnly={!isEditing}
                />
              </div>

              {/* Total Amount */}
              <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-md mt-4">
                <span className="text-white">Total Amount</span>
                <Input
                  type="text"
                  value={formData.totalAmount}
                  onChange={(e) => isEditing && setFormData({ ...formData, totalAmount: e.target.value })}
                  placeholder="Enter amount"
                  className="w-32 bg-[#222222] border-0 text-white placeholder-[#9d9d9d] text-right"
                  readOnly={!isEditing}
                />
              </div>
            </div>

            {/* RIGHT COLUMN: "How Can I Assist You?" etc. */}
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
                  📊 Customer History &amp; Past Work Orders
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

        {/* FOOTER */}
        <div className="flex items-center justify-between p-6 border-t border-[#222222] shrink-0 bg-[#131313]">
          <Button
            variant="outline"
            className="px-8 py-3 h-auto bg-[#1A1A1A] border-[#222222] text-[#9d9d9d] hover:bg-[#222222] hover:text-white rounded-lg"
          >
            Generate Invoice
          </Button>
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
