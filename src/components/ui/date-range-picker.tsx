"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
    dateRange: DateRange | undefined
    onDateRangeChange: (range: DateRange | undefined) => void
    className?: string
    placeholder?: string
}

export function DateRangePicker({
    dateRange,
    onDateRangeChange,
    className,
    placeholder = "Select date range"
}: DateRangePickerProps) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant="outline"
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            "bg-white dark:bg-background border-border text-foreground",
                            !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={onDateRangeChange}
                        numberOfMonths={2}
                        className="bg-popover"
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}

// Preset date ranges for quick selection
export const dateRangePresets = [
    {
        label: "Today",
        getValue: () => {
            const today = new Date()
            return { from: today, to: today }
        }
    },
    {
        label: "Yesterday",
        getValue: () => {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            return { from: yesterday, to: yesterday }
        }
    },
    {
        label: "Last 7 days",
        getValue: () => {
            const to = new Date()
            const from = new Date()
            from.setDate(from.getDate() - 7)
            return { from, to }
        }
    },
    {
        label: "Last 30 days",
        getValue: () => {
            const to = new Date()
            const from = new Date()
            from.setDate(from.getDate() - 30)
            return { from, to }
        }
    },
    {
        label: "This month",
        getValue: () => {
            const to = new Date()
            const from = new Date(to.getFullYear(), to.getMonth(), 1)
            return { from, to }
        }
    },
    {
        label: "Last month",
        getValue: () => {
            const to = new Date()
            to.setDate(0) // Last day of previous month
            const from = new Date(to.getFullYear(), to.getMonth(), 1)
            return { from, to }
        }
    },
    {
        label: "This quarter",
        getValue: () => {
            const to = new Date()
            const quarter = Math.floor(to.getMonth() / 3)
            const from = new Date(to.getFullYear(), quarter * 3, 1)
            return { from, to }
        }
    },
    {
        label: "This year",
        getValue: () => {
            const to = new Date()
            const from = new Date(to.getFullYear(), 0, 1)
            return { from, to }
        }
    },
    {
        label: "Last year",
        getValue: () => {
            const to = new Date()
            const from = new Date(to.getFullYear() - 1, 0, 1)
            const toDate = new Date(to.getFullYear() - 1, 11, 31)
            return { from, to: toDate }
        }
    }
]
