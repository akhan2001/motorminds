'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Save, RefreshCw } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import AdminNav from '../../../components/AdminNav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Slash } from 'lucide-react'
import { useAdminContext } from '../../../components/admin-context/useAdminContext'
import { toast } from 'sonner'

interface OrganizationSettings {
    name: string
    organization_type: string
    billing_email: string
    subscription_plan: string
    status: string
}

export default function OrganizationSettingsPage() {
    const { organizationId } = useAdminContext()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<OrganizationSettings>({
        name: '',
        organization_type: 'mso',
        billing_email: '',
        subscription_plan: 'basic',
        status: 'active'
    })

    useEffect(() => {
        if (organizationId) {
            fetchSettings()
        }
    }, [organizationId])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/organization/settings')
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
            const response = await fetch('/api/admin/organization/settings', {
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
                                    Organization Settings
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage your organization configuration
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

                        {/* Organization Profile */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Organization Profile
                                </CardTitle>
                                <CardDescription>
                                    Basic information about your organization
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-foreground">
                                        Organization Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={settings.name}
                                        onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                        placeholder="My Organization"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="organization_type" className="text-foreground">
                                            Organization Type <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={settings.organization_type}
                                            onValueChange={(value) => setSettings({ ...settings, organization_type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="mso">MSO</SelectItem>
                                                <SelectItem value="franchise">Franchise</SelectItem>
                                                <SelectItem value="corporate">Corporate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status" className="text-foreground">
                                            Status <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={settings.status}
                                            onValueChange={(value) => setSettings({ ...settings, status: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="suspended">Suspended</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Billing & Subscription */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-foreground">Billing & Subscription</CardTitle>
                                <CardDescription>
                                    Manage your subscription and billing information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="billing_email" className="text-foreground">
                                        Billing Email
                                    </Label>
                                    <Input
                                        id="billing_email"
                                        type="email"
                                        value={settings.billing_email}
                                        onChange={(e) => setSettings({ ...settings, billing_email: e.target.value })}
                                        placeholder="billing@example.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subscription_plan" className="text-foreground">
                                        Subscription Plan
                                    </Label>
                                    <Select
                                        value={settings.subscription_plan}
                                        onValueChange={(value) => setSettings({ ...settings, subscription_plan: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basic">Basic</SelectItem>
                                            <SelectItem value="professional">Professional</SelectItem>
                                            <SelectItem value="enterprise">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Save Button */}
                        <div className="flex justify-end gap-3">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
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

