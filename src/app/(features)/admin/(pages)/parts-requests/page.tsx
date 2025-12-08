'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Package, RefreshCw } from 'lucide-react'
//import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Slash } from "lucide-react"
import Link from 'next/link'
import { PartsRequest } from '@/app/(features)/parts/types/parts'
import { toast } from 'sonner'
import AdminNav from '../../components/AdminNav'
import { PartsRequestCard } from './components/PartsRequestCard'
import { QuoteModal } from './components/QuoteModal'
import { StatsCards } from './components/StatsCards'
import { FilterSection } from './components/FilterSection'

interface QuoteFormData {
	parts_info: Array<{
		part_name: string
		quantity: number
		unit_price: number
		availability: string
	}>
	quote_details: {
		total_cost: number
		currency: string
		availability: string
		delivery_eta: string
		delivery_days: number
	}
	supplier_info: {
		supplier_name: string
		contact_person?: string
		phone_number?: string
	}
	call_outcome: {
		notes: string
		quote_provided: boolean
		quote_accepted: boolean
		follow_up_needed: boolean
	}
}

export default function AdminPartsRequestsPage() {
	const [partsRequests, setPartsRequests] = useState<PartsRequest[]>([])
	const [loading, setLoading] = useState(true)
	const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'quoted' | 'ordered'>('all')
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedRequest, setSelectedRequest] = useState<PartsRequest | null>(null)
	const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
	const [quoteForm, setQuoteForm] = useState<QuoteFormData>({
		parts_info: [],
		quote_details: {
			total_cost: 0,
			currency: 'CAD',
			availability: '',
			delivery_eta: '',
			delivery_days: 1
		},
		supplier_info: {
			supplier_name: ''
		},
		call_outcome: {
			notes: '',
			quote_provided: true,
			quote_accepted: false,
			follow_up_needed: false
		}
	})
	const [isSubmittingQuote, setIsSubmittingQuote] = useState(false)
	const [editingAdminNotes, setEditingAdminNotes] = useState<string | null>(null)
	const [adminNotesValue, setAdminNotesValue] = useState('')
	const [isSavingAdminNotes, setIsSavingAdminNotes] = useState(false)

	useEffect(() => {
		fetchPartsRequests()
	}, [])

	const fetchPartsRequests = async () => {
		try {
			setLoading(true)
			console.log('Fetching admin parts requests...')

			const response = await fetch(`/api/admin/parts-requests?t=${Date.now()}`)
			console.log('Response status:', response.status)

			const data = await response.json()
			console.log('Response data:', data)

			if (response.ok) {
				setPartsRequests(data.partsRequests || [])
				console.log('Loaded parts requests:', data.partsRequests?.length || 0)
			} else {
				console.error('API error:', data)
				toast.error(data.error || 'Failed to fetch parts requests')
			}
		} catch (error) {
			console.error('Error fetching parts requests:', error)
			toast.error(`Failed to fetch parts requests: ${error instanceof Error ? error.message : 'Unknown error'}`)
		} finally {
			setLoading(false)
		}
	}

	const updateRequestStatus = async (requestId: string, status: PartsRequest['status'], adminNotes?: string) => {
		try {
			const response = await fetch(`/api/admin/parts-requests/${requestId}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status, admin_notes: adminNotes })
			})

			if (response.ok) {
				toast.success(`Status updated to ${status}`)
				fetchPartsRequests()
			} else {
				const data = await response.json()
				toast.error(data.error || 'Failed to update status')
			}
		} catch (error) {
			console.error('Error updating status:', error)
			toast.error('Failed to update status')
		}
	}

	const handleEditAdminNotes = (requestId: string, currentNotes: string) => {
		setEditingAdminNotes(requestId)
		setAdminNotesValue(currentNotes || '')
	}

	const handleSaveAdminNotes = async (requestId: string) => {
		try {
			setIsSavingAdminNotes(true)
			const response = await fetch(`/api/admin/parts-requests/${requestId}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ admin_notes: adminNotesValue })
			})

			if (response.ok) {
				toast.success('Admin notes updated successfully')
				setEditingAdminNotes(null)
				setAdminNotesValue('')
				fetchPartsRequests()
			} else {
				const data = await response.json()
				toast.error(data.error || 'Failed to update admin notes')
			}
		} catch (error) {
			console.error('Error saving admin notes:', error)
			toast.error('Failed to save admin notes')
		} finally {
			setIsSavingAdminNotes(false)
		}
	}

	const handleCancelEditAdminNotes = () => {
		setEditingAdminNotes(null)
		setAdminNotesValue('')
	}

	const openQuoteModal = (request: PartsRequest) => {
		setSelectedRequest(request)

		// If there's an existing quote, use that data; otherwise use parts_requested data
		let partsInfo = []
		let quoteDetails = {
			total_cost: 0,
			currency: 'CAD',
			availability: 'In Stock',
			delivery_eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
			delivery_days: 1
		}
		let callOutcomeNotes = ''

		if (request.quote_provided && typeof request.quote_provided === 'object') {
			// Existing quote - populate from quote_provided
			const existingQuote = request.quote_provided as any

			if (existingQuote.parts_info && Array.isArray(existingQuote.parts_info)) {
				partsInfo = existingQuote.parts_info.map((part: any) => ({
					part_name: part.part_name || '',
					quantity: part.quantity || 1,
					unit_price: part.unit_price || 0,
					availability: part.availability || 'In Stock'
				}))
			}

			if (existingQuote.quote_details) {
				quoteDetails = {
					total_cost: existingQuote.quote_details.total_cost || 0,
					currency: existingQuote.quote_details.currency || 'CAD',
					availability: existingQuote.quote_details.availability || 'In Stock',
					delivery_eta: existingQuote.quote_details.delivery_eta
						? new Date(existingQuote.quote_details.delivery_eta).toISOString().split('T')[0]
						: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
					delivery_days: existingQuote.quote_details.delivery_days || 1
				}
			}

			if (existingQuote.call_outcome?.notes) {
				callOutcomeNotes = existingQuote.call_outcome.notes
			}
		} else {
			// New quote - populate from parts_requested
			if (request.parts_requested && Array.isArray(request.parts_requested) && request.parts_requested.length > 0) {
				partsInfo = request.parts_requested.map((part: any) => ({
					part_name: part.part_name || part.name || 'Unknown Part',
					quantity: part.quantity || 1,
					unit_price: part.estimated_price || part.price || part.unit_price || 0,
					availability: part.availability || 'In Stock'
				}))

				quoteDetails.total_cost = partsInfo.reduce((sum, part) => sum + (part.unit_price * part.quantity), 0)
			} else {
				// Fallback if no parts available
				partsInfo = [{
					part_name: request.parts_requested[0]?.part_name || 'Unknown Part',
					quantity: 1,
					unit_price: 0,
					availability: 'In Stock'
				}]
			}
		}

		// Ensure partsInfo is not empty
		if (partsInfo.length === 0) {
			partsInfo = [{
				part_name: 'Part',
				quantity: 1,
				unit_price: 0,
				availability: 'In Stock'
			}]
		}

		setQuoteForm({
			parts_info: partsInfo,
			quote_details: quoteDetails,
			supplier_info: {
				supplier_name: request.supplier_info?.supplier_name || '',
				contact_person: request.supplier_info?.contact_person || '',
				phone_number: request.supplier_info?.phone_number || ''
			},
			call_outcome: {
				notes: callOutcomeNotes,
				quote_provided: true,
				quote_accepted: false,
				follow_up_needed: false
			}
		})

		setIsQuoteModalOpen(true)
	}

	const submitQuote = async () => {
		if (!selectedRequest) return

		try {
			setIsSubmittingQuote(true)

			const response = await fetch(`/api/admin/parts-requests/${selectedRequest.id}/quote`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					quote_provided: quoteForm,
					actual_cost: quoteForm.quote_details.total_cost,
					status: 'quoted'
				})
			})

			// Also update status to processing if it was pending
			if (selectedRequest.status === 'pending') {
				await fetch(`/api/admin/parts-requests/${selectedRequest.id}/status`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ status: 'processing' })
				})
			}

			if (response.ok) {
				toast.success('Quote submitted successfully')
				setIsQuoteModalOpen(false)
				setSelectedRequest(null)
				fetchPartsRequests()
			} else {
				const data = await response.json()
				toast.error(data.error || 'Failed to submit quote')
			}
		} catch (error) {
			console.error('Error submitting quote:', error)
			toast.error('Failed to submit quote')
		} finally {
			setIsSubmittingQuote(false)
		}
	}

	const updatePartPrice = (index: number, price: number) => {
		const updatedParts = [...quoteForm.parts_info]
		updatedParts[index].unit_price = price

		const totalCost = updatedParts.reduce((sum, part) => sum + (part.unit_price * part.quantity), 0)

		setQuoteForm(prev => ({
			...prev,
			parts_info: updatedParts,
			quote_details: {
				...prev.quote_details,
				total_cost: totalCost
			}
		}))
	}

	const filteredRequests = partsRequests.filter(request => {
		const matchesFilter = filter === 'all' || request.status === filter
		const matchesSearch = searchTerm === '' ||
			request.parts_requested.some(part =>
				part.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				part.part_number.toLowerCase().includes(searchTerm.toLowerCase())
			) ||
			request.supplier_info?.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			request.vehicle_info?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())

		return matchesFilter && matchesSearch
	})

	return (
		<div className="h-screen flex flex-col bg-[#0d0d0d]">
			{/* <Nav /> */}
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
										Parts Requests
									</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>

						<AdminNav />

						{/* Header */}
						<div className="flex justify-between items-center mb-6">
							<div>
								<h1 className="text-3xl font-bold text-white mb-2">
									Parts Requests Management
								</h1>
								<p className="text-gray-400">
									Review and process parts requests from all shops
								</p>
							</div>
							<div className="flex gap-3">
								<Button
									onClick={fetchPartsRequests}
									variant="outline"
									className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									Refresh
								</Button>
							</div>
						</div>

						<FilterSection
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							filter={filter}
							setFilter={setFilter}
						/>

						<StatsCards partsRequests={partsRequests} />

						{/* Parts Requests List */}
						{loading ? (
							<div className="text-center py-8">
								<div className="text-gray-400">Loading parts requests...</div>
							</div>
						) : filteredRequests.length === 0 ? (
							<Card className="bg-[#111111] border-[#2a2a2a]">
								<CardContent className="text-center py-8">
									<Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-white mb-2">
										No {filter === 'all' ? '' : filter} parts requests found
									</h3>
									<p className="text-gray-400">
										{searchTerm ? 'Try adjusting your search terms' : 'No requests available at this time'}
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-6">
								{filteredRequests.map((request) => (
									<PartsRequestCard
										key={request.id}
										request={request}
										onUpdateStatus={updateRequestStatus}
										onOpenQuoteModal={openQuoteModal}
										onEditAdminNotes={handleEditAdminNotes}
										onSaveAdminNotes={handleSaveAdminNotes}
										onCancelEditAdminNotes={handleCancelEditAdminNotes}
										editingAdminNotes={editingAdminNotes}
										adminNotesValue={adminNotesValue}
										setAdminNotesValue={setAdminNotesValue}
										isSavingAdminNotes={isSavingAdminNotes}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			<QuoteModal
				isOpen={isQuoteModalOpen}
				onClose={() => setIsQuoteModalOpen(false)}
				selectedRequest={selectedRequest}
				quoteForm={quoteForm}
				setQuoteForm={setQuoteForm}
				onSubmit={submitQuote}
				isSubmitting={isSubmittingQuote}
				onUpdatePartPrice={updatePartPrice}
			/>
		</div>
	)
}