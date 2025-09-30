'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
    Settings, 
    Save, 
    RefreshCw,
    Shield,
    Database,
    Mail,
    Bell,
    Globe,
    Lock,
    AlertTriangle,
    CheckCircle,
    Info
} from 'lucide-react'
import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Slash } from "lucide-react"
import Link from 'next/link'
import { toast } from 'sonner'
import AdminNav from '../../components/AdminNav'

interface SystemSettings {
    general: {
        site_name: string
        site_description: string
        maintenance_mode: boolean
        registration_enabled: boolean
        email_verification_required: boolean
    }
    email: {
        smtp_host: string
        smtp_port: number
        smtp_username: string
        smtp_password: string
        from_email: string
        from_name: string
    }
    notifications: {
        email_notifications: boolean
        sms_notifications: boolean
        push_notifications: boolean
        admin_alerts: boolean
    }
    security: {
        password_min_length: number
        session_timeout: number
        two_factor_required: boolean
        ip_whitelist: string[]
    }
    integrations: {
        stripe_enabled: boolean
        twilio_enabled: boolean
        google_analytics_id: string
        facebook_pixel_id: string
    }
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SystemSettings>({
        general: {
            site_name: 'MotorMinds',
            site_description: 'Auto Parts Management Platform',
            maintenance_mode: false,
            registration_enabled: true,
            email_verification_required: true
        },
        email: {
            smtp_host: '',
            smtp_port: 587,
            smtp_username: '',
            smtp_password: '',
            from_email: '',
            from_name: 'MotorMinds'
        },
        notifications: {
            email_notifications: true,
            sms_notifications: true,
            push_notifications: true,
            admin_alerts: true
        },
        security: {
            password_min_length: 8,
            session_timeout: 24,
            two_factor_required: false,
            ip_whitelist: []
        },
        integrations: {
            stripe_enabled: false,
            twilio_enabled: false,
            google_analytics_id: '',
            facebook_pixel_id: ''
        }
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'general' | 'email' | 'notifications' | 'security' | 'integrations'>('general')

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            // TODO: Implement actual API call to fetch settings
            // const response = await fetch(`/api/admin/settings?t=${Date.now()}`)
            // const data = await response.json()
            // if (response.ok) {
            //     setSettings(data.settings)
            // }
            setLoading(false)
        } catch (error) {
            console.error('Error fetching settings:', error)
            toast.error('Failed to fetch settings')
            setLoading(false)
        }
    }

    const saveSettings = async () => {
        try {
            setSaving(true)
            // TODO: Implement actual API call to save settings
            // const response = await fetch('/api/admin/settings', {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(settings)
            // })
            // if (response.ok) {
            //     toast.success('Settings saved successfully')
            // } else {
            //     const data = await response.json()
            //     toast.error(data.error || 'Failed to save settings')
            // }
            toast.success('Settings saved successfully')
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const updateSetting = (section: keyof SystemSettings, key: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }))
    }

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'email', label: 'Email', icon: Mail },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'integrations', label: 'Integrations', icon: Globe }
    ] as const

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-7xl mx-auto w-full">
                        {/* Breadcrumb Navigation */}
                        <Breadcrumb className="mb-6">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin" className="text-gray-400 hover:text-gray-300">
                                            Admin
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="h-4 w-4" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-white">
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
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    System Settings
                                </h1>
                                <p className="text-gray-400">
                                    Configure system-wide settings and preferences
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={fetchSettings}
                                    variant="outline"
                                    className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                                <Button
                                    onClick={saveSettings}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </Button>
                            </div>
                        </div>

                        {/* Settings Tabs */}
                        <div className="flex gap-2 mb-6">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <Button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        variant={activeTab === tab.id ? 'default' : 'outline'}
                                        className={
                                            activeTab === tab.id
                                                ? 'bg-blue-600 hover:bg-blue-700'
                                                : 'border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]'
                                        }
                                    >
                                        <Icon className="h-4 w-4 mr-2" />
                                        {tab.label}
                                    </Button>
                                )
                            })}
                        </div>

                        {/* Settings Content */}
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="text-gray-400">Loading settings...</div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* General Settings */}
                                {activeTab === 'general' && (
                                    <Card className="bg-[#111111] border-[#2a2a2a]">
                                        <CardHeader>
                                            <CardTitle className="text-white flex items-center gap-2">
                                                <Settings className="h-5 w-5" />
                                                General Settings
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-gray-300">Site Name</Label>
                                                    <Input
                                                        value={settings.general.site_name}
                                                        onChange={(e) => updateSetting('general', 'site_name', e.target.value)}
                                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-gray-300">Site Description</Label>
                                                    <Input
                                                        value={settings.general.site_description}
                                                        onChange={(e) => updateSetting('general', 'site_description', e.target.value)}
                                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-gray-300">Maintenance Mode</Label>
                                                        <p className="text-sm text-gray-400">Enable maintenance mode to restrict access</p>
                                                    </div>
                                                    <Switch
                                                        checked={settings.general.maintenance_mode}
                                                        onCheckedChange={(checked) => updateSetting('general', 'maintenance_mode', checked)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-gray-300">Registration Enabled</Label>
                                                        <p className="text-sm text-gray-400">Allow new user registrations</p>
                                                    </div>
                                                    <Switch
                                                        checked={settings.general.registration_enabled}
                                                        onCheckedChange={(checked) => updateSetting('general', 'registration_enabled', checked)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-gray-300">Email Verification Required</Label>
                                                        <p className="text-sm text-gray-400">Require email verification for new accounts</p>
                                                    </div>
                                                    <Switch
                                                        checked={settings.general.email_verification_required}
                                                        onCheckedChange={(checked) => updateSetting('general', 'email_verification_required', checked)}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Email Settings */}
                                {activeTab === 'email' && (
                                    <Card className="bg-[#111111] border-[#2a2a2a]">
                                        <CardHeader>
                                            <CardTitle className="text-white flex items-center gap-2">
                                                <Mail className="h-5 w-5" />
                                                Email Configuration
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-gray-300">SMTP Host</Label>
                                                    <Input
                                                        value={settings.email.smtp_host}
                                                        onChange={(e) => updateSetting('email', 'smtp_host', e.target.value)}
                                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                                        placeholder="smtp.gmail.com"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-gray-300">SMTP Port</Label>
                                                    <Input
                                                        type="number"
                                                        value={settings.email.smtp_port}
                                                        onChange={(e) => updateSetting('email', 'smtp_port', parseInt(e.target.value))}
                                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-gray-300">SMTP Username</Label>
                                                    <Input
                                                        value={settings.email.smtp_username}
                                                        onChange={(e) => updateSetting('email', 'smtp_username', e.target.value)}
                                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-gray-300">SMTP Password</Label>
                                                    <Input
                                                        type="password"
                                                        value={settings.email.smtp_password}
                                                        onChange={(e) => updateSetting('email', 'smtp_password', e.target.value)}
                                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-gray-300">From Email</Label>
                                                    <Input
                                                        value={settings.email.from_email}
                                                        onChange={(e) => updateSetting('email', 'from_email', e.target.value)}
                                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-gray-300">From Name</Label>
                                                    <Input
                                                        value={settings.email.from_name}
                                                        onChange={(e) => updateSetting('email', 'from_name', e.target.value)}
                                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Notification Settings */}
                                {activeTab === 'notifications' && (
                                    <Card className="bg-[#111111] border-[#2a2a2a]">
                                        <CardHeader>
                                            <CardTitle className="text-white flex items-center gap-2">
                                                <Bell className="h-5 w-5" />
                                                Notification Settings
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-gray-300">Email Notifications</Label>
                                                        <p className="text-sm text-gray-400">Send notifications via email</p>
                                                    </div>
                                                    <Switch
                                                        checked={settings.notifications.email_notifications}
                                                        onCheckedChange={(checked) => updateSetting('notifications', 'email_notifications', checked)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-gray-300">SMS Notifications</Label>
                                                        <p className="text-sm text-gray-400">Send notifications via SMS</p>
                                                    </div>
                                                    <Switch
                                                        checked={settings.notifications.sms_notifications}
                                                        onCheckedChange={(checked) => updateSetting('notifications', 'sms_notifications', checked)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-gray-300">Push Notifications</Label>
                                                        <p className="text-sm text-gray-400">Send push notifications to mobile apps</p>
                                                    </div>
                                                    <Switch
                                                        checked={settings.notifications.push_notifications}
                                                        onCheckedChange={(checked) => updateSetting('notifications', 'push_notifications', checked)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-gray-300">Admin Alerts</Label>
                                                        <p className="text-sm text-gray-400">Send critical alerts to administrators</p>
                                                    </div>
                                                    <Switch
                                                        checked={settings.notifications.admin_alerts}
                                                        onCheckedChange={(checked) => updateSetting('notifications', 'admin_alerts', checked)}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Security Settings */}
                                {activeTab === 'security' && (
                                    <Card className="bg-[#111111] border-[#2a2a2a]">
                                        <CardHeader>
                                            <CardTitle className="text-white flex items-center gap-2">
                                                <Shield className="h-5 w-5" />
                                                Security Settings
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-gray-300">Password Minimum Length</Label>
                                                    <Input
                                                        type="number"
                                                        value={settings.security.password_min_length}
                                                        onChange={(e) => updateSetting('security', 'password_min_length', parseInt(e.target.value))}
                                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-gray-300">Session Timeout (hours)</Label>
                                                    <Input
                                                        type="number"
                                                        value={settings.security.session_timeout}
                                                        onChange={(e) => updateSetting('security', 'session_timeout', parseInt(e.target.value))}
                                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-gray-300">Two-Factor Authentication Required</Label>
                                                        <p className="text-sm text-gray-400">Require 2FA for all admin accounts</p>
                                                    </div>
                                                    <Switch
                                                        checked={settings.security.two_factor_required}
                                                        onCheckedChange={(checked) => updateSetting('security', 'two_factor_required', checked)}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-gray-300">IP Whitelist</Label>
                                                <Textarea
                                                    value={settings.security.ip_whitelist.join('\n')}
                                                    onChange={(e) => updateSetting('security', 'ip_whitelist', e.target.value.split('\n').filter(ip => ip.trim()))}
                                                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white min-h-[100px]"
                                                    placeholder="Enter IP addresses, one per line"
                                                />
                                                <p className="text-sm text-gray-400 mt-1">Enter one IP address per line. Leave empty to allow all IPs.</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Integration Settings */}
                                {activeTab === 'integrations' && (
                                    <Card className="bg-[#111111] border-[#2a2a2a]">
                                        <CardHeader>
                                            <CardTitle className="text-white flex items-center gap-2">
                                                <Globe className="h-5 w-5" />
                                                Integration Settings
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-gray-300">Stripe Integration</Label>
                                                        <p className="text-sm text-gray-400">Enable Stripe payment processing</p>
                                                    </div>
                                                    <Switch
                                                        checked={settings.integrations.stripe_enabled}
                                                        onCheckedChange={(checked) => updateSetting('integrations', 'stripe_enabled', checked)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-gray-300">Twilio Integration</Label>
                                                        <p className="text-sm text-gray-400">Enable Twilio SMS services</p>
                                                    </div>
                                                    <Switch
                                                        checked={settings.integrations.twilio_enabled}
                                                        onCheckedChange={(checked) => updateSetting('integrations', 'twilio_enabled', checked)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-gray-300">Google Analytics ID</Label>
                                                    <Input
                                                        value={settings.integrations.google_analytics_id}
                                                        onChange={(e) => updateSetting('integrations', 'google_analytics_id', e.target.value)}
                                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                                        placeholder="GA-XXXXXXXXX-X"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-gray-300">Facebook Pixel ID</Label>
                                                    <Input
                                                        value={settings.integrations.facebook_pixel_id}
                                                        onChange={(e) => updateSetting('integrations', 'facebook_pixel_id', e.target.value)}
                                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                                        placeholder="123456789012345"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

