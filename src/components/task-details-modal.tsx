"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, Edit2, Trash2, Mail, Phone, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { generateInvoice } from "@/app/invoices/api/invoiceGenerator"
import { toast } from "sonner"
import { formatPhoneNumber } from "@/app/invoices/utils/invoice-utils"
import MechanicsHubChat from "@/app/mechanic-hub/components/mechanics-hub-chat"
import { WorkOrderStatusButtons } from "./work-order-status-buttons"

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
    customer_address?: string
    customer_vehicles?: Array<{
      id: string
      year?: string
      make?: string
      model?: string
      engine_type?: string
      vin?: string
      color?: string
      license_plate?: string
    }>
  }
}

// Define a more specific type for the update payload
interface UpdatePayload {
  id: string;
  status: string;
  repair_order_details?: Array<{
    id: string;
    mechanic_id?: string | null;
    labour?: string;
    parts?: string;
    notes?: string;
    cost?: string;
    mileage?: string;
    task_priority?: string;
    description?: string;
    labour_cost?: string;
    parts_cost?: string;
  }>
}

interface TaskDetailsModalProps {
  task: DetailedRepairOrder
  onClose: () => void
  onSave: (updated: UpdatePayload) => void
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
  
  // Add staff options state
  const [staffOptions, setStaffOptions] = useState<Array<{id: string, full_name: string, role: string}>>([])
  // Add selectedStaffId state to track the selected staff member
  const [selectedStaffId, setSelectedStaffId] = useState<string>("")
  const [currentStatus, setCurrentStatus] = useState(initialTask.status)
  const [invoiceInfo, setInvoiceInfo] = useState<{ exists: boolean; id: string | null }>({ exists: false, id: null });

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
    color: vehicleToUse?.color || "",
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
    address: initialTask.customers?.customer_address || "",
    licensePlate: vehicleToUse?.license_plate || "",
    vehicle_id: vehicleToUse?.id || "",
  })

  // ------------------
  // Fetch shop staff options when component mounts
  // ------------------
  useEffect(() => {
    async function fetchStaffOptions() {
      if (!shopId) return;
      
      const { data: staffData, error: staffErr } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role")
        .eq("shop_id", shopId)
        .is('termination_date', null);
        
      if (!staffErr && staffData) {
        const options = staffData.map(s => ({
          id: s.id,
          full_name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
          role: s.role
        }));
        setStaffOptions(options);
      } else {
        console.error("Error fetching staff options:", staffErr);
      }
    }
    
    fetchStaffOptions();
  }, [shopId]);

  // ------------------
  // Fetch staff_name if there's mechanic_id
  // ------------------
  useEffect(() => {
    async function fetchStaffName() {
      if (firstDetail?.mechanic_id) {
        setSelectedStaffId(firstDetail.mechanic_id);
        
        const { data: staffRow, error: staffErr } = await supabase
          .from("employees")
          .select("first_name, last_name")
          .eq("id", firstDetail.mechanic_id)
          .single()

        if (!staffErr && staffRow) {
          const fullName = `${staffRow.first_name || ''} ${staffRow.last_name || ''}`.trim();
          setFormData((prev) => ({
            ...prev,
            assignedToName: fullName,
          }))
        } else {
          setFormData((prev) => ({
            ...prev,
            assignedToName: "Unknown Mechanic",
          }))
        }
      } else {
        setSelectedStaffId("");
        setFormData((prev) => ({
          ...prev,
          assignedToName: "",
        }))
      }
    }
    fetchStaffName()
  }, [firstDetail?.mechanic_id])

  useEffect(() => {
    async function checkInvoiceExists() {
      if (currentStatus !== "Completed" || !initialTask.id || !shopId) {
        setInvoiceInfo({ exists: false, id: null });
        return;
      }

      const firstDetailId = initialTask.repair_order_details?.[0]?.id;
      if (!firstDetailId) {
        return;
      }
      
      const { data: existingInvoice, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('workorder_id', firstDetailId)
        .eq('shop_id', shopId)
        .limit(1);

      if (error) {
        console.error("Error checking for existing invoice:", error.message);
        return;
      }
      
      if (existingInvoice && existingInvoice.length > 0) {
        setInvoiceInfo({ exists: true, id: existingInvoice[0].invoice_number });
      } else {
        setInvoiceInfo({ exists: false, id: null });
      }
    }

    checkInvoiceExists();
  }, [initialTask.id, currentStatus, initialTask.repair_order_details, shopId]);

  // If the parent re-renders with a new task
  useEffect(() => {
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
      color: v?.color || "",
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
      address: initialTask.customers?.customer_address || "",
      licensePlate: v?.license_plate || "",
      vehicle_id: v?.id || "",
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
  async function handleSave() {
    // Create a "patch" object with only the changed fields
    const updatedFields: UpdatePayload = {
      id: initialTask.id, // Include ID for matching
      status: currentStatus,
      repair_order_details: initialTask.repair_order_details?.length
        ? [
            {
              ...initialTask.repair_order_details[0],
              mechanic_id: selectedStaffId || null,
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
    };

    onSave(updatedFields);
    setIsEditing(false);
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

  // Handle staff selection change
  const handleStaffChange = (value: string) => {
    setSelectedStaffId(value === "none" ? "" : value);
    
    if (value && value !== "none") {
      const selectedStaff = staffOptions.find(staff => staff.id === value);
      if (selectedStaff) {
        setFormData(prev => ({
          ...prev,
          assignedToName: selectedStaff.full_name
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        assignedToName: ""
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center overflow-hidden">
      <div className="bg-[#131313] text-white border-none rounded-lg shadow-lg flex max-h-[90vh] w-[95vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw]">
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b border-[#222222] shrink-0">
            <div className="space-y-1">
              <h2 className="text-white text-xl sm:text-2xl">Work Order <span className="text-gray-400 text-sm">#{initialTask.id}</span></h2>
              <p className="text-gray-400 text-xs sm:text-sm">
                Manage work order details and customer information.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-zinc-800"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Replace old status buttons with new component */}
          <WorkOrderStatusButtons 
            workOrderId={initialTask.id} 
            initialStatus={initialTask.status}
            onStatusChange={(newStatus) => setCurrentStatus(newStatus)}
          />

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
                          readOnly={true}
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
                          readOnly={true}
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
                          readOnly={true}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-gray-400">Address</Label>
                        <Input
                          value={formData.address || ""}
                          onChange={(e) =>
                            isEditing && setFormData({ ...formData, address: e.target.value })
                          }
                          className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                          readOnly={true}
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
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Year</Label>
                    <Input
                      value={formData.year}
                      onChange={(e) =>
                        isEditing && setFormData({ ...formData, year: e.target.value })
                      }
                      className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                      readOnly={true}
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
                      readOnly={true}
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
                      readOnly={true}
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
                      readOnly={true}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Color</Label>
                    <Input
                      value={formData.color}
                      onChange={(e) =>
                        isEditing && setFormData({ ...formData, color: e.target.value })
                      }
                      className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                      readOnly={!isEditing}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">VIN</Label>
                    <Input
                      value={formData.vin}
                      onChange={(e) =>
                        isEditing && setFormData({ ...formData, vin: e.target.value })
                      }
                      className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                      readOnly={true}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">License Plate</Label>
                      <Input
                        value={formData.licensePlate || ""}
                        onChange={(e) =>
                          isEditing && setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })
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

                  <Label className="text-gray-400 self-center sm:col-span-1">Priority</Label>
                  <div className="sm:col-span-3">
                    {isEditing ? (
                      <Select 
                        value={formData.taskPriority || "Medium"} 
                        onValueChange={(value) => setFormData({ ...formData, taskPriority: value })}
                      >
                        <SelectTrigger className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 w-full">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#292929] text-white border-[#626262]">
                          <SelectItem value="High">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-[#e23232] mr-2"></div>
                              High
                            </div>
                          </SelectItem>
                          <SelectItem value="Medium">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-[#d6cd24] mr-2"></div>
                              Medium
                            </div>
                          </SelectItem>
                          <SelectItem value="Low">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-[#1eb386] mr-2"></div>
                              Low
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 h-10 px-3 bg-[#292929] border border-[#626262] rounded-md">
                        <div className={`w-2 h-2 rounded-full ${
                          formData.taskPriority === "High" ? "bg-[#e23232]" : 
                          formData.taskPriority === "Low" ? "bg-[#1eb386]" : "bg-[#d6cd24]"
                        }`}></div>
                        <span className="text-white">{formData.taskPriority}</span>
                      </div>
                    )}
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

                  <Label className="text-gray-400 self-center sm:col-span-1">Assigned To</Label>
                  <div className="sm:col-span-3">
                    {isEditing ? (
                      <Select 
                        value={selectedStaffId || "none"} 
                        onValueChange={handleStaffChange}
                      >
                        <SelectTrigger className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 w-full">
                          <SelectValue placeholder="Select a staff member" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#292929] text-white border-[#626262]">
                          <SelectItem value="none">None</SelectItem>
                          {staffOptions.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.full_name} <span className="text-gray-400 text-xs">({staff.role})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={formData.assignedToName}
                        className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 w-full"
                        readOnly={true}
                      />
                    )}
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
              {/* DELETE BUTTON */}
              <Button
                variant="destructive"
                className="bg-[#e23232] text-white hover:bg-[#e23232]/80 w-full sm:w-auto order-1 sm:order-2"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              {currentStatus === "Completed" && (
                <Button
                  variant="outline"
                  className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white w-full sm:w-auto order-2 sm:order-1"
                  onClick={async () => {
                    if (invoiceInfo.exists && invoiceInfo.id) {
                      router.push(`/invoices?invoiceId=${invoiceInfo.id}`);
                      return;
                    }

                    const result = await generateInvoice(initialTask.id, shopId);
                    if (result === false) {
                        toast.error("Invoice already exists for this work order");
                    } else if (result && result !== true) {
                        const invoiceId = result[0].invoice_number;
                        toast.success("Invoice generated successfully", {
                            action: {
                                label: "Go to Invoice",
                                onClick: () => {
                                    router.push(`/invoices?invoiceId=${invoiceId}`);
                                }
                            }
                        });
                        setInvoiceInfo({ exists: true, id: invoiceId });
                    } else if (result === true) {
                        toast.success("Invoice generated successfully", {
                          action: {
                            label: "Go to Invoices",
                            onClick: () => {
                              router.push("/invoices");
                            }
                          }
                        });
                    }
                  }}
                >
                  {invoiceInfo.exists ? "View Invoice" : "Generate Invoice"}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    className="border border-[#626262] px-8 text-gray-300 hover:bg-[#626262] hover:text-white w-full sm:w-auto"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="px-8 bg-[#22C55E] hover:bg-[#22C55E]/80 text-white rounded-lg"
                    onClick={handleSave}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white w-full sm:w-auto"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

			{/* Right side panel */}
			<div className="w-[350px] bg-[#131313] border-l border-[#222222] flex flex-col h-full">
				{/* Content */}
				<div className="flex-1 overflow-hidden">
					<MechanicsHubChat 
						shopId={shopId} 
						taskId={initialTask.id}
						workOrderData={initialTask}
					/>
				</div>
			</div>

		</div>
    </div>
  )
}
