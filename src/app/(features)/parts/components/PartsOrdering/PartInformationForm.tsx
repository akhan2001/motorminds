'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Hash, Type } from 'lucide-react'
import { PartItem } from '@/app/(features)/parts/types/parts'

interface PartInformationFormProps {
    partInfo: PartItem
    onChange: (field: keyof PartItem, value: string | number | undefined) => void
    className?: string
}

export default function PartInformationForm({ 
    partInfo, 
    onChange, 
    className = "" 
}: PartInformationFormProps) {
    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="text-lg font-medium text-white">Part Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="part_number" className="text-gray-300">
                        Part Number *
                    </Label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="part_number"
                            value={partInfo.part_number || ''}
                            onChange={(e) => onChange('part_number', e.target.value)}
                            placeholder="ABC123-456"
                            className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="part_name" className="text-gray-300">
                        Part Name *
                    </Label>
                    <div className="relative">
                        <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="part_name"
                            value={partInfo.part_name || ''}
                            onChange={(e) => onChange('part_name', e.target.value)}
                            placeholder="Brake Pad Set"
                            className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white"
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">
                    Description
                </Label>
                <Textarea
                    id="description"
                    value={partInfo.description || ''}
                    onChange={(e) => onChange('description', e.target.value)}
                    placeholder="Front brake pads for 2018 Honda Civic..."
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white min-h-[80px]"
                />
            </div>
        </div>
    )
}
