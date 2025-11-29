'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Save, RefreshCw } from 'lucide-react'
import { Nav } from '@/components/navigation/nav'
import AdminNav from '../../../components/AdminNav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Slash } from 'lucide-react'
import { useAdminContext } from '../../../components/admin-context/useAdminContext'
import { toast } from 'sonner'

interface ShopSettings {
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
    operating_hours?: any
    services_offered?: any
    widget_config?: any
    status_tracker_presets?: any
}

export default function ShopSettingsPage() {
    const { shopId } = useAdminContext()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<ShopSettings>({
        shop_name: '',
        shop_email: '',
        shop_phone: '',
        shop_address: '',
        shop_city: '',
        shop_province: '',
        shop_owner: '',
        shop_about: '',
        shop_tagline: '',
        default_hourly_rate: 99.99,
        website: '',
        business_number: '',
        hst_number: ''
    })

    useEffect(() => {
        if (shopId) {
            fetchSettings()
        }
    }, [shopId])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/shop/settings')
            const data = await response.json()
            
            if (response.ok) {
                setSettings(data.settings)
            } else {
                console.error('Error fetching settings:', data.error)
                toast.error(data.error || 'Failed to fetch settings')
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
            toast.error('Failed to fetch settings')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const response = await fetch('/api/admin/shop/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Settings saved successfully')
            } else {
                toast.error(data.error || 'Failed to save settings')
            }
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-4xl mx-auto w-full">
                        {/* Breadcrumb */}
                        <Breadcrumb className="mb-4">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <a href="/admin" className="text-muted-foreground hover:text-foreground">
                                            Admin
                                        </a>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="text-muted-foreground" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-foreground">
                                        Settings
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Admin Navigation */}
                        <AdminNav />

                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">
                                    Shop Settings
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage your shop configuration
                                </p>
                            </div>
                            <Button
                                onClick={fetchSettings}
                                variant="outline"
                                size="sm"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>

                        {/* Shop Profile */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Shop Profile
                                </CardTitle>
                                <CardDescription>
                                    Basic information about your shop
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="shop_name" className="text-foreground">
                                        Shop Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="shop_name"
                                        value={settings.shop_name}
                                        onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
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
                                            value={settings.shop_email || ''}
                                            onChange={(e) => setSettings({ ...settings, shop_email: e.target.value })}
                                            placeholder="shop@example.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="shop_phone" className="text-foreground">
                                            Phone
                                        </Label>
                                        <Input
                                            id="shop_phone"
                                            value={settings.shop_phone || ''}
                                            onChange={(e) => setSettings({ ...settings, shop_phone: e.target.value })}
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
                                        value={settings.shop_address || ''}
                                        onChange={(e) => setSettings({ ...settings, shop_address: e.target.value })}
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
                                            value={settings.shop_city || ''}
                                            onChange={(e) => setSettings({ ...settings, shop_city: e.target.value })}
                                            placeholder="Toronto"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="shop_province" className="text-foreground">
                                            Province
                                        </Label>
                                        <Input
                                            id="shop_province"
                                            value={settings.shop_province || ''}
                                            onChange={(e) => setSettings({ ...settings, shop_province: e.target.value })}
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
                                        value={settings.shop_owner || ''}
                                        onChange={(e) => setSettings({ ...settings, shop_owner: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="shop_tagline" className="text-foreground">
                                        Tagline
                                    </Label>
                                    <Input
                                        id="shop_tagline"
                                        value={settings.shop_tagline || ''}
                                        onChange={(e) => setSettings({ ...settings, shop_tagline: e.target.value })}
                                        placeholder="Your trusted auto repair partner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="shop_about" className="text-foreground">
                                        About
                                    </Label>
                                    <Textarea
                                        id="shop_about"
                                        value={settings.shop_about || ''}
                                        onChange={(e) => setSettings({ ...settings, shop_about: e.target.value })}
                                        placeholder="Tell customers about your shop..."
                                        rows={4}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Business Information */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-foreground">Business Information</CardTitle>
                                <CardDescription>
                                    Legal and business details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="business_number" className="text-foreground">
                                            Business Number
                                        </Label>
                                        <Input
                                            id="business_number"
                                            value={settings.business_number || ''}
                                            onChange={(e) => setSettings({ ...settings, business_number: e.target.value })}
                                            placeholder="123456789"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="hst_number" className="text-foreground">
                                            HST Number
                                        </Label>
                                        <Input
                                            id="hst_number"
                                            value={settings.hst_number || ''}
                                            onChange={(e) => setSettings({ ...settings, hst_number: e.target.value })}
                                            placeholder="123456789RT0001"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="website" className="text-foreground">
                                        Website
                                    </Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        value={settings.website || ''}
                                        onChange={(e) => setSettings({ ...settings, website: e.target.value })}
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
                                        value={settings.default_hourly_rate || 99.99}
                                        onChange={(e) => setSettings({ ...settings, default_hourly_rate: parseFloat(e.target.value) || 99.99 })}
                                        placeholder="99.99"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Save Button */}
                        <div className="flex justify-end gap-3">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

