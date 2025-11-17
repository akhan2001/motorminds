'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { toast } from 'sonner'
import { Loader2, Plus, User, Building, ArrowLeft, Slash } from 'lucide-react'
import { AdminUserFormData, AdminShopFormData, CreateUserRequest } from '../../types/user-creation'
import { UserCreationService } from '../../services/user-creation'
import UserForm from '../../components/user-creation/UserForm'
import ShopForm from '../../components/user-creation/ShopForm'
import AdminNav from '../../components/AdminNav'
import { Nav } from '@/app/components/nav'
import Link from 'next/link'

const defaultUserForm: AdminUserFormData = {
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'user',
    plan: 'DEFAULT',
    status: 'active'
}

const defaultShopForm: AdminShopFormData = {
    shopName: '',
    shopEmail: '',
    shopPhone: '',
    shopAddress: '',
    shopCity: '',
    shopProvince: '',
    shopOwner: '',
    shopAbout: '',
    shopTagline: '',
    defaultHourlyRate: 99.99,
    website: '',
    businessNumber: null,
    hstNumber: null,
    servicesOffered: [],
    operatingHours: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '15:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true }
    }
}

export default function CreateUserPage() {
    const [userForm, setUserForm] = useState<AdminUserFormData>(defaultUserForm)
    const [shopForm, setShopForm] = useState<AdminShopFormData>(defaultShopForm)
    const [createShop, setCreateShop] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [userErrors, setUserErrors] = useState<string[]>([])
    const [shopErrors, setShopErrors] = useState<string[]>([])

    const validateForms = async () => {
        const userValidationErrors = await UserCreationService.validateUserData(userForm)
        const shopValidationErrors = createShop 
            ? await UserCreationService.validateShopData(shopForm)
            : []

        setUserErrors(userValidationErrors)
        setShopErrors(shopValidationErrors)

        return userValidationErrors.length === 0 && shopValidationErrors.length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const isValid = await validateForms()
        if (!isValid) {
            toast.error('Please fix the errors before submitting')
            return
        }

        setIsLoading(true)

        try {
            const request: CreateUserRequest = {
                user: userForm,
                shop: createShop ? shopForm : undefined,
                createShop
            }

            const response = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request)
            })

            const result = await response.json()

            if (response.ok && result.success) {
                toast.success(result.message)
                // Reset forms
                setUserForm(defaultUserForm)
                setShopForm(defaultShopForm)
                setCreateShop(false)
                setUserErrors([])
                setShopErrors([])
            } else {
                // Display validation errors if available
                if (result.details && Array.isArray(result.details)) {
                    if (result.error?.includes('User')) {
                        setUserErrors(result.details)
                    } else if (result.error?.includes('Shop')) {
                        setShopErrors(result.details)
                    } else {
                        // Show all errors in toast
                        toast.error(`${result.error}: ${result.details.join(', ')}`)
                    }
                } else {
                    toast.error(result.error || 'Failed to create user')
                }
            }
        } catch (error) {
            console.error('Error creating user:', error)
            toast.error('Failed to create user')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateShopToggle = (checked: boolean) => {
        setCreateShop(checked)
        if (!checked) {
            setShopErrors([])
        }
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-4xl mx-auto w-full">
                        {/* Breadcrumb Navigation */}
                        <Breadcrumb className="mb-4">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                                            Admin
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="text-muted-foreground" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-foreground">
                                        Create User
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Admin Navigation */}
                        <AdminNav />

                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">Create New User</h1>
                                <p className="text-muted-foreground">Create a new user account and optionally associate them with a shop.</p>
                            </div>
                            <Button asChild variant="outline">
                                <Link href="/admin/users">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Go Back
                                </Link>
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Form */}
                    <UserForm
                        userForm={userForm}
                        setUserForm={setUserForm}
                        errors={userErrors}
                    />

                    {/* Shop Creation Toggle */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-3">
                                <Switch
                                    id="create-shop"
                                    checked={createShop}
                                    onCheckedChange={handleCreateShopToggle}
                                />
                                <div className="flex-1">
                                    <Label htmlFor="create-shop" className="text-foreground font-medium">
                                        Create Shop for this User
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Create a shop and associate it with this user. Only applicable for shop owners.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shop Form - Only show if createShop is true */}
                    {createShop && (
                        <ShopForm
                            shopForm={shopForm}
                            setShopForm={setShopForm}
                            errors={shopErrors}
                        />
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setUserForm(defaultUserForm)
                                setShopForm(defaultShopForm)
                                setCreateShop(false)
                                setUserErrors([])
                                setShopErrors([])
                            }}
                        >
                            Reset
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating User...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create User
                                </>
                            )}
                        </Button>
                    </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
