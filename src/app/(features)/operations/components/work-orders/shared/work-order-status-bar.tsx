'use client'

import { Calendar, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getPriorityColor } from "@/lib/utils/status"
import { WorkOrderPriority } from "../../../types/work-order"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

export interface WorkOrderStatusBarProps {
    priority: WorkOrderPriority
    date: string
    assignee?: string
    status?: string
    className?: string
}

export const WorkOrderStatusBar: React.FC<WorkOrderStatusBarProps> = ({
    priority,
    date,
    assignee,
    status = "pending",
    className = ""
}) => {
    return (
        <div className={`flex items-center justify-between p-4 bg-slate-50 dark:bg-[#1A1A1A] border-b border-border dark:border-[#222222] ${className}`}>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`} />
                    <span className="text-sm font-medium text-foreground dark:text-white capitalize">{priority} Priority</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                    <span className="text-sm text-foreground dark:text-gray-300">{date}</span>
                </div>
                {assignee && (
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                                        <span className="text-sm text-foreground dark:text-gray-300">{assignee}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#1f1f1f] text-popover-foreground dark:text-white">
                                    <span className="text-sm text-foreground dark:text-gray-300">Assigned Technician</span>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Badge className="bg-yellow-500 text-black capitalize">{status}</Badge>
            </div>
        </div>
    )
}
