"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { Eye, EyeOff, Loader2, CheckCircle, Building, User, MapPin, Globe } from "lucide-react"
import Link from "next/link"
import { signup } from "./actions"
import { UserFormData, ShopFormData } from "./types/ShopUserInterface"
import LoadingComponent from "./components/LoadingComponent"
// import { Turnstile } from '@marsidev/react-turnstile'



export default function SignupComponent() {
    const [currentStep, setCurrentStep] = useState(1)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [captchaToken, setCaptchaToken] = useState<string | null>(null)
    const [startTime] = useState(Date.now())

    const searchParams = useSearchParams()

    const [userForm, setUserForm] = useState<UserFormData>({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: ''
    })

    const [shopForm, setShopForm] = useState<ShopFormData>({
        shopName: '',
        shopEmail: '',
        shopPhone: '',
        shopAddress: '',
        shopCity: '',
        shopProvince: '',
        website: '',
        businessNumber: '',
        hstNumber: '',
        servicesOffered: [],
        operatingHours: {
            monday: { open: '09:00', close: '17:00', closed: false },
            tuesday: { open: '09:00', close: '17:00', closed: false },
            wednesday: { open: '09:00', close: '17:00', closed: false },
            thursday: { open: '09:00', close: '17:00', closed: false },
            friday: { open: '09:00', close: '17:00', closed: false },
            saturday: { open: '09:00', close: '17:00', closed: false },
            sunday: { open: '09:00', close: '17:00', closed: false }
        }
    })

    useEffect(() => {
        const errorParam = searchParams?.get('error')
        const messageParam = searchParams?.get('message')

        if (errorParam) {
            setError(errorParam)
        }
        if (messageParam) {
            setMessage(messageParam)
        }
    }, [searchParams])

    const handleUserFormChange = (field: keyof UserFormData, value: string) => {
        setUserForm(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleShopFormChange = (field: keyof ShopFormData, value: string | string[]) => {
        setShopForm(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleOperatingHoursChange = (day: string, field: string, value: string | boolean) => {
        setShopForm(prev => ({
            ...prev,
            operatingHours: {
                ...prev.operatingHours,
                [day]: {
                    ...prev.operatingHours[day as keyof typeof prev.operatingHours],
                    [field]: value
                }
            }
        }))
    }

    const validateUserForm = () => {
        if (!userForm.email || !userForm.password || !userForm.fullName) {
            setError('Please fill in all required fields')
            return false
        }
        if (userForm.password.length < 6) {
            setError('Password must be at least 6 characters')
            return false
        }
        return true
    }

    // Calculate progress based on filled mandatory fields
    const calculateProgress = () => {
        if (currentStep === 1) {
            const mandatoryFields = [userForm.email, userForm.password, userForm.fullName]
            const filledFields = mandatoryFields.filter(field => field.trim() !== '').length
            return (filledFields / mandatoryFields.length) * 100
        } else {
            const mandatoryFields = [shopForm.shopName, shopForm.shopAddress, shopForm.shopCity]
            const filledFields = mandatoryFields.filter(field => field.trim() !== '').length
            return (filledFields / mandatoryFields.length) * 100
        }
    }

    const validateShopForm = () => {
        if (!shopForm.shopName || !shopForm.shopAddress || !shopForm.shopCity) {
            setError('Please fill in all required shop information')
            return false
        }
        return true
    }

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (validateUserForm()) {
                setError(null)
                setCurrentStep(2)
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!validateUserForm() || !validateShopForm()) {
            return
        }

        if (!captchaToken) {
            setError('Please complete the security verification')
            return
        }

        // Check minimum time
        if (Date.now() - startTime < 10000) {
            setError('Please take your time to fill out the form')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const formData = new FormData()

            // Add user data
            formData.append('email', userForm.email)
            formData.append('password', userForm.password)
            formData.append('fullName', userForm.fullName)
            formData.append('phone', userForm.phone)

            // Add shop data
            formData.append('shopName', shopForm.shopName)
            formData.append('shopEmail', shopForm.shopEmail || userForm.email)
            formData.append('shopPhone', shopForm.shopPhone || userForm.phone)
            formData.append('shopAddress', shopForm.shopAddress)
            formData.append('shopCity', shopForm.shopCity)
            formData.append('shopProvince', shopForm.shopProvince)
            formData.append('website', shopForm.website)
            formData.append('businessNumber', shopForm.businessNumber)
            formData.append('hstNumber', shopForm.hstNumber)
            formData.append('servicesOffered', JSON.stringify(shopForm.servicesOffered))
            formData.append('operatingHours', JSON.stringify(shopForm.operatingHours))

            // Add security data
            formData.append('turnstile-token', captchaToken)
            formData.append('startTime', startTime.toString())

            await signup(formData)
        } catch (error: any) {
            setError(error.message || 'Signup failed')
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50">
                <LoadingComponent />
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-start w-full min-h-full px-4 sm:px-6 md:px-8 py-4 overflow-y-auto">
            <div className="mx-auto w-full max-w-[400px] flex-shrink-0">
                {/* Progress Indicator */}
                <div className="mb-6">
                    <div className="w-full bg-black border border-gray-600 rounded-full h-2">
                        <div 
                            className="bg-red-600 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${calculateProgress()}%` }}
                        />
                    </div>
                </div>

                <h2 className="mb-4 md:mb-6 text-lg sm:text-xl font-medium text-white text-center">
                    {currentStep === 1 ? 'Create Account' : 'Shop Information'}
                </h2>

                {currentStep === 1 ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-3 md:space-y-4">
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        {message && <p className="text-green-500 text-sm">{message}</p>}

                        <div>
                            <Label htmlFor="fullName" className="mb-1.5 block text-sm text-gray-300">
                                Full Name *
                            </Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                type="text"
                                value={userForm.fullName}
                                onChange={(e) => handleUserFormChange('fullName', e.target.value)}
                                placeholder="John Doe"
                                required
                                className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
                            />
                        </div>

                        <div>
                            <Label htmlFor="email" className="mb-1.5 block text-sm text-gray-300">
                                Email *
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={userForm.email}
                                onChange={(e) => handleUserFormChange('email', e.target.value)}
                                placeholder="john.doe@gmail.com"
                                required
                                className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
                            />
                        </div>

                        <div>
                            <Label htmlFor="phone" className="mb-1.5 block text-sm text-gray-300">
                                Phone Number
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={userForm.phone}
                                onChange={(e) => handleUserFormChange('phone', e.target.value)}
                                placeholder="(555) 123-4567"
                                className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
                            />
                        </div>

                        <div>
                            <Label htmlFor="password" className="mb-1.5 block text-sm text-gray-300">
                                Password *
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={userForm.password}
                                    onChange={(e) => handleUserFormChange('password', e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword" className="mb-1.5 block text-sm text-gray-300">
                                Confirm Password *
                            </Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                value={userForm.confirmPassword}
                                onChange={(e) => handleUserFormChange('confirmPassword', e.target.value)}
                                placeholder="Confirm your password"
                                required
                                className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-100"
                        >
                            Next: Shop Information
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="mb-4">
                            <h3 className="text-base font-medium text-white mb-3 flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                Shop Details
                            </h3>
                        </div>

                        <div>
                            <Label htmlFor="shopName" className="mb-1.5 block text-sm text-gray-300">
                                Shop Name *
                            </Label>
                            <Input
                                id="shopName"
                                name="shopName"
                                type="text"
                                value={shopForm.shopName}
                                onChange={(e) => handleShopFormChange('shopName', e.target.value)}
                                placeholder="AutoPro Mechanics"
                                required
                                className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
                            />
                        </div>

                        <div>
                            <Label htmlFor="shopAddress" className="mb-1.5 block text-sm text-gray-300">
                                Address *
                            </Label>
                            <Input
                                id="shopAddress"
                                name="shopAddress"
                                type="text"
                                value={shopForm.shopAddress}
                                onChange={(e) => handleShopFormChange('shopAddress', e.target.value)}
                                placeholder="123 Main Street"
                                required
                                className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="shopCity" className="mb-1.5 block text-sm text-gray-300">
                                    City *
                                </Label>
                                <Input
                                    id="shopCity"
                                    name="shopCity"
                                    type="text"
                                    value={shopForm.shopCity}
                                    onChange={(e) => handleShopFormChange('shopCity', e.target.value)}
                                    placeholder="Toronto"
                                    required
                                    className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
                                />
                            </div>
                            <div>
                                <Label htmlFor="shopProvince" className="mb-1.5 block text-sm text-gray-300">
                                    Province *
                                </Label>
                                <Input
                                    id="shopProvince"
                                    name="shopProvince"
                                    type="text"
                                    value={shopForm.shopProvince}
                                    onChange={(e) => handleShopFormChange('shopProvince', e.target.value)}
                                    placeholder="ON"
                                    required
                                    className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="website" className="mb-1.5 block text-sm text-gray-300">
                                Website
                            </Label>
                            <Input
                                id="website"
                                name="website"
                                type="url"
                                value={shopForm.website}
                                onChange={(e) => handleShopFormChange('website', e.target.value)}
                                placeholder="https://your-shop.com"
                                className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="businessNumber" className="mb-1.5 block text-sm text-gray-300">
                                    Business Number
                                </Label>
                                <Input
                                    id="businessNumber"
                                    name="businessNumber"
                                    type="text"
                                    value={shopForm.businessNumber}
                                    onChange={(e) => handleShopFormChange('businessNumber', e.target.value)}
                                    placeholder="123456789"
                                    className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
                                />
                            </div>
                            <div>
                                <Label htmlFor="hstNumber" className="mb-1.5 block text-sm text-gray-300">
                                    HST Number
                                </Label>
                                <Input
                                    id="hstNumber"
                                    name="hstNumber"
                                    type="text"
                                    value={shopForm.hstNumber}
                                    onChange={(e) => handleShopFormChange('hstNumber', e.target.value)}
                                    placeholder="12345 6789 RT0001"
                                    className="w-full rounded-lg bg-[#222222] px-4 py-2 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 transition focus:ring-1 focus:ring-[#444444] border-none"
                                />
                            </div>
                        </div>

                        {/* Honeypot field */}
                        <input
                            type="text"
                            name="website"
                            style={{ display: 'none' }}
                            tabIndex={-1}
                            autoComplete="off"
                        />

                        {/* Turnstile CAPTCHA - Temporarily disabled until package is installed */}
                        <div className="flex justify-center">
                            <div className="bg-gray-800 p-4 rounded-lg text-center">
                                <p className="text-gray-400 text-sm">Security verification will be enabled</p>
                                <button
                                    type="button"
                                    onClick={() => setCaptchaToken('demo-token')}
                                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Skip for Demo
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={!captchaToken}
                            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                        </Button>
                    </form>
                )}

                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400">
                        Already have an account? <Link href="/login" className="underline hover:text-white">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
