'use client'

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/utils/supabase/client"
import type { TechnicianOption, TechnicianDropdownProps } from "../types"

export const TechnicianDropdown: React.FC<TechnicianDropdownProps> = ({
    shopId,
    selectedTechnicianId,
    onTechnicianSelect,
    placeholder = "Select Technician",
    disabled = false,
    className = "",
    showNoneOption = true
}) => {
    const [technicianOptions, setTechnicianOptions] = useState<TechnicianOption[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Fetch technicians on mount
    useEffect(() => {
        async function fetchTechnicians() {
            if (!shopId) return
            
            setIsLoading(true)
            try {
                const supabase = createClient()
                const { data: employeesData, error } = await supabase
                    .from("employees")
                    .select("id, first_name, last_name, role")
                    .eq("shop_id", shopId)
                    .is('termination_date', null) // Only active employees

                if (!error && employeesData) {
                    const options: TechnicianOption[] = employeesData.map((emp: any) => {
                        const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
                        return {
                            id: emp.id,
                            firstName: emp.first_name,
                            lastName: emp.last_name,
                            fullName: fullName || 'Unnamed Employee',
                            role: emp.role,
                        }
                    })
                    setTechnicianOptions(options)
                }
            } catch (error) {
                console.error("Error fetching technicians:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchTechnicians()
    }, [shopId])

    // Handle technician selection
    const handleTechnicianChange = (value: string) => {
        if (value === "none") {
            onTechnicianSelect("none")
        } else {
            const selectedTech = technicianOptions.find((opt) => opt.id === value)
            onTechnicianSelect(value, selectedTech)
        }
    }

    return (
        <Select
            value={selectedTechnicianId}
            onValueChange={handleTechnicianChange}
            disabled={disabled || isLoading}
        >
            <SelectTrigger className={`bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 ${className}`}>
                <SelectValue placeholder={isLoading ? "Loading technicians..." : placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-[#292929] text-white border-[#626262]">
                {showNoneOption && (
                    <SelectItem value="none">None</SelectItem>
                )}
                {technicianOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                        {option.fullName} <span className="text-gray-400 text-xs">({option.role})</span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

export default TechnicianDropdown
