'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building2 } from 'lucide-react'

interface ShopFormData {
    shop_name: string
    shop_email?: string
    shop_phone?: string
    shop_address?: string
    shop_city?: string
    shop_province?: string
    shop_owner?: string
    shop_about?: string
    shop_tagline?: string
    default_hourly_rate?: number
    website?: string
    business_number?: string
    hst_number?: string
}

interface ShopFormProps {
    initialData?: Partial<ShopFormData>
    onSubmit: (data: ShopFormData) => void
    onCancel?: () => void
    isLoading?: boolean
}

export function ShopForm({ 
    initialData, 
    onSubmit, 
    onCancel,
    isLoading = false 
}: ShopFormProps) {
    const [formData, setFormData] = useState<ShopFormData>({
        shop_name: initialData?.shop_name || '',
        shop_email: initialData?.shop_email || '',
        shop_phone: initialData?.shop_phone || '',
        shop_address: initialData?.shop_address || '',
        shop_city: initialData?.shop_city || '',
        shop_province: initialData?.shop_province || '',
        shop_owner: initialData?.shop_owner || '',
        shop_about: initialData?.shop_about || '',
        shop_tagline: initialData?.shop_tagline || '',
        default_hourly_rate: initialData?.default_hourly_rate || 99.99,
        website: initialData?.website || '',
        business_number: initialData?.business_number || '',
        hst_number: initialData?.hst_number || ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Shop Information
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="shop_name" className="text-foreground">
                            Shop Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="shop_name"
                            value={formData.shop_name}
                            onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                            placeholder="My Auto Shop"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="shop_email" className="text-foreground">
                                Email
                            </Label>
                            <Input
                                id="shop_email"
                                type="email"
                                value={formData.shop_email}
                                onChange={(e) => setFormData({ ...formData, shop_email: e.target.value })}
                                placeholder="shop@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shop_phone" className="text-foreground">
                                Phone
                            </Label>
                            <Input
                                id="shop_phone"
                                value={formData.shop_phone}
                                onChange={(e) => setFormData({ ...formData, shop_phone: e.target.value })}
                                placeholder="(555) 123-4567"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="shop_address" className="text-foreground">
                            Address
                        </Label>
                        <Input
                            id="shop_address"
                            value={formData.shop_address}
                            onChange={(e) => setFormData({ ...formData, shop_address: e.target.value })}
                            placeholder="123 Main St"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="shop_city" className="text-foreground">
                                City
                            </Label>
                            <Input
                                id="shop_city"
                                value={formData.shop_city}
                                onChange={(e) => setFormData({ ...formData, shop_city: e.target.value })}
                                placeholder="Toronto"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shop_province" className="text-foreground">
                                Province
                            </Label>
                            <Input
                                id="shop_province"
                                value={formData.shop_province}
                                onChange={(e) => setFormData({ ...formData, shop_province: e.target.value })}
                                placeholder="ON"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="shop_owner" className="text-foreground">
                            Shop Owner
                        </Label>
                        <Input
                            id="shop_owner"
                            value={formData.shop_owner}
                            onChange={(e) => setFormData({ ...formData, shop_owner: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="shop_tagline" className="text-foreground">
                            Tagline
                        </Label>
                        <Input
                            id="shop_tagline"
                            value={formData.shop_tagline}
                            onChange={(e) => setFormData({ ...formData, shop_tagline: e.target.value })}
                            placeholder="Your trusted auto repair partner"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="shop_about" className="text-foreground">
                            About
                        </Label>
                        <Textarea
                            id="shop_about"
                            value={formData.shop_about}
                            onChange={(e) => setFormData({ ...formData, shop_about: e.target.value })}
                            placeholder="Tell customers about your shop..."
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="business_number" className="text-foreground">
                                Business Number
                            </Label>
                            <Input
                                id="business_number"
                                value={formData.business_number}
                                onChange={(e) => setFormData({ ...formData, business_number: e.target.value })}
                                placeholder="123456789"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hst_number" className="text-foreground">
                                HST Number
                            </Label>
                            <Input
                                id="hst_number"
                                value={formData.hst_number}
                                onChange={(e) => setFormData({ ...formData, hst_number: e.target.value })}
                                placeholder="123456789RT0001"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="website" className="text-foreground">
                                Website
                            </Label>
                            <Input
                                id="website"
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="default_hourly_rate" className="text-foreground">
                                Default Hourly Rate ($)
                            </Label>
                            <Input
                                id="default_hourly_rate"
                                type="number"
                                step="0.01"
                                value={formData.default_hourly_rate}
                                onChange={(e) => setFormData({ ...formData, default_hourly_rate: parseFloat(e.target.value) || 99.99 })}
                                placeholder="99.99"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isLoading ? 'Saving...' : 'Save Shop'}
                        </Button>
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

