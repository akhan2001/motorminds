'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Package } from 'lucide-react'
import { PartItem } from '@/app/(features)/voice-calling/types'

interface PartsCallFormProps {
    partInfo: PartItem
    onPartChange: (field: keyof PartItem, value: string | number) => void
}

export default function PartsCallForm({ 
    partInfo, 
    onPartChange 
}: PartsCallFormProps) {
    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Package className="h-5 w-5 text-yellow-400" />
                    Parts Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label className="text-white">Part Name</Label>
                        <Input
                            value={partInfo.partName}
                            onChange={(e) => onPartChange('partName', e.target.value)}
                            placeholder="Brake Pads"
                            className="bg-gray-900 border-gray-700 text-white"
                        />
                    </div>
                    <div>
                        <Label className="text-white">Part Number</Label>
                        <Input
                            value={partInfo.partNumber}
                            onChange={(e) => onPartChange('partNumber', e.target.value)}
                            placeholder="BP-123456"
                            className="bg-gray-900 border-gray-700 text-white"
                        />
                    </div>
                    <div>
                        <Label className="text-white">Quantity</Label>
                        <Input
                            type="number"
                            value={partInfo.quantity}
                            onChange={(e) => onPartChange('quantity', parseInt(e.target.value) || 1)}
                            min="1"
                            className="bg-gray-900 border-gray-700 text-white"
                        />
                    </div>
                </div>
                <div>
                    <Label className="text-white">Description</Label>
                    <Textarea
                        value={partInfo.description}
                        onChange={(e) => onPartChange('description', e.target.value)}
                        placeholder="Additional details about the part needed..."
                        className="bg-gray-900 border-gray-700 text-white"
                        rows={3}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
