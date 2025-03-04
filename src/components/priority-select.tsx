"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface PrioritySelectProps {
  value: string
  onChange: (value: string) => void
}

export function PrioritySelect({ value, onChange }: PrioritySelectProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-gray-400">Task Priority</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-[#1A1A1A] border-0 text-white h-9">
          <SelectValue placeholder="Select priority">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  value === "high" ? "bg-[#e23232]" : value === "medium" ? "bg-[#d6cd24]" : "bg-[#1eb386]"
                }`}
              />
              <span className="capitalize">{value}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#1A1A1A] border-[#2d2d2d]">
          <SelectItem value="high" className="text-white hover:bg-[#222222] focus:bg-[#222222] cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#e23232]" />
              High
            </div>
          </SelectItem>
          <SelectItem value="medium" className="text-white hover:bg-[#222222] focus:bg-[#222222] cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#d6cd24]" />
              Medium
            </div>
          </SelectItem>
          <SelectItem value="low" className="text-white hover:bg-[#222222] focus:bg-[#222222] cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#1eb386]" />
              Low
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

