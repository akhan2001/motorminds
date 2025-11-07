'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { SegmentCriteria } from '../../types/segment'

interface CustomerSegmentBuilderProps {
    shopId: string
    criteria: SegmentCriteria
    onChange: (criteria: SegmentCriteria) => void
}

export function CustomerSegmentBuilder({ 
    shopId, 
    criteria, 
    onChange 
}: CustomerSegmentBuilderProps) {
    const [previewCount, setPreviewCount] = useState<number | null>(null)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const [availableTags, setAvailableTags] = useState<string[]>([])
    const [availableMakes, setAvailableMakes] = useState<string[]>([])
    const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>([])

    // Fetch available options
    useEffect(() => {
        fetchAvailableOptions()
    }, [shopId])

    // Fetch preview count when criteria changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchPreviewCount()
        }, 500) // Debounce

        return () => clearTimeout(timeoutId)
    }, [criteria, shopId])

    const fetchAvailableOptions = async () => {
        try {
            const { createClient } = await import('@/utils/supabase/client')
            const supabase = createClient()

            // Fetch unique tags
            const { data: customers } = await supabase
                .from('customers')
                .select('tags')
                .eq('shop_id', shopId)
                .not('tags', 'is', null)

            const tags = new Set<string>()
            customers?.forEach(customer => {
                if (Array.isArray(customer.tags)) {
                    customer.tags.forEach(tag => tags.add(tag))
                }
            })
            setAvailableTags(Array.from(tags).sort())

            // Fetch unique vehicle makes
            const { data: vehicles } = await supabase
                .from('customer_vehicles')
                .select('make')
                .not('make', 'is', null)

            const makes = new Set<string>()
            vehicles?.forEach(vehicle => {
                if (vehicle.make) makes.add(vehicle.make)
            })
            setAvailableMakes(Array.from(makes).sort())

            // Fetch unique service types from work orders
            const { data: workOrders } = await supabase
                .from('work_orders')
                .select('title')
                .eq('shop_id', shopId)
                .not('title', 'is', null)

            const serviceTypes = new Set<string>()
            workOrders?.forEach(wo => {
                if (wo.title) serviceTypes.add(wo.title)
            })
            setAvailableServiceTypes(Array.from(serviceTypes).sort())
        } catch (error) {
            console.error('Error fetching available options:', error)
        }
    }

    const fetchPreviewCount = async () => {
        try {
            setIsLoadingPreview(true)
            const response = await fetch('/api/messaging/mass-send/campaigns/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_segment: criteria
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to fetch preview')
            }

            const data = await response.json()
            setPreviewCount(data.count || 0)
        } catch (error) {
            console.error('Error fetching preview count:', error)
            setPreviewCount(null)
        } finally {
            setIsLoadingPreview(false)
        }
    }

    const updateCriteria = (updates: Partial<SegmentCriteria>) => {
        onChange({ ...criteria, ...updates })
    }

    const addTag = (tag: string, type: 'contains' | 'notContains') => {
        const currentTags = criteria.tags?.[type] || []
        if (!currentTags.includes(tag)) {
            updateCriteria({
                tags: {
                    ...criteria.tags,
                    [type]: [...currentTags, tag]
                }
            })
        }
    }

    const removeTag = (tag: string, type: 'contains' | 'notContains') => {
        const currentTags = criteria.tags?.[type] || []
        updateCriteria({
            tags: {
                ...criteria.tags,
                [type]: currentTags.filter(t => t !== tag)
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Customer Segment</CardTitle>
                <CardDescription>
                    Define which customers will receive this campaign
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Preview Count */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <div className="font-medium">Estimated Recipients</div>
                            <div className="text-sm text-muted-foreground">
                                {isLoadingPreview ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Calculating...
                                    </span>
                                ) : previewCount !== null ? (
                                    `${previewCount} customers match these criteria`
                                ) : (
                                    'Unable to calculate'
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tags Filter */}
                <div className="space-y-3">
                    <Label>Customer Tags</Label>
                    
                    {/* Include Tags */}
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Must have tags:</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(criteria.tags?.contains || []).map(tag => (
                                <Badge key={tag} variant="default" className="gap-1">
                                    {tag}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => removeTag(tag, 'contains')}
                                    />
                                </Badge>
                            ))}
                        </div>
                        <Select onValueChange={(value) => addTag(value, 'contains')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Add tag" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTags
                                    .filter(tag => !criteria.tags?.contains?.includes(tag))
                                    .map(tag => (
                                        <SelectItem key={tag} value={tag}>
                                            {tag}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Exclude Tags */}
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Must not have tags:</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(criteria.tags?.notContains || []).map(tag => (
                                <Badge key={tag} variant="destructive" className="gap-1">
                                    {tag}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => removeTag(tag, 'notContains')}
                                    />
                                </Badge>
                            ))}
                        </div>
                        <Select onValueChange={(value) => addTag(value, 'notContains')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Exclude tag" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTags
                                    .filter(tag => !criteria.tags?.notContains?.includes(tag))
                                    .map(tag => (
                                        <SelectItem key={tag} value={tag}>
                                            {tag}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Service Type Filter */}
                <div className="space-y-2">
                    <Label>Service Type</Label>
                    <Select
                        value={criteria.serviceType?.has?.[0] || ''}
                        onValueChange={(value) => {
                            updateCriteria({
                                serviceType: {
                                    has: value ? [value] : undefined
                                }
                            })
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select service type (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All services</SelectItem>
                            {availableServiceTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Vehicle Filters */}
                <div className="space-y-4">
                    <Label>Vehicle Filters (Optional)</Label>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {/* Vehicle Make */}
                        <div className="space-y-2">
                            <Label className="text-sm">Make</Label>
                            <Select
                                value={criteria.vehicle?.make?.[0] || ''}
                                onValueChange={(value) => {
                                    updateCriteria({
                                        vehicle: {
                                            ...criteria.vehicle,
                                            make: value ? [value] : undefined
                                        }
                                    })
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Any make" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Any make</SelectItem>
                                    {availableMakes.map(make => (
                                        <SelectItem key={make} value={make}>
                                            {make}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Vehicle Year Range */}
                        <div className="space-y-2">
                            <Label className="text-sm">Year Range</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={criteria.vehicle?.year?.min || ''}
                                    onChange={(e) => {
                                        const min = e.target.value ? parseInt(e.target.value) : undefined
                                        updateCriteria({
                                            vehicle: {
                                                ...criteria.vehicle,
                                                year: {
                                                    ...criteria.vehicle?.year,
                                                    min
                                                }
                                            }
                                        })
                                    }}
                                />
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={criteria.vehicle?.year?.max || ''}
                                    onChange={(e) => {
                                        const max = e.target.value ? parseInt(e.target.value) : undefined
                                        updateCriteria({
                                            vehicle: {
                                                ...criteria.vehicle,
                                                year: {
                                                    ...criteria.vehicle?.year,
                                                    max
                                                }
                                            }
                                        })
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Spent Filter */}
                <div className="space-y-2">
                    <Label>Total Spent (Optional)</Label>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="Min amount"
                            value={criteria.totalSpent?.above || ''}
                            onChange={(e) => {
                                const above = e.target.value ? parseFloat(e.target.value) : undefined
                                updateCriteria({
                                    totalSpent: {
                                        ...criteria.totalSpent,
                                        above
                                    }
                                })
                            }}
                        />
                        <Input
                            type="number"
                            placeholder="Max amount"
                            value={criteria.totalSpent?.below || ''}
                            onChange={(e) => {
                                const below = e.target.value ? parseFloat(e.target.value) : undefined
                                updateCriteria({
                                    totalSpent: {
                                        ...criteria.totalSpent,
                                        below
                                    }
                                })
                            }}
                        />
                    </div>
                </div>

                {/* Days Since Last Visit */}
                <div className="space-y-2">
                    <Label>Days Since Last Visit (Optional)</Label>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="Min days"
                            value={criteria.daysSinceLastVisit?.min || ''}
                            onChange={(e) => {
                                const min = e.target.value ? parseInt(e.target.value) : undefined
                                updateCriteria({
                                    daysSinceLastVisit: {
                                        ...criteria.daysSinceLastVisit,
                                        min
                                    }
                                })
                            }}
                        />
                        <Input
                            type="number"
                            placeholder="Max days"
                            value={criteria.daysSinceLastVisit?.max || ''}
                            onChange={(e) => {
                                const max = e.target.value ? parseInt(e.target.value) : undefined
                                updateCriteria({
                                    daysSinceLastVisit: {
                                        ...criteria.daysSinceLastVisit,
                                        max
                                    }
                                })
                            }}
                        />
                    </div>
                </div>

                {/* Last Service Date */}
                <div className="space-y-2">
                    <Label>Last Service Date (Optional)</Label>
                    <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs text-muted-foreground">After</Label>
                            <Input
                                type="date"
                                value={criteria.lastServiceDate?.after?.split('T')[0] || ''}
                                onChange={(e) => {
                                    const after = e.target.value ? `${e.target.value}T00:00:00Z` : undefined
                                    updateCriteria({
                                        lastServiceDate: {
                                            ...criteria.lastServiceDate,
                                            after
                                        }
                                    })
                                }}
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs text-muted-foreground">Before</Label>
                            <Input
                                type="date"
                                value={criteria.lastServiceDate?.before?.split('T')[0] || ''}
                                onChange={(e) => {
                                    const before = e.target.value ? `${e.target.value}T23:59:59Z` : undefined
                                    updateCriteria({
                                        lastServiceDate: {
                                            ...criteria.lastServiceDate,
                                            before
                                        }
                                    })
                                }}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

