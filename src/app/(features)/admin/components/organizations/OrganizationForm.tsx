'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2 } from 'lucide-react'

interface OrganizationFormData {
    name: string
    organization_type: 'mso' | 'franchise' | 'corporate'
    billing_email: string
    subscription_plan: string
    status: 'active' | 'suspended' | 'inactive'
}

interface OrganizationFormProps {
    initialData?: Partial<OrganizationFormData>
    onSubmit: (data: OrganizationFormData) => void
    onCancel?: () => void
    isLoading?: boolean
}

export function OrganizationForm({ 
    initialData, 
    onSubmit, 
    onCancel,
    isLoading = false 
}: OrganizationFormProps) {
    const [formData, setFormData] = useState<OrganizationFormData>({
        name: initialData?.name || '',
        organization_type: initialData?.organization_type || 'mso',
        billing_email: initialData?.billing_email || '',
        subscription_plan: initialData?.subscription_plan || 'basic',
        status: initialData?.status || 'active'
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
                    Organization Information
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground">
                            Organization Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                value={formData.organization_type}
                                onValueChange={(value) => setFormData({ ...formData, organization_type: value as OrganizationFormData['organization_type'] })}
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
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value as OrganizationFormData['status'] })}
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

                    <div className="space-y-2">
                        <Label htmlFor="billing_email" className="text-foreground">
                            Billing Email
                        </Label>
                        <Input
                            id="billing_email"
                            type="email"
                            value={formData.billing_email}
                            onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                            placeholder="billing@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subscription_plan" className="text-foreground">
                            Subscription Plan
                        </Label>
                        <Select
                            value={formData.subscription_plan}
                            onValueChange={(value) => setFormData({ ...formData, subscription_plan: value })}
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

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isLoading ? 'Saving...' : 'Save Organization'}
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

