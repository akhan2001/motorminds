'use client'

import { useState, useEffect } from "react"
import { X, Edit2, Trash2, Calendar, User, Tag, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { WorkOrderKanbanItem, WorkOrderPriority } from "../../types/work-order"
import { formatDate } from "@/lib/utils/date"
import { truncateText, getInitials } from "@/lib/utils/text"
import { getPriorityColor } from "@/lib/utils/status"

export interface WorkOrderDetailsModalProps {
    workOrder: WorkOrderKanbanItem
    onClose: () => void
    onSave?: (updated: WorkOrderKanbanItem) => void
    onDelete?: (workOrderId: string) => void
    className?: string
}

export const WorkOrderDetailsModal: React.FC<WorkOrderDetailsModalProps> = ({ 
    workOrder: initialWorkOrder,
    onClose,
    onSave,
    onDelete,
    className = ""
}) => {
    const [isEditing, setIsEditing] = useState(false)
    const [currentStatus, setCurrentStatus] = useState('pending') // Since it's from kanban
    
    // Form state for editing
    const [formData, setFormData] = useState({
        title: initialWorkOrder.title || "",
        description: initialWorkOrder.description || "",
        priority: (initialWorkOrder.priority || "medium") as WorkOrderPriority,
        assignee: initialWorkOrder.assignee || "",
        date: initialWorkOrder.date || "",
        customer: initialWorkOrder.customer || "",
        vehicle: initialWorkOrder.vehicle || "",
        tags: initialWorkOrder.tags || [],
        
        // Additional fields for comprehensive display
        customerEmail: "customer@example.com", // Mock data
        customerPhone: "+1 (555) 123-4567", // Mock data
        customerAddress: "123 Main St, City, State 12345", // Mock data
        
        // Vehicle details (expanded from vehicle string)
        vehicleYear: "2015",
        vehicleMake: "Honda",
        vehicleModel: "Civic",
        vehicleColor: "Blue",
        vehicleMileage: "85,432",
        vehicleVin: "1HGBH41JXMN109186",
        vehicleLicensePlate: "ABC123",
        
        // Work order specifics
        estimatedHours: "3.5",
        laborCost: "245.00",
        partsCost: "125.50",
        totalCost: "370.50",
        notes: "Customer reported strange noise when braking. Initial inspection suggests brake pad replacement needed.",
    })

    // Update form when work order changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            title: initialWorkOrder.title || "",
            description: initialWorkOrder.description || "",
            priority: (initialWorkOrder.priority || "medium") as WorkOrderPriority,
            assignee: initialWorkOrder.assignee || "",
            date: initialWorkOrder.date || "",
            customer: initialWorkOrder.customer || "",
            vehicle: initialWorkOrder.vehicle || "",
            tags: initialWorkOrder.tags || [],
        }))
    }, [initialWorkOrder])

    // Calculate total cost when labor or parts change
    useEffect(() => {
        const labor = parseFloat(formData.laborCost) || 0
        const parts = parseFloat(formData.partsCost) || 0
        const total = labor + parts
        setFormData(prev => ({
            ...prev,
            totalCost: total.toFixed(2)
        }))
    }, [formData.laborCost, formData.partsCost])

    const handleSave = () => {
        const updatedWorkOrder: WorkOrderKanbanItem = {
            ...initialWorkOrder,
            title: formData.title,
            description: formData.description,
            priority: formData.priority as WorkOrderPriority,
            assignee: formData.assignee,
            date: formData.date,
            customer: formData.customer,
            vehicle: formData.vehicle,
            tags: formData.tags,
        }

        onSave?.(updatedWorkOrder)
        setIsEditing(false)
        toast.success("Work order updated successfully")
    }

    const handleDelete = () => {
        onDelete?.(initialWorkOrder.id)
        toast.success("Work order deleted successfully")
        onClose()
    }

    const handleAddTag = (newTag: string) => {
        if (newTag && !formData.tags.includes(newTag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag]
            }))
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }

    const priorityOptions = [
        { value: 'low' as WorkOrderPriority, label: 'Low', color: 'bg-green-500' },
        { value: 'medium' as WorkOrderPriority, label: 'Medium', color: 'bg-yellow-500' },
        { value: 'high' as WorkOrderPriority, label: 'High', color: 'bg-orange-500' },
        { value: 'urgent' as WorkOrderPriority, label: 'Urgent', color: 'bg-red-500' },
    ]

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center overflow-hidden">
            <div className="bg-[#131313] text-white border-none rounded-lg shadow-lg flex max-h-[90vh] w-[95vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw]">
                {/* Main content */}
                <div className="flex-1 flex flex-col">
                    {/* HEADER */}
                    <div className="flex items-center justify-between p-6 border-b border-[#222222] shrink-0">
                        <div className="space-y-1">
                            <h2 className="text-white text-xl sm:text-2xl">
                                Work Order <span className="text-gray-400 text-sm">#{initialWorkOrder.id}</span>
                            </h2>
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

                    {/* STATUS AND PRIORITY BAR */}
                    <div className="flex items-center justify-between p-4 bg-[#1A1A1A] border-b border-[#222222]">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${getPriorityColor(formData.priority)}`} />
                                <span className="text-sm font-medium text-white capitalize">{formData.priority} Priority</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-300">{formData.date}</span>
                            </div>
                            {formData.assignee && (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-300">{formData.assignee}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-500 text-black">Pending</Badge>
                        </div>
                    </div>

                    {/* MAIN CONTENT */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Work Order Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-white">Work Order Information</h3>
                            <div className="bg-[#1A1A1A] rounded-xl p-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-gray-400">Title</Label>
                                            <Input
                                                value={formData.title}
                                                onChange={(e) =>
                                                    isEditing && setFormData({ ...formData, title: e.target.value })
                                                }
                                                className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                                readOnly={!isEditing}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-gray-400">Priority</Label>
                                            {isEditing ? (
                                                <Select 
                                                    value={formData.priority} 
                                                    onValueChange={(value) => setFormData({ ...formData, priority: value as WorkOrderPriority })}
                                                >
                                                    <SelectTrigger className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500">
                                                        <SelectValue placeholder="Select priority" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#292929] text-white border-[#626262]">
                                                        {priorityOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                <div className="flex items-center">
                                                                    <div className={`w-2 h-2 rounded-full ${option.color} mr-2`}></div>
                                                                    {option.label}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="flex items-center gap-2 h-10 px-3 bg-[#292929] border border-[#626262] rounded-md">
                                                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(formData.priority)}`}></div>
                                                    <span className="text-white capitalize">{formData.priority}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">Description</Label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) =>
                                                isEditing && setFormData({ ...formData, description: e.target.value })
                                            }
                                            className="w-full bg-[#292929] text-white border-[#626262] focus:ring-gray-500 rounded-md p-2 min-h-[80px]"
                                            readOnly={!isEditing}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-gray-400">Assigned To</Label>
                                            <Input
                                                value={formData.assignee}
                                                onChange={(e) =>
                                                    isEditing && setFormData({ ...formData, assignee: e.target.value })
                                                }
                                                className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                                readOnly={!isEditing}
                                                placeholder="Assign technician"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-gray-400">Due Date</Label>
                                            <Input
                                                value={formData.date}
                                                onChange={(e) =>
                                                    isEditing && setFormData({ ...formData, date: e.target.value })
                                                }
                                                className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                                readOnly={!isEditing}
                                            />
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">Tags</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.tags.map((tag, index) => (
                                                <Badge 
                                                    key={index} 
                                                    variant="secondary" 
                                                    className="text-xs bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] flex items-center gap-1"
                                                >
                                                    <Tag className="h-3 w-3" />
                                                    {tag}
                                                    {isEditing && (
                                                        <X 
                                                            className="h-3 w-3 cursor-pointer hover:text-red-400" 
                                                            onClick={() => handleRemoveTag(tag)}
                                                        />
                                                    )}
                                                </Badge>
                                            ))}
                                            {isEditing && (
                                                <Badge 
                                                    variant="outline" 
                                                    className="text-xs border-dashed border-gray-400 text-gray-400 hover:border-white hover:text-white cursor-pointer"
                                                    onClick={() => {
                                                        const newTag = prompt("Enter new tag:")
                                                        if (newTag) handleAddTag(newTag)
                                                    }}
                                                >
                                                    + Add Tag
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-white">Customer Information</h3>
                            <div className="bg-[#1A1A1A] rounded-xl p-6">
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src="/placeholder.svg?height=64&width=64" />
                                        <AvatarFallback className="bg-[#b22222] text-white text-xl">
                                            {getInitials(formData.customer)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-gray-400">Customer Name</Label>
                                                <Input
                                                    value={formData.customer}
                                                    onChange={(e) =>
                                                        isEditing && setFormData({ ...formData, customer: e.target.value })
                                                    }
                                                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                                    readOnly={!isEditing}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-gray-400">Email</Label>
                                                <Input
                                                    value={formData.customerEmail}
                                                    onChange={(e) =>
                                                        isEditing && setFormData({ ...formData, customerEmail: e.target.value })
                                                    }
                                                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                                    readOnly={!isEditing}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-gray-400">Phone</Label>
                                                <Input
                                                    value={formData.customerPhone}
                                                    onChange={(e) =>
                                                        isEditing && setFormData({ ...formData, customerPhone: e.target.value })
                                                    }
                                                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                                    readOnly={!isEditing}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-gray-400">Address</Label>
                                                <Input
                                                    value={formData.customerAddress}
                                                    onChange={(e) =>
                                                        isEditing && setFormData({ ...formData, customerAddress: e.target.value })
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
                                            value={formData.vehicleYear}
                                            onChange={(e) =>
                                                isEditing && setFormData({ ...formData, vehicleYear: e.target.value })
                                            }
                                            className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                            readOnly={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">Make</Label>
                                        <Input
                                            value={formData.vehicleMake}
                                            onChange={(e) =>
                                                isEditing && setFormData({ ...formData, vehicleMake: e.target.value })
                                            }
                                            className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                            readOnly={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">Model</Label>
                                        <Input
                                            value={formData.vehicleModel}
                                            onChange={(e) =>
                                                isEditing && setFormData({ ...formData, vehicleModel: e.target.value })
                                            }
                                            className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                            readOnly={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">Color</Label>
                                        <Input
                                            value={formData.vehicleColor}
                                            onChange={(e) =>
                                                isEditing && setFormData({ ...formData, vehicleColor: e.target.value })
                                            }
                                            className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                            readOnly={!isEditing}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">VIN</Label>
                                        <Input
                                            value={formData.vehicleVin}
                                            onChange={(e) =>
                                                isEditing && setFormData({ ...formData, vehicleVin: e.target.value })
                                            }
                                            className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                            readOnly={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">License Plate</Label>
                                        <Input
                                            value={formData.vehicleLicensePlate}
                                            onChange={(e) =>
                                                isEditing && setFormData({ ...formData, vehicleLicensePlate: e.target.value.toUpperCase() })
                                            }
                                            className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                            readOnly={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">Mileage</Label>
                                        <Input
                                            value={formData.vehicleMileage}
                                            onChange={(e) =>
                                                isEditing && setFormData({ ...formData, vehicleMileage: e.target.value })
                                            }
                                            className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                            readOnly={!isEditing}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-white">Financial Information</h3>
                            <div className="bg-[#1A1A1A] rounded-xl p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">Estimated Hours</Label>
                                        <Input
                                            value={formData.estimatedHours}
                                            onChange={(e) =>
                                                isEditing && setFormData({ ...formData, estimatedHours: e.target.value })
                                            }
                                            className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                            readOnly={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">Labor Cost</Label>
                                        <div className="flex items-center">
                                            <span className="text-gray-300 bg-[#292929] border border-[#626262] border-r-0 px-3 py-2 rounded-l-md">$</span>
                                            <Input
                                                type="number"
                                                value={formData.laborCost}
                                                onChange={(e) =>
                                                    isEditing && setFormData({ ...formData, laborCost: e.target.value || "0" })
                                                }
                                                className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 rounded-l-none"
                                                readOnly={!isEditing}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">Parts Cost</Label>
                                        <div className="flex items-center">
                                            <span className="text-gray-300 bg-[#292929] border border-[#626262] border-r-0 px-3 py-2 rounded-l-md">$</span>
                                            <Input
                                                type="number"
                                                value={formData.partsCost}
                                                onChange={(e) =>
                                                    isEditing && setFormData({ ...formData, partsCost: e.target.value || "0" })
                                                }
                                                className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 rounded-l-none"
                                                readOnly={!isEditing}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 p-4 bg-[#222222] rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-gray-400 text-lg">Total Cost</Label>
                                        <span className="text-white text-2xl font-bold">$ {formData.totalCost}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-white">Notes</h3>
                            <div className="bg-[#1A1A1A] rounded-xl p-6">
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) =>
                                        isEditing && setFormData({ ...formData, notes: e.target.value })
                                    }
                                    className="w-full bg-[#292929] text-white border-[#626262] focus:ring-gray-500 rounded-md p-3 min-h-[120px]"
                                    placeholder="Enter notes about the work order..."
                                    readOnly={!isEditing}
                                />
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="flex items-center justify-between p-6 border-t border-[#222222] shrink-0">
                        <div className="flex items-center gap-2">
                            {onDelete && (
                                <Button
                                    variant="destructive"
                                    className="bg-[#e23232] text-white hover:bg-[#e23232]/80"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="outline"
                                        className="border border-[#626262] px-8 text-gray-300 hover:bg-[#626262] hover:text-white"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="px-8 bg-[#22C55E] hover:bg-[#22C55E]/80 text-white"
                                        onClick={handleSave}
                                    >
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                                        onClick={onClose}
                                    >
                                        Close
                                    </Button>
                                    {onSave && (
                                        <Button
                                            variant="outline"
                                            className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <Edit2 className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WorkOrderDetailsModal
