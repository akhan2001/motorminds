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
			<SheetContent side="right" className="w-[400px] bg-white dark:bg-[#0a0a0a] border-border dark:border-[#222222] overflow-y-auto">
				<SheetHeader className="pb-4">
					<div className="flex items-center gap-3">
						<Package className="h-5 w-5 text-blue-500 dark:text-blue-400" />
						<SheetTitle className="text-foreground dark:text-white text-lg">
							Parts Ordering
						</SheetTitle>
					</div>
					<SheetDescription className="text-muted-foreground dark:text-gray-400 text-sm mt-1">
						Review and order parts for this vehicle
					</SheetDescription>
				</SheetHeader>

				<div className="space-y-4">
					{parts.map((part, idx) => (
						<div
							key={idx}
							className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]"
						>
							{/* Part Name and Number */}
							<div className="mb-3">
								<div className="text-sm font-semibold text-foreground dark:text-white mb-1">
									{part.name}
								</div>
								<div className="text-xs font-mono text-muted-foreground dark:text-gray-400">
									Part #: {part.partNumber}
								</div>
							</div>

							{/* Details Grid */}
							<div className="grid grid-cols-2 gap-3 mb-3">
								<div className="flex items-center gap-2">
									<DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
									<div>
										<div className="text-xs text-muted-foreground dark:text-gray-400">Price</div>
										<div className="text-sm font-semibold text-foreground dark:text-white">
											${part.price?.toFixed(2) || '0.00'}
										</div>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
									<div>
										<div className="text-xs text-muted-foreground dark:text-gray-400">ETA</div>
										<div className="text-sm font-semibold text-foreground dark:text-white">
											{part.eta || 'N/A'}
										</div>
									</div>
								</div>
							</div>

							{/* Supplier and Availability */}
							<div className="flex items-center justify-between pt-3 border-t border-border dark:border-[#2a2a2a]">
								<div className="text-xs text-muted-foreground dark:text-gray-400">
									{part.supplier || 'Supplier'}
								</div>
								<div className="flex items-center gap-1.5">
									{part.availability === 'In Stock' ? (
										<CheckCircle className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
									) : (
										<AlertCircle className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
									)}
									<span
										className={`text-xs font-medium px-2 py-0.5 rounded ${
											part.availability === 'In Stock'
												? 'bg-green-500/10 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 dark:border-green-500/20'
												: 'bg-yellow-500/10 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 dark:border-yellow-500/20'
										}`}
									>
										{part.availability || 'Unknown'}
									</span>
								</div>
							</div>

							{/* Confidence Badge */}
							{part.confidence && (
								<div className="mt-2 pt-2 border-t border-border dark:border-[#2a2a2a]">
									<div className="text-xs text-muted-foreground dark:text-gray-400">
										Confidence:{' '}
										<span
											className={`font-medium ${
												part.confidence === 'High'
													? 'text-green-600 dark:text-green-400'
													: part.confidence === 'Medium'
													? 'text-yellow-600 dark:text-yellow-400'
													: 'text-muted-foreground dark:text-gray-400'
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
				<SheetFooter className="mt-6 pt-4 border-t border-border dark:border-[#2a2a2a]">
					<div className="w-full space-y-3">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground dark:text-gray-400">Total ({parts.length} part{parts.length !== 1 ? 's' : ''})</span>
							<span className="text-lg font-semibold text-foreground dark:text-white">
								${totalPrice.toFixed(2)}
							</span>
						</div>
						<button
							className="w-full px-4 py-2.5 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors"
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