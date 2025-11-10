'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Loader2, X } from 'lucide-react'
import { format } from 'date-fns'
import type { CustomerSegment } from '../types/mass-campaign'

interface CustomerSegmentBuilderProps {
    value: CustomerSegment
    onChange: (segment: CustomerSegment) => void
    onPreview?: (count: number) => void
}

export function CustomerSegmentBuilder({ value, onChange, onPreview }: CustomerSegmentBuilderProps) {
    const [localSegment, setLocalSegment] = useState<CustomerSegment>(value)
    const [isPreviewLoading, setIsPreviewLoading] = useState(false)
    const [previewCount, setPreviewCount] = useState<number | null>(null)
    const [isAllCustomers, setIsAllCustomers] = useState(false)

    // Service types
    const serviceTypes = [
        'oil_change', 'brake_service', 'tire_service', 'inspection',
        'battery_service', 'alignment', 'transmission_service', 'engine_service',
        'diagnostic', 'ac_service', 'suspension', 'exhaust', 'other'
    ]

    useEffect(() => {
        setLocalSegment(value)
        // Check if segment is empty (all customers mode)
        const isEmpty = Object.keys(value).length === 0 || 
            Object.values(value).every(v => !v || (Array.isArray(v) && v.length === 0))
        setIsAllCustomers(isEmpty)
    }, [value])

    const updateSegment = (updates: Partial<CustomerSegment>) => {
        const newSegment = { ...localSegment, ...updates }
        setLocalSegment(newSegment)
        onChange(newSegment)
    }

    const handleAllCustomersToggle = async (checked: boolean) => {
        setIsAllCustomers(checked)
        if (checked) {
            // Clear all filters
            const emptySegment: CustomerSegment = {}
            setLocalSegment(emptySegment)
            onChange(emptySegment)
            
            // Auto-preview all customers with empty segment
            await handlePreviewWithSegment(emptySegment)
        } else {
            setPreviewCount(null)
        }
    }

    const handlePreview = async () => {
        await handlePreviewWithSegment(localSegment)
    }

    const handlePreviewWithSegment = async (segmentToPreview: CustomerSegment) => {
        setIsPreviewLoading(true)
        try {
            const response = await fetch('/api/messaging/segments/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(segmentToPreview)
            })

            if (!response.ok) throw new Error('Failed to preview segment')

            const data = await response.json()
            setPreviewCount(data.count)
            onPreview?.(data.count)
        } catch (error) {
            console.error('Error previewing segment:', error)
            setPreviewCount(0)
        } finally {
            setIsPreviewLoading(false)
        }
    }

    const removeServiceType = (serviceType: string) => {
        const newServiceTypes = (localSegment.service_types || []).filter(st => st !== serviceType)
        updateSegment({ service_types: newServiceTypes })
    }

    const removeTag = (tag: string) => {
        const newTags = (localSegment.customer_tags || []).filter(t => t !== tag)
        updateSegment({ customer_tags: newTags })
    }

    return (
        <div className="space-y-4">
            <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                <CardHeader>
                    <CardTitle className="text-lg text-foreground dark:text-white">Customer Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* All Customers Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="space-y-0.5">
                            <Label htmlFor="all-customers" className="text-base font-semibold text-foreground dark:text-white cursor-pointer">
                                Send to All Customers
                            </Label>
                            <p className="text-sm text-muted-foreground dark:text-gray-400">
                                {isAllCustomers ? 'Campaign will be sent to all customers with phone numbers' : 'Add filters below to target specific customer segments'}
                            </p>
                        </div>
                        <Switch
                            id="all-customers"
                            checked={isAllCustomers}
                            onCheckedChange={handleAllCustomersToggle}
                        />
                    </div>

                    {/* Last Service Date Range */}
                    <div className="space-y-2">
                        <Label className="text-foreground dark:text-gray-300">Last Service Date Range</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="date-from" className="text-xs text-muted-foreground">From</Label>
                                <Input
                                    id="date-from"
                                    type="date"
                                    disabled={isAllCustomers}
                                    value={localSegment.last_service_date_from ? format(new Date(localSegment.last_service_date_from), 'yyyy-MM-dd') : ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const date = new Date(e.target.value)
                                            date.setUTCHours(0, 0, 0, 0)
                                            updateSegment({ last_service_date_from: date.toISOString() })
                                        } else {
                                            updateSegment({ last_service_date_from: undefined })
                                        }
                                    }}
                                    className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a]"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="date-to" className="text-xs text-muted-foreground">To</Label>
                                <Input
                                    id="date-to"
                                    type="date"
                                    disabled={isAllCustomers}
                                    value={localSegment.last_service_date_to ? format(new Date(localSegment.last_service_date_to), 'yyyy-MM-dd') : ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const date = new Date(e.target.value)
                                            date.setUTCHours(0, 0, 0, 0)
                                            updateSegment({ last_service_date_to: date.toISOString() })
                                        } else {
                                            updateSegment({ last_service_date_to: undefined })
                                        }
                                    }}
                                    min={localSegment.last_service_date_from ? format(new Date(localSegment.last_service_date_from), 'yyyy-MM-dd') : undefined}
                                    className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Service Types */}
                    <div className="space-y-2">
                        <Label className="text-foreground dark:text-gray-300">Service Types</Label>
                        <Select
                            value=""
                            disabled={isAllCustomers}
                            onValueChange={(value) => {
                                const currentTypes = localSegment.service_types || []
                                if (!currentTypes.includes(value)) {
                                    updateSegment({ service_types: [...currentTypes, value] })
                                }
                            }}
                        >
                            <SelectTrigger className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a]">
                                <SelectValue placeholder="Add service type..." />
                            </SelectTrigger>
                            <SelectContent>
                                {serviceTypes.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {localSegment.service_types && localSegment.service_types.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {localSegment.service_types.map(type => (
                                    <Badge key={type} variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        <button
                                            onClick={() => removeServiceType(type)}
                                            className="ml-2 hover:text-red-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Vehicle Make Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="vehicle-makes" className="text-foreground dark:text-gray-300">Vehicle Makes (comma-separated)</Label>
                        <Input
                            id="vehicle-makes"
                            disabled={isAllCustomers}
                            placeholder="e.g., Toyota, Honda, Ford"
                            value={(localSegment.vehicle_makes || []).join(', ')}
                            onChange={(e) => {
                                const makes = e.target.value.split(',').map(m => m.trim()).filter(Boolean)
                                updateSegment({ vehicle_makes: makes })
                            }}
                            className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a]"
                        />
                    </div>

                    {/* Last Visit Days */}
                    <div className="space-y-2">
                        <Label htmlFor="last-visit" className="text-foreground dark:text-gray-300">Last Visit Within (days)</Label>
                        <Input
                            id="last-visit"
                            type="number"
                            disabled={isAllCustomers}
                            placeholder="e.g., 90"
                            value={localSegment.last_visit_days || ''}
                            onChange={(e) => updateSegment({
                                last_visit_days: e.target.value ? Number(e.target.value) : undefined
                            })}
                            className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a]"
                        />
                    </div>

                    {/* Customer Tags */}
                    <div className="space-y-2">
                        <Label htmlFor="customer-tags" className="text-foreground dark:text-gray-300">Customer Tags (comma-separated)</Label>
                        <Input
                            id="customer-tags"
                            disabled={isAllCustomers}
                            placeholder="e.g., VIP, Regular, New"
                            value={(localSegment.customer_tags || []).join(', ')}
                            onChange={(e) => {
                                const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                                updateSegment({ customer_tags: tags })
                            }}
                            className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a]"
                        />
                        {localSegment.customer_tags && localSegment.customer_tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {localSegment.customer_tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                        {tag}
                                        <button
                                            onClick={() => removeTag(tag)}
                                            className="ml-2 hover:text-red-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Preview Button */}
                    <Button
                        onClick={handlePreview}
                        disabled={isPreviewLoading}
                        variant="outline"
                        className="w-full"
                    >
                        {isPreviewLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <Users className="h-4 w-4 mr-2" />
                                Preview Recipients
                            </>
                        )}
                    </Button>

                    {/* Preview Count */}
                    {previewCount !== null && (
                        <Card className="border-green-500/20 bg-green-500/10 dark:bg-green-500/5">
                            <CardContent className="py-4">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    <div>
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                            {previewCount} customers match these filters
                                        </p>
                                        <p className="text-xs text-muted-foreground dark:text-gray-500">
                                            Ready to receive this campaign
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

