'use client'

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface FinancialInformationProps {
    estimatedHours: string
    laborCost: string
    partsCost: string
    totalCost: string
    isEditing: boolean
    onFieldChange: (field: string, value: string) => void
    className?: string
}

export const FinancialInformation: React.FC<FinancialInformationProps> = ({
    estimatedHours,
    laborCost,
    partsCost,
    totalCost,
    isEditing,
    onFieldChange,
    className = ""
}) => {
    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="text-lg font-medium text-white">Financial Information</h3>
            <div className="bg-[#1A1A1A] rounded-xl p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-gray-400">Estimated Hours</Label>
                        <Input
                            value={estimatedHours}
                            onChange={(e) => isEditing && onFieldChange('estimatedHours', e.target.value)}
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
                                value={laborCost}
                                onChange={(e) => isEditing && onFieldChange('laborCost', e.target.value || "0")}
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
                                value={partsCost}
                                onChange={(e) => isEditing && onFieldChange('partsCost', e.target.value || "0")}
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
                        <span className="text-white text-2xl font-bold">$ {totalCost}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
