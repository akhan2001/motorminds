'use client'

import { X, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getPriorityColor } from "@/lib/utils/status"
import { WorkOrderPriority } from "../../../types/work-order"
import { TechnicianDropdown } from "@/app/(features)/technician"
import { useAuth } from "../../../hooks/use-auth"

export interface WorkOrderInformationProps {
    title: string
    description: string
    priority: WorkOrderPriority
    assignee: string
    assigneeId?: string
    date: string
    tags: string[]
    isEditing: boolean
    isCreating?: boolean
    onFieldChange: (field: string, value: any) => void
    onTechnicianSelect?: (technicianId: string, technicianData?: any) => void
    onAddTag: (tag: string) => void
    onRemoveTag: (tag: string) => void
    className?: string
}

export const WorkOrderInformation: React.FC<WorkOrderInformationProps> = ({
    title,
    description,
    priority,
    assignee,
    assigneeId,
    date,
    tags,
    isEditing,
    isCreating = false,
    onFieldChange,
    onTechnicianSelect,
    onAddTag,
    onRemoveTag,
    className = ""
}) => {
    const { shopId } = useAuth()

    // Handle technician selection
    const handleTechnicianSelect = (technicianId: string, technicianData?: any) => {
        if (technicianId === "none") {
            onFieldChange('assignee', '')
            onTechnicianSelect?.("none")
        } else if (technicianData) {
            onFieldChange('assignee', technicianData.fullName)
            onTechnicianSelect?.(technicianId, technicianData)
        }
    }
    const priorityOptions = [
        { value: 'low' as WorkOrderPriority, label: 'Low', color: 'bg-green-500' },
        { value: 'medium' as WorkOrderPriority, label: 'Medium', color: 'bg-yellow-500' },
        { value: 'high' as WorkOrderPriority, label: 'High', color: 'bg-orange-500' },
        { value: 'urgent' as WorkOrderPriority, label: 'Urgent', color: 'bg-red-500' },
    ]

    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="text-lg font-medium text-white">Work Order Information</h3>
            <div className="bg-[#1A1A1A] rounded-xl p-6">
                <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-gray-400">Title *</Label>
                            <Input
                                value={title}
                                onChange={(e) => {
                                    if (isEditing) {
                                        // Convert to title case and limit to 30 characters
                                        const value = e.target.value
                                            .slice(0, 100)
                                            .toLowerCase()
                                            .replace(/\b\w/g, (char) => char.toUpperCase())
                                        onFieldChange('title', value)
                                    }
                                }}
                                className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
                                readOnly={!isEditing}
                                maxLength={100}
                                placeholder={isEditing ? "Brief Title for Work Order" : ""}
                            />
                            {isEditing && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {title.length}/100 characters
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-400">Priority</Label>
                            {isEditing ? (
                                <Select 
                                    value={priority} 
                                    onValueChange={(value) => onFieldChange('priority', value as WorkOrderPriority)}
                                >
                                    <SelectTrigger className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] text-white border-[#2a2a2a]">
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
                                <div className="flex items-center gap-2 h-10 px-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md">
                                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(priority)}`}></div>
                                    <span className="text-white capitalize text-sm">{priority}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <Label className="text-gray-400">Description</Label>
                        <textarea
                            value={description}
                            onChange={(e) => isEditing && onFieldChange('description', e.target.value)}
                            className="w-full bg-[#1a1a1a] text-white text-sm border border-[#2a2a2a] focus:ring-gray-500 rounded-md p-2 min-h-[80px] max-h-[200px] overflow-y-auto"
                            readOnly={!isEditing}
                            placeholder={isEditing ? "Describe the work to be performed..." : ""}
                        />
                        {isEditing && (
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Adding a detailed description helps the AI better understand and assist with this work order
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-gray-400">Assigned To</Label>
                            <TechnicianDropdown
                                shopId={shopId || ""}
                                selectedTechnicianId={assigneeId || "none"}
                                onTechnicianSelect={handleTechnicianSelect}
                                placeholder="Select technician"
                                className="w-full"
                                showNoneOption={true}
                                disabled={!isEditing}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-400">Date</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => isEditing && onFieldChange('date', e.target.value)}
                                className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                readOnly={!isEditing}
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    {/* <div className="space-y-1.5">
                        <Label className="text-gray-400">Tags</Label>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
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
                                            onClick={() => onRemoveTag(tag)}
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
                                        if (newTag) onAddTag(newTag)
                                    }}
                                >
                                    + Add Tag
                                </Badge>
                            )}
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    )
}
