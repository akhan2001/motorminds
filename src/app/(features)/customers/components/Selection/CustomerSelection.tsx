'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, User, Phone, Car, X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
interface Customer {
	id: string
	customer_name: string
	customer_email?: string
	customer_phone: string
	customer_address?: string
	customer_vehicle?: {
		year?: number
		make?: string
		model?: string
		trim?: string
	}
	license_plate?: string
	tags?: string[]
}

interface CustomerSelectionProps {
	selectedCustomer?: Customer | null
	onCustomerSelect: (customer: Customer | null) => void
	placeholder?: string
	className?: string
	disabled?: boolean
	showCreateOption?: boolean
	onCreateNew?: () => void
	compact?: boolean
}

export default function CustomerSelection({
	selectedCustomer,
	onCustomerSelect,
	placeholder = "Search customers...",
	className,
	disabled = false,
	showCreateOption = false,
	onCreateNew,
	compact = false
}: CustomerSelectionProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [customers, setCustomers] = useState<Customer[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [highlightedIndex, setHighlightedIndex] = useState(-1)

	const containerRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const listRef = useRef<HTMLUListElement>(null)

	// Debounced search function using optimized API
	const searchCustomers = useCallback(async (search: string) => {
		if (!search.trim() || search.length < 2) {
			setCustomers([])
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch(`/api/customers/search?q=${encodeURIComponent(search)}&limit=50`)

			if (!response.ok) {
				throw new Error('Search request failed')
			}

			const data = await response.json()

			if (data.error) {
				setError(data.error)
				return
			}

			setCustomers(data.customers || [])
			setHighlightedIndex(-1)
		} catch (err) {
			console.error('Customer search error:', err)
			setError('Search failed')
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Debounce search calls
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchTerm && isOpen) {
				searchCustomers(searchTerm)
			}
		}, 300)

		return () => clearTimeout(timer)
	}, [searchTerm, isOpen, searchCustomers])

	// Focus search input when dropdown opens
	useEffect(() => {
		if (isOpen && inputRef.current) {
			// Small delay to ensure the dropdown is rendered
			setTimeout(() => {
				inputRef.current?.focus()
			}, 10)
		}
	}, [isOpen])

	// Handle clicks outside to close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false)
				setSearchTerm('')
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	// Keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
				e.preventDefault()
				setIsOpen(true)
				return
			}
		}

		switch (e.key) {
			case 'Escape':
				setIsOpen(false)
				setSearchTerm('')
				inputRef.current?.blur()
				break

			case 'ArrowDown':
				e.preventDefault()
				const maxIndex = customers.length + (showCreateOption ? 0 : -1)
				setHighlightedIndex(prev => prev < maxIndex ? prev + 1 : 0)
				break

			case 'ArrowUp':
				e.preventDefault()
				const minIndex = showCreateOption ? -1 : 0
				setHighlightedIndex(prev => prev > minIndex ? prev - 1 : customers.length - 1)
				break

			case 'Enter':
				e.preventDefault()
				if (highlightedIndex === -1 && showCreateOption) {
					onCreateNew?.()
					setIsOpen(false)
				} else if (highlightedIndex >= 0 && customers[highlightedIndex]) {
					handleCustomerSelect(customers[highlightedIndex])
				}
				break
		}
	}

	// Scroll highlighted item into view
	useEffect(() => {
		if (listRef.current && highlightedIndex >= 0) {
			const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
			if (highlightedElement) {
				highlightedElement.scrollIntoView({ block: 'nearest' })
			}
		}
	}, [highlightedIndex])

	const handleCustomerSelect = (customer: Customer) => {
		onCustomerSelect(customer)
		setIsOpen(false)
		setSearchTerm('')
		setHighlightedIndex(-1)
	}

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation()
		onCustomerSelect(null)
		setSearchTerm('')
		setIsOpen(false)
	}

	const formatVehicle = (vehicle: Customer['customer_vehicle']) => {
		if (!vehicle) return null
		const parts = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean)
		return parts.length > 0 ? parts.join(' ') : null
	}

	const formatPhoneNumber = (phone: string) => {
		if (!phone) return ''
		// Simple formatting for display
		const cleaned = phone.replace(/\D/g, '')
		if (cleaned.length === 10) {
			return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
		}
		if (cleaned.length === 11 && cleaned.startsWith('1')) {
			return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
		}
		return phone
	}

	return (
		<div
			ref={containerRef}
			className={cn("relative", className)}
		>
			<div
				className={cn(
					"relative min-h-10 border border-[#333] bg-[#222] text-sm",
					"focus-within:ring-2 focus-within:ring-red-500 focus-within:ring-offset-2",
					"cursor-pointer rounded-md",
					disabled && "cursor-not-allowed opacity-50",
					compact ? "min-h-8" : "min-h-10"
				)}
				onClick={() => !disabled && setIsOpen(true)}
			>
				{selectedCustomer ? (
					<div className={cn("flex items-center justify-between p-2", compact && "px-2 py-1")}>
						<div className="flex items-center gap-2 min-w-0 flex-1">
							<User className={cn("text-gray-400 flex-shrink-0", compact ? "h-3 w-3" : "h-4 w-4")} />
							<div className="min-w-0 flex-1">
								<div className={cn("font-medium truncate text-white", compact && "text-xs")}>
									{selectedCustomer.customer_name}
								</div>
								{!compact && (
									<div className="flex items-center gap-3 text-xs text-gray-400">
										{selectedCustomer.customer_phone && (
											<span className="flex items-center gap-1">
												<Phone className="h-3 w-3" />
												{formatPhoneNumber(selectedCustomer.customer_phone)}
											</span>
										)}
										{selectedCustomer.license_plate && (
											<span className="flex items-center gap-1">
												<Car className="h-3 w-3" />
												{selectedCustomer.license_plate}
											</span>
										)}
									</div>
								)}
							</div>
						</div>
						<div className="flex items-center gap-1">
							<button
								onClick={handleClear}
								className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
								type="button"
							>
								<X className="h-3 w-3" />
							</button>
							{isOpen ? (
								<ChevronUp className="h-4 w-4 text-gray-400" />
							) : (
								<ChevronDown className="h-4 w-4 text-gray-400" />
							)}
						</div>
					</div>
				) : (
					<div className={cn("flex items-center justify-between p-2", compact && "px-2 py-1")}>
						<div className="flex items-center gap-2 min-w-0 flex-1">
							<Search className={cn("text-gray-400 flex-shrink-0", compact ? "h-3 w-3" : "h-4 w-4")} />
							<span className={cn("text-gray-500", compact && "text-xs")}>
								{placeholder}
							</span>
						</div>
						{isOpen ? (
							<ChevronUp className="h-4 w-4 text-gray-400" />
						) : (
							<ChevronDown className="h-4 w-4 text-gray-400" />
						)}
					</div>
				)}
			</div>

			{/* Dropdown */}
			{isOpen && (
				<div className="absolute z-50 w-full mt-1 bg-[#222] border border-[#333] rounded-md shadow-lg max-h-60 overflow-hidden">
					<div className="p-2 border-b border-[#333]">
						<div className="relative">
							<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<input
								ref={inputRef}
								type="text"
								placeholder="Search by name, email, or phone..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								onKeyDown={handleKeyDown}
								className="w-full pl-8 pr-3 py-2 bg-[#111] border border-[#333] rounded text-sm outline-none focus:ring-2 focus:ring-red-500 text-white placeholder:text-gray-500"
								autoFocus
							/>
						</div>
					</div>

					<div className="max-h-48 overflow-y-auto">
						{isLoading ? (
							<div className="p-4 text-center text-sm text-gray-400">
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500 mx-auto mb-2"></div>
								Searching...
							</div>
						) : error ? (
							<div className="p-4 text-center text-sm text-red-400">
								{error}
							</div>
						) : customers.length > 0 ? (
							<ul ref={listRef} role="listbox">
								{showCreateOption && searchTerm && (
									<li
										role="option"
										aria-selected={highlightedIndex === -1}
										className={cn(
											"p-3 cursor-pointer border-b border-[#333] last:border-b-0",
											"hover:bg-[#333] transition-colors",
											highlightedIndex === -1 && "bg-[#333]"
										)}
										onClick={() => {
											onCreateNew?.()
											setIsOpen(false)
										}}
									>
										<div className="flex items-center gap-2 text-sm">
											<div className="h-8 w-8 bg-red-600 rounded-full flex items-center justify-center">
												<User className="h-4 w-4 text-white" />
											</div>
											<div>
												<div className="font-medium text-white">Create new customer</div>
												<div className="text-xs text-gray-400">"{searchTerm}"</div>
											</div>
										</div>
									</li>
								)}
								{customers.map((customer, index) => (
									<li
										key={customer.id}
										role="option"
										aria-selected={highlightedIndex === index}
										className={cn(
											"p-3 cursor-pointer border-b border-[#333] last:border-b-0",
											"hover:bg-[#333] transition-colors",
											highlightedIndex === index && "bg-[#333]"
										)}
										onClick={() => handleCustomerSelect(customer)}
									>
										<div className="flex items-start gap-3">
											<div className="h-8 w-8 bg-[#444] rounded-full flex items-center justify-center flex-shrink-0">
												<User className="h-4 w-4 text-gray-400" />
											</div>
											<div className="min-w-0 flex-1">
												<div className="font-medium text-sm truncate text-white">
													{customer.customer_name}
												</div>
												<div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
													{customer.customer_phone && (
														<span className="flex items-center gap-1">
															<Phone className="h-3 w-3" />
															{formatPhoneNumber(customer.customer_phone)}
														</span>
													)}
													{customer.customer_email && (
														<span className="truncate text-gray-500">{customer.customer_email}</span>
													)}
												</div>
												{(customer.license_plate || formatVehicle(customer.customer_vehicle)) && (
													<div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
														{customer.license_plate && (
															<span className="flex items-center gap-1 bg-[#444] text-gray-300 px-1.5 py-0.5 rounded">
																<Car className="h-3 w-3" />
																{customer.license_plate}
															</span>
														)}
														{formatVehicle(customer.customer_vehicle) && (
															<span className="truncate">
																{formatVehicle(customer.customer_vehicle)}
															</span>
														)}
													</div>
												)}
											</div>
										</div>
									</li>
								))}
							</ul>
						) : searchTerm ? (
							<div className="p-4 text-center text-sm text-gray-400">
								<User className="h-8 w-8 mx-auto mb-2 opacity-50" />
								<div>No customers found</div>
								<div className="text-xs mt-1 text-gray-500">Try a different search term</div>
								{showCreateOption && (
									<button
										onClick={() => {
											onCreateNew?.()
											setIsOpen(false)
										}}
										className="mt-2 text-red-400 hover:text-red-300 hover:underline text-xs transition-colors"
									>
										Create new customer "{searchTerm}"
									</button>
								)}
							</div>
						) : (
							<div className="p-4 text-center text-sm text-gray-400">
								Start typing to search for customers...
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
