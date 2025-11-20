'use client'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Package, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface PartsOrderingSheetProps {
	parts: any[]
	isOpen: boolean
	onOpenChange: (open: boolean) => void
}

export function PartsOrderingSheet({ parts, isOpen, onOpenChange }: PartsOrderingSheetProps) {
	if (!parts || parts.length === 0) {
		return null
	}

	const totalPrice = parts.reduce((sum, part) => sum + (part.price || 0), 0)

	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="bg-[#131313] text-white border-l border-[#222] w-[400px] overflow-y-auto">
				<SheetHeader>
					<SheetTitle className="text-white text-lg flex items-center gap-2">
						<Package className="w-5 h-5 text-red-600" />
						Parts Ordering
					</SheetTitle>
					<SheetDescription className="text-gray-400">
						Review and order parts for this vehicle
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6 space-y-4">
					{parts.map((part, idx) => (
						<div
							key={idx}
							className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4"
						>
							{/* Part Name and Number */}
							<div className="mb-3">
								<div className="text-sm font-semibold text-white mb-1">
									{part.name}
								</div>
								<div className="text-xs font-mono text-gray-400">
									Part #: {part.partNumber}
								</div>
							</div>

							{/* Details Grid */}
							<div className="grid grid-cols-2 gap-3 mb-3">
								<div className="flex items-center gap-2">
									<DollarSign className="w-4 h-4 text-gray-400" />
									<div>
										<div className="text-xs text-gray-400">Price</div>
										<div className="text-sm font-semibold text-white">
											${part.price?.toFixed(2) || '0.00'}
										</div>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Clock className="w-4 h-4 text-gray-400" />
									<div>
										<div className="text-xs text-gray-400">ETA</div>
										<div className="text-sm font-semibold text-white">
											{part.eta || 'N/A'}
										</div>
									</div>
								</div>
							</div>

							{/* Supplier and Availability */}
							<div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a]">
								<div className="text-xs text-gray-400">
									{part.supplier || 'Supplier'}
								</div>
								<div className="flex items-center gap-1.5">
									{part.availability === 'In Stock' ? (
										<CheckCircle className="w-3.5 h-3.5 text-green-500" />
									) : (
										<AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
									)}
									<span
										className={`text-xs font-medium px-2 py-0.5 rounded ${
											part.availability === 'In Stock'
												? 'bg-green-900/20 text-green-400'
												: 'bg-yellow-900/20 text-yellow-400'
										}`}
									>
										{part.availability || 'Unknown'}
									</span>
								</div>
							</div>

							{/* Confidence Badge */}
							{part.confidence && (
								<div className="mt-2 pt-2 border-t border-[#2a2a2a]">
									<div className="text-xs text-gray-400">
										Confidence:{' '}
										<span
											className={`font-medium ${
												part.confidence === 'High'
													? 'text-green-400'
													: part.confidence === 'Medium'
													? 'text-yellow-400'
													: 'text-gray-400'
											}`}
										>
											{part.confidence}
										</span>
									</div>
								</div>
							)}
						</div>
					))}
				</div>

				{/* Footer with Total */}
				<SheetFooter className="mt-6 pt-4 border-t border-[#2a2a2a]">
					<div className="w-full space-y-3">
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-400">Total ({parts.length} part{parts.length !== 1 ? 's' : ''})</span>
							<span className="text-lg font-semibold text-white">
								${totalPrice.toFixed(2)}
							</span>
						</div>
						<button
							className="w-full px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
							onClick={() => {
								console.log('Ordering parts:', parts)
								// TODO: Implement actual ordering logic
							}}
						>
							Place Order
						</button>
					</div>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}