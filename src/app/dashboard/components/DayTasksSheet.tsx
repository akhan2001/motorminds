'use client'

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"

interface CalendarTask {
    id: string;
    created_at: string;
    status: string;
    title: string;
}

interface DayTasksSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    selectedDate: Date | null;
    tasks: CalendarTask[];
    onTaskClick: (task: CalendarTask) => void;
}

function getStatusColorClass(status: string): string {
    switch (status) {
        case "Pending":
            return "bg-yellow-500";
        case "In Progress":
            return "bg-blue-500";
        case "Completed":
            return "bg-green-500";
        default:
            return "bg-gray-500";
    }
}

export function DayTasksSheet({
    isOpen,
    onOpenChange,
    selectedDate,
    tasks,
    onTaskClick,
}: DayTasksSheetProps) {
    if (!selectedDate) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] bg-[#1C1C1C] text-white border-l border-gray-700">
                <SheetHeader>
                    <SheetTitle className="text-white text-xl">
                        Tasks for {format(selectedDate, "PPP")}
                    </SheetTitle>
                    <SheetDescription>
                        {tasks.length > 0 ? `You have ${tasks.length} task(s) for this day.` : "No tasks scheduled for this day."}
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100%-80px)] mt-4 pr-4">
                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-[#2A2A2A] p-4 rounded-lg cursor-pointer hover:bg-[#3A3A3A] transition-colors"
                                onClick={() => onTaskClick(task)}
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">{task.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">{task.status}</span>
                                        <div className={`w-3 h-3 rounded-full ${getStatusColorClass(task.status)}`}></div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 mt-2">
                                    Created at: {format(new Date(task.created_at), "p")}
                                </p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
} 