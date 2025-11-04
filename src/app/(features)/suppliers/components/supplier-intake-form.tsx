'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, User, Phone, Mail, MapPin, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { CreateSupplierRequest } from '@/app/(features)/suppliers/types/supplier'
import { formatPhoneNumber, cleanPhoneNumber } from '@/utils/format-phone'

interface SupplierIntakeFormProps {
	onSuccess?: (supplier: any) => void
	onCancel?: () => void
	isModal?: boolean
}

export default function SupplierIntakeForm({ onSuccess, onCancel, isModal = false }: SupplierIntakeFormProps) {
	const [formData, setFormData] = useState<CreateSupplierRequest>({
		name: '',
		contact_person: '',
		phone_number: '',
		email: '',
		address: {
			street: '',
			city: '',
			province: '',
			postal_code: '',
			country: 'Canada'
		},
		account_number: '',
		notes: ''
	})
	const [isLoading, setIsLoading] = useState(false)

	const handleInputChange = (field: keyof CreateSupplierRequest, value: string) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}))
	}

	const handlePhoneNumberChange = (value: string) => {
		const formatted = formatPhoneNumber(value)
		setFormData(prev => ({
			...prev,
			phone_number: formatted
		}))
	}

	const handleAddressChange = (field: keyof NonNullable<CreateSupplierRequest['address']>, value: string) => {
		setFormData(prev => ({
			...prev,
			address: {
				...prev.address,
				[field]: value
			}
		}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.name.trim()) {
			toast.error('Supplier name is required')
			return
		}

		setIsLoading(true)

		try {
			// Clean the phone number before sending
			const cleanedFormData = {
				...formData,
				phone_number: cleanPhoneNumber(formData.phone_number || '')
			}

			const response = await fetch('/api/suppliers', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(cleanedFormData),
			})

			const data = await response.json()

			if (response.ok) {
				toast.success('Supplier added successfully!')
				onSuccess?.(data.supplier)
				// Reset form
				setFormData({
					name: '',
					contact_person: '',
					phone_number: '',
					email: '',
					address: {
						street: '',
						city: '',
						province: '',
						postal_code: '',
						country: 'Canada'
					},
					account_number: '',
					notes: ''
				})
			} else {
				toast.error(data.error || 'Failed to add supplier')
			}
		} catch (error) {
			console.error('Error adding supplier:', error)
			toast.error('Failed to add supplier')
		} finally {
			setIsLoading(false)
		}
	}

	if (isModal) {
		return (
			<form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
				{/* Basic Information */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-foreground dark:text-white">Basic Information</h3>

					<div className="space-y-2">
						<Label htmlFor="name" className="text-foreground dark:text-gray-300">
							Supplier Name *
						</Label>
						<div className="relative">
							<Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
							<Input
								id="name"
								value={formData.name}
								onChange={(e) => handleInputChange('name', e.target.value)}
								placeholder="NAPA Auto Parts"
								className="pl-10 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="contact_person" className="text-foreground dark:text-gray-300">
							Contact Person
						</Label>
						<div className="relative">
							<User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
							<Input
								id="contact_person"
								value={formData.contact_person}
								onChange={(e) => handleInputChange('contact_person', e.target.value)}
								placeholder="John Smith"
								className="pl-10 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="phone_number" className="text-foreground dark:text-gray-300">
								Phone Number
							</Label>
							<div className="relative">
								<Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
								<Input
									id="phone_number"
									type="tel"
									value={formData.phone_number}
									onChange={(e) => handlePhoneNumberChange(e.target.value)}
									placeholder="(555) 123-4567"
									className="pl-10 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email" className="text-foreground dark:text-gray-300">
								Email
							</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
								<Input
									id="email"
									type="email"
									value={formData.email}
									onChange={(e) => handleInputChange('email', e.target.value)}
									placeholder="contact@supplier.com"
									className="pl-10 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Address */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-foreground dark:text-white">Address</h3>

					<div className="space-y-2">
						<Label htmlFor="street" className="text-foreground dark:text-gray-300">
							Street Address
						</Label>
						<div className="relative">
							<MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
							<Input
								id="street"
								value={formData.address?.street || ''}
								onChange={(e) => handleAddressChange('street', e.target.value)}
								placeholder="123 Main Street"
								className="pl-10 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="city" className="text-foreground dark:text-gray-300">
								City
							</Label>
							<Input
								id="city"
								value={formData.address?.city || ''}
								onChange={(e) => handleAddressChange('city', e.target.value)}
								placeholder="Toronto"
								className="bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="province" className="text-foreground dark:text-gray-300">
								Province
							</Label>
							<Input
								id="province"
								value={formData.address?.province || ''}
								onChange={(e) => handleAddressChange('province', e.target.value)}
								placeholder="ON"
								className="bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="postal_code" className="text-foreground dark:text-gray-300">
								Postal Code
							</Label>
							<Input
								id="postal_code"
								value={formData.address?.postal_code || ''}
								onChange={(e) => handleAddressChange('postal_code', e.target.value)}
								placeholder="M5V 3A8"
								className="bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
							/>
						</div>
					</div>
				</div>

				{/* Additional Information */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-foreground dark:text-white">Additional Information</h3>

					<div className="space-y-2">
						<Label htmlFor="account_number" className="text-foreground dark:text-gray-300">
							Account Number
						</Label>
						<Input
							id="account_number"
							value={formData.account_number}
							onChange={(e) => handleInputChange('account_number', e.target.value)}
							placeholder="Your account number with this supplier"
							className="bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="notes" className="text-foreground dark:text-gray-300">
							Notes
						</Label>
						<div className="relative">
							<FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground dark:text-gray-400" />
							<Textarea
								id="notes"
								value={formData.notes}
								onChange={(e) => handleInputChange('notes', e.target.value)}
								placeholder="Any additional notes about this supplier..."
								className="pl-10 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white min-h-[80px] max-h-[200px]"
							/>
						</div>
					</div>
				</div>

				{/* Form Actions */}
				<div className="flex gap-3 pt-4 border-t border-border dark:border-[#2a2a2a] mt-4">
					{onCancel && (
						<Button
							type="button"
							onClick={onCancel}
							variant="outline"
							className="flex-1 border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#1a1a1a]"
						>
							Cancel
						</Button>
					)}
					<Button
						type="submit"
						disabled={isLoading}
						className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
					>
						{isLoading ? 'Adding Supplier...' : 'Add Supplier'}
					</Button>
				</div>
			</form>
		)
	}

	return (
		<Card className="bg-card dark:bg-[#111111] border-border dark:border-[#2a2a2a] max-w-2xl mx-auto max-h-[85vh] flex flex-col">
			<CardHeader className="flex-shrink-0">
				<CardTitle className="text-foreground dark:text-white flex items-center gap-2">
					<Building2 className="h-5 w-5" />
					Add New Supplier
				</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 overflow-hidden flex flex-col p-6">
				<form onSubmit={handleSubmit} className="flex flex-col h-full">
					<div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-4">
						{/* Basic Information */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium text-foreground dark:text-white">Basic Information</h3>

							<div className="space-y-2">
								<Label htmlFor="name" className="text-foreground dark:text-gray-300">
									Supplier Name *
								</Label>
								<div className="relative">
									<Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
									<Input
										id="name"
										value={formData.name}
										onChange={(e) => handleInputChange('name', e.target.value)}
										placeholder="NAPA Auto Parts"
										className="pl-10 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
										required
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="contact_person" className="text-foreground dark:text-gray-300">
									Contact Person
								</Label>
								<div className="relative">
									<User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
									<Input
										id="contact_person"
										value={formData.contact_person}
										onChange={(e) => handleInputChange('contact_person', e.target.value)}
										placeholder="John Smith"
										className="pl-10 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="phone_number" className="text-foreground dark:text-gray-300">
										Phone Number
									</Label>
									<div className="relative">
										<Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
										<Input
											id="phone_number"
											type="tel"
											value={formData.phone_number}
											onChange={(e) => handlePhoneNumberChange(e.target.value)}
											placeholder="(555) 123-4567"
											className="pl-10 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="email" className="text-foreground dark:text-gray-300">
										Email
									</Label>
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
										<Input
											id="email"
											type="email"
											value={formData.email}
											onChange={(e) => handleInputChange('email', e.target.value)}
											placeholder="contact@supplier.com"
											className="pl-10 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Address */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium text-foreground dark:text-white">Address</h3>

							<div className="space-y-2">
								<Label htmlFor="street" className="text-foreground dark:text-gray-300">
									Street Address
								</Label>
								<div className="relative">
									<MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
									<Input
										id="street"
										value={formData.address?.street || ''}
										onChange={(e) => handleAddressChange('street', e.target.value)}
										placeholder="123 Main Street"
										className="pl-10 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label htmlFor="city" className="text-foreground dark:text-gray-300">
										City
									</Label>
									<Input
										id="city"
										value={formData.address?.city || ''}
										onChange={(e) => handleAddressChange('city', e.target.value)}
										placeholder="Toronto"
										className="bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="province" className="text-foreground dark:text-gray-300">
										Province
									</Label>
									<Input
										id="province"
										value={formData.address?.province || ''}
										onChange={(e) => handleAddressChange('province', e.target.value)}
										placeholder="ON"
										className="bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="postal_code" className="text-foreground dark:text-gray-300">
										Postal Code
									</Label>
									<Input
										id="postal_code"
										value={formData.address?.postal_code || ''}
										onChange={(e) => handleAddressChange('postal_code', e.target.value)}
										placeholder="M5V 3A8"
										className="bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
									/>
								</div>
							</div>
						</div>

						{/* Additional Information */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium text-foreground dark:text-white">Additional Information</h3>

							<div className="space-y-2">
								<Label htmlFor="account_number" className="text-foreground dark:text-gray-300">
									Account Number
								</Label>
								<Input
									id="account_number"
									value={formData.account_number}
									onChange={(e) => handleInputChange('account_number', e.target.value)}
									placeholder="Your account number with this supplier"
									className="bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="notes" className="text-foreground dark:text-gray-300">
									Notes
								</Label>
								<div className="relative">
									<FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground dark:text-gray-400" />
									<Textarea
										id="notes"
										value={formData.notes}
										onChange={(e) => handleInputChange('notes', e.target.value)}
										placeholder="Any additional notes about this supplier..."
										className="pl-10 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white min-h-[80px] max-h-[200px]"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Form Actions - Fixed at bottom */}
					<div className="flex-shrink-0 flex gap-3 pt-6 border-t border-border dark:border-[#2a2a2a] mt-4">
						{onCancel && (
							<Button
								type="button"
								onClick={onCancel}
								variant="outline"
								className="flex-1 border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#1a1a1a]"
							>
								Cancel
							</Button>
						)}
						<Button
							type="submit"
							disabled={isLoading}
							className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
						>
							{isLoading ? 'Adding Supplier...' : 'Add Supplier'}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
