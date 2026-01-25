'use client'

import React, { useState, useEffect } from 'react'
import { X, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getPriorityColor } from "@/lib/utils/status"
import { WorkOrderPriority } from "../../../types/work-order"
import { TechnicianDropdown } from "@/app/(features)/technician"
import { useAuth } from "../../../hooks/use-auth"
import { StatusTrackerSelector } from "../status-tracker-selector"
import type { StatusTracker } from "../../../types/status-tracker"
import { WORK_ORDER_TITLE_CATEGORIES, OTHER_CATEGORY } from "../../../lib/work-order-title-categories"

export interface WorkOrderInformationProps {
    title: string
    description: string
    priority: WorkOrderPriority
    assignee: string
    assigneeId?: string
    date: string
    tags: string[]
    statusTracker?: StatusTracker[] | null // Changed to array
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
    statusTracker,
    isEditing,
    isCreating = false,
    onFieldChange,
    onTechnicianSelect,
    onAddTag,
    onRemoveTag,
    className = ""
}) => {
    const { shopId } = useAuth()
    
    // Determine if current title is a category or custom
    const isTitleACategory = WORK_ORDER_TITLE_CATEGORIES.includes(title as any)
    const [selectedCategory, setSelectedCategory] = useState<string>(
        isTitleACategory ? title : OTHER_CATEGORY
    )
    const [customTitle, setCustomTitle] = useState<string>(
        isTitleACategory ? '' : title
    )

    // Update selected category when title prop changes externally
    useEffect(() => {
        const isCategory = WORK_ORDER_TITLE_CATEGORIES.includes(title as any)
        if (isCategory) {
            setSelectedCategory(title)
            setCustomTitle('')
        } else if (title) {
            setSelectedCategory(OTHER_CATEGORY)
            setCustomTitle(title)
        }
    }, [title])

    // Handle category selection
    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value)
        if (value === OTHER_CATEGORY) {
            // If switching to "Other", keep current custom title or clear it
            if (customTitle) {
                onFieldChange('title', customTitle)
            } else {
                onFieldChange('title', '')
            }
        } else {
            // If selecting a category, set it as title and clear custom
            setCustomTitle('')
            onFieldChange('title', value)
        }
    }

    // Handle custom title input
    const handleCustomTitleChange = (value: string) => {
        const formattedValue = value
            .slice(0, 100)
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase())
        setCustomTitle(formattedValue)
        onFieldChange('title', formattedValue)
    }

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
            <h3 className="text-lg font-medium text-foreground dark:text-white">Work Order Information</h3>
            <div className="bg-card dark:bg-[#131313] rounded-xl p-6 border border-border dark:border-[#333333]">
                <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground dark:text-gray-400">Title *</Label>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <Select
                                        value={selectedCategory}
                                        onValueChange={handleCategoryChange}
                                    >
                                        <SelectTrigger className={`text-foreground dark:text-white border-border dark:border-[#333333] focus:ring-gray-500 ${
                                            isEditing 
                                                ? 'bg-background dark:bg-[#1a1a1a]' 
                                                : 'bg-card dark:bg-[#131313]'
                                        }`}>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover dark:bg-[#1a1a1a] text-popover-foreground dark:text-white border-border dark:border-[#333333]">
                                            {WORK_ORDER_TITLE_CATEGORIES.map((category) => (
                                                <SelectItem 
                                                    key={category} 
                                                    value={category}
                                                    className="hover:bg-accent dark:hover:bg-[#2a2a2a]"
                                                >
                                                    {category}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedCategory === OTHER_CATEGORY && (
                                        <Input
                                            value={customTitle}
                                            onChange={(e) => handleCustomTitleChange(e.target.value)}
                                            className={`text-foreground dark:text-white border-border dark:border-[#333333] focus:ring-gray-500 ${
                                                isEditing 
                                                    ? 'bg-background dark:bg-[#1a1a1a]' 
                                                    : 'bg-card dark:bg-[#131313]'
                                            }`}
                                            maxLength={100}
                                            placeholder="Enter custom title..."
                                        />
                                    )}
                                    <p className="text-xs text-muted-foreground dark:text-gray-500">
                                        {selectedCategory === OTHER_CATEGORY ? customTitle.length : selectedCategory.length}/100 characters
                                    </p>
                                </div>
                            ) : (
                                <div className="h-10 px-3 bg-card dark:bg-[#131313] border border-border dark:border-[#333333] rounded-md flex items-center">
                                    <span className="text-foreground dark:text-white text-sm">{title || '—'}</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground dark:text-gray-400">Priority</Label>
                            {isEditing ? (
                                <Select 
                                    value={priority} 
                                    onValueChange={(value) => onFieldChange('priority', value as WorkOrderPriority)}
                                >
                                    <SelectTrigger className={`text-foreground dark:text-white border-border dark:border-[#333333] focus:ring-gray-500 ${
                                        isEditing 
                                            ? 'bg-background dark:bg-[#1a1a1a]' 
                                            : 'bg-card dark:bg-[#131313]'
                                    }`}>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover dark:bg-[#1a1a1a] text-popover-foreground dark:text-white border-border dark:border-[#333333]">
                                        {priorityOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value} className="hover:bg-accent dark:hover:bg-[#2a2a2a]">
                                                <div className="flex items-center">
                                                    <div className={`w-2 h-2 rounded-full ${option.color} mr-2`}></div>
                                                    {option.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="flex items-center gap-2 h-10 px-3 bg-card dark:bg-[#131313] border border-border dark:border-[#333333] rounded-md">
                                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(priority)}`}></div>
                                    <span className="text-foreground dark:text-white capitalize text-sm">{priority}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground dark:text-gray-400">Customer Requests</Label>
                        <textarea
                            value={description}
                            onChange={(e) => isEditing && onFieldChange('description', e.target.value)}
                            className={`w-full text-foreground dark:text-white text-sm border border-border dark:border-[#333333] focus:ring-gray-500 rounded-md p-2 min-h-[80px] max-h-[200px] overflow-y-auto ${
                                isEditing 
                                    ? 'bg-background dark:bg-[#1a1a1a]' 
                                    : 'bg-card dark:bg-[#131313]'
                            }`}
                            readOnly={!isEditing}
                            placeholder={isEditing ? "What does the customer want done?..." : ""}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground dark:text-gray-400">Assigned To</Label>
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
                            <Label className="text-muted-foreground dark:text-gray-400">Date</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => isEditing && onFieldChange('date', e.target.value)}
                                className={`text-foreground dark:text-white border-border dark:border-[#333333] focus:ring-gray-500 dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                                    isEditing 
                                        ? 'bg-background dark:bg-[#1a1a1a]' 
                                        : 'bg-card dark:bg-[#131313]'
                                }`}
                                readOnly={!isEditing}
                            />
                        </div>
                    </div>

                    {/* Status Tracker - Only show when NOT creating */}
                    {!isCreating && (
                        <StatusTrackerSelector
                            value={statusTracker}
                            onChange={(tracker) => onFieldChange('statusTracker', tracker)}
                            disabled={!isEditing}
                        />
                    )}

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
